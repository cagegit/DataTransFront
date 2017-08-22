'use strict';
let dt = require('moment');
let util = require('util');
let async = require('async');

let hdrcom = require('../common');
let hdrcfg = require('../../config');


function insert_svc(req, res, type) {
    let db;

    function reverse(dim, obj, id) {
        let buf = [];

        for (let tmp in obj) {
            if ('object' === typeof obj[tmp]) {
                if (obj[tmp] instanceof Array) {
                    for (let i = 0; i < obj[tmp].length; i++) {
                        if ('object' === typeof obj[tmp][i]) {
                            reverse(dim, obj[tmp][i], id);
                        } else {
                            buf = [];
                            buf.push(id);
                            buf.push(tmp);
                            buf.push(obj[tmp][i]);
                            buf.push('yes');
                            buf.push(dt().format('YYYY-MM-DD HH:mm:ss'));
                            buf.push(dt().format('YYYY-MM-DD HH:mm:ss'));
                            buf.push('descript');
                            dim.push(buf);
                        }

                    }

                } else {
                    reverse(dim, obj[tmp], id);
                }
            } else {
                buf = [];
                buf.push(id);
                buf.push(tmp);
                buf.push(obj[tmp]);
                buf.push('yes');
                buf.push(dt().format('YYYY-MM-DD HH:mm:ss'));
                buf.push(dt().format('YYYY-MM-DD HH:mm:ss'));
                buf.push('descript');
                dim.push(buf);
            }
        }
    }

    async function logical_deal() {

        let sql = 'SELECT ID id FROM ' + hdrcfg.cfg.table_name.T_SERVICE_INFO +
            ' WHERE TYPE = ? ' +
            ' LIMIT 0, 1';

        let svcId = await hdrcom.db.preSql(db, sql, [type]);

        if (0 < svcId.length) {
            /* clear original data */
            if (type === hdrcfg.cfg.service_type.MONITOR) {
                sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM +
                    ' WHERE SERVICE_ID = ? ' +
                    '  AND PARAM_NAME in (\'task_identify\', \'monitor_ip\', \'monitor_port\', \'monitor_interval\', \'free_disk_threshold\', \'group\', \'capture_interval_threshold\')';
            } else if (type === hdrcfg.cfg.service_type.SENDER) {
                sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM +
                    ' WHERE SERVICE_ID = ? ';
            }

            await hdrcom.db.preSql(db, sql, [svcId[0].id]);

            /* insert new data */
            sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM + ' (SERVICE_ID, PARAM_NAME, PARAM_VALUE, VALID, INSERT_TIME, UPDATE_TIME, REMARK)' +
                ' VALUES (?, ?, ?, ?, ?, ?, ?)';
            let val = [];
            let task = [];

            reverse(val, req.body.request, svcId[0].id);
            for (let i = 0; i < val.length; i++) {
                hdrcom.db.preSql(db, sql, val[i]);
            }

            await Promise.all(task);
        } else {
            console.error('Service id should be initialized');
            throw {error_code: hdrcfg.code.EOTHER, error_msg: hdrcfg.msg[hdrcfg.code.EOTHER]};
        }
    }

    async function doJob() {
        try {
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await logical_deal();

            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, {}, true);
            console.info("[insert_svc success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[insert_svc fail]');
            //hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function AddMonitor(req, res) {
    console.info('[save_reporter_conf begin]');
    return insert_svc(req, res, hdrcfg.cfg.service_type.MONITOR);
}

function QueryMonitor(req, res) {
    let db;

    async function query_monitor() {
        let sql = 'SELECT ID id FROM ' + hdrcfg.cfg.table_name.T_SERVICE_INFO +
            ' WHERE TYPE = ? ' +
            ' LIMIT 0, 1';
        let result = {};

        let svcId = await hdrcom.db.preSql(db, sql, [hdrcfg.cfg.service_type.MONITOR]);

        if (0 < svcId.length) {
            sql = 'SELECT PARAM_NAME name, PARAM_VALUE value ' +
                ' FROM ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM +
                ' WHERE SERVICE_ID = ?';

            let monRec = await hdrcom.db.preSql(db, sql, svcId[0].id);

            if (0 < monRec.length) {
                let dim = [];
                monRec.forEach(e=> {
                    if ('group' === e.name) {
                        dim.push(e.value);
                    } else {
                        result[e.name] = e.value;
                    }
                });

                if (0 !== result.length) {
                    result.unmonitored_group = 0 === dim.length ? {} : {group: dim};
                }
            }

        } else {
            console.error('Service id should be initialized');
            throw {error_code: hdrcfg.code.EOTHER, error_msg: hdrcfg.msg[hdrcfg.code.EOTHER]};
        }

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_reporter_conf begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let result = await query_monitor();

            //hdrcom.pub.processResult(res, {report_system: result}, true);
            console.info("[query_reporter_conf success.]");
            return {report_system: result};
        } catch (err) {
            console.error(err);
            console.error('[query_reporter_conf fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function AddSender(req, res) {
    console.info('[save_monitor_conf begin]');
    return insert_svc(req, res, hdrcfg.cfg.service_type.SENDER);
}

function QuerySender(req, res) {
    let db;

    async function query_sender() {
        let sql = 'SELECT ID id FROM ' + hdrcfg.cfg.table_name.T_SERVICE_INFO +
            ' WHERE TYPE = ? ' +
            ' LIMIT 0, 1';
        let result = {};

        let svcId = await hdrcom.db.preSql(db, sql, [hdrcfg.cfg.service_type.SENDER])

        if (0 < svcId.length) {
            sql = 'SELECT PARAM_NAME name, PARAM_VALUE value ' +
                ' FROM ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM +
                ' WHERE SERVICE_ID = ?';

            let svcRec = await hdrcom.db.preSql(db, sql, svcId[0].id);

            if (0 < svcRec.length) {
                let method = [];
                let phone = [];
                let addr = [];
                let mail = {};
                let sms = {};

                svcRec.forEach(e=> {
                    if ('mail_server' === e.name
                        || 'mail_port' === e.name
                        || 'user' === e.name
                        || 'password' === e.name) {

                        if ('password' !== e.name) {
                            mail[e.name] = e.value;
                        } else {
                            mail[e.name] = hdrcom.pub.detdes(e.value);
                        }
                    } else if ('method' === e.name) {
                        method[e.name] = e.value;
                    } else if ('phone_number' === e.name) {
                        phone.push(e.value);
                    } else if ('address' === e.name) {
                        addr.push(e.value);
                    } else {
                        result[e.name] = e.value;
                    }
                });

                mail['address_list'] = 0 === addr.length ? {} : {address: addr};

                result.mail = hdrcom.pub.isEmptyObj(mail) ? {} : mail;
                sms.send_method = 0 === method.length ? {} : method;
                sms.phone_number_list = 0 === phone.length ? {} : {phone_number: phone};
                result.sms = sms;
            }
        } else {
            console.error('Service id should be initialized');
            throw {error_code: hdrcfg.code.EOTHER, error_msg: hdrcfg.msg[hdrcfg.code.EOTHER]};
        }

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_monitor_conf begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let result = await query_sender();

            //hdrcom.pub.processResult(res, {monitor: result}, true);
            console.info("[query_monitor_conf success.]");
            return {monitor: result};
        } catch (err) {
            console.error(err);
            console.error('[query_monitor_conf fail]');
            //hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}


module.exports = {
    save_reporter_conf: AddMonitor,
    query_reporter_conf: QueryMonitor,
    save_monitor_conf: AddSender,
    query_monitor_conf: QuerySender
};

