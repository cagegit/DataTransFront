'use strict';
let q = require('q');
let fs = require('fs');
let dt = require('moment');
let async = require('async');
let csv = require('json2csv');
let exec = require('child_process').exec;
let path = require('path');

let hdrcom = require('../common');
let hdrcfg = require('../../config');

function ClearErr(req, res) {

    let db;

    function truncate_file(group, component_name) {
        return new Promise((resolve, reject)=> {
            let file = path.join(process.env['DIP_HOME'], hdrcfg.cfg.macro.MN_DIR_ERRSQL, group, component_name + '_error_sql.log');
            fs.truncate(file, 0, function (err) {
                if (err) {
                    console.error(err);
                    reject({error_code: hdrcfg.code.EFILETRUN, error_msg: hdrcfg.msg[hdrcfg.code.EFILETRUN]});
                } else {
                    resolve();
                }
            });
        });
    }

    async function clear_err() {
        let sql = 'truncate table ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX;
        await truncate_file(req.group, req.component_name);
        await hdrcom.db.preSql(db, sql, []);
    }

    async function doJob() {
        try {
            console.info('[trunc_apply_error_record begin]');
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await clear_err();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[trunc_apply_error_record success.]");
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            hdrcom.pub.processResult(res, err, false);
            console.info("[trunc_apply_error_record fail.]");
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    doJob();
}

function get_action(act) {
    switch (act) {
        case hdrcfg.cfg.macro.OLDR_ACT_USER_SKIP_RECORD:
            return "User Skip Record";

        case hdrcfg.cfg.macro.OLDR_ACT_AUTO_SKIP_RECORD:
            return "Auto Skip Record";

        case hdrcfg.cfg.macro.OLDR_ACT_FIXERR_SKIP_RECORD:
            return "Fix Error Skip Record";

        case hdrcfg.cfg.macro.OLDR_ACT_UNKNOWN_SKIP_RECORD:
            return "Unknown Error Skip Record";

        case hdrcfg.cfg.macro.OLDR_ACT_USER_FIX_RECORD:
            return "User Fix Record";

        case hdrcfg.cfg.macro.OLDR_ACT_AUTO_FIX_RECORD:
            return "Auto Fix Record";

        case hdrcfg.cfg.macro.OLDR_ACT_USER_EXCLUDE_TABLE:
            return "User Exclude Table";

        case hdrcfg.cfg.macro.OLDR_ACT_AUTO_EXCLUDE_TABLE:
            return "Auto Exclude Table";

        case hdrcfg.cfg.macro.OLDR_ACT_FIXERR_EXCLUDE_TABLE:
            return "Fix Error Exclude Table";

        case hdrcfg.cfg.macro.OLDR_ACT_USER_FORCE_UPDATE:
            return "User Force Update Record";

        default:
            return "Unknown Action";
    }
}

function get_action_code(act) {
    if (act === "User Skip Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_USER_SKIP_RECORD;
    } else if (act === "Auto Skip Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_AUTO_SKIP_RECORD
    } else if (act === "Fix Error Skip Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_FIXERR_SKIP_RECORD
    } else if (act === "Unknown Error Skip Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_UNKNOWN_SKIP_RECORD
    } else if (act === "User Fix Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_USER_FIX_RECORD
    } else if (act === "Auto Fix Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_AUTO_FIX_RECORD
    } else if (act === "User Exclude Table") {
        return hdrcfg.cfg.macro.OLDR_ACT_USER_EXCLUDE_TABLE
    } else if (act === "Auto Exclude Table") {
        return hdrcfg.cfg.macro.OLDR_ACT_AUTO_EXCLUDE_TABLE
    } else if (act === "Fix Error Exclude Table") {
        return hdrcfg.cfg.macro.OLDR_ACT_FIXERR_EXCLUDE_TABLE
    } else if (act === "User Force Update Record") {
        return hdrcfg.cfg.macro.OLDR_ACT_USER_FORCE_UPDATE
    } else {
        return 0;
    }
}

function get_opration(opc) {

    switch (opc) {

        case hdrcfg.cfg.macro.DB_OP_INSERT:
            return 'INSERT';

        case hdrcfg.cfg.macro.DB_OP_UPDATE:
            return 'UPDATE';

        case hdrcfg.cfg.macro.DB_OP_DELETE:
            return 'DELETE';

        case hdrcfg.cfg.macro.DB_OP_TAG_MARKER:
            return 'TAG';

        case hdrcfg.cfg.macro.DB_OP_LOB_ERASE:
            return 'LOB_ERASE';

        case hdrcfg.cfg.macro.DB_OP_LOB_WRITE:
            return 'LOB_WRITE';

        case hdrcfg.cfg.macro.DB_OP_LOB_TRIM:
            return 'LOB_TRIM';

        case hdrcfg.cfg.macro.DB_OP_LOB_SELECT:
            return 'LOB_SELECT';

        case hdrcfg.cfg.macro.DB_OP_LONG_WRITE:
            return 'LONG_WRITE';

        case hdrcfg.cfg.macro.DB_OP_DDL:
            return 'DDL';

        case hdrcfg.cfg.macro.DB_OP_SYNC_SEQUENCE:
            return 'SYNC_SEQ';

        case hdrcfg.cfg.macro.DB_OP_START:
            return 'START';

        case hdrcfg.cfg.macro.DB_OP_COMMIT:
            return 'COMMIT';

        case hdrcfg.cfg.macro.DB_OP_ROLLBACK:
            return 'ROLLBACK';

        default:
            return 'UNKNOWN';
    }
}

function FullErr(req, res) {
    let db;

    function generate_idx() {
        let mydefer = q.defer();

        exec('$DIP_HOME/bin/dip_job_ldr_idx2db', function (err, stdout, stderr) {
            if (err) {
                console.error(err);
            } else {
                console.info('Parse idx file success');
            }
            mydefer.resolve();
        });
        return mydefer.promise;
    }

    async function full_err() {
        let file = path.join(process.env['DIP_HOME'], hdrcfg.cfg.macro.MN_DIR_ERRSQL, req.group, req.component_name + '_error_sql.log');
        let sql = 'SELECT FLAG flg, ACTION act, OPTCODE opc, LEN len, DATE_FORMAT(UPDATE_TIME, \'%Y-%m-%d %H:%i:%s\') tm, ERRCODE ec, OFFSET off, OWNER owner, TNAME tnm ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX +
            ' WHERE GROUP_ID = ? ' +
            '   AND COMP_ID = ? ';

        let sql1 = 'SELECT COUNT(*) page_num ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX +
            ' WHERE GROUP_ID = ? ' +
            '   AND COMP_ID = ? ';

        let buf = '';
        let val = [];
        let page;

        val.push(req.group);
        val.push(req.component_name);

        for (let tmp in req) {
            if ('owner' === tmp && 0 < req[tmp].length) {
                buf += ' AND OWNER like ? ';
                val.push(req[tmp] + '%');
            } else if ('object' === tmp && 0 < req[tmp].length) {
                buf += ' AND TNAME like ? ';
                val.push(req[tmp] + '%');
            } else if ('action' === tmp && 0 < req[tmp].length) {
                buf += ' AND ACTION = ? ';
                val.push(get_action_code(req[tmp]));
            } else if ('mark_flag' === tmp && 0 < req[tmp].length) {
                buf += ' AND FLAG = ? ';
                val.push(req[tmp]);
            } else if ('start_time' === tmp && 0 < req[tmp].length) {

                buf += ' AND UPDATE_TIME >= ? ';
                val.push(req[tmp]);
            } else if ('end_time' === tmp && 0 < req[tmp].length) {
                buf += ' AND UPDATE_TIME <= ? ';
                val.push(req[tmp]);
            }
        }

        /* get page_num */
        if (0 < buf.length) {
            sql1 += buf;
        }
        let pageRec = await hdrcom.db.preSql(db, sql1, val);
        if (0 < pageRec.length) {
            page = 0;
        } else {
            page = parseInt(pageRec[0].page_num / hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);
            pageRec[0].page_num % hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER > 0 ? page++ : page;
        }

        /* get error */
        if (0 < buf.length) {
            sql += buf;
        }
        sql += 'ORDER BY tnm, off LIMIT ?, ?';
        if (0 === parseInt(req.page_num) || 1 === parseInt(req.page_num)) {
            val.push(0);
        } else {
            val.push((parseInt(req.page_num) - 1) * hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);
        }

        val.push(hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);

        let errRec = await hdrcom.db.preSql(db, sql, val);
        let history = [];

        if (0 < errRec.length) {
            let fd = fs.openSync(file, 'r');
            if (0 > fd) {
                hdrcom.log.error('open error');
                throw {error_code: hdrcfg.code.EFILEOPEN, error_msg: hdrcfg.msg[hdrcfg.code.EFILEOPEN]};
            } else {
                for (let i = 0; i < errRec.length; i++) {
                    let tmp = {};
                    let buf = new Buffer(parseInt(errRec[i].len));

                    let rcnt = fs.readSync(fd, buf, 0, parseInt(errRec[i].len), parseInt(errRec[i].off));
                    if (parseInt(errRec[i].len) !== rcnt) {
                        console.error('read error');
                        break;
                    }

                    tmp.detailed_message = buf.toString();
                    tmp.time = errRec[i].tm;
                    tmp.flag = errRec[i].flg;
                    tmp.owner = errRec[i].owner;
                    tmp.object = errRec[i].tnm;
                    tmp.action = get_action(parseInt(errRec[i].act));
                    tmp.offset = '';
                    tmp.operation = get_opration(parseInt(errRec[i].opc));
                    if (errRec[i].ec === hdrcfg.cfg.macro.OLDR_ERROR_NOMATCH) {
                        tmp.error_type = 'Record Not Matched';
                    } else {
                        tmp.error_type = 'Access Database Error' + errRec[i].ec.toString();
                    }

                    history[i] = tmp;
                }
            }
            fs.closeSync(fd);
        }

        return {all_num: page, history: history};
    }

    async function doJob() {
        try {
            console.info('[query_apply_full_error begin]');
            db = await hdrcom.db.openDb();

            await generate_idx();
            let result = await full_err();
            hdrcom.pub.processResult_noMD5(res, result, true);
            console.info("[query_apply_full_error success.]");
            return result
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult_noMD5(res, err, false);
            console.info("[query_apply_full_error fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function CurErr(req, res) {
    let db;

    async function current_err() {
        let mydefer = q.defer();
        let sql = 'SELECT LEN len, UPDATE_TIME tm, OFFSET off, OWNER owner, TNAME tnm, ACTION act, OPTCODE opc, ERRCODE ec ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX +
            ' ORDER BY tm DESC' +
            ' LIMIT 0, 1';

        let errRec = await hdrcom.db.preSql(db, sql, []);
        let result = {};
        if (0 < errRec.length) {
            let file = path.join(process.env['DIP_HOME'], hdrcfg.cfg.macro.MN_DIR_ERRSQL, req.group, req.component_name + '_error_sql.log');

            fs.open(file, 'r', function (err, fd) {
                if (err) {
                    console.error(err);
                    if ('ENOENT' === err.code) {
                        mydefer.resolve({});
                    }
                    mydefer.reject({error_code: hdrcfg.code.EOTHER, error_msg: hdrcfg.msg[hdrcfg.code.EOTHER]});
                } else {
                    let buf = new Buffer(parseInt(errRec[0].len));
                    fs.read(fd, buf, 0, parseInt(errRec[0].len), parseInt(errRec[0].off), function (err, rcnt, data) {
                        if (err) {
                            fs.close(fd, error=> {
                                console.error(error);
                            });
                            console.error(err);
                            mydefer.reject({
                                error_code: hdrcfg.code.EFILERD,
                                error_msg: hdrcfg.msg[hdrcfg.code.EFILERD]
                            });
                        } else {
                            fs.close(fd, error=> {
                                console.error(error);
                            });
                            if (parseInt(errRec[0].len) !== rcnt) {
                                console.error('read too short');
                                mydefer.reject({
                                    error_code: hdrcfg.code.ETOOSHORT,
                                    error_msg: hdrcfg.msg[hdrcfg.code.ETOOSHORT]
                                });
                            } else {
                                result.time = errRec[0].tm;
                                result.owner = errRec[0].owner;
                                result.object = errRec[0].tnm;
                                result.status = 'Running';
                                result.action = get_action(parseInt(errRec[0].act));
                                result.operation = get_opration(parseInt(errRec[0].opc));
                                if (errRec[0].ec === hdrcfg.cfg.macro.OLDR_ERROR_NOMATCH) {
                                    result.error_type = 'Record Not Matched';
                                } else {
                                    result.error_type = 'Access Database Error' + errRec[0].ec.toString();
                                }

                                result.detailed_message = data.toString();

                                mydefer.resolve(result);
                            }
                        }
                    });
                }
            });
        } else {
            mydefer.resolve(result);
        }
        return mydefer.promise;
    }

    async function doJob() {
        try {
            console.info('[query_apply_current_error begin]');
            db = await hdrcom.db.openDb();

            let result = await current_err();
            hdrcom.pub.processResult_noMD5(res, result, true);
            console.info("[query_apply_current_error success.]");
            return result;
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult_noMD5(res, err, false);
            console.info("[query_apply_current_error fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function MarkedErr(req, res) {
    let db;

    async function mark_err() {
        let sql = 'UPDATE ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX +
            ' SET FLAG = ? ' +
            ' WHERE GROUP_ID = ? ' +
            ' AND COMP_ID = ? ' +
            ' AND OFFSET = ?';
        let val = [];
        if (req.location.offset instanceof Array) {
            req.location.offset.forEach(e=> {
                val.push(['1', req.group, req.component_name, parseInt(e)]);
            })
        } else {
            val[0] = ['1', req.group, req.component_name, 0 === req.location.offset.length ? 0 : parseInt(req.location.offset)];
        }

        let task = [];
        for (let i = 0; i < val.length; i++) {
            task.push(hdrcom.db.preSql(db, sql, val[i]));
        }

        await Promise.all(task);
    }

    async function doJob() {
        try {
            console.info('[marked_apply_error begin]');
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await mark_err();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult_noMD5(res, {}, true);
            console.info("[marked_apply_error success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            hdrcom.pub.processResult_noMD5(res, err, false);
            console.info("[marked_apply_error fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function DownloadErr(req, res) {
    let db;

    function genarate_csv(group, comp, json) {
        return new Promise((resolve, reject)=> {
            let file = path.join(process.env['DIP_HOME'], '/web/app/download/', group + '_' + comp + '_error_sql.csv');

            csv({
                data: json,
                fields: ['time', 'user', 'object', 'action', 'operation', 'type', 'detailed_message']
            }, function (err, result) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    fs.writeFile(file, result, function (err) {
                        if (err) {
                            console.error(err);
                            reject(err);
                        } else {
                            resolve(path.basename(file));
                        }
                    });
                }
            });
        });
    }

    async function download_err() {
        let file = path.join(process.env['DIP_HOME'], hdrcfg.cfg.macro.MN_DIR_ERRSQL, req.group, req.component_name + '_error_sql.log');
        let sql = 'SELECT FLAG flg, ACTION act, OPTCODE opc, LEN len, UPDATE_TIME tm, ERRCODE ec, OFFSET off, OWNER owner, TNAME tnm ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX +
            ' WHERE GROUP_ID = ? ' +
            ' AND COMP_ID = ? ' +
            ' ORDER BY tnm DESC';
        let val = [req.group, req.component_name];

        let errRec = await hdrcom.db.preSql(db, sql, val);
        let history = [];

        if (0 < errRec.length) {
            let fd = fs.openSync(file, 'r');
            if (0 > fd) {
                hdrcom.log.error('open error');
                throw {error_code: hdrcfg.code.EFILEOPEN, error_msg: hdrcfg.msg[hdrcfg.code.EFILEOPEN]};
            } else {
                for (let i = 0; i < errRec.length; i++) {
                    let tmp = {};
                    let buf = new Buffer(parseInt(errRec[i].len));

                    let rcnt = fs.readSync(fd, buf, 0, parseInt(errRec[i].len), parseInt(errRec[i].off));
                    if (parseInt(errRec[i].len) !== rcnt) {
                        console.error('read error');
                        break;
                    }

                    tmp.detailed_message = buf.toString();
                    tmp.time = errRec[i].tm;
                    tmp.flag = errRec[i].flg;
                    tmp.user = errRec[i].owner;
                    tmp.object = errRec[i].tnm;
                    tmp.action = get_action(parseInt(errRec[i].act));
                    tmp.offset = '';
                    tmp.operation = get_opration(parseInt(errRec[i].opc));
                    if (errRec[i].ec === hdrcfg.cfg.macro.OLDR_ERROR_NOMATCH) {
                        tmp.type = 'Record Not Matched';
                    } else {
                        tmp.type = 'Access Database Error' + errRec[i].ec.toString();
                    }

                    history[i] = tmp;
                }
            }
            fs.closeSync(fd);
        }


        return await genarate_csv(req.group, req.component_name, history);
    }

    async function doJob() {
        try {
            console.info('[download_error_file begin]');
            db = await hdrcom.db.openDb();

            let result = await download_err();
            hdrcom.pub.processResult_noMD5(res, {file_path: result}, true);
            console.info("[download_error_file success.]");
            return {file_path: result};
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult_noMD5(res, err, false);
            console.info("[download_error_file fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function ExportErr(req, res) {
    async function export_err() {
        let epath = path.join(process.env['DIP_HOME'], 'errinfo');
        let downPath = path.join(process.env['DIP_HOME'], '/web/app/download/');
        let tar = 'dip_errinfo_' + dt().format('YYYYMMDDHHmmss') + '.tar';
        let stmt;

        stmt = `cd ${epath} && tar -cf ${tar} ./* && mv ${tar} ${downPath}`;
        await hdrcom.pub.exe_shell(stmt);

        stmt = `cd ${downPath} && gzip ${tar} && rm -f ${tar}`;
        await hdrcom.pub.exe_shell(stmt);

        return `${tar}.gz`;
    }

    async function doJob() {
        console.info('[exp_err begin]');
        try {
            let result = await export_err();
            hdrcom.pub.processResult(res, {filename: result}, 1);
            console.info('[exp_err success]');
            return {filename: result};
        } catch (err) {
            hdrcom.pub.processResult(res, ret, 0);
            console.info('[exp_err fail]');
            return err;
        }
    }

    return doJob();
}

module.exports = {
    trunc_apply_error_record: ClearErr,
    query_apply_full_error: FullErr,
    query_apply_current_error: CurErr,
    marked_apply_error: MarkedErr,
    download_error_file: DownloadErr,
    exp_err: ExportErr
};