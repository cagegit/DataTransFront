'use strict';
let fs = require('fs');
let dt = require('moment');
let async = require('async');
let path = require('path');

let hdrcom = require('../common');
let hdrcfg = require('../../config');

let tab = [hdrcfg.cfg.table_name.T_USER_MANAGER,
    hdrcfg.cfg.table_name.T_DIP_SEQ,
    hdrcfg.cfg.table_name.T_PROJECT_INFO,
    hdrcfg.cfg.table_name.T_GROUP_INFO,
    hdrcfg.cfg.table_name.T_GROUP_PARAM,
    hdrcfg.cfg.table_name.T_SERVICE_INFO,
    hdrcfg.cfg.table_name.T_SERVICE_PARAM,
    hdrcfg.cfg.table_name.T_COMP_INFO,
    hdrcfg.cfg.table_name.T_COMP_PARAM,
    hdrcfg.cfg.table_name.T_COMP_RELATION,
    hdrcfg.cfg.table_name.T_DB_FAV,
    hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS,
    hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET,
    hdrcfg.cfg.table_name.T_WEB_CACHE,
    hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO,
    hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN,
    hdrcfg.cfg.table_name.T_ETL_ASSIGN_DB_INFO,
    hdrcfg.cfg.table_name.T_ETL_BATCH_RULES,
    hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING,
    hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN,
    hdrcfg.cfg.table_name.T_ETL_OPERATION_FILTER,
    hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM,
    hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER,
    hdrcfg.cfg.table_name.T_ETL_RULE_SET,
    hdrcfg.cfg.table_name.T_ETL_RULE_SET_DETAIL,
    hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT,
    hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER];

function Bakup(req, res) {
    let db;

    async function create_file() {
        let sql = '';
        let file = path.join(process.env['DIP_HOME'], '/web/app/download/' + 'tab_sql.txt');
        let fd = fs.openSync(file, 'w+');

        for (let i = 0; i < tab.length; i++) {
            /* get meta data */
            sql = 'SELECT COLUMN_NAME AS fld, DATA_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_NAME = ? ';
            let metaRec = await hdrcom.db.preSql(db, sql, [tab[i]]);
            let stmt = '';

            /* get table data */
            for (let j = 0; j < metaRec.length; j++) {
                if ('datetime' === metaRec[j]['type']) {
                    if (0 === j) {
                        stmt += 'SELECT ' + 'QUOTE(DATE_FORMAT(' + metaRec[j]['fld'] + ', \'%Y-%m-%d %H:%i:%s\')) AS ' + metaRec[j]['fld'];
                    } else if (j !== metaRec.length - 1) {
                        stmt += ', ' + 'QUOTE(DATE_FORMAT(' + metaRec[j]['fld'] + ', \'%Y-%m-%d %H:%i:%s\')) AS ' + metaRec[j]['fld'];
                    } else {
                        stmt += ', ' + 'QUOTE(DATE_FORMAT(' + metaRec[j]['fld'] + ', \'%Y-%m-%d %H:%i:%s\')) AS ' + metaRec[j]['fld'];
                        stmt += ' FROM ' + tab[i];
                    }
                } else {
                    if (0 === j) {
                        stmt += 'SELECT QUOTE(' + metaRec[j]['fld'] + ') as ' + metaRec[j]['fld'];
                    } else if (j !== metaRec.length - 1) {
                        stmt += ', QUOTE(' + metaRec[j]['fld'] + ') as ' + metaRec[j]['fld'];
                    } else {
                        stmt += ', QUOTE(' + metaRec[j]['fld'] + ') as ' + metaRec[j]['fld'];
                        stmt += ' FROM ' + tab[i];
                    }
                }
            }

            let result = await hdrcom.db.preSql(db, stmt, []);

            /* genarate SQL statements*/
            if (0 < result.length) {
                let flag = 1;
                let field = '';
                let val = '';
                let tmp = '';
                let wcnt = 0;

                for (let m = 0; m < result.length; m++) {
                    flag = 1;
                    field = '';
                    val = '';
                    tmp = '';
                    wcnt = 0;

                    for (let obj in result[m]) {
                        if ('object' === typeof result[m][obj] && result[m][obj] === null) {
                            continue;
                        }

                        if (1 === flag) {
                            flag = 0;
                            field += obj;
                            val += result[m][obj];

                        } else {
                            field += ',' + obj;
                            val += ',' + result[m][obj];
                        }
                    }
                    tmp = 'insert into ' + tab[i] + ' (' + field + ')' + ' values(' + val + '); \n';
                    console.info(tmp);

                    let buf = new Buffer(tmp);
                    wcnt = fs.writeSync(fd, buf, 0, buf.length);
                    if (wcnt !== buf.length) {
                        fs.closeSync(fd);
                        throw {error_code: hdrcfg.code.EFILEWR, error_msg: hdrcfg.msg[hdrcfg.code.EFILEWR]};
                    }
                }
            }
        }

        fs.closeSync(fd);
    }

    async function create_tar() {
        let zip = 'dip_etc_' + dt().format('YYYYMMDDHHmmss') + '.tar.gz';
        let downPath = path.join(process.env['DIP_HOME'], '/web/app/download/');
        let dirPath = path.join(process.env['DIP_HOME'] + '/etc/');
        let dirTar = 'etc_dir.tar';
        let file = 'tab_sql.txt';
        await hdrcom.pub.exe_shell('cd ' + dirPath + ' && tar -cf ' + dirTar + ' ./* && mv ./' + dirTar + ' ' + downPath);
        await hdrcom.pub.exe_shell('cd ' + downPath + ' && tar -zcf ./' + zip + ' ./' + dirTar + ' ./' + file + ' && rm -f ' + dirTar + ' ' + file);
        console.info('[%s] genarate success', zip);
        return zip;
    }

    async function doJob() {
        try {
            console.info('[export_config begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();

            await create_file();
            let result = await create_tar();

            //hdrcom.pub.processResult(res, {filename: result}, true);
            return {filename: result};
            console.info("[export_config success.]");
        } catch (err) {
            console.error(err);
            console.error('[query_group fail]');
            //hdrcom.pub.processResult(res, err, false);
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function Recovery(req, res) {
    let db;

    function read_sql(file) {
        return new Promise((resolve, reject)=> {
            fs.readFile(file, function (err, data) {
                if (err) {
                    reject({error_code: hdrcfg.code.EFILERD, error_msg: hdrcfg.msg[hdrcfg.code.EFILERD]});
                } else {
                    resolve(data);
                }
            });
        });
    }

    async function import_cfg(file) {
        let dir = [hdrcfg.cfg.macro.MN_DIR_DATA,
            hdrcfg.cfg.macro.MN_DIR_LOG,
            hdrcfg.cfg.macro.MN_DIR_DICT,
            hdrcfg.cfg.macro.MN_DIR_SKIPSQL,
            hdrcfg.cfg.macro.MN_DIR_ERRSQL,
            hdrcfg.cfg.macro.MN_DIR_SYNC,
            hdrcfg.cfg.macro.MN_DIR_ETC];
        let sql = 'SELECT ID id ' +
            'FROM ' + hdrcfg.cfg.table_name.T_GROUP_INFO;

        /* permission check
        if ('super_admin' !== req.user.cuser.auth) {
            throw {error_code: hdrcfg.code.EAUTH, error_msg: hdrcfg.msg[hdrcfg.code.EAUTH]};
        }
    */
        let grpRec = await hdrcom.db.preSql(db, sql, []);
        if (0 < grpRec.length) {
            let status;
            let task = [];
            /* check group status */
            for (let i = 0; i < grpRec.length; i++) {
                status = await hdrcom.pub.getStatus(grpRec[i].id);
                if ('yes' === status) {
                    throw {error_code: hdrcfg.code.EBUSY, error_msg: hdrcfg.msg[hdrcfg.code.EBUSY]};
                }
            }

            /* clear directory */
            let tmp = '';
            for (let i = 0; i < grpRec.length; i++) {
                for (let j = 0; j < dir.length; j++) {
                    tmp = path.join(process.env['DIP_HOME'], dir[j], grpRec[i].id);
                    task.push(hdrcom.pub.exe_shell('rm -rf ' + tmp + ' >/dev/null'));
                }
            }
            await Promise.all(task);

            /* truncate table */
            let sql = '';
            task = [];
            for (let i = 0; i < tab.length; i++) {
                sql = 'delete from ' + tab[i];
                task.push(hdrcom.db.preSql(db, sql, []));
            }
            await Promise.all(task);
        }

        /* unpack */
        let downPath = path.join(process.env['DIP_HOME'], '/web/app/download/');
        let etcPath = path.join(process.env['DIP_HOME'], 'etc');
        let etcTar = 'etc_dir.tar';
        await hdrcom.pub.exe_shell('cd ' + downPath + ' && tar -xf ' + file + ' && mv ' + etcTar + ' ' + etcPath);
        await hdrcom.pub.exe_shell('cd ' + etcPath + ' && tar -xf ./' + etcTar + ' && rm -f ./' + etcTar);

        /* insert table */
        let sqlFile = path.join(downPath, 'tab_sql.txt');
        let buf = await read_sql(sqlFile);
        hdrcom.pub.exe_shell(`rm -f ${sqlFile}`);
        let stmt = buf.toString().split('\n');
        let task = [];
        for (let i = 0; i < stmt.length; i++) {
            if (0 < stmt[i].length){
                task.push(hdrcom.db.preSql(db, stmt[i], []));
            }
        }

        await Promise.all(task);

        /* create table */
        sql = 'SELECT ID id ' +
            'FROM ' + hdrcfg.cfg.table_name.T_GROUP_INFO;

        grpRec = await hdrcom.db.preSql(db, sql, []);

        if (0 < grpRec.length) {
            let tmp = '';
            for (let i = 0; i < grpRec.length; i++) {
                for (let j = 0; j < dir.length; j++) {
                    tmp = path.join(process.env['DIP_HOME'], dir[j], grpRec[i].id);
                    task.push(hdrcom.pub.exe_shell('mkdir -p ' + tmp + ' >/dev/null'));
                }
            }
            await Promise.all(task);
        }
    }

    async function doJob() {
        try {
            console.info('[import_config begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await import_cfg(req.body.request.filename);
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, {}, true);
            return {};
            console.info("[import_config success.]");
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            //hdrcom.pub.processResult(res, err, false);
            console.info("[import_config fail.]");
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}


module.exports = {
    export_config: Bakup,
    import_config: Recovery
};
