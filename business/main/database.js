/**
 * Created by on 2016/12/13.
 */

const hdrcom = require('../common');
const hdrcfg = require('../../config');
// const Pub=require('../common/public');
// const md5 = require('md5');
// const Q = require("q");
// const async = require('async');
const moment = require('moment');
const setenv = require('setenv');
const DB = require('odbc')();
const CK = require('check-types');
const Promise = require('bluebird');
//var mysqlCn = hdrcfg.cfg.mysql_connstr.connstr;
// let mysqlCn = hdrcom.pub.getDipMysqlConn();

/**查询数据库版本
 * @param db:
 * @return Promise
 */
async function query_db_version(db) {
    console.info("begin to query_db_version.");
    let sql = "select serverproperty('engineedition') as serverproperty";
    let params = [];
    let result = false;
    let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
        console.error(err);
    });
    if (CK.nonEmptyArray(rs)) {
        if (rs[0].serverproperty !== '3') {
            let buf = hdrcfg.code.ENSUPPORT + ':engineedition:' + rs[0].serverproperty + ' ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
            console.error(buf);
            result = '3';
        }
    } else {
        let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
        console.error(buf);
        result = false;
    }

    let sqlV = "select @@version as version";
    let paramsV = [];

    let rsV = await hdrcom.db.executeStrSql(db, sqlV, paramsV).catch(err=> {
        console.error(err);
    });
    if (CK.nonEmptyArray(rsV)) {
        if (rsV[0].version.indexOf('2005') !== -1) {
            result = hdrcfg.cfg.DATABASE_2005;
        } else {
            result = '0';
        }
    } else {
        let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
        console.error(buf);
        result = false;
    }
    return result;
}
async function check_rollback_table(db) {
    let sql = "SELECT name  FROM sys.tables WHERE type = 'U' and name = 'r7_cfg_rollback'";
    let params = [];
    let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
        let buf = hdrcfg.code.ECHECKROLLTABLE + ':' + hdrcfg.msg[hdrcfg.code.ECHECKROLLTABLE];
        let msg = {error_code: hdrcfg.code.ECHECKROLLTABLE, error_msg: buf};
        console.error(err);
        throw msg;
    });
    if (CK.nonEmptyArray(rs)) {
        return '1';
    } else {
        return '0';
    }
}
async function check_sqlserver_envir(version, db, db_id, rollbackFlag) {
    console.info("begin to check_sqlserver_envir.");
    let resJson1 = {};
    let resJson2 = {};
    let resArrayJson = [];

    resJson2["db_version"] = version;

    if (rollbackFlag === '1') {
        resJson1["rollback"] = "yes";
    } else {
        resJson1["rollback"] = "no";
    }
    let sql = "SELECT recovery_model FROM sys.databases WHERE name  = ?";
    let params = [db_id];

    let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
        console.error(err);
    });
    if (!rs) {
        return false;
    } else {
        if (CK.nonEmptyArray(rs)) {
            if (rs[0].recovery_model === 1) {
                resJson1["recover_status"] = "yes";
                resJson2["recover_status"] = "1";
            } else if (rs[0].recovery_model === 2) {
                resJson1["recover_status"] = "no";
                resJson2["recover_status"] = "2";
            } else if (rs[0].recovery_model === 3) {
                resJson1["recover_status"] = "no";
                resJson2["recover_status"] = "3";
            }
        } else {
            let buf = hdrcfg.code.ENOENT + ':recovery_model ' + hdrcfg.msg[hdrcfg.code.ENOENT];
            console.error(buf);
            return false;
        }
    }

    let flag = 0;

    if (version === hdrcfg.cfg.DATABASE_2005) {
        resJson1["cdc_status"] = "yes";
        resJson2["cdc_status"] = "1";
    } else {
        let sqlC = "select is_cdc_enabled from sys.databases where name = ?";
        let paramsC = [db_id];

        let rsC = await hdrcom.db.executeStrSql(db, sqlC, paramsC).catch(err=> {
            console.error(err);
        });
        if (!rsC) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (CK.nonEmptyArray(rsC)) {
                if (rsC[0].is_cdc_enabled) {
                    resJson1["cdc_status"] = "yes";
                    resJson2["cdc_status"] = "1";
                } else {
                    flag = 1;
                    resJson1["cdc_status"] = "no";
                    resJson2["cdc_status"] = "0";
                }
            } else {
                let buf = hdrcfg.code.ENOENT + ':is_cdc_enabled ' + hdrcfg.msg[hdrcfg.code.ENOENT];
                console.error(buf);
                return false;
            }
        }
    }

    resJson1["r7"] = {};

    let sqlV = "SELECT name  FROM sys.tables WHERE type = 'U'  and name = 'r7_ddl_dblog'";
    let paramsV = [];

    let rsV = await hdrcom.db.executeStrSql(db, sqlV, paramsV).catch(err=> {
        console.error(err);
    });
    if (!rsV) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (CK.nonEmptyArray(rsV)) {
            resJson1.r7.r7_table = "yes";
            resJson2["r7_table"] = "1";
        } else {
            flag = 1;
            resJson1.r7.r7_table = "no";
            resJson2["r7_table"] = "0";
        }
    }

    let sqlV1 = "SELECT  name  FROM sys.procedures WHERE type = 'P'  and name = 'r7_extended_logging'";
    let paramsV1 = [];

    let rsV1 = await hdrcom.db.executeStrSql(db, sqlV1, paramsV1).catch(err=> {
        console.error(err);
    });
    if (!rsV1) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (CK.nonEmptyArray(rsV1)) {
            resJson1.r7.r7_pro = "yes";
            resJson2["r7_pro"] = "1";
        } else {
            flag = 1;
            resJson1.r7.r7_pro = "no";
            resJson2["r7_pro"] = "0";
        }
    }

    let sqlV2 = "SELECT  name  FROM sys.triggers WHERE type = 'TR' AND  name = 'r7_ddl_dblog_trigger'";
    let paramsV2 = [];

    let rsV2 = await hdrcom.db.executeStrSql(db, sqlV2, paramsV2).catch(err=> {
        console.error(err);
    });
    if (!rsV2) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (CK.nonEmptyArray(rsV2)) {
            resJson1.r7.r7_tri = "yes";
            resJson2["r7_tri"] = "1";
        } else {
            flag = 1;
            resJson1.r7.r7_tri = "no";
            resJson2["r7_tri"] = "0";
        }
    }

    if (version !== hdrcfg.cfg.DATABASE_2005) {
        let sqlV3 = "SELECT  is_disabled  FROM sys.triggers WHERE type = 'TR' AND  name = 'tr_MScdc_ddl_event'";
        let paramsV3 = [];

        let rsV3 = await hdrcom.db.executeStrSql(db, sqlV3, paramsV3).catch(err=> {
            console.error(err);
        });
        if (!rsV3) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (CK.nonEmptyArray(rsV3)) {
                if (rsV3[0].is_disabled) {
                    resJson1.r7.r7_ms_tri = "yes";
                    resJson2["r7_ms_tri"] = "1";
                } else {
                    flag = 1;
                    resJson1.r7.r7_ms_tri = "no";
                    resJson2["r7_ms_tri"] = "0";
                }
            } else {
                resJson1.r7.r7_ms_tri = "no";
                resJson2["r7_ms_tri"] = "2";
            }
        }

        let sqlV4 = "SELECT enabled FROM msdb.dbo.sysjobs where name = ?";
        let name = 'cdc.' + db_id + '_capture';
        let paramsV4 = [name];

        let rsV4 = await hdrcom.db.executeStrSql(db, sqlV4, paramsV4).catch(err=> {
            console.error(err);
        });
        if (!rsV4) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (CK.nonEmptyArray(rsV4)) {
                if (rsV4[0].enabled === 0) {
                    resJson1.r7.r7_cap = "yes";
                    resJson2["r7_cap"] = "0";
                } else {
                    flag = 1;
                    resJson1.r7.r7_cap = "no";
                    resJson2["r7_cap"] = "1";
                }
            } else {
                resJson1.r7.r7_cap = "no";
                resJson2["r7_cap"] = "2";
            }
        }

        let sqlV5 = "SELECT enabled FROM msdb.dbo.sysjobs where name = ?";
        let name1 = 'cdc.' + db_id + '_cleanup';
        let paramsV5 = [name1];

        let rsV5 = await hdrcom.db.executeStrSql(db, sqlV5, paramsV5).catch(err=> {
            console.error(err);
        });
        if (!rsV5) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (CK.nonEmptyArray(rsV5)) {
                if (rsV5[0].enabled === 0) {
                    resJson1.r7.r7_clean = "yes";
                    resJson2["r7_clean"] = "0";
                } else {
                    flag = 1;
                    resJson1.r7.r7_clean = "no";
                    resJson2["r7_clean"] = "1";
                }
            } else {
                resJson1.r7.r7_clean = "no";
                resJson2["r7_clean"] = "2";
            }
        }
    } else {
        resJson1.r7.r7_ms_tri = "yes";
        resJson1.r7.r7_cap = "yes";
        resJson1.r7.r7_clean = "yes";
        resJson2["r7_clean"] = "0";
        resJson2["r7_cap"] = "0";
        resJson2["r7_ms_tri"] = "1";
    }

    if (flag !== 0) {
        resJson1.r7_status = "no";
    } else {
        resJson1.r7_status = "yes";
    }
    resArrayJson.push(resJson1);
    resArrayJson.push(resJson2);

    return resArrayJson;
}
async function create_rollback_table(db, infoJson) {
    let sql = "CREATE TABLE [dbo].[r7_cfg_rollback]\n" +
        "(\n" +
        " [db_version] [numeric](18, 0) NOT NULL,\n" +
        " [recover_status] [numeric](18, 0) NOT NULL,\n" +
        " [cdc_status] [numeric](18, 0) NOT NULL,\n" +
        " [r7_pro] [numeric](18, 0) NOT NULL,\n" +
        " [r7_tri] [numeric](18, 0) NOT NULL,\n" +
        " [r7_ms_tri] [numeric](18, 0) NOT NULL,\n" +
        " [r7_cap] [numeric](18, 0) NOT NULL,\n" +
        " [r7_clean] [numeric](18, 0) NOT NULL,\n" +
        " [r7_table] [numeric](18, 0) NOT NULL,\n" +
        " CONSTRAINT [PK_r7_cfg_rollback] PRIMARY KEY CLUSTERED \n" +
        "(\n" +
        " [db_version] ASC \n" +
        " ) \n" +
        ")\n";
    let params = [];

    await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
        // let buf = hdrcfg.code.ECREATEROLLTABLE + ':' + hdrcfg.msg[hdrcfg.code.ECREATEROLLTABLE];
        let msg = {
            error_code: hdrcfg.code.ECREATEROLLTABLE,
            error_msg: hdrcfg.msg[hdrcfg.code.ECREATEROLLTABLE]
        };
        console.error(err);
        throw msg;
    });
    let sql1 = "INSERT INTO [dbo].[r7_cfg_rollback]\n" +
        "           (\n" +
        "            [db_version]\n" +
        "           ,[recover_status]\n" +
        "           ,[cdc_status]\n" +
        "           ,[r7_pro]\n" +
        "           ,[r7_tri]\n" +
        "           ,[r7_ms_tri]\n" +
        "           ,[r7_cap]\n" +
        "           ,[r7_clean]\n" +
        "           ,[r7_table]\n" +
        "            )\n" +
        "     VALUES\n" +
        "           (\n" +
        "            ?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           ,?\n" +
        "           );\n";
    let params1 = [infoJson.db_version, infoJson.recover_status, infoJson.cdc_status, infoJson.r7_pro, infoJson.r7_tri, infoJson.r7_ms_tri, infoJson.r7_cap, infoJson.r7_clean, infoJson.r7_table];

    await hdrcom.db.executeStrSql(db, sql1, params1).catch(err => {
        console.error(err);
        // let buf = hdrcfg.code.ECREATEROLLTABLE + ':' + hdrcfg.msg[hdrcfg.code.ECREATEROLLTABLE];
        throw {
            error_code: hdrcfg.code.ECREATEROLLTABLE,
            error_msg: hdrcfg.msg[hdrcfg.code.ECREATEROLLTABLE]
        };
    });
    return true;
}
async function connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword) {
    let db;
    //打开数据库连接
    let constr = hdrcom.pub.getConnStr(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
    if (!constr) {
        let buf = 'database type:[' + dbType + '],' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
        let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
        console.error(buf);
        throw msg;
    } else {
        db = await hdrcom.db.openStrDB(constr).catch(err => {
            let msg = {error_code: hdrcfg.code.EDBERROR, error_msg: hdrcfg.msg[hdrcfg.code.EDBERROR]};
            console.error(err);
            throw msg;
        });
    }
    return db;
}
/*
 * ##############以下为调用database相关方法######################
 */
//save db info
function save_db_info(body, res) {
    let db;
    let group_id = body.request.group;
    let component_id = body.request.component_id;
    let realDBid = "";
    //1、保存dbinfo
    async function checkDb() {
        console.info("save_db_info, if source DB is exist...");
        let as_source_db = body.request.as_source_db;
        if ('yes' === as_source_db) {
            let sql = '';
            let params = '';
            if (component_id) {
                sql = 'select a.ID from ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' a, ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' b where a.ID = b.COMP_ID AND a.ID != ? AND a.GROUP_ID = ? AND b.PARAM_NAME = ? AND b.PARAM_VALUE = ?';
                params = [component_id, group_id, 'as_source_db', 'yes'];
            } else {
                sql = 'select a.ID from ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' a, ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' b where a.ID = b.COMP_ID AND a.GROUP_ID = ? AND b.PARAM_NAME = ? AND b.PARAM_VALUE = ?';
                params = [group_id, 'as_source_db', 'yes'];
            }
            let rs = await hdrcom.db.preSql(db, sql, params);
            if (CK.nonEmptyArray(rs)) {
                let buf = hdrcfg.code.EEXIST + ':' + 'the source db ' + hdrcfg.msg[hdrcfg.code.EEXIST];
                let msg = {error_code: hdrcfg.code.EEXIST, error_msg: buf};
                console.error(msg);
                throw msg;
            }
        }
    }

    async function insertDb() {
        let insertDB = async function (request, db, component_id, time) {
            //遍历body，循环插入T_COMP_PARAM表
            request["db_connect_mode"] = "RAW";
            request["encrypt_password"] = "";
            request["db_connect_string"] = request.db_ip + ':' + request.db_port + '/' + request.db_id;

            for (let x in request) {
                if (x === 'group' || x === 'component_id')continue;
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                let params = "";
                if (x === 'db_password') {
                    request["encrypt_password"] = "yes";
                    // let crypt_passwd = hdrcom.pub.tdes(request[x]);
                    params = [component_id, x, request[x], 'NORMAL', 'YES', time];
                } else {
                    params = [component_id, x, request[x], 'NORMAL', 'YES', time];
                }
                await hdrcom.db.preSql(db, sql, params);
            }
            if (request.as_source_db === 'yes' && request.db_type === 'oracle') {
                //更改cap和loader的环境变量
                console.info("update cap & loader param...");
                let ora_db = "";

                let sqlQ = 'SELECT b.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' a,' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' b WHERE a.ID = b.COMP_ID AND a.TYPE = ? AND b.PARAM_NAME = ? AND b.PARAM_VALUE = ?';
                let paramsQ = ['ORA_CAPTURE', 'source_db', component_id];

                let rsQ = await hdrcom.db.preSql(db, sqlQ, paramsQ);

                //loader
                let sqlQ1 = 'SELECT b.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' a,' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' b WHERE a.ID = b.COMP_ID AND a.TYPE = ? AND b.PARAM_NAME = ? AND b.PARAM_VALUE = ?';
                let paramsQ1 = ['ORA_LOADER', 'source_db', component_id];

                let rsQ1 = await hdrcom.db.preSql(db, sqlQ1, paramsQ1);
                if (rsQ.length > 0 || rsQ1.length > 0) {
                    let type = request.db_type;
                    let dbIp = request.db_ip;
                    let dbPort = request.db_port;
                    let dbId = request.db_id;
                    let dbUser = request.db_user;
                    let dbPassword = request.db_password;
                    let component_id = request.component_id;

                    let constr = hdrcom.pub.getConnStr(type, dbIp, dbPort, dbId, dbUser, dbPassword);
                    if (!constr) {
                        let buf = 'database type:[' + dbType + '],' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
                        let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
                        console.error(buf);
                        throw msg;
                    }
                    ora_db = await hdrcom.db.openStrDB(constr);
                    let nls = await hdrcom.pub.get_nls_lang(ora_db);
                    let nls_lang = nls.nls_lang;
                    let source_nchar_charset = nls.nchar_charset;
                    let dip_nchar_charset = nls.nls_characterset;
                    let source_clob_charset = nls.source_clob_charset;

                    for (let x = 0; x < rsQ.length; x++) {
                        let sqlU = 'UPDATE ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' SET PARAM_VALUE = ?, UPDATE_TIME = ? WHERE COMP_ID = ? AND PARAM_NAME=?';
                        let paramsU = [nls_lang, time, rsQ[x].COMP_ID, 'nls_lang'];
                        await hdrcom.db.preSql(db, sqlU, paramsU)
                    }

                    let paramArry = ['source_nchar_charset', 'dip_nchar_charset', 'dip_nls_lang', 'source_clob_charset'];
                    let paramValueArry = [source_nchar_charset, dip_nchar_charset, nls_lang, source_clob_charset];

                    for (let x = 0; x < rsQ1.length; x++) {
                        for (let i = 0; i < paramArry.length; i++) {
                            let sqlU = 'UPDATE ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' SET PARAM_VALUE = ?, UPDATE_TIME = ? WHERE COMP_ID = ? AND PARAM_NAME=?';
                            let paramsU = [paramValueArry[i], time, rsQ1[x].COMP_ID, paramArry[i]];
                            await hdrcom.db.preSql(db, sqlU, paramsU)
                        }
                    }
                }
            }
        };

        let db_name = body.request.component_name;
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        if (!component_id || component_id === 'undefined') { //database id is not exist, create
            console.info("database id is not exist, to create.");
            realDBid = await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, hdrcfg.cfg.component_type.DATABASE);
            if (!realDBid) {
                let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
                let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
                console.error(buf);
                throw msg;
            }
            console.info("get id success:" + realDBid);
            //插入T_COMP_INFO表
            let type = hdrcfg.cfg.component_type1.DATABASE;

            let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_INFO + '(ID, NAME, TYPE, GROUP_ID, CREATE_TIME) values (?, ?, ?, ?, ?)';
            let params = [realDBid, db_name, type, group_id, time];
            await hdrcom.db.preSql(db, sql, params);
            //遍历body，循环插入T_COMP_PARAM表
            await insertDB(body.request, db, realDBid, time);
            component_id = realDBid;
        } else {//修改T_COMP_INFO， T_COMP_PARAMS
            console.info("database id is exist, to update.");
            let sql = 'update ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' set NAME = ? where ID = ? and GROUP_ID = ?';
            let params = [db_name, component_id, group_id];

            await hdrcom.db.preSql(db, sql, params);
            let sql1 = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ?';
            let params1 = [component_id];

            await hdrcom.db.preSql(db, sql1, params1);

            //遍历body，循环插入T_COMP_PARAM表
            await insertDB(body.request, db, component_id, time);
        }
        let rejson = {};
        rejson.component_id = component_id;
        return rejson;
    }

    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            console.info("[save_db_info], conn db ok.");
            await checkDb();//检查数据是否存在
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await insertDb();//插入数据
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("save_db_info success!");
            return result;
        } catch (err) {
            console.log("database/save_db_info err:", err);
            db && await hdrcom.db.dbRollback(db).catch(err1 => {
                console.error(err1);
            });
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//查询db_info
function query_db_info(body, res) {
    let db;
    let queDbInfo = async function () {
        let grp_id = body.request.group;
        let db_id = body.request.component_id;
        let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ?';
        let params = [db_id];
        let data = await hdrcom.db.preSql(db, sql, params);
        let resJson = {};
        if (CK.nonEmptyArray(data)) {
            resJson.group = grp_id;
            resJson.component_id = db_id;
            let db_passwd = "";
            let encryPw = "";
            for (let i = 0; i < data.length; i++) {
                if (data[i].PARAM_NAME === 'db_password') {
                    db_passwd = data[i].PARAM_VALUE;
                }
                if (data[i].PARAM_NAME === 'encrypt_password') {
                    encryPw = data[i].PARAM_VALUE;
                }
                resJson[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
            }
            if (encryPw === 'yes') {
                // resJson.db_password = hdrcom.pub.detdes(db_passwd); //解密
                resJson.db_password = db_passwd;
            }
        } else {
            throw {error_code: '000404', error_msg: 'Can not find this dbInfo!'};
        }
        return resJson;
    };
    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            console.info("[query_db_info], conn db ok.");
            let data = await queDbInfo();
            hdrcom.pub.processResult(res, data, true, body);
            return data;
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//查询db模板
function query_fav_db(body, res) {
    let db;
    let queDbModel = async function () {
        let sql = 'SELECT DB_NAME as db_name, DB_TYPE as db_type, DB_IP as db_ip, DB_PORT as db_port, DB_USER as db_user, DB_PASSWORD as db_password, DB_ID as db_id, AS_SOURCE_DB as as_source_db FROM ' + hdrcfg.cfg.table_name.T_DB_FAV;
        let params = [];
        let data = await hdrcom.db.preSql(db, sql, params);
        let resJson = {};
        if (CK.nonEmptyArray(data)) {
            // for (let x = 0; x < data.length; x++) {
            //     data[x].db_password = hdrcom.pub.detdes(data[x].db_password);
            // }
            resJson.fav_dbs = {db: data};
        } else {
            resJson = {fav_dbs: []};
        }
        return resJson;
    };
    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            console.info("[query_fav_db], conn db ok.");
            let data = await queDbModel();
            console.info("query_fav_db  success!");
            hdrcom.pub.processResult(res, data, true, body);
            return data;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//删除db模板
function delete_fav_db(body, res) {
    let db;
    let delDbModel = async function () {
        let db_name = body.request.db_name;
        let sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_DB_FAV + ' WHERE DB_NAME = ?';
        let params = [db_name];
        await hdrcom.db.preSql(db, sql, params);
        return 'SUCCESS';
    };
    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            console.info("[delete_fav_db], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let data = await delDbModel();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, data, true, body);
            return data;
        } catch (err) {
            db && await hdrcom.db.dbRollback(db).catch(er=> {
                console.error(er);
            });
            console.error(err);
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//新增fav db
function add_fav_db(body, res) {
    let db;

    async function checkFav() {
        console.info("To judge whether fav db is exist.");
        let dbName = body.request.db_name;
        let sql = 'SELECT DB_NAME FROM ' + hdrcfg.cfg.table_name.T_DB_FAV + ' WHERE DB_NAME = ?';
        let params = [dbName];
        let rs = await hdrcom.db.preSql(db, sql, params);
        if (rs && rs.length > 0) {
            let buf = hdrcfg.code.EEXIST + ':' + 'the fav_db [' + dbName + '] ' + hdrcfg.msg[hdrcfg.code.EEXIST];
            let msg = {error_code: hdrcfg.code.EEXIST, error_msg: buf};
            console.debug(msg);
            throw msg;
        }
    }

    async function insertFav() {
        console.info("to insert fav db.");
        let dbName = body.request.db_name;
        let dbType = body.request.db_type;
        let dbIp = body.request.db_ip;
        let dbPort = body.request.db_port;
        let dbUser = body.request.db_user;
        let dbPassword = body.request.db_password;
        let dbId = body.request.db_id;
        let dbAsSourceDb = body.request.as_source_db;
        // let crypt_passwd = hdrcom.pub.tdes(dbPassword);
        let sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_DB_FAV + '(DB_NAME, DB_TYPE, DB_IP, DB_PORT, DB_USER, DB_PASSWORD, DB_ID, AS_SOURCE_DB) values (?, ?, ?, ?, ?, ?, ?, ?)';
        let params = [dbName, dbType, dbIp, dbPort, dbUser, dbPassword, dbId, dbAsSourceDb];
        await hdrcom.db.preSql(db, sql, params);
        return 'SUCCESS';
    }

    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            console.info("[add_fav_db], conn db ok.");
            await checkFav();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await insertFav();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("end add fav db.\n");
            return result;
        } catch (err) {
            db && await hdrcom.db.dbRollback(db).catch(er=> {
                console.error(er);
            });
            console.error(err);
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//测试数据库连接
function test_db_connection(body, res) {
    let db;
    let testDbConn = async function () {
        let dbType = body.request.db_type;
        let dbIp = body.request.db_ip;
        let dbPort = body.request.db_port;
        let dbUser = body.request.db_user;
        let dbPassword = body.request.db_password;
        let dbId = body.request.db_id;
        let constr = hdrcom.pub.getConnStr(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
        if (!constr) {
            let buf = 'database type:[' + dbType + '],' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
            let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
            console.error(msg);
            throw msg;
        }
        console.info('test Db begin open ......');
        db = await hdrcom.db.openStrDB(constr).catch(err => {
            console.error(err);
            let buf = err.state + ':' + err.message;
            console.error(err);
            throw {error_code: hdrcfg.code.EDBERROR, error_msg: hdrcfg.msg[hdrcfg.code.EDBERROR]};
        });
        return 'SUCCESS';
    };
    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            let data = await testDbConn();
            hdrcom.pub.processResult(res, data, true, body);
            return data;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error(err);
            });
        }
    };
    return doJob();
}
// odbc 测试数据库连接环境
function check_sourcedb_env(body, res) {
    let dbIsSource = body.request.db_is_source;
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let db;
    //检查oracle
    let check_oracle_env = async function () {
        let checkLogMode = async function () {
            console.info("check log mode begin......");
            let sql = 'select log_mode from v$database';
            let params = [];
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(err);
                throw msg;
            });
            let resJson = {}, ts = '';
            console.info("check log mode ok.");
            if (CK.nonEmptyArray(rs)) {
                ts = rs[0].LOG_MODE;
            }
            if (ts === "ARCHIVELOG") {
                resJson["status"] = "success";
                resJson["message"] = ts;
            } else {
                resJson["status"] = "failure";
                resJson["message"] = ts;
            }
            return resJson;
        };
        let checkDbVersion = async function () {
            console.info("begin to check oracle version.");
            let sql = 'select version from v$instance where rownum<2';
            let params = [];
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(err);
                throw msg;
            });
            let resJson = {};
            let version = '';
            if (CK.nonEmptyArray(rs)) {
                version = rs[0].VERSION;
            }
            let str1 = version.substr(0, version.indexOf('.'));
            let res = version.substr(version.indexOf('.') + 1, version.length);
            let str2 = res.substr(0, res.indexOf('.'));

            if (parseInt(str1) > 9) {
                resJson["status"] = "success";
                resJson["message"] = version;
            } else if ((parseInt(str1) === 9) && (parseInt(str2) >= 2)) {
                resJson["status"] = "success";
                resJson["message"] = version;
            } else {
                resJson["status"] = "failure";
                resJson["message"] = "Version should be at least 9.2";
            }
            return resJson;
        };
        let checkUserPrivilege = async function () {
            console.info("begin to check user privilege.");
            let priv_flag = 0;
            let priv_errmsg = "";
            let f1 = async function () {
                console.info('checkUserPrivilege sql begin......');
                let sql = 'select privilege from user_sys_privs';
                let params = [];
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (!CK.array(rs)) {
                    rs = [];
                }
                for (let x = 0; x < rs.length; x++) {
                    if (rs[x].PRIVILEGE === 'SELECT ANY DICTIONARY') {
                        //error-priv_flag |= 01
                        priv_flag = priv_flag | 1;
                    } else if (rs[x].PRIVILEGE === 'SELECT ANY TABLE') {
                        //error-priv_flag |= 02
                        priv_flag = priv_flag | 2;
                    } else if (rs[x].PRIVILEGE === 'SELECT ANY TRANSACTION') {
                        //error-priv_flag |= 04
                        priv_flag = priv_flag | 4;
                    }
                }
                //error-(priv_flag & 01)
                if (!(priv_flag & 1)) {
                    priv_errmsg += 'NO SELECT ANY DICTIONARY;';
                }
                //error-(priv_flag & 02)
                if (!(priv_flag & 2)) {
                    priv_errmsg += 'NO SELECT ANY TABLE;';
                }
                //error-(priv_flag & 04)
                if (!(priv_flag & 4)) {
                    priv_errmsg += 'NO SELECT ANY TRANSACTION;';
                }
            };
            let f2 = async function () {
                console.info('checkUserPrivilege sql1 begin......');
                let sql1 = 'select granted_role from user_role_privs';
                let params1 = [];
                let rs1 = await hdrcom.db.executeStrSql(db, sql1, params1).catch(err=> {
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (!CK.array(rs1)) {
                    rs1 = [];
                }
                for (let x = 0; x < rs1.length; x++) {
                    if (rs1[x].GRANTED_ROLE === 'DBA') {
                        //error-priv_flag |= 0100
                        priv_flag |= 100
                    } else if (rs1[x].GRANTED_ROLE === 'EXP_FULL_DATABASE') {
                        //error-priv_flag |= 010
                        priv_flag |= 10
                    } else if (rs1[x].GRANTED_ROLE === 'EXECUTE_CATALOG_ROLE') {
                        //error-priv_flag |= 020
                        priv_flag |= 20
                    } else if ((rs1[x].GRANTED_ROLE === 'RESOURCE') || (dbIsSource === 'yes')) {
                        //error-priv_flag |= 040
                        priv_flag |= 40
                    }
                }
                //error-(priv_flag & 010)
                if (!(priv_flag & 10)) {
                    priv_errmsg += 'NO EXP_FULL_DATABASE;';
                }
                //error-(priv_flag & 020)
                if (!(priv_flag & 20)) {
                    priv_errmsg += 'NO EXECUTE_CATALOG_ROLE;';
                }
                //error-(priv_flag & 040)
                if (!(priv_flag & 40) || (dbIsSource === 'yes')) {
                    priv_errmsg += 'NO RESOURCE;';
                }
            };
            let f3 = async function () {
                console.info('checkUserPrivilege sql2 begin......');
                let sql2 = 'select table_name from user_tab_privs';
                let params2 = [];
                let rs2 = await hdrcom.db.executeStrSql(db, sql2, params2).catch(err=> {
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (!CK.array(rs2)) {
                    rs2 = [];
                }
                for (let x = 0; x < rs2.length; x++) {
                    if (rs2[x].TABLE_NAME === 'DBMS_FLASHBACK') {
                        //error-priv_flag |= 0200
                        priv_flag = priv_flag | 200;
                    }
                }
                //error-(priv_flag & 0200)
                if (!(priv_flag & 200)) {
                    priv_errmsg += 'NO EXECUTE ON DBMS_FLASHBACK ;';
                }
            };
            let resJson = {};
            await Promise.all([f1(), f2(), f3()]);
            console.log('checkUserPrivilege done done============');
            //error-(priv_flag & 0100)(priv_flag & 0277) != 0277
            if ((priv_flag & 100) || ((priv_flag & 277) === 277)) {
                resJson["status"] = "success";
                resJson["message"] = "";
            } else {
                //error-(priv_flag & 0277) != 0277
                if ((priv_flag & 277) !== 277) {
                    resJson["status"] = "failure";
                    resJson["message"] = priv_errmsg;
                }
            }
            return resJson;
        };
        let checkDbmsPrivilege = async function () {
            console.info("begin to check checkDbmsPrivilege");
            let scn_flag = false;
            let logmnr_flag = false;
            let priv_errmsg = "";
            let f1 = async function () {
                let sql = 'select dbms_flashback.get_system_change_number as scn from dual';
                let params = [];
                console.info('checkDbmsPrivilege sql begin......');
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (!CK.array(rs)) {
                    rs = [];
                }
                if (rs.length === 0) {
                    priv_errmsg += 'NO SCN;';
                } else {
                    scn_flag = true;
                }
                console.info('checkDbmsPrivilege sql done......');
            };
            let f2 = async function () {
                let sql1 = "select object_name from all_objects where object_name='DBMS_LOGMNR' and object_type='PACKAGE'";
                let params1 = [];
                console.info('checkDbmsPrivilege sql1 begin......');
                let rs1 = await hdrcom.db.executeStrSql(db, sql1, params1).catch(err=> {
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (!CK.array(rs1)) {
                    rs1 = [];
                }
                if (rs1.length === 0) {
                    priv_errmsg += 'NO DBMS_LOGMNR;';
                } else {
                    if (rs1[0].OBJECT_NAME === 'DBMS_LOGMNR') {
                        logmnr_flag = true;
                    }
                }
            };
            let resJson = {};
            await Promise.all([f1(), f2()]);
            console.info('checkDbmsPrivilege all done......');
            if (scn_flag && logmnr_flag) {
                resJson["status"] = "success";
                resJson["message"] = "";
            } else {
                resJson["status"] = "failure";
                resJson["message"] = priv_errmsg;
            }
            console.info("check DbmsPrivilege ok");
            return resJson;
        };
        let checkSupplementalLog = async function () {
            console.info("begin to check the supplemental log.");
            if (dbIsSource === 'yes') {
                let spmtlog_flag = false;
                let priv_errmsg = "";
                let sql = 'select SUPPLEMENTAL_LOG_DATA_MIN as min,SUPPLEMENTAL_LOG_DATA_PK as pk,SUPPLEMENTAL_LOG_DATA_UI as ui from v$database';
                let params = [];
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (!CK.array(rs)) {
                    rs = [];
                }
                if (rs.length === 0) {
                    priv_errmsg += 'NO SUPPLEMENTAL_LOG';
                } else {
                    if ((rs[0].MIN === 'YES') || (rs[0].MIN === 'IMPLICIT')) {
                        if ((rs[0].PK === 'YES') && (rs[0].UI === 'YES')) {
                            spmtlog_flag = true;
                        } else {
                            priv_errmsg += 'NO SUPPLEMENTAL_LOG, please check table in dba_log_groups';
                        }
                    }
                }
                let resJson = {};
                if (spmtlog_flag) {
                    resJson["status"] = "success";
                    resJson["message"] = "";
                } else {
                    resJson["status"] = "failure";
                    resJson["message"] = priv_errmsg;
                }
                return resJson;
            }
        };
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            console.info("check_oracle_env, conn db ok.");
            let resJson = {};
            let rs = await Promise.all([checkLogMode(), checkDbVersion(), checkUserPrivilege(), checkDbmsPrivilege(), checkSupplementalLog()]);
            resJson["archive_mode"] = rs[0];
            resJson["version"] = rs[1];
            resJson["user_priv"] = rs[2];
            resJson["dbms_priv"] = rs[3];
            resJson["spmt_log"] = rs[4];
            console.info('all jobs done....=======-----------------');
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('check oracle env err:Close db Err!');
                console.error(err);
            });
        }
    };

    //检查sqlserver
    let check_sqlserver_env = async function () {
        let checkDbVersion = async function () {
            console.info("begin to check sqlserver version.");
            let VER_CODE = ['SQL Server 6.5', 'SQL Server 7.0', 'SQL Server 2000', 'SQL Server 2005', 'SQL Server 2008', 'SQL Server 2012', 'SQL Server 2014'];
            let sql = "select SERVERPROPERTY('productversion') as pVersion, SERVERPROPERTY('Edition') as eDition,SERVERPROPERTY('ProductLevel') as pLevel,serverproperty('engineedition') as egDition";
            let params = [];
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(err);
                throw msg;
            });
            if (CK.nonEmptyArray(rs)) {
                let message = "";
                let ver_flag = 0;
                let resJson = {};

                let version = rs[0].pVersion;//10.50.4000.0
                let n1 = parseInt(version.split(".")[0]);
                let n2 = parseInt(version.split(".")[2]);

                let fullversion = VER_CODE[n1 - 6] + '-' + rs[0].eDition + '-' + rs[0].pLevel;

                if (n1 === 9 && n2 >= 3228) {
                    resJson["status"] = "success";
                    resJson["message"] = fullversion;
                }

                if (n1 >= 10 && parseInt(rs[0].egDition) >= 3) {
                    ver_flag = 1;
                    resJson["status"] = "success";
                    resJson["message"] = fullversion;
                }

                if (n1 >= 10 && parseInt(rs[0].egDition) < 3) {
                    ver_flag = 1;
                    message = "SQL Server engineedition should be at least 3";
                    resJson["status"] = "failure";
                    resJson["message"] = fullversion + '.' + message;
                }

                if (n1 < 9 || (n1 === 9 && n2 < 3228)) {
                    message = "Version should be at least 9.00.3228, or SP2 and CU6 should been installed";
                    resJson["status"] = "failure";
                    resJson["message"] = fullversion + '.' + message;
                }
                resJson["ver_flag"] = ver_flag;
                console.info("check sqlserver db version ok.");
                return resJson;
            } else {
                let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                let msg = {
                    error_code: hdrcfg.code.ENOENT,
                    error_msg: +'version info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                };
                console.error(buf);
                throw msg;
            }
        };
        let checkUserPrivilege = async function () {
            console.info("begin to check sqlserver user privilege.");
            let sql = 'select sysadmin from sys.syslogins where name = ?';
            let params = [dbUser];
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                console.error(err);
                throw msg;
            });
            if (CK.nonEmptyArray(rs)) {
                let resJson = {};
                if (1 === parseInt(rs[0].sysadmin)) {
                    resJson["status"] = "success";
                    resJson["message"] = "";
                } else {
                    resJson["status"] = "failure";
                    resJson["message"] = 'Role error';
                }
                console.info("check UserPrivilege ok.");
                return resJson;
            } else {
                let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                let msg = {
                    error_code: hdrcfg.code.ENOENT,
                    error_msg: +'user privilege info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                };
                console.error(buf);
                throw msg;
            }
        };
        let checkLogMode = async function () {
            console.info("begin to sqlserver check log mode.");
            let resJson = {};
            if (dbIsSource === 'yes') {
                let message = "";
                let log_flag = 0;
                let sql = 'select recovery_model_desc from sys.databases where name  = ?';
                let params = [dbId];
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    // let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                    // console.error(buf);
                    console.error(err);
                    throw msg;
                });
                if (CK.nonEmptyArray(rs)) {
                    if (rs[0].recovery_model_desc === "FULL") {
                        //error-log_flag |= 01
                        log_flag = log_flag | 1;
                    } else {
                        message = "Recovery_model_desc is " + rs[0].recovery_model_desc + ".";
                    }
                    let sql1 = 'select a.last_log_backup_lsn blsn from sys.database_recovery_status a, sys.databases b where a.database_id = b.database_id and b.name = ?';
                    let params1 = [dbId];

                    let rs1 = await hdrcom.db.executeStrSql(db, sql1, params1).catch(err => {
                        let msg = {
                            error_code: hdrcfg.code.EDBEXECUTE,
                            error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]
                        };
                        console.error(err);
                        throw msg;
                    });
                    if (CK.nonEmptyArray(rs1)) {
                        if (rs1[0].blsn === '') {
                            message = message + "last_log_backup_lsn is null.";
                        } else {
                            //error-log_flag |= 02
                            log_flag = log_flag | 2;
                        }
                        //error-log_flag === 03
                        if (log_flag === 3) {
                            resJson["status"] = "success";
                            resJson["message"] = "";
                        } else {
                            resJson["status"] = "failure";
                            resJson["message"] = message;
                        }
                    } else {
                        let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                        let msg = {
                            error_code: hdrcfg.code.ENOENT,
                            error_msg: +'last_log_backup_lsn info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                        };
                        console.error(buf);
                        throw msg;
                    }
                } else {
                    let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                    let msg = {
                        error_code: hdrcfg.code.ENOENT,
                        error_msg: +'recovery_model_desc info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                    };
                    console.error(buf);
                    throw msg;
                }
                console.info("check log mode ok.");
            }
            return resJson;
        };
        let checkSupplementalLog = async function (ret) {
            console.info("begin to check the supplemental log.");
            let resJson = {};
            if (dbIsSource === 'yes' && ret.ver_flag === '0') {
                let sql = "select name from master.sys.sysobjects where name = 'sp_extended_logging'";
                let params = [];
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                if (CK.nonEmptyArray(rs)) {
                    if (rs[0].name === 'sp_extended_logging') {
                        resJson["status"] = "success";
                        resJson["message"] = "";
                    } else {
                        resJson["status"] = "failure";
                        resJson["message"] = 'no sp_extended_logging';
                    }
                } else {
                    let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                    let msg = {
                        error_code: hdrcfg.code.ENOENT,
                        error_msg: +'supplemental info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                    };
                    console.error(buf);
                    throw msg;
                }
                console.info("check SupplementalLog ok.\n");
            }
            return resJson;
        };

        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            // let ret=await checkDbVersion();
            // let cup=await checkUserPrivilege();
            // let clm=await checkLogMode();
            // let csll=await checkSupplementalLog(ret);
            let ret = await checkDbVersion();
            let rs = await Promise.all([checkUserPrivilege(), checkLogMode(), checkSupplementalLog(ret)]);
            let resJson = {};
            resJson["version"] = ret;
            resJson["user_priv"] = rs[0];
            resJson["archive_mode"] = rs[1];
            resJson["spmt_log"] = rs[2];
            resJson["dbms_priv"] = {status: "success", message: ""};
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('check sqlserver env err:Close db Err!');
                console.error(err);
            });
        }
    };

    //检查mysql
    let check_mysql_env = async function () {
        let checkDbVersion = async function () {
            console.info("begin to check mysql version.");
            let sql = "select version() as vers";
            let params = [];
            let resJson = {};
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
                // let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                // console.error(buf);
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(err);
                throw msg;
            });
            if (CK.nonEmptyArray(rs)) {
                if (rs[0].vers) {
                    resJson["status"] = "success";
                    resJson["message"] = rs[0].vers;
                } else {
                    resJson["status"] = "failure";
                    resJson["message"] = "mysql no version ";
                }
            } else {
                let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                let msg = {
                    error_code: hdrcfg.code.ENOENT,
                    error_msg: +'version info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                };
                console.error(buf);
                throw msg;
            }
            console.info("check mysql db version ok.");
            return resJson;
        };
        let checkUserPrivilege = async function () {
            console.info("begin to check user privilege.");
            let priv = 0;
            let sql = "select * from information_schema.USER_PRIVILEGES where GRANTEE like ''?'@%%'";
            let params = [dbUser];
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                // console.error(buf);
                console.error(err);
                throw msg;
            });
            if (CK.nonEmptyArray(rs)) {
                for (let x = 0; x < rs.length; x++) {
                    if (rs[x].PRIVILEGE_TYPE === 'SUPER') {
                        priv = priv | 0x01;
                    } else if (rs[x].PRIVILEGE_TYPE === 'REPLICATION SLAVE') {
                        priv = priv | 0x02;
                    } else if (rs[x].PRIVILEGE_TYPE === 'REPLICATION CLIENT') {
                        priv = priv | 0x04;
                    }
                }
            }
            let resJson = {};
            if (priv === 0x07) {
                resJson["status"] = "success";
                resJson["message"] = "";
            } else {
                resJson["status"] = "failure";
                resJson["message"] = "priv error";
            }
            console.info("check UserPrivilege ok.");
            return resJson;
        };
        let checkLogMode = async function () {
            let resJson = {};
            if (dbIsSource === 'yes') {
                console.info("begin to check log mode.");
                let sql = "show variables like 'binlog_format'";
                let params = [];
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
                    // let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    // console.error(buf);
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                    console.error(err);
                    throw msg;
                });
                if (CK.nonEmptyArray(rs)) {
                    if (rs[0].Value === "ROW") {
                        resJson["status"] = "success";
                        resJson["message"] = "";
                    } else {
                        resJson["status"] = "failure";
                        resJson["message"] = "achive mode is " + rs[0].Value;
                    }
                } else {
                    let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                    let msg = {
                        error_code: hdrcfg.code.ENOENT,
                        error_msg: +'binlog_format info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                    };
                    console.error(buf);
                    throw msg;
                }
                console.info("check log mode ok.");
            }
            return resJson;
        };
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            let rs = await Promise.all([checkDbVersion(), checkUserPrivilege(), checkLogMode()]);
            let resJson = {};
            resJson["version"] = rs[0];
            resJson["user_priv"] = rs[1];
            resJson["archive_mode"] = rs[2];
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('check mysql env err:Close db Err!');
                console.error(err);
            });
        }
    };

    //check db2
    let check_db2_env = async function () {
        let checkDbVersion = async function () {
            console.info("begin to check db2 version.");
            let sql = 'SELECT substr(service_level, 6) vers FROM sysibmadm.ENV_INST_INFO ';
            let params = [];
            let resJson = {};
            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                // let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                // console.error(buf);
                console.error(err);
                throw msg;
            });
            if (CK.nonEmptyArray(rs)) {
                if (rs[0].VERS) {
                    resJson["status"] = "success";
                    resJson["message"] = rs[0].VERS;
                } else {
                    resJson["status"] = "failure";
                    resJson["message"] = "db2 no version ";
                }
            } else {
                // let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                let msg = {
                    error_code: hdrcfg.code.ENOENT,
                    error_msg: +'version info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                };
                console.error(msg);
                throw msg;
            }
            console.info("check db2 db version ok.");
            return resJson;
        };
        let checkUserPrivilege = async function () {
            console.info("begin to check db2 user privilege.");
            let priv = 0;
            let sql = `SELECT trim(substr(AUTHORITY,1,32)) as role , D_USER as usr, D_GROUP as grp 
                  FROM TABLE (SYSPROC.AUTH_LIST_AUTHORITIES_FOR_AUTHID ('${dbUser}', 'U') ) 
                  WHERE AUTHORITY=\'SYSADM\' or AUTHORITY=\'DBADM\' `;
            let resJson = {};
            let rs = await hdrcom.db.executeStrSql(db, sql, []).catch(err=> {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                console.error(buf);
                console.error(err);
                throw msg;
            });
            let flag = false;
            if (CK.nonEmptyArray(rs)) {
                for (let i = 0; i < rs.length; i++) {
                    if (('SYSADM' === rs[i].ROLE && 'Y' === rs[i].GRP) || ('DBADM' === rs[i].ROLE && 'Y' === rs[i].USR)) {
                        flag = true;
                        break;
                    }
                }
            }
            if (flag) {
                resJson["status"] = "success";
                resJson["message"] = "";
            } else {
                resJson["status"] = "failure";
                resJson["message"] = "priv error";
            }
            console.info("check db2 UserPrivilege ok.");
            return resJson;
        };
        let checkLogMode = async function () {
            console.info("begin to check db2 log mode.");
            let resJson = {};
            if (dbIsSource === 'yes') {
                let sql = "select value from SYSIBMADM.DBCFG where name= 'logretain'";
                let params = [];
                let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                    console.error(buf);
                    console.error(err);
                    throw msg;
                });
                if (CK.nonEmptyArray(rs)) {
                    if (rs[0].VALUE === "RECOVERY") {
                        resJson["status"] = "success";
                        resJson["message"] = "achive mode is " + rs[0].VALUE;
                    } else {
                        resJson["status"] = "failure";
                        resJson["message"] = "achive mode is " + rs[0].VALUE;
                    }
                } else {
                    // let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
                    let msg = {
                        error_code: hdrcfg.code.ENOENT,
                        error_msg: +'binlog_format info ' + hdrcfg.msg[hdrcfg.code.ENOENT]
                    };
                    console.error(msg);
                    throw msg;
                }
                console.info("check log mode ok.");
            }
            return resJson;
        };
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            console.debug(db);
            let rs = await Promise.all([checkDbVersion(), checkUserPrivilege(), checkLogMode()]);
            let resJson = {};
            resJson["version"] = rs[0];
            resJson["user_priv"] = rs[1];
            resJson["archive_mode"] = rs[2];
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('check db2 env err:Close db Err!');
                console.error(err);
            });
        }
    };

    if ('oracle' === dbType) {
        return check_oracle_env();
    } else if ('sqlserver' === dbType) {
        return check_sqlserver_env();
    } else if ('mysql' === dbType) {
        return check_mysql_env();
    } else if ('db2' === dbType) {
        return check_db2_env();
    } else {
        if (hdrcom.pub.judge_dbType(dbType)) {
            hdrcom.pub.processResult(res, "SUCCESS", true, body);
            return "SUCCESS";
        } else {
            let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
            let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
            console.error(buf);
            hdrcom.pub.processResult(res, msg, false, body);
            return msg;
        }
    }
}
//判断数据库是否同源
function query_all_db_info(body, res) {
    let sorcedb_name = body.request.sorcedb_name;
    let targetdb_name = body.request.targetdb_name;
    let db;
    let getSourceDBConnStr = async function () {
        let sql = 'SELECT PARAM_VALUE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ? AND PARAM_NAME = ?';
        let params = [sorcedb_name, 'db_connect_string'];

        let rs = await hdrcom.db.preSql(db, sql, params).catch(err=> {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            // console.error(buf);
            console.error(err);
            throw msg;
        });
        let res = '';
        if (CK.nonEmptyArray(rs)) {
            res = rs[0].PARAM_VALUE;
        }
        console.info("query_all_db_info sourceDBinfo ok.");
        return res;
    };
    let getTargetDBConnStr = async function () {
        let sql = 'SELECT PARAM_VALUE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ? AND PARAM_NAME = ?';
        let params = [targetdb_name, 'db_connect_string'];
        let rs = await hdrcom.db.preSql(db, sql, params).catch(err=> {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            console.error(err);
            throw msg;
        });
        let res = '';
        if (CK.nonEmptyArray(rs)) {
            res = rs[0].PARAM_VALUE;
        }
        console.info("query_all_db_info TargetDB ok.");
        return res;
    };
    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            console.info("[database/query_all_db_info], conn db ok.");
            let rs = await Promise.all([getSourceDBConnStr(), getTargetDBConnStr()]);
            let resJson = {};
            let s = rs[0];
            let t = rs[1];
            if (s === t) {
                resJson.same = "yes";
            } else {
                resJson.same = "no";
            }
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}
//必要环境查询
function query_db_table(body, res) {
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let db;
    let query_oracle_table = async function () {
        let queryTables = async function () {
            console.info("begin to query users.");
            let sql = 'select username from dba_users where username not in (' + hdrcfg.cfg.oracle_user + ') order by username';
            let params = [];
            let rs = await hdrcom.db.executeStrSql(db, sql, params);
            let sqlInfo = "select * from (select owner, table_name from dba_log_groups " +
                "union all " +
                "select owner,table_name from all_tables where " +
                "(owner,table_name) not in (select owner,table_name from dba_log_groups)) where owner not in (" + hdrcfg.cfg.oracle_user + ")";
            let paramsInfo = [];

            let rsInfo = await hdrcom.db.executeStrSql(db, sqlInfo, paramsInfo);
            let resJson = {};
            for (let x = 0; x < rs.length; x++) {
                let tableJson = {"table": []};
                resJson[rs[x].USERNAME] = tableJson;

                for (let y = 0; y < rsInfo.length; y++) {
                    let json1 = {};
                    if (rs[x].USERNAME === rsInfo[y].OWNER) {
                        json1["name"] = rsInfo[y].TABLE_NAME;
                        json1["sup_log"] = "yes";
                        tableJson.table.push(json1);
                    }
                }
            }
            console.info("query User ok.");
            return resJson;
        };
        try {
            await hdrcom.pub.checkMd5(body);
            setenv.set('NLS_LANG', 'AMERICAN_AMERICA.AL32UTF8');
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            console.info("query_oracle_table, conn db ok.");
            let tbs = await queryTables();
            hdrcom.pub.processResult(res, tbs, true, body);
            return tbs;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            setenv.set('NLS_LANG', ' ');
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('query_oracle_table err:Close db Err!');
                console.error(err);
            });
        }
    };
    //查询sqlserver table
    let query_sqlserver_table = async function () {
        let queryTables = async function () {
            console.info("begin to query users.");
            let sql = 'SELECT name FROM sys.schemas';
            let params = [];
            let rs = await hdrcom.db.executeSqlSync(db, sql, params).catch(err=> {
                throw err;
            });

            let sqlInfo = "select schema_name(schema_id) as owner, name, is_replicated from sys.tables where type = 'U'";
            let paramsInfo = [];
            let rsInfo = hdrcom.db.executeSqlSync(db, sqlInfo, paramsInfo).catch(err=> {
                throw err;
            });
            let resJson = {};
            for (let x = 0; x < rs.length; x++) {
                let tableJson = {"table": []};
                resJson[rs[x].name] = tableJson;

                for (let y = 0; y < rsInfo.length; y++) {
                    let json1 = {};
                    if (rs[x].name === rsInfo[y].owner) {
                        json1["name"] = rsInfo[y].name;
                        if (rsInfo[y].is_replicated === 1)
                            json1["sup_log"] = "yes";
                        else
                            json1["sup_log"] = "no";
                        tableJson.table.push(json1);
                    }
                }
            }
            console.info("query User ok.");
            return resJson;
        };
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            console.info("query_sqlserver_table, conn db ok.");
            let tbs = await queryTables();
            console.info("end get sqlserver table.");
            hdrcom.pub.processResult(res, tbs, true, body);
            return tbs;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('query_sqlserver_table err:Close db Err!');
                console.error(err);
            });
        }
    };

    if ('oracle' === dbType) {
        return query_oracle_table();
    } else if ('sqlserver' === dbType) {
        return query_sqlserver_table();
    } else {
        let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
        let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
        console.error(buf);
        hdrcom.pub.processResult(res, msg, false, body);
    }
}

function query_environment_status(body, res) {
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let db;

    async function query_envir_status(db) {
        let ret = await query_db_version(db);
        if (!ret) {
            let buf = hdrcfg.code.EDBVERSION + ':' + hdrcfg.msg[hdrcfg.code.EDBVERSION];
            let msg = {error_code: hdrcfg.code.EDBVERSION, error_msg: buf};
            console.error(buf);
            throw msg;
        } else {
            if (ret === '3') {
                let buf = hdrcfg.code.ENSUPPORT + ':engineedition ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
                let msg = {error_code: hdrcfg.code.ENSUPPORT, error_msg: buf};
                console.error(buf);
                throw msg;
            } else {
                let retR = await check_rollback_table(db);
                let ret1 = await check_sqlserver_envir(ret, db, dbId, retR);
                if (!ret1) {
                    let buf = hdrcfg.code.EDBENV + ':' + hdrcfg.msg[hdrcfg.code.EDBENV];
                    let msg = {error_code: hdrcfg.code.EDBENV, error_msg: buf};
                    console.error(buf);
                    throw msg;
                } else {
                    // callback(null, ret1[0]);
                    console.info("query_envir_status ok.");
                    return ret1[0];
                }
            }
        }
    }

    let query_sqlserver_env_status = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            let result = await query_envir_status(db);
            console.info("end query_environment_status.\n");
            hdrcom.pub.processResult(res, result, true, body);
            return result;
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('query_environment_status err:Close db Err!');
                console.error(err);
            });
        }
    };
    if ('sqlserver' === dbType) {
        return query_sqlserver_env_status();
    } else {
        hdrcom.pub.processResult(res, "SUCCESS", true, body);
        return 'SUCCESS';
    }
}

function add_r7_cdc(body, res) {
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let r7Json = body.request.r7;
    let db;
    let query_db_ver = async function () {
        let ret = await query_db_version(db);
        if (!ret) {
            let buf = hdrcfg.code.EDBVERSION + ':' + hdrcfg.msg[hdrcfg.code.EDBVERSION];
            let msg = {error_code: hdrcfg.code.EDBVERSION, error_msg: buf};
            console.error(buf);
            throw msg;
        } else {
            if (ret === '3') {
                let buf = hdrcfg.code.ENSUPPORT + ':engineedition ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
                let msg = {error_code: hdrcfg.code.ENSUPPORT, error_msg: buf};
                console.error(buf);
                throw msg;
            } else {
                console.info("query db version ok.");
                return ret;
            }
        }
    };
    let add_cdc = async function (res1) {
        let retR = await check_rollback_table(db);
        let ret1 = await check_sqlserver_envir(res1, db, dbId, retR);
        if (!ret1) {
            let buf = hdrcfg.code.EDBENV + ':' + hdrcfg.msg[hdrcfg.code.EDBENV];
            let msg = {error_code: hdrcfg.code.EDBENV, error_msg: buf};
            console.error(buf);
            throw msg;
        }
        console.info("check_envir ok.");
        if ("no" === r7Json.r7_table) {
            let sql = "CREATE TABLE [dbo].[r7_ddl_dblog]\n" +
                "(\n" +
                "[logid] [int] IDENTITY(1,1) NOT NULL,\n" +
                "[tsql] varchar(max)   NULL,\n" +
                "[ctime] datetime default getdate(),\n" +
                "CONSTRAINT [PK_r7_ddl_dblog_LogID] PRIMARY KEY NONCLUSTERED\n" +
                "(\n" +
                "   [logid] ASC\n" +
                " )\n" +
                ")\n";
            let params = [];

            let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(err);
                throw msg;
            });
            if (!rs) {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            }
            console.info("r7_table ok.");
        }
        if ("no" === r7Json.r7_pro) {
            let sqlPro = "";
            if (res1 === hdrcfg.cfg.DATABASE_2005) {
                sqlPro = "create procedure r7_extended_logging\n" +
                    "(\n" +
                    "  @owner  sysname,  @tabname sysname,  @enable bit = 1\n" +
                    ")\n" +
                    "as \n" +
                    "begin\n" +
                    " declare @retcode int\n" +
                    " declare @stname sysname\n" +
                    " declare @event sysname\n" +
                    " set @stname = @owner+'.['+@tabname+']'\n" +
                    " if @enable=0\n" +
                    " begin\n" +
                    "    if exists (select 1 from sys.tables where schema_name(schema_id)=@owner\n" +
                    "            and name = @tabname and is_replicated = 1)\n" +
                    "   begin\n" +
                    "     exec @retcode =sp_extended_logging  @stname, 0\n" +
                    "     if (@retcode <> 0)\n" +
                    "     begin\n" +
                    "       raiserror ('sp_extended_logging table:%%s error', 16, -1, @tabname)\n" +
                    "       return 1\n" +
                    "     end\n" +
                    "    else\n" +
                    "     begin\n" +
                    "       if exists(select 1 from sys.tables where name = 'r7_ddl_dblog')\n" +
                    "       begin\n" +
                    "        insert into r7_ddl_dblog(tsql)\n" +
                    "        values('UN_EXTEND_LOG['+@owner+']['+@tabname+']')\n" +
                    "       end\n" +
                    "     end\n" +
                    "   end\n" +
                    "   return 0\n" +
                    " end\n" +
                    " if exists (select 1 from sys.tables where schema_name(schema_id)=@owner\n" +
                    "           and name = @tabname and is_replicated = 1)\n" +
                    " begin\n" +
                    "  return 0\n" +
                    " end  \n" +
                    " if @enable = 1  \n" +
                    "   exec @retcode = sp_extended_logging @stname\n" +
                    " if (@retcode <> 0)\n" +
                    " begin \n" +
                    "   raiserror ('sp_extended_logging table:%%s error', 16, -1, @tabname)  \n" +
                    "   return 1\n" +
                    " end\n" +
                    " if exists(select 1 from sys.tables where name = 'r7_ddl_dblog')\n" +
                    " begin\n" +
                    "  insert into r7_ddl_dblog(tsql)\n" +
                    "  values('EXTEND_LOG['+@owner+']['+@tabname+']')\n" +
                    " end\n" +
                    " return 0 \n" +
                    "end\n";
            } else {
                sqlPro = "create procedure [dbo].[r7_extended_logging] \n" +
                    "( \n" +
                    "  @owner  sysname, \n" +
                    "  @tabname sysname, \n" +
                    "  @enable bit = 1 \n" +
                    ") \n" +
                    "as \n" +
                    "begin \n" +
                    " set nocount on  \n" +
                    " declare @retcode int \n" +
                    " declare @sname sysname \n" +
                    " declare @event sysname \n" +
                    " declare @cname varchar(max) \n" +
                    " declare @stypeid int \n" +
                    " declare @utypeid int \n" +
                    " declare @pkey int \n" +
                    " declare @keycols varchar(max) \n" +
                    " declare @ctname varchar(256) \n" +
                    " declare @funname varchar(256) \n" +
                    " declare @sqlstr nvarchar(1024) \n" +
                    " declare @iname varchar(256) \n" +
                    " declare @stname sysname \n" +
                    " declare @isExist int    --检查是否是复制表标识 \n" +
                    " set @stname = @owner+'.['+@tabname+']'; \n" +
                    " set @isExist = 0 \n" +
                    "  \n" +
                    " if exists (select 1 from sys.tables where schema_name(schema_id)=@owner \n" +
                    "            and name = @tabname and is_replicated = 1) \n" +
                    " begin \n" +
                    "   set @isExist = 1 \n" +
                    " end \n" +
                    " if @enable=0 \n" +
                    " begin \n" +
                    "   -- if exists (select 1 from sys.tables where schema_name(schema_id)=@owner \n" +
                    "   --         and name = @tabname and is_replicated = 1) \n" +
                    "   if  @isExist = 1 \n" +
                    "   begin \n" +
                    "     exec @retcode =sys.sp_cdc_disable_table  \n" +
                    "                 @source_schema = @owner,  \n" +
                    "                 @source_name = @tabname,  \n" +
                    "                 @capture_instance = 'all'; \n" +
                    "     if (@retcode <> 0) \n" +
                    "     begin  \n" +
                    "       raiserror ('sp_extended_logging table:%%s error', 16, -1, @tabname)   \n" +
                    "       return 1 \n" +
                    "     end \n" +
                    "     else \n" +
                    "     begin \n" +
                    "       if exists(select 1 from sys.tables where name = 'r7_ddl_dblog') \n" +
                    "       begin \n" +
                    "         insert into r7_ddl_dblog(tsql) \n" +
                    "         values('UN_EXTEND_LOG['+@owner+']['+@tabname+']') \n" +
                    "       end        \n" +
                    "     end \n" +
                    "   end \n" +
                    "   return 0 \n" +
                    " end \n" +
                    " if  @isExist = 1 \n" +
                    " begin \n" +
                    "  return 0 \n" +
                    " end  \n" +
                    "   \n" +
                    " set @ctname = @owner+'_'+@tabname+'_CT' \n" +
                    "  \n" +
                    " if exists (select 1 from sys.tables where schema_name(schema_id)='cdc' and name = @ctname) begin \n" +
                    "   set @sqlstr = 'drop table cdc.'+@ctname \n" +
                    "   exec sp_executesql  @sqlstr \n" +
                    " end \n" +
                    "  \n" +
                    " set @iname = @owner+'_'+@tabname \n" +
                    " if exists (select 1 from sys.objects where schema_name(schema_id)='cdc' \n" +
                    "           and name = 'change_tables') \n" +
                    " begin \n" +
                    "     delete cdc.change_tables  where capture_instance = @iname \n" +
                    " end \n" +
                    " set @funname = 'fn_cdc_get_all_changes_'+@owner+'_'+@tabname \n" +
                    " if exists (select 1 from sys.objects where schema_name(schema_id)='cdc' \n" +
                    "           and name = @funname) \n" +
                    " begin \n" +
                    "   set @sqlstr = 'drop function cdc.'+@funname \n" +
                    "   exec sp_executesql  @sqlstr \n" +
                    " end \n" +
                    "  \n" +
                    " set @funname = 'fn_cdc_get_net_changes_'+@owner+'_'+@tabname \n" +
                    " if exists (select 1 from sys.objects where schema_name(schema_id)='cdc' \n" +
                    "           and name = @funname) \n" +
                    " begin \n" +
                    "   set @sqlstr = 'drop function cdc.'+@funname \n" +
                    "   exec sp_executesql  @sqlstr \n" +
                    " end \n" +
                    " select @keycols=isnull(@keycols,'')+','+b.name from sys.indexes a, sys.columns b, sys.index_columns c  \n" +
                    " where a.object_id = b.object_id \n" +
                    " and b.object_id = c.object_id \n" +
                    " and a.is_primary_key = 1 \n" +
                    " and a.index_id = c.index_id \n" +
                    " and c.column_id = b.column_id \n" +
                    " and a.object_id = object_id(@stname) \n" +
                    " set @keycols = stuff(@keycols,1,1,'') \n" +
                    " SELECT top 1 @cname = CASE WHEN @keycols is null then  isnull(@cname,'') + ',' + name end  from sys.columns  \n" +
                    " WHERE object_id = object_id(@stname)  \n" +
                    " AND system_type_id not in (34, 35, 99, 241)  \n" +
                    " AND user_type_id not in (34, 35, 99, 241); \n" +
                    " set @cname = stuff(@cname,1,1,'') \n" +
                    " if (@keycols is null and @cname is null ) \n" +
                    " begin \n" +
                    "  raiserror ('table:%%s not exist or is all lob column error', 16, -1, @tabname)   \n" +
                    "  return 1 \n" +
                    " end \n" +
                    " print @keycols \n" +
                    " if @enable = 1   \n" +
                    "   exec @retcode =sys.sp_cdc_enable_table  \n" +
                    "             @source_schema = @owner,  \n" +
                    "             @source_name = @tabname, \n" +
                    "             @captured_column_list = @keycols,  \n" +
                    "             @role_name = 'NULL';  \n" +
                    " if (@retcode <> 0) \n" +
                    " begin \n" +
                    "   raiserror ('sp_extended_logging table:%%s error', 16, -1, @tabname)   \n" +
                    "   return 1 \n" +
                    " end \n" +
                    " if exists(select 1 from sys.tables where name = 'r7_ddl_dblog') \n" +
                    " begin \n" +
                    "  insert into r7_ddl_dblog(tsql) \n" +
                    "  values('EXTEND_LOG['+@owner+']['+@tabname+']') \n" +
                    " end \n" +
                    " return 0  \n" +
                    "end \n";
            }

            let paramsPro = [];
            let rsPro = await hdrcom.db.executeStrSql(db, sqlPro, paramsPro).catch(err=> {
                console.error(err);
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            });
            if (!rsPro) {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            }

            let sqlPro1 = "exec r7_extended_logging dbo,r7_ddl_dblog";
            let rsPro1 = await hdrcom.db.executeStrSql(db, sqlPro1, []).catch(err=> {
                console.error(err);
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            });
            if (!rsPro1) {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            }
            console.info("r7_pro ok.");
        }
        if ("no" === r7Json.r7_tri) {
            let sqlTri = "create TRIGGER [r7_ddl_dblog_trigger]\n" +
                "ON DATABASE\n" +
                "FOR DDL_DATABASE_LEVEL_EVENTS\n" +
                "AS \n" +
                "BEGIN\n" +
                "    SET NOCOUNT ON;\n" +
                "    DECLARE @data varchar(max);\n" +
                "    DECLARE @rv int;\n" +
                "    SET @data = convert(varchar(max),EVENTDATA())\n" +
                "    select @rv = patindex('%%<SchemaName>cdc</SchemaName>%%', @data)\n" +
                "    if (@rv > 0)\n" +
                "    begin\n" +
                "      return\n" +
                "    end\n" +
                "    if exists(select 1 from sys.tables where name = 'r7_ddl_dblog')\n" +
                "    begin\n" +
                "     insert into r7_ddl_dblog(tsql) values(@data)\n" +
                "    end \n" +
                "END;\n";
            let paramsTri = [];

            let rsTri = await hdrcom.db.executeStrSql(db, sqlTri, paramsTri).catch(err=> {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            });
            if (!rsTri) {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            }
            console.info("r7_tri ok.");
        }
        if ("no" === r7Json.r7_ms_tri) {
            let sqlMstri = "SELECT  is_disabled  FROM sys.triggers WHERE type = 'TR' AND  name = 'tr_MScdc_ddl_event'";
            let paramsMstri = [];

            let rsMstri = await hdrcom.db.executeStrSql(db, sqlMstri, paramsMstri).catch(err=> {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            });
            if (CK.nonEmptyArray(rsMstri)) {
                if (rsMstri[0].is_disabled === '0') {
                    let sqlrsMstri1 = "disable trigger tr_MScdc_ddl_event on database";
                    let paramsrsMstri1 = [];

                    let rsrsMstri1 = await hdrcom.db.executeStrSql(db, sqlrsMstri1, paramsrsMstri1).catch(err=> {
                        console.error(err);
                    });
                    if (!rsrsMstri1) {
                        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                        let msg = {
                            error_code: hdrcfg.code.EDBEXECUTE,
                            error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]
                        };
                        console.error(buf);
                        throw msg;
                    }
                }
            } else {
                let buf = hdrcfg.code.ENOENT + ':tr_MScdc_ddl_event ' + hdrcfg.msg[hdrcfg.code.ENOENT];
                console.info(buf);
            }
            console.info("r7_ms_tri ok.");
        }
        if ("no" === r7Json.r7_cap) {
            let sqlCap = "SELECT enabled FROM msdb.dbo.sysjobs where name = ?";
            let nameCap = 'cdc.' + dbId + '_capture';
            let paramsCap = [nameCap];

            let rsCap = await hdrcom.db.executeStrSql(db, sqlCap, paramsCap).catch(err=> {
                console.error(err);
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            });
            if (CK.nonEmptyArray(rsCap)) {
                if (rsCap[0].enabled === '1') {
                    let sqlCap1 = "exec msdb.dbo.sp_update_job @job_name = ?, @enabled = 0";
                    let nameCap1 = 'cdc.' + dbId + '_capture';
                    let paramsCap1 = [nameCap1];

                    let rsCap1 = await hdrcom.db.executeStrSql(db, sqlCap1, paramsCap1).catch(err=> {
                        console.error(err);
                    });
                    if (!rsCap1) {
                        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                        let msg = {
                            error_code: hdrcfg.code.EDBEXECUTE,
                            error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]
                        };
                        console.error(buf);
                        throw msg;
                    }
                }
            } else {
                let buf = hdrcfg.code.ENOENT + ':' + nameCap + ' ' + hdrcfg.msg[hdrcfg.code.ENOENT];
                console.error(buf);
            }
            console.info("r7_cap ok.");
        }
        if ("no" === r7Json.r7_clean) {
            let sqlClean = "SELECT enabled FROM msdb.dbo.sysjobs where name = ?";
            let nameClean = 'cdc.' + dbId + '_cleanup';
            let paramsClean = [nameClean];

            let rsClean = await hdrcom.db.executeStrSql(db, sqlClean, paramsClean).catch(err=> {
                console.error(err);
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]};
                console.error(buf);
                throw msg;
            });
            if (CK.nonEmptyArray(rsClean)) {
                if (rsClean[0].enabled === '1') {
                    let sqlClean1 = "exec msdb.dbo.sp_update_job @job_name = ?, @enabled = 0";
                    let nameClean1 = 'cdc.' + dbId + '_cleanup';
                    let paramsClean1 = [nameClean1];

                    let rsClean1 = await hdrcom.db.executeStrSql(db, sqlClean1, paramsClean1).catch(err=> {
                        console.error(err);
                    });
                    if (!rsClean1) {
                        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                        let msg = {
                            error_code: hdrcfg.code.EDBEXECUTE,
                            error_msg: hdrcfg.msg[hdrcfg.code.EDBEXECUTE]
                        };
                        console.error(buf);
                        throw msg;
                    }
                }
            } else {
                let buf = hdrcfg.code.ENOENT + ':' + nameClean + ' ' + hdrcfg.msg[hdrcfg.code.ENOENT];
                console.error(buf);
            }
            console.info("r7_clean ok.");
        }

        if (retR === '0') {
            await create_rollback_table(db, ret1[1]);
            console.info("create_rollbacktable ok.");
        }
    };
    let sqlserver_add_r7_cdc = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            let ret = await query_db_ver();
            await add_cdc(ret);
            console.info("end add_cdc.\n");
            hdrcom.pub.processResult(res, "SUCCESS", true, body);
            return 'SUCCESS';
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('add_r7_cdc err:Close db Err!');
                console.error(err);
            });
        }
    };
    if ('sqlserver' === dbType) {
        return sqlserver_add_r7_cdc();
    } else {
        hdrcom.pub.processResult(res, "SUCCESS", true, body);
        return 'SUCCESS';
    }
}

function start_recover_mode(body, res) {
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let db;

    let create_rb_table = async function (db) {
        let res1 = await check_rollback_table(db);
        if (res1 === '0') {
            let retDB = await query_db_version(db);
            if (!retDB) {
                let buf = hdrcfg.code.EDBVERSION + ':' + hdrcfg.msg[hdrcfg.code.EDBVERSION];
                let msg = {error_code: hdrcfg.code.EDBVERSION, error_msg: buf};
                console.error(buf);
                throw msg;
            } else {
                if (retDB === '3') {
                    let buf = hdrcfg.code.ENSUPPORT + ':engineedition ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
                    let msg = {error_code: hdrcfg.code.ENSUPPORT, error_msg: buf};
                    console.error(buf);
                    throw msg;
                }
            }
            let ret1 = await check_sqlserver_envir(retDB, db, dbId, res1);
            if (!ret1) {
                let buf = hdrcfg.code.EDBENV + ':' + hdrcfg.msg[hdrcfg.code.EDBENV];
                let msg = {error_code: hdrcfg.code.EDBENV, error_msg: buf};
                console.error(buf);
                throw msg;
            } else {
                //create rollback table
                await create_rollback_table(db, ret1[1]);
                console.info("create_rollbacktable ok.");
            }
        }
    };
    let start_mode = async function (db) {
        let sql = 'ALTER DATABASE ' + dbId + ' SET RECOVERY FULL WITH NO_WAIT';
        let params = [];

        await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            console.error(err);
            throw msg;
        });
        console.info("start_mode ok.");
    };

    let sqlserver_recover_mode = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            await create_rb_table(db);
            await start_mode(db);
            console.info("end add_cdc.\n");
            hdrcom.pub.processResult(res, "SUCCESS", true, body);
            return 'SUCCESS';
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('start_recover_mode err:Close db Err!');
                console.error(err);
            });
        }
    };
    if ('sqlserver' === dbType) {
        return sqlserver_recover_mode();
    } else {
        hdrcom.pub.processResult(res, "SUCCESS", true, body);
        return 'SUCCESS';
    }
}

function start_cdc(body, res) {
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let db;
    let create_rb_table = async function () {
        let res1 = await check_rollback_table(db);
        if (res1 === '0') {
            let retDB = await query_db_version(db);
            if (!retDB) {
                let buf = hdrcfg.code.EDBVERSION + ':' + hdrcfg.msg[hdrcfg.code.EDBVERSION];
                let msg = {error_code: hdrcfg.code.EDBVERSION, error_msg: buf};
                console.error(buf);
                throw msg;
            } else {
                if (retDB === '3') {
                    let buf = hdrcfg.code.ENSUPPORT + ':engineedition ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
                    let msg = {error_code: hdrcfg.code.ENSUPPORT, error_msg: buf};
                    console.error(buf);
                    throw msg;
                }
            }
            let ret1 = await check_sqlserver_envir(retDB, db, dbId, res1);
            if (!ret1) {
                let buf = hdrcfg.code.EDBENV + ':' + hdrcfg.msg[hdrcfg.code.EDBENV];
                let msg = {error_code: hdrcfg.code.EDBENV, error_msg: buf};
                console.error(buf);
                throw msg;
            }

            await create_rollback_table(db, ret1[1]);
            console.info("create_rollbacktable ok.");
        }
    };
    let start_mode = async function () {
        let sql = 'ALTER AUTHORIZATION ON DATABASE::' + dbId + ' to sa; exec sp_cdc_enable_db';
        let params = [];
        await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            console.error(err);
            throw msg;
        });
        console.info("start_mode ok.");
    };
    let sqlserver_start_cdc = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            await create_rb_table();
            await start_mode();
            console.info("end add_cdc.\n");
            hdrcom.pub.processResult(res, "SUCCESS", true, body);
            return 'SUCCESS';
        } catch (err) {
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('start_cdc err:Close db Err!');
                console.error(err);
            });
        }
    };
    if ('sqlserver' === dbType) {
        return sqlserver_start_cdc();
    } else {
        hdrcom.pub.processResult(res, "SUCCESS", true, body);
    }
}

function dip_sqlcfg_rollback(body, res) {
    let dbType = body.request.db_type;
    let dbIp = body.request.db_ip;
    let dbPort = body.request.db_port;
    let dbUser = body.request.db_user;
    let dbPassword = body.request.db_password;
    let dbId = body.request.db_id;
    let db;
    let query_db_ver = async function (db) {
        let ret = await query_db_version(db);
        if (!ret) {
            let buf = hdrcfg.code.EDBVERSION + ':' + hdrcfg.msg[hdrcfg.code.EDBVERSION];
            let msg = {error_code: hdrcfg.code.EDBVERSION, error_msg: buf};
            console.error(buf);
            throw msg;
        } else {
            if (ret === '3') {
                let buf = hdrcfg.code.ENSUPPORT + ':engineedition ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
                let msg = {error_code: hdrcfg.code.ENSUPPORT, error_msg: buf};
                console.error(buf);
                throw msg;
            }
        }
        return ret;
    };
    let check_sqlserver_sqlcfg = async function (retDB) {
        let sqlcfg_Json = {};
        sqlcfg_Json["db_version"] = retDB;

        let retR = await check_rollback_table(db);
        if (!retR) {
            let buf = hdrcfg.code.ECHECKROLLTABLE + ':' + hdrcfg.msg[hdrcfg.code.ECHECKROLLTABLE];
            let msg = {error_code: hdrcfg.code.ECHECKROLLTABLE, error_msg: buf};
            console.error(buf);
            throw msg;
        }

        let sql = "SELECT * from [dbo].[r7_cfg_rollback]";
        let params = [];

        let rs = await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            console.error(err);
            throw msg;
        });
        console.info("check_sqlserver_sqlcfg ok.");
        if (CK.nonEmptyArray(rs)) {
            return rs[0];
        } else {
            return '{}';
        }
    };
    let check_sqlserver_env = async function (retDB) {
        let retR = await check_rollback_table(db);
        if (!retR) {
            let buf = hdrcfg.code.ECHECKROLLTABLE + ':' + hdrcfg.msg[hdrcfg.code.ECHECKROLLTABLE];
            let msg = {error_code: hdrcfg.code.ECHECKROLLTABLE, error_msg: buf};
            console.error(buf);
            throw msg;
        }
        let ret1 = await check_sqlserver_envir(retDB, db, dbId, retR);
        if (!ret1) {
            let buf = hdrcfg.code.EDBENV + ':' + hdrcfg.msg[hdrcfg.code.EDBENV];
            let msg = {error_code: hdrcfg.code.EDBENV, error_msg: buf};
            console.error(buf);
            throw msg;
        }
        console.info("check_sqlserver_env ok.");
        return ret1[1];
    };
    let isEqual = function (ret1, ret2) {
        let sqlcfg = JSON.stringify(ret1);
        let sqlenv = JSON.stringify(ret2);
        console.info("isEqual ok.");
        if (sqlcfg === sqlenv) {
            return 'SUCCESS1';
        } else {
            return 'SUCCESS2';
        }
    };
    let exec_cdc = async function (suc, sqlenv, sqlcfg) {
        if (suc === 'SUCCESS2') {
            // let sqlenv = suc.check_sqlserver_env;
            // let sqlcfg = suc.check_sqlserver_sqlcfg;
            if ((sqlenv.db_version === hdrcfg.cfg.DATABASE_2005 && sqlenv.cdc_status === 1) || (sqlenv.cdc_status === sqlcfg.cdc_status)) {
                return true;
            } else {
                let sql = "";
                if (sqlcfg.cdc_status === '1') {
                    sql = 'ALTER AUTHORIZATION ON DATABASE::' + dbId + ' to sa; exec sp_cdc_enable_db';
                } else {
                    sql = 'ALTER AUTHORIZATION ON DATABASE::' + dbId + ' to sa; exec sp_cdc_disable_db';
                }
                let params = [];
                await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    console.error(err);
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(buf);
                    throw msg;
                });
                return true;
            }
        } else {
            console.info("exec_cdc ok.");
            return true;
        }
    };
    let exec_r7_cdc = async function (suc, sqlenv, sqlcfg) {
        console.info("exec_r7_cdc ok.");
        if (suc === 'SUCCESS2') {
            if (sqlcfg.r7_tri !== sqlenv.r7_tri) {
                let sql = "DROP TRIGGER [r7_ddl_dblog_trigger] on database";
                let params = [];
                await hdrcom.db.executeStrSql(db, sql, params).catch(err => {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                console.info("DROP TRIGGER [r7_ddl_dblog_trigger] on database ok.");
            }
            if (sqlcfg.r7_pro !== sqlenv.r7_pro) {
                let sql1 = "drop procedure r7_extended_logging";
                let params1 = [];
                await hdrcom.db.executeStrSql(db, sql1, params1).catch(err=> {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(buf);
                    throw msg;
                });
                console.info("drop procedure r7_extended_logging ok.");
            }
            if (sqlcfg.r7_table !== sqlenv.r7_table) {
                let sql2 = "DROP TABLE [dbo].[r7_ddl_dblog]";
                let params2 = [];
                await hdrcom.db.executeStrSql(db, sql2, params2).catch(err=> {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(buf);
                    throw msg;
                });
                console.info("DROP TABLE [dbo].[r7_ddl_dblog] ok.");
            }
            return true;
        } else {
            return true;
        }
    };
    let exec_recv_mode = async function (suc, sqlenv, sqlcfg) {
        console.info("exec_recv_mode ok.");
        if (suc === 'SUCCESS2') {
            if (sqlcfg.recover_status === sqlenv.recover_status) {
                return true;
            } else {
                let sql = "";
                if (sqlcfg.recover_status === '1') {
                    sql = 'ALTER DATABASE ' + dbId + ' SET RECOVERY FULL WITH NO_WAIT';
                } else if (sqlcfg.recover_status === '2') {
                    sql = 'ALTER DATABASE ' + dbId + ' SET RECOVERY BULK_LOGGED';
                } else {
                    sql = 'ALTER DATABASE ' + dbId + ' SET RECOVERY SIMPLE';
                }
                let params = [];
                await hdrcom.db.executeStrSql(db, sql, params).catch(err=> {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    console.error(err);
                    throw msg;
                });
                console.info("ALTER DATABASE SET RECOVERY ok.");
                return true;
            }
        } else {
            return true;
        }
    };

    let sqlserver_sqlcfg_rb = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db = await connectOdbcDb(dbType, dbIp, dbPort, dbId, dbUser, dbPassword);
            let ret = await query_db_ver(db);
            console.log('1', ret);
            let ret1 = await check_sqlserver_sqlcfg(ret);
            console.log('2', ret1);
            let ret2 = await check_sqlserver_env(ret);
            console.log('3', ret2);
            let suc = isEqual(ret1, ret2);
            console.log('4', suc);
            await exec_cdc(suc, ret1, ret2);
            await exec_r7_cdc(suc, ret1, ret2);
            await exec_recv_mode(suc, ret1, ret2);
            console.info("end reset.\n");
            hdrcom.pub.processResult(res, "SUCCESS", true);
            return 'SUCCESS';
        } catch (err) {
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeStrDB(db).catch(err=> {
                console.error('dip_sqlcfg_rollback err:Close db Err!');
                console.error(err);
            });
        }
    };
    if ('sqlserver' === dbType) {
        return sqlserver_sqlcfg_rb();
    } else {
        hdrcom.pub.processResult(res, "SUCCESS", true);
        return 'SUCCESS';
    }
}

function query_db2_metadata(body, res) {
    let db;
    let srcDb;

    async function get_meta_data() {
        let sql;
        let result = [];
        srcDb = await hdrcom.pub.openAsignDB(db, body.request.component_id, 'db2');

        if ('table' === body.request.type) {

            sql = `select tabname as TAB, datacapture as STAT from syscat.tables where tabschema = ? and type = 'T' order by tabname`;
            let tabRec = await hdrcom.db.executeStrSql(srcDb, sql, [body.request.schema]);

            tabRec.forEach(e=> {
                if ('L' === e.STAT || 'Y' === e.STAT) {
                    result.push({name: e.TAB, status: 'yes'});
                } else {
                    result.push({name: e.TAB, status: 'no'});
                }
            });
        } else {
            sql = hdrcom.pub.getUserSqltext('db2');
            if ('1' === sql) {
                throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
            }

            let usrRec = await hdrcom.db.executeStrSql(srcDb, sql, []);

            usrRec.forEach(e=> {
                result.push(e.USERNAME);
            });
        }

        return result;
    }

    async function doJob() {
        try {
            console.info("[query_db2_schema begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();

            let result = await get_meta_data();
            hdrcom.pub.processResult(res, result, true);
            console.info("[query_db2_schema success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult(res, err, false);
            console.error('[query_db2_schema fail]');
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
            srcDb && hdrcom.db.closeStrDB(srcDb).catch(err=> {
                console.error('In query_db2_schema ', err);
            });
        }
    }

    return doJob();
}

function set_db2_cdc(body, res) {
    let db;
    let srcDb;

    async function set_cdc(recordSet, type) {
        let sql;
        let task = [];
        if ('open' === type) {
            sql = `ALTER TABLE ? DATA CAPTURE NONE `;
        } else {
            sql = `ALTER TABLE ? DATA CAPTURE CHANGES `;
        }

        //srcDb = await hdrcom.pub.openAsignDB(db, body.request.db_id, 'db2');

        let connStr = hdrcom.pub.getConnStr('db2', '172.16.1.67', 50000, 'test1', 'db2inst1', '123123');
        srcDb = await hdrcom.db.openStrDB(connStr);
        if ('undefined' !== recordSet) {
            for (let j = 0; j < recordSet.length; j++) {
                if ('yes' === recordSet[j].select_all) {
                    sql = `select tabname as TAB from syscat.tables where tabschema = ? and type = 'T' order by tabname`;
                    let tabRec = await hdrcom.db.executeStrSql(srcDb, sql, [recordSet[j].schema]);

                    for (let i = 0; i < tabRec.length; i++) {
                        if ('open' === type) {
                            sql = `ALTER TABLE ${recordSet[j].schema}.${tabRec[i].TAB} DATA CAPTURE NONE `;
                        } else {
                            sql = `ALTER TABLE ${recordSet[j].schema}.${tabRec[i].TAB} DATA CAPTURE CHANGES `;
                        }
                        task.push(hdrcom.db.executeStrSql(srcDb, sql, []));
                    }
                    await Promise.all(task);
                } else {
                    for (let i = 0; i < recordSet[j].table.length; i++) {
                        if ('open' === type) {
                            sql = `ALTER TABLE ${recordSet[j].schema}.${recordSet[j].table[i]} DATA CAPTURE NONE `;
                        } else {
                            sql = `ALTER TABLE ${recordSet[j].schema}.${recordSet[j].table[i]} DATA CAPTURE CHANGES `;
                        }
                        task.push(hdrcom.db.executeStrSql(srcDb, sql, []));
                    }
                    await Promise.all(task);
                }
            }

        }
    }

    async function doJob() {
        try {
            console.info("[set_db2_cdc begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();

            await set_cdc(body.request.close_cdc_set, 'close');
            await set_cdc(body.request.open_cdc_set, 'open');
            hdrcom.pub.processResult(res, 'SUCCESS', true, body);
            console.info("[set_db2_cdc success.]\n");
            return 'SUCCESS';
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult(res, err, false, body);
            console.error('[set_db2_cdc fail]');
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
            srcDb && hdrcom.db.closeStrDB(srcDb).catch(err=> {
                console.error('In set_db2_cdc ', err);
            });
        }
    }

    return doJob();
}

module.exports = {
    save_db_info: save_db_info,
    query_db_info: query_db_info,
    query_fav_db: query_fav_db,
    delete_fav_db: delete_fav_db,
    add_fav_db: add_fav_db,
    test_db_connection: test_db_connection,
    check_sourcedb_env: check_sourcedb_env,
    query_all_db_info: query_all_db_info,
    query_db_table: query_db_table,
    //sqlserver方法
    query_environment_status: query_environment_status,
    add_r7_cdc: add_r7_cdc,
    start_recover_mode: start_recover_mode,
    start_cdc: start_cdc,
    dip_sqlcfg_rollback: dip_sqlcfg_rollback,
    //db2 cdc op
    query_db2_schema: query_db2_metadata,
    query_db2_table: query_db2_metadata,
    set_db2_cdc: set_db2_cdc
};
