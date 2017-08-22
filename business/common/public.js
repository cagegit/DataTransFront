'use strict';
const Q = require("q");
const net = require('net');
// const logger = require('./logger').log('log_date');
const md5 = require('md5');
const fs = require('fs');
const exec = require('child_process').exec;

const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser({explicitArray: false, ignoreAttrs: true}); // xml -> json
const async = require('async');
let hdrcfg = require('../../config');
let dbObj = require('./dbObject');
let CryptoJS = require('./tripledes');
let moment = require('moment');
let port = require('../../routes/sys_config');
const CK = require('check-types');
//get database conn str
function getConnStr(type, ip, port, id, user, passwd) {
    let cn = "";
    let pwd = detdes(passwd);
    if ('oracle' === type) {
        cn = 'DRIVER={oradriver};DBQ=' + ip + ':' + port + '/' + id + ';UID=' + user + ';PWD=' + pwd;
    } else if ('sqlserver' === type) {
        cn = 'DRIVER={sqldriver};SERVER=' + ip + ',' + port + ';DATABASE=' + id + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else if ('db2' === type) {
        cn = 'DRIVER={db2driver};Hostname=' + ip + ';DATABASE=' + id + ';Port=' + port + ';UID=' + user + ';PWD=' + pwd + ';Protocol=TCPIP;LANGUAGE=us_english';
    } else if ('mysql' === type) {
        cn = 'DRIVER={mysqldriver};SERVER=' + ip + ';DATABASE=' + id + ';Port=' + port + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else if ('gbase-8a' === type) {
        cn = 'DRIVER={8adriver};SERVER=' + ip + ';DATABASE=' + id + ';Port=' + port + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else if ('vertica' === type) {
        cn = 'DRIVER={verticadriver};SERVER=' + ip + ';DATABASE=' + id + ';Port=' + port + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else if ('dbone' === type) {
        cn = 'DRIVER={dbonedriver};ServerName=' + ip + ';DATABASE=' + id + ';Port=' + port + ';UserName=' + user + ';Password=' + pwd + ';LANGUAGE=us_english;Protocol=7.4';
    } else if ('altibase' === type) {
        cn = 'DRIVER={altibasedriver};DSN=' + ip + ';PORT_NO=' + port + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else if ('postgresql' === type) {
        cn = 'DRIVER={pgdriver};SERVER=' + ip + ';DATABASE=' + id + ';Port=' + port + ';UID=' + user + ';PWD=' + pwd;
    } else if ('dameng' === type) {
        cn = 'DRIVER={dmdriver};SERVER=' + ip + ';TCP_PORT=' + port + ';DSN=' + id + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else if ('kdb' === type) {
        cn = 'DRIVER={kdb};SERVER=' + ip + ';TCP_PORT=' + port + ';DSN=' + id + ';UID=' + user + ';PWD=' + pwd + ';LANGUAGE=us_english';
    } else {
        console.error("wrong database type.");
        return false;
    }
    return cn;
}

function checkMd5(body) {
    console.info("check md5");
    return new Promise((resolve, reject) => {
        resolve(body);
        // try {
        //     if (body.md5 === md5(JSON.stringify(body.request))) {
        //         console.info('md5 check success!!!');
        //         resolve(body);
        //     } else {
        //         let buf = hdrcfg.code.EMD5 + ':' + hdrcfg.msg[hdrcfg.code.EMD5];
        //         let msg = {error_code: hdrcfg.code.EMD5, error_msg: buf};
        //         console.error(buf);
        //         console.info('/public/checkMd5 info:md5 not equal!');
        //         reject(msg);
        //     }
        // } catch (err) {
        //     reject(err);
        // }
    });
}
/**
 * @param db
 * @returns {Promise}  true, false
 */
function setAutoCommit(db) {
    let sql = 'set autocommit = 0';
    let params = [];
    return new Promise((resolve, reject) => {
        let rs = dbObj.preSql(db, sql, params);
        rs.then(function () {
            console.info("set autocommit = 0, ok.");
            resolve(true);
        }).catch(function (err) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            console.error('/public/setAutoCommit err:', err);
            reject(false);
        });
    });
}
/**
 * @param db
 * @param type  :project, group, component
 * @param compType ：database、capture、queue、apply、transfer
 * @returns {*}
 */
async function getDipId(db, type, compType) {
    console.info("common to getDipId");
    await setAutoCommit(db);
    // await dbObj.dbTransaction(db);
    let id = "";
    let seqType = "";
    if (type === hdrcfg.cfg.type.PROJECT) {
        id = type;
        seqType = 'PROJECT_SEQ';
    } else if (type === hdrcfg.cfg.type.GROUP) {
        id = type;
        seqType = 'GROUP_SEQ';
    } else if (type === hdrcfg.cfg.type.COMPONENT) {
        id = compType;
        seqType = 'COMP_SEQ';
    } else if (type === hdrcfg.cfg.type.SYNC) {
        id = type;
        seqType = 'SYNC_SEQ';
    }

    let sql;
    let params;
    sql = 'select current_value from ' + hdrcfg.cfg.table_name.T_DIP_SEQ + ' where seq_type = ? for update';
    params = [seqType];
    let rs = await dbObj.preSql(db, sql, params);
    console.info(rs);

    /*judgement group count*/
    if (type === hdrcfg.cfg.type.PROJECT || type === hdrcfg.cfg.type.GROUP) {
        let table = '';
        if (type === hdrcfg.cfg.type.PROJECT) {
            table = hdrcfg.cfg.table_name.T_PROJECT_INFO;
        } else {
            table = hdrcfg.cfg.table_name.T_GROUP_INFO;
        }
        sql = `select count(id) cnt from ${table}`;
        let ret = await dbObj.preSql(db, sql, []);
        if (CK.nonEmptyArray(ret) && ret[0].cnt >= hdrcfg.cfg.macro.MAX_GROUP_OR_PROJECT) {
            throw {error_code: hdrcfg.code.EEXCEED, error_msg: hdrcfg.msg[hdrcfg.code.EEXCEED]};
        }
    }

    sql = 'update ' + hdrcfg.cfg.table_name.T_DIP_SEQ + ' set current_value = current_value + 1 where seq_type = ?';
    params = [seqType];
    await dbObj.preSql(db, sql, params);
    // await dbObj.dbCommit(db);
    if (type === hdrcfg.cfg.type.SYNC) {
        return rs[0].current_value;
    } else {
        return id + '_' + rs[0].current_value;
    }
}

async function dealNormalParam(db, comp_id, paramSet, time) {
    for (let x in paramSet) {
        let sql = 'SELECT COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ? AND PARAM_NAME = ? AND PARAM_TYPE = ?';
        let params = [comp_id, x, 'NORMAL'];

        let rs = await dbObj.preSql(db, sql, params);

        if (CK.emptyArray(rs)) {
            console.info("params are not exist, to insert.");
            let sqlI = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
            let paramsI = [comp_id, x, paramSet[x], 'NORMAL', 'YES', time];

            await dbObj.preSql(db, sqlI, paramsI);
        } else {
            console.info("params is exist, to update.");
            let sqlU = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
            let paramsU = [paramSet[x], time, comp_id, x];

            await dbObj.preSql(db, sqlU, paramsU);
        }
    }
    return true;
}


/**
 * @param db
 * @param comp_id
 * @param type
 * @param tableName
 * @param time
 */
async function dealExternalParam(db, comp_id, type, tableName, time) {
    //删除T_COMP_PARAM中的信息，然后再插入。
    console.info("to delete old param.");
    let t_object_set_id = false;
    let isTrue = await this.delectExternalParam(db, comp_id, type);
    if (!isTrue) {
        return false;
    }

    console.info("to insert T_COMP_DEPEND_SETS.");
    let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + '(NAME, TYPE, TABLE_NAME, CREATE_TIME) values (?, ?, ?, ?)';
    let params = [type, type, tableName, time];

    let rs = await dbObj.preSql(db, sql, params).catch(err=> {
        console.error(err);
        t_object_set_id = false;
    });
    if (!rs) {
        dbObj.dbRollback(db).catch(er=> {
            console.error(er);
        });
        return false;
    }

    //获取插入的id
    let sqlId = 'select last_insert_id() as id';
    let paramsSqlId = [];
    let lastInsId = await dbObj.preSql(db, sqlId, paramsSqlId).catch(err=> {
        console.error(err);
        t_object_set_id = false;
    });
    if (!lastInsId) {
        return false;
    }

   if(CK.nonEmptyArray(lastInsId)) {
       t_object_set_id = lastInsId[0].id;
       console.info("get insert T_COMP_DEPEND_SETS id & insert into t_comp_param.");

       let sqlInfo = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
       let paramsInfo = [comp_id, type, t_object_set_id, 'EXTERNAL', 'YES', time];

       let rsInfo = await dbObj.preSql(db, sqlInfo, paramsInfo).catch(err=> {
           console.error(err);
           t_object_set_id = false;
       });

       if (!rsInfo) {
           dbObj.dbRollback(db).catch(er=> {
               console.error(er);
           });
           t_object_set_id = false;
       }
   }
   return t_object_set_id;
}

async function delectExternalParam(db, comp_id, type) {
    //删除T_COMP_PARAM中的信息，然后再插入。
    console.info("delectExternalParam to delete old param.");

    let sqlArray = [];
    if (type === hdrcfg.cfg.object_set_type.RAC_INFO) {
        sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO + " WHERE " +
            "SET_ID IN (SELECT b.ID FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " a, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " b WHERE" +
            " a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? " +
            "AND a.PARAM_VALUE = b.ID)");
    } else {
        sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + " WHERE " +
            "SET_ID IN (SELECT b.ID FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " a, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " b WHERE" +
            " a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? " +
            "AND a.PARAM_VALUE = b.ID)");
    }

    sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " WHERE id IN " +
        "(SELECT PARAM_VALUE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " WHERE " +
        "COMP_ID = ? AND PARAM_NAME = ? " +
        "AND PARAM_TYPE = ?)");
    sqlArray.push("delete from " + hdrcfg.cfg.table_name.T_COMP_PARAM + " where COMP_ID = ? and PARAM_NAME = ? and PARAM_TYPE = ?");

    let params = [comp_id, type, 'EXTERNAL'];
    let jobs = [];
    let resVal = true;
    for (let x = 0; x < sqlArray.length; x++) {
        console.error(sqlArray[x]);
        let rs = dbObj.preSql(db, sqlArray[x], params);
        jobs.push(rs);
    }
    let result = await Promise.all(jobs).catch(err=> {
        console.error(err);
        resVal = false;
    });
    if (!result) {
        dbObj.dbRollback(db).catch(er=> {
            console.error(er);
        });
        resVal = false;
    }
    return resVal;
}

async function insertWebCache(db, comp_id, objString) {
    let sqlFilter = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_WEB_CACHE + ' WHERE COMP_ID = ?';
    let paramsFilter = [comp_id];
    let returnVal = true;
    let rsFilter = await dbObj.preSql(db, sqlFilter, paramsFilter).catch(err=> {
        console.error(err);
        dbObj.dbRollback(db).catch(er=> {
            console.error(er);
        });
        returnVal = false;
    });
    if (!rsFilter) {
        returnVal = false;
    }
    let sqlFilter1 = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_WEB_CACHE + '(COMP_ID, CACHE) values (?, ?)';
    let paramsFilter1 = [comp_id, objString];
    let rsFilter1 = await dbObj.preSql(db, sqlFilter1, paramsFilter1).catch(err=> {
        console.error(err);
        dbObj.dbRollback(db).catch(er=> {
            console.error(er);
        });
        returnVal = false;
    });
    if (!rsFilter1) {
        returnVal = false;
    }
    return returnVal;
}

/**
 * @param db: odbc database
 * @returns {*}
 */
async function get_nls_lang(db) {
    let nchar_charset;
    let sql0 = "select value from nls_database_parameters where parameter = 'NLS_NCHAR_CHARACTERSET'";
    let params0 = [];

    let rs0 = await dbObj.executeStrSql(db, sql0, params0).catch(err=> {
        console.error(err);
    });
    if (!rs0 || (typeof rs0 === "object" && rs0.length <= 0)) {
        return false;
    }
    nchar_charset = rs0[0].VALUE;

    let nls_lang;
    let sql = "select value from nls_database_parameters where parameter = 'NLS_CHARACTERSET'";
    let params = [];

    let rs = await dbObj.executeStrSql(db, sql, params).catch(err=> {
        console.error(err);
    });
    if (!rs || (typeof rs === "object" && rs.length <= 0)) {
        return false;
    }
    let nls_characterset = rs[0].VALUE;

    let sql1 = "select value from nls_database_parameters where parameter = 'NLS_LANGUAGE'";
    let params1 = [];

    let rs1 = await dbObj.executeStrSql(db, sql1, params1).catch(err=> {
        console.error(err);
    });
    if (!rs1 || (typeof rs1 === "object" && rs1.length <= 0)) {
        return false;
    }
    let nls_language = rs1[0].VALUE;

    let sql2 = "select value from nls_database_parameters where parameter = 'NLS_TERRITORY'";
    let params2 = [];

    let rs2 = await dbObj.executeStrSql(db, sql2, params2).catch(err=> {
        console.error(err);
    });
    if (!rs2 || (typeof rs2 === "object" && rs2.length <= 0)) {
        return false;
    }
    let nls_territory = rs2[0].VALUE;

    nls_lang = nls_language + '_' + nls_territory + '.' + nls_characterset;

    let resJson = {};
    resJson["nchar_charset"] = nchar_charset;
    resJson["nls_lang"] = nls_lang;
    resJson["nls_characterset"] = nls_characterset;

    let flag = 0;
    for (let x = 0; x < nls_characterset.length; x++) {
        let num = parseInt(nls_characterset[x]);
        if (!(num >= 0 && num <= 9)) {
            if (flag !== 0)
                break;
        } else {
            flag++;
        }
    }
    if (flag > 1) {
        resJson["source_clob_charset"] = 'AL16UTF16';
    } else {
        resJson["source_clob_charset"] = nls_characterset;
    }
    return resJson;
}

/**
 * @param db    dip mysql数据库
 * @param db_id 指定的数据id
 * @param type  制定数据库的类型
 * @returns {*} 失败返回false，成功返回db的连接。
 */
async function openAsignDB(db, db_id, type) {
    let ret_db = false;
    let dbIp = "", dbPort = "", dbId = "", dbUser = "", dbPassword = "", encrypt_password = "";
    let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ?';
    let params = [db_id];
    let rs =await dbObj.preSql(db, sql, params);
    if (CK.nonEmptyArray(rs)) {
        for (let x = 0; x < rs.length; x++) {
            if ('db_ip' === rs[x].PARAM_NAME) {
                dbIp = rs[x].PARAM_VALUE;
            } else if ('db_port' === rs[x].PARAM_NAME) {
                dbPort = rs[x].PARAM_VALUE;
            } else if ('db_id' === rs[x].PARAM_NAME) {
                dbId = rs[x].PARAM_VALUE;
            } else if ('db_user' === rs[x].PARAM_NAME) {
                dbUser = rs[x].PARAM_VALUE;
            } else if ('db_password' === rs[x].PARAM_NAME) {
                dbPassword = rs[x].PARAM_VALUE;
            } else if ('encrypt_password' === rs[x].PARAM_NAME) {
                encrypt_password = rs[x].PARAM_VALUE;
            }
        }
        //打开数据库连接
        let constr = getConnStr(type, dbIp, dbPort, dbId, dbUser, dbPassword);
        if (!constr) {
            let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
            console.error(buf);
            throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
        }
        if ('oracle' === type) {
            process.env.NLS_LANG = 'AMERICAN_AMERICA.AL32UTF8';
        }
        ret_db = await dbObj.openStrDB(constr);
    } else {
        //数据库信息不存在
        throw {error_code: hdrcfg.code.ENOENT, error_msg: hdrcfg.msg[hdrcfg.code.ENOENT]};
    }
    return ret_db;
}

/**
 * @param res
 * @param data
 * @param flag
 * @param body
 */
function processResult(res, data, flag, body) {
    let result = {};
    result.status = flag;
    if (typeof(data) === 'string') {
        result.md5 = md5(data);
        result.response = data;
    } else if (typeof(data) === 'object') {
        let msg = '';
        if (data.message) {
            msg = {error_msg: data.message};
            result.md5 = md5(JSON.stringify(msg));
            result.response = msg;
        } else {
            try {
                result.md5 = md5(JSON.stringify(data));
                result.response = data;
            } catch (err) {
                msg = {error_msg: err.message};
                result.md5 = md5(JSON.stringify(msg));
                result.response = msg;
            }
        }
    } else {
        result.md5 = md5('');
        result.response = '';
    }
    res.json(result);
}

function processResult_noMD5(res, data, flag, body) {
    let result = {};
    if (flag) {
        result["command_return"] = "SUCCESS";
    } else {
        result["command_return"] = "ERROR";
    }
    result["return_data"] = data;
    res.json(result);
}

function exe_shell(stmt) {
    return new Promise((resolve, reject)=> {
        exec(stmt, err => {
            console.info(stmt);
            if (err) {
                console.error('ERR:', err);
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

function isEmptyObj(obj) {
    for (let tmp in obj) {
        return false;
    }
    return true;
}

function getStatus(id) {
    return new Promise((resolve, reject) => {
        let xml = '<dip_command><command>query_one_group_ex</command><command_data><group>' + id + '</group></command_data></dip_command>';
        let buffer = '';
        let client = new net.Socket();
        client.setTimeout(5000);
        client.connect(port.manager_port, hdrcfg.cfg.node.host, function () {
            client.write(xml);
        });
        client.on('data', function (data) {
            buffer = data.toString();
            if (buffer.indexOf('</dip_command>') > 0) {
                xmlParser.parseString(buffer, function (err, result) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        console.debug('result:', result);
                        resolve(result.dip_command.return_data.status);
                    }
                });
                client.destroy();
            }
        });
        client.on('error', function (err) {
            console.error(err);
            reject({err: 'socket err'});
            client.destroy();
        });
        // 为客户端添加“close”事件处理函数
        client.on('close', function () {
            reject({err: 'socket close'});
        });
        client.on('timeout', function (err) {
            console.error('Timeout');
            reject({err: 'timeout'});
            client.destroy();
        });
    });
}

function tdes(str) {
    let key1 = CryptoJS.enc.Utf8.parse(hdrcfg.cfg.secret_key.key);
    let iv1 = CryptoJS.enc.Utf8.parse(hdrcfg.cfg.secret_key.iv);
    let encrypted = CryptoJS.TripleDES.encrypt(str, key1, {
        iv: iv1,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

function detdes(str) {
    let key1 = CryptoJS.enc.Utf8.parse(hdrcfg.cfg.secret_key.key);
    let iv1 = CryptoJS.enc.Utf8.parse(hdrcfg.cfg.secret_key.iv);
    let encrypted = CryptoJS.TripleDES.decrypt(str, key1, {
        iv: iv1,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString(CryptoJS.enc.Utf8);
}

function judge_dbType(type) {
    for (let x = 0; x < hdrcfg.cfg.db_type.length; x++) {
        if (type === hdrcfg.cfg.db_type[x]) {
            return true;
        }
    }
    return false;
}

function get_db_type(db, db_id) {
    let dbIp = "", dbPort = "", dbId = "", dbUser = "", dbPassword = "", encrypt_password = "";
    let sql = 'select PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
    let params = [db_id, 'db_type'];
    let rs = dbObj.executeSqlSync(db, sql, params);
    if (rs.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (CK.nonEmptyArray(rs)) {
            return rs[0].PARAM_VALUE;
        } else {
            //数据库信息不存在
            let buf = hdrcfg.code.ENOENT + ':database info ' + hdrcfg.msg[hdrcfg.code.ENOENT];
            console.error(buf);
            return false;
        }
    }
}


/**查询数据库版本
 * @param db:
 */
async function query_db_version(db) {
    console.info("begin to query_db_version.");
    let sql = "select serverproperty('engineedition') as serverproperty";
    let params = [];
    let result = false;
    let rs =await hdrcom.db.executeStrSql(db, sql, params).catch(err=>{
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

    let rsV =await hdrcom.db.executeStrSql(db, sqlV, paramsV).catch(err=>{
        console.error(err);
    });
    if (CK.nonEmptyArray(rsV)) {
        if (rsV[0].version.indexOf('2005') !== -1) {
            result =  hdrcfg.cfg.DATABASE_2005;
        } else {
            result =  '0';
        }
    } else {
        let buf = hdrcfg.code.ENOENT + ':' + hdrcfg.msg[hdrcfg.code.ENOENT];
        console.error(buf);
        result =  false;
    }
    return result;
}

function check_sqlserver_envir(version, db, db_id, rollbackFlag) {
    console.info("begin to check_sqlserver_envir.");

    let resJson1 = {};
    let resJson2 = {};
    let resArrayJson = [];

    resJson2["db_version"] = version;

    if (rollbackFlag === '1')
        resJson1["rollback"] = "yes";
    else
        resJson1["rollback"] = "no";

    let sql = "SELECT recovery_model FROM sys.databases WHERE name  = ?";
    let params = [db_id];

    let rs = dbObj.executeSqlSync(db, sql, params);
    if (rs.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (rs.length > 0) {
            if (rs[0].recovery_model === '1') {
                resJson1["recover_status"] = "yes";
                resJson2["recover_status"] = "1";
            } else if (rs[0].recovery_model === '2') {
                resJson1["recover_status"] = "no";
                resJson2["recover_status"] = "2";
            } else if (rs[0].recovery_model === '3') {
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

        let rsC = dbObj.executeSqlSync(db, sqlC, paramsC);
        if (rsC.error) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (rsC.length > 0) {
                if (rsC[0].is_cdc_enabled === '1') {
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

    let rsV = dbObj.executeSqlSync(db, sqlV, paramsV);
    if (rsV.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (rsV.length > 0) {
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

    let rsV1 = dbObj.executeSqlSync(db, sqlV1, paramsV1);
    if (rsV1.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (rsV1.length > 0) {
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

    let rsV2 = dbObj.executeSqlSync(db, sqlV2, paramsV2);
    if (rsV2.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (rsV2.length > 0) {
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

        let rsV3 = dbObj.executeSqlSync(db, sqlV3, paramsV3);
        if (rsV3.error) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (rsV3.length > 0) {
                if (rsV3[0].is_disabled === '1') {
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

        let rsV4 = dbObj.executeSqlSync(db, sqlV4, paramsV4);
        if (rsV4.error) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (rsV4.length > 0) {
                if (rsV4[0].enabled === '0') {
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

        let rsV5 = dbObj.executeSqlSync(db, sqlV5, paramsV5);
        if (rsV5.error) {
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            console.error(buf);
            return false;
        } else {
            if (rsV4.length > 0) {
                if (rsV5[0].enabled === '0') {
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

    if (flag !== 0)
        resJson1.r7_status = "no";
    else
        resJson1.r7_status = "yes";

    resArrayJson.push(resJson1);
    resArrayJson.push(resJson2);

    return resArrayJson;
}

function check_rollback_table(db) {
    let sql = "SELECT name  FROM sys.tables WHERE type = 'U' and name = 'r7_cfg_rollback'";
    let params = [];

    let rs = dbObj.executeSqlSync(db, sql, params);
    if (rs.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    } else {
        if (rs.length > 0){
            return '1';
        } else {
            return '0';
        }
    }
}

function create_rollback_table(db, infoJson) {
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

    let rs = dbObj.executeSqlSync(db, sql, params);
    if (rs.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    }

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

    let rs1 = dbObj.executeSqlSync(db, sql1, params1);
    if (rs1.error) {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        return false;
    }
    return true;
}

function db_extended_table(type, db_version, flag) {
    if ('sqlserver' === type) {
        let sql = "";
        if (db_version === hdrcfg.cfg.DATABASE_2005) {
            if (flag === 'TABLE_LIST') {
                sql = "select name from sys.tables where schema_name(schema_id) = ? order by is_replicated desc, name";
            } else if (flag === 'TABLE_COUNT') {
                sql = "select count(*) a from sys.tables where schema_name(schema_id) = ?";
            } else if (flag === 'TABLE_EXTEND_COUNT') {
                sql = "select count(*) a from sys.tables where is_replicated = 1 and schema_name(schema_id) = ?";
            }
        } else {
            if (flag === 'TABLE_LIST') {
                sql = "select name from sys.tables where name not in('dtproperties', 'systranschemas') and SCHEMA_NAME(schema_id) = ? order by is_replicated desc, name";
            } else if (flag === 'TABLE_COUNT') {
                sql = "select count(*) a from sys.tables where name not in('dtproperties', 'systranschemas') and SCHEMA_NAME(schema_id) = ?";
            } else if (flag === 'TABLE_EXTEND_COUNT') {
                sql = "select count(*) a from sys.tables where name not in('dtproperties', 'systranschemas') and is_replicated = 1 and SCHEMA_NAME(schema_id) = ?";
            }
        }
        return sql;
    } else {
        return false;
    }
}

function get_sqltext(type, objectType) {
    let sql = "";
    if (type === 'sqlserver') {
        if (objectType === 'INDEX') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'INDEX' and SCHEMA_NAME(schema_id)=? order by name";
        } else if (objectType === 'TABLE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'U' and SCHEMA_NAME(schema_id)=? order by name";
        } else if (objectType === 'VIEW') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'V' and SCHEMA_NAME(schema_id)=?  order by name";
        } else if (objectType === 'SEQUENCE') {
            sql = '1';
        } else if (objectType === 'PROCEDURE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'P' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'FUNCTION') {
            sql = "SELECT  name  FROM sys.objects WHERE type IN ('FN','TF') and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'PACKAGE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'PACKAGE' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'PACKAGE_BODY') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'PACKAGE_BODY' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'TRIGGER') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'TR' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'TYPE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'TYPE' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'TYPE_BODY') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'TYPE_BODY' and SCHEMA_NAME(schema_id)=?";
        }
    } else if (type === 'mysql') {
        if (objectType === 'INDEX') {
            sql = "select index_name as name from information_schema.statistics where INDEX_SCHEMA = ? order by index_name";
        } else if (objectType === 'TABLE') {
            sql = "select table_name as name from information_schema.TABLES where table_SCHEMA = ? and table_type = 'BASE TABLE' order by table_name";
        } else if (objectType === 'VIEW') {
            sql = "select TABLE_NAME as name from information_schema.VIEWS where table_schema = ? order by view_definition";
        } else if (objectType === 'SEQUENCE' || objectType === 'PACKAGE' || objectType === 'PACKAGE_BODY' || objectType === 'TYPE' || objectType === 'TYPE_BODY') {
            sql = '1';
        } else if (objectType === 'PROCEDURE') {
            sql = "select ROUTINE_NAME as name from information_schema.ROUTINES where ROUTINE_SCHEMA = ? and ROUTINE_type = 'PROCEDURE' order by ROUTINE_NAME";
        } else if (objectType === 'FUNCTION') {
            sql = "select ROUTINE_NAME as name from information_schema.ROUTINES where ROUTINE_SCHEMA = ? and ROUTINE_type = 'FUNCTION' order by ROUTINE_NAME";
        } else if (objectType === 'TRIGGER') {
            sql = "select trigger_name as name from information_schema.triggers where trigger_SCHEMA = ? order by trigger_name";
        }
    } else if (type === 'db2') {
        if (objectType === 'INDEX') {
            sql = "select INDNAME as name FROM SYSCAT.INDEXES WHERE OWNER = ? order by INDNAME";
        } else if (objectType === 'TABLE') {
            sql = "select tabname as name from syscat.tables where tabschema = ? and type = 'T' order by tabname";
        } else if (objectType === 'VIEW') {
            sql = "select VIEWNAME as name FROM SYSCAT.VIEWS WHERE OWNER = ?";
        } else if (objectType === 'SEQUENCE') {
            sql = 'select SEQNAME as name FROM SYSCAT.SEQUENCES WHERE SEQSCHEMA = ?';
        } else if (objectType === 'PROCEDURE') {
            sql = "select PROCNAME as name from syscat.procedures WHERE PROCSCHEMA= ?";
        } else if (objectType === 'FUNCTION') {
            sql = "select FUNCNAME as name FROM SYSCAT.FUNCTIONS WHERE FUNCSCHEMA=?";
        } else if (objectType === 'PACKAGE') {
            sql = "select PKGNAME as name FROM SYSCAT.PACKAGES WHERE OWNER =?";
        } else if (objectType === 'PACKAGE_BODY' || objectType === 'TYPE' || objectType === 'TYPE_BODY') {
            sql = '1';
        } else if (objectType === 'TRIGGER') {
            sql = "select TRIGNAME as name from syscat.triggers where OWNER = ?";
        }
    }
    return sql;
}

function getTableSqltext(type, objectType) {
    let sql = "";
    if (type === 'oracle') {
        sql = "select object_name as \"name\" from dba_objects where owner not in ('SYS','SYSTEM','MGMT_VIEW','DBSNMP','SYSMAN','SDE','OUTLN','MDSYS','WMSYS','FLOWS_FILES','ORDDATA','CTXSYS','ANONYMOUS','SI_INFORMTN_SCHEMA','ORDSYS','EXFSYS','APPQOSSYS','XDB','ORDPLUGINS','OWBSYS','OLAPSYS','XS$NULL','APEX_PUBLIC_USER','SPATIAL_CSW_ADMIN_USR','SPATIAL_WFS_ADMIN_USR') and object_type='" + objectType + "' and owner=? order by object_name desc";
    } else if (type === 'sqlserver') {
        if (objectType === 'INDEX') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'INDEX' and SCHEMA_NAME(schema_id)=? order by name";
        } else if (objectType === 'TABLE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'U' and SCHEMA_NAME(schema_id)=? order by name";
        } else if (objectType === 'VIEW') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'V' and SCHEMA_NAME(schema_id)=?  order by name";
        } else if (objectType === 'SEQUENCE') {
            sql = '1';
        } else if (objectType === 'PROCEDURE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'P' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'FUNCTION') {
            sql = "SELECT  name  FROM sys.objects WHERE type IN ('FN','TF') and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'PACKAGE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'PACKAGE' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'PACKAGE_BODY') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'PACKAGE_BODY' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'TRIGGER') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'TR' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'TYPE') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'TYPE' and SCHEMA_NAME(schema_id)=?";
        } else if (objectType === 'TYPE_BODY') {
            sql = "SELECT  name  FROM sys.objects WHERE type = 'TYPE_BODY' and SCHEMA_NAME(schema_id)=?";
        }
    } else if (type === 'mysql') {
        if (objectType === 'INDEX') {
            sql = "select index_name as name from information_schema.statistics where INDEX_SCHEMA = ? order by index_name";
        } else if (objectType === 'TABLE') {
            sql = "select table_name as name from information_schema.TABLES where table_SCHEMA = ? and table_type = 'BASE TABLE' order by table_name";
        } else if (objectType === 'VIEW') {
            sql = "select TABLE_NAME as name from information_schema.VIEWS where table_schema = ? order by view_definition";
        } else if (objectType === 'SEQUENCE' || objectType === 'PACKAGE' || objectType === 'PACKAGE_BODY' || objectType === 'TYPE' || objectType === 'TYPE_BODY') {
            sql = '1';
        } else if (objectType === 'PROCEDURE') {
            sql = "select ROUTINE_NAME as name from information_schema.ROUTINES where ROUTINE_SCHEMA = ? and ROUTINE_type = 'PROCEDURE' order by ROUTINE_NAME";
        } else if (objectType === 'FUNCTION') {
            sql = "select ROUTINE_NAME as name from information_schema.ROUTINES where ROUTINE_SCHEMA = ? and ROUTINE_type = 'FUNCTION' order by ROUTINE_NAME";
        } else if (objectType === 'TRIGGER') {
            sql = "select trigger_name as name from information_schema.triggers where trigger_SCHEMA = ? order by trigger_name";
        }
    } else if (type === 'db2') {
        if (objectType === 'INDEX') {
            sql = "select INDNAME as name FROM SYSCAT.INDEXES WHERE OWNER = ? order by INDNAME";
        } else if (objectType === 'TABLE') {
            sql = "select tabname as name from syscat.tables where tabschema = ? and type = 'T' order by tabname";
        } else if (objectType === 'VIEW') {
            sql = "select VIEWNAME as name FROM SYSCAT.VIEWS WHERE OWNER = ?";
        } else if (objectType === 'SEQUENCE') {
            sql = 'select SEQNAME as name FROM SYSCAT.SEQUENCES WHERE SEQSCHEMA = ?';
        } else if (objectType === 'PROCEDURE') {
            sql = "select PROCNAME as name from syscat.procedures WHERE PROCSCHEMA= ?";
        } else if (objectType === 'FUNCTION') {
            sql = "select FUNCNAME as name FROM SYSCAT.FUNCTIONS WHERE FUNCSCHEMA=?";
        } else if (objectType === 'PACKAGE') {
            sql = "select PKGNAME as name FROM SYSCAT.PACKAGES WHERE OWNER =?";
        } else if (objectType === 'PACKAGE_BODY' || objectType === 'TYPE' || objectType === 'TYPE_BODY') {
            sql = '1';
        } else if (objectType === 'TRIGGER') {
            sql = "select TRIGNAME as name from syscat.triggers where OWNER = ?";
        }
    }
    return sql;
}

function getUserSqltext(type) {
    let sql = "";
    if (type === 'oracle') {
        sql = "select username from dba_users order by username";
    } else if (type === 'sqlserver') {
        sql = "SELECT name as USERNAME FROM sys.schemas where name not in" +
            "('sys','guest','INFORMATION_SCHEMA','db_owner'," +
            "'db_accessadmin','db_securityadmin','db_ddladmin'," +
            "'db_backupoperator','db_datareader','db_datawriter'," +
            "'db_denydatareader','db_denydatawriter','cdc') order by name";
    } else if (type === 'mysql') {
        sql = 'SELECT SCHEMA_NAME as USERNAME from information_schema.schemata order by SCHEMA_NAME';
    } else if (type === 'db2') {
        sql = "select TRIM(SCHEMANAME) as USERNAME from syscat.schemata where definertype = 'U' and schemaname not in('NULLID','SQLJ','SYSTOOLS')";
    } else {
        sql = '1';
    }
    return sql;
}

function getColumnSqltext(type, user, table) {
    let sql = "";
    if (type === 'oracle') {
        sql = "select COLUMN_NAME as \"column_name\", DATA_TYPE as \"column_type\", DATA_LENGTH as \"column_length\" from DBA_TAB_COLUMNS where owner='" + user + "' and table_name='" + table + "' order by COLUMN_NAME";
    } else if (type === 'sqlserver') {
        sql = "select  a.name as column_name,type_name(a.user_type_id) as column_type, a.max_length as column_length from sys.columns a, sys.objects b where a.object_id=b.object_id and a.object_id=object_id('" + table + "') and SCHEMA_NAME(schema_id)= '" + user + "' order by a.name";
    } else if (type === 'mysql') {
        sql = "select COLUMN_NAME as column_name, DATA_TYPE as column_type, CHARACTER_MAXIMUM_LENGTH as column_length  from information_schema.COLUMNS where TABLE_NAME = '" + table + "' and TABLE_SCHEMA = '" + user + "'";
    } else if (type === 'db2') {
        sql = "select COLNAME as column_name, TYPENAME as column_type, LENGTH as column_length from SYSCAT.COLUMNS where TABNAME = '" + table + "' and TABSCHEMA = '" + user + "'";
    } else
        sql = '1';

    return sql;
}

function getDipMysqlConn() {
    let data = '';
    try {
        let filename = process.env['DIP_HOME'] + '/mysql/my.cnf';
        data= fs.readFileSync(filename, 'utf-8');
    } catch (err) {
        console.error(err);
        return false;
    }

    let lines = data.split("\n");
    let port = '3306';

    for (let x = 0; x < lines.length; x++) {
        let line = lines[x].split("=");
        if (line[0].trim() === 'port') {
            if (line[1].trim().length > 0)
                port = line[1].trim();
            break;
        }
    }

    return 'DRIVER={mysqldriver};SERVER=127.0.0.1;PORT=' + port + ';UID=r7;PWD=r7;DATABASE=dip';
}

async function getEtlRules(db, etl_id, user, table, rule_type) {
    let sql = '';
    let params = [];
    if (rule_type === hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN) {
        sql = 'SELECT a.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + ' c ' +
            'WHERE a.COMP_ID = ? AND a.PARAM_TYPE = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.OBJECT = ?';
        params = [etl_id, 'EXTERNAL', hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN, user + '.' + table];
    } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN) {
        sql = 'SELECT a.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN + ' c ' +
            'WHERE a.COMP_ID = ? AND a.PARAM_TYPE = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.OBJECT = ?';
        params = [etl_id, 'EXTERNAL', hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN, user + '.' + table];
    } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING) {
        sql = 'SELECT a.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING + ' c ' +
            'WHERE a.COMP_ID = ? AND a.PARAM_TYPE = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.OBJECT = ?';
        params = [etl_id, 'EXTERNAL', hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING, user + '.' + table];
    } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER) {
        sql = 'SELECT a.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER + ' c ' +
            'WHERE a.COMP_ID = ? AND a.PARAM_TYPE = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.OBJECT = ?';
        params = [etl_id, 'EXTERNAL', hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER, user + '.' + table];
    } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT) {
        sql = 'SELECT a.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT + ' c ' +
            'WHERE a.COMP_ID = ? AND a.PARAM_TYPE = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.OBJECT = ?';
        params = [etl_id, 'EXTERNAL', hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT, user + '.' + table];
    } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM) {
        sql = 'SELECT a.COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM + ' c ' +
            'WHERE a.COMP_ID = ? AND a.PARAM_TYPE = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.OBJECT = ?';
        params = [etl_id, 'EXTERNAL', hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM, user + '.' + table];
    }

    let result = await dbObj.preSql(db, sql, params);

    return !!CK.nonEmptyArray(result);
}

async function getRuleIndex(db, etl_id, type) {
    console.info("to get rule index.");
    let table_name = "";
    if (type === hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN) {
        table_name = hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN) {
        table_name = hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER) {
        table_name = hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING) {
        table_name = hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT) {
        table_name = hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM) {
        table_name = hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER) {
        table_name = hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER) {
        table_name = hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_BATCH_FILTER) {
        table_name = hdrcfg.cfg.table_name.T_ETL_BATCH_RULES;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_BATCH_INSERT) {
        table_name = hdrcfg.cfg.table_name.T_ETL_BATCH_RULES;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_BATCH_UPDATE) {
        table_name = hdrcfg.cfg.table_name.T_ETL_BATCH_RULES;
    }

    let sql = 'select b.ID from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b ' +
        'where a.COMP_ID = ? and a.PARAM_NAME = ? and a.PARAM_VALUE = b.ID and a.PARAM_TYPE = ?';
    let params = [etl_id, type, 'EXTERNAL'];

    let rs = await dbObj.preSql(db, sql, params);

    if (CK.nonEmptyArray(rs)) {
        return rs[0].ID;
    } else {
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        let sql1 = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + '(NAME, TYPE, TABLE_NAME, CREATE_TIME) values (?, ?, ?, ?)';
        let params1 = [type, type, table_name, time];

        await dbObj.preSql(db, sql1, params1);

        //获取插入的id
        let sqlId = 'select last_insert_id() as id';
        let paramsSqlId = [];
        let lastInsId = await dbObj.preSql(db, sqlId, paramsSqlId);

        let t_object_set_id = lastInsId[0].id;

        let sqlInfo = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
        let paramsInfo = [etl_id, type, t_object_set_id, 'EXTERNAL', 'YES', time];

        await dbObj.preSql(db, sqlInfo, paramsInfo);

        return t_object_set_id;
    }
}

async function dealRuleTable(db, set_id, type, table, user, oper) {
    console.info("to deal rule table.");
    let table_name = "";
    if (type === hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN) {
        table_name = hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN) {
        table_name = hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER) {
        table_name = hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING) {
        table_name = hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT) {
        table_name = hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT;
    } else if (type === hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM) {
        table_name = hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM;
    }

    let sql = 'select SET_ID from ' + table_name + ' where SET_ID = ? and OBJECT = ?';
    let params = [set_id, user + '.' + table];
    let result = await dbObj.preSql(db, sql, params);

    if (CK.nonEmptyArray(result)) {
        if (oper === 'DEL') {
            sql = 'delete from ' + table_name + ' where SET_ID = ? and OBJECT = ?';
            params = [set_id, user + '.' + table];

            await dbObj.preSql(db, sql, params);
        }
    } else {
        if (oper === 'ADD') {
            sql = 'insert into ' + table_name + '(SET_ID, RULE_TYPE, OBJECT) values (?, ?, ?)';
            params = [set_id, type, user + '.' + table];

            await dbObj.preSql(db, sql, params);
        }
    }
}

function get_sql_expression(expression, db_type) {
    let sqlExpression = [];
    let i = 0;
    let rc = 0;
    let rz = 0;

    while (expression[i]) {
        rc = check_code_num(expression[i]);

        if (rc === 1) {
            if (expression[i] === ('\'').charCodeAt()) {
                sqlExpression.push(expression[i]);
                i++;
                while (1) {
                    if (((rz = check_code_num(expression[i])) === 1) && (expression[i] === ('\'').charCodeAt())) {
                        break;
                    }
                    else {
                        while (rz !== 0) {
                            sqlExpression.push(expression[i]);
                            i++;
                            rz--;
                        }
                    }

                }
                sqlExpression.push(expression[i]);
                i++;
            }
            else {
                if (expression[i] === (':').charCodeAt()) {
                    if (db_type !== 'oracle') {
                        sqlExpression.push(('?').charCodeAt());
                        i++;
                        while (expression[i] !== undefined) {
                            if ((rz = check_code_num(expression[i])) > 1) {
                                i += rz;
                            }
                            else {
                                if (((expression[i] > 47) && (expression[i] < 58)) ||
                                    ((expression[i] > 64) && (expression[i] < 91)) ||
                                    ((expression[i] > 96) && (expression[i] < 123)) ||
                                    (expression[i] === 95)) {
                                    i++;
                                }
                                else {
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        sqlExpression.push(expression[i]);
                        i++;
                        while (expression[i] !== undefined) {
                            if ((rz = check_code_num(expression[i])) > 1) {
                                /*
                                 while (rz != 0) {
                                 sqlExpression = sqlExpression + expression[i];
                                 i++;
                                 rz--;
                                 }
                                 */
                                i += rz;
                            }
                            else {
                                if (((expression[i] > 47) && (expression[i] < 58)) ||
                                    ((expression[i] > 64) && (expression[i] < 91)) ||
                                    ((expression[i] > 96) && (expression[i] < 123)) ||
                                    (expression[i] === 95)) {
                                    //sqlExpression = sqlExpression + expression[i];
                                    i++;
                                }
                                else {
                                    (function conv(i) {
                                        if (parseInt(i / 10) > 0) {
                                            conv(i / 10);
                                        }

                                        sqlExpression.push(parseInt(i % 10) + 0x30);
                                    })(i);

                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    sqlExpression.push(expression[i]);
                    i++;
                }
            }
        }
        else {
            while (rc !== 0) {
                sqlExpression.push(expression[i]);
                i++;
                rc--;
            }
        }
    }

    return new Buffer(sqlExpression).toString();
}


function check_code_num(num) {
    if (num < (0x80).toString(10)) {
        return (1);
    }
    if (num < (0xe0).toString(10)) {
        return (2);
    }
    if (num < (0xf0).toString(10)) {
        return (3);
    }
    if (num < (0xf8).toString(10)) {
        return (4);
    }
    if (num < (0xfd).toString(10)) {
        return (5);
    }
    if (num < (0xfe).toString(10)) {
        return (6);
    }
    return 0;
}

async function check_etl_column(db, db_id, db_type, columnJson, level) {

    if (!judge_dbType(db_type)) {
        console.error('Database type [%s] error', db_type);
        throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
    }

    let dbCom = await openAsignDB(db, db_id, db_type);

    let sqlColumn = getColumnSqltext(db_type, columnJson.user, columnJson.table);
    if (sqlColumn === '1') {
        console.error('Database type [%s] error', db_type);
        throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
    }

    let rsColumn = await dbObj.executeStrSql(dbCom, sqlColumn, []);
    await dbObj.closeStrDB(dbCom);

    if (CK.nonEmptyArray(rsColumn)) {
        for (let x = 0; x < rsColumn.length; x++) {
            if (level === 'LEVEL_A') {
                if (columnJson.column_name === rsColumn[x].column_name) {
                    return;
                }
            } else if (level === 'LEVEL_B') {
                if (columnJson.column_name === rsColumn[x].column_name && columnJson.column_type === rsColumn[x].column_type) {
                    return;
                }
            } else if (level === 'LEVEL_C'){
                if (columnJson.column_name === rsColumn[x].column_name && columnJson.column_type === rsColumn[x].column_type && columnJson.column_length === rsColumn[x].column_length) {
                    return;
                }
            }
        }
    } else {
        console.error('Get column info error');
        throw {error_code: hdrcfg.code.ENOENT, error_msg: hdrcfg.msg[hdrcfg.code.ENOENT]};
    }

    if (level === 'LEVEL_A') {
        let buf = "table:" + columnJson.table + " column name:" + columnJson.column_name + " not exist.";
        console.error(buf);
        throw {error_msg: buf};
    } else if (level === 'LEVEL_B') {
        let buf = "table:" + columnJson.table + " column name:" + columnJson.column_name + " column type:" + columnJson.column_type + " not exist.";
        console.error(buf);
        throw {error_msg: buf};
    } else if (level === 'LEVEL_C') {
        let buf = "table:" + columnJson.table + " column name:" + columnJson.column_name + " column type:" + columnJson.column_type + " column length:" + columnJson.column_length + "not exist.";
        console.error(buf);
        throw {error_msg: buf};
    }
}

async function dealDBinfo(db, db_info, oper) {
    let resJson = {};

    if (oper === 'INS') {
        let sql = 'SELECT DB_NAME FROM ' + hdrcfg.cfg.table_name.T_ETL_ASSIGN_DB_INFO + ' WHERE DB_NAME = ?';
        let params = [db_info.db_name];

        let rs = await dbObj.preSql(db, sql, params);

        if (CK.nonEmptyArray(rs)) {
            return resJson;
        }

        let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_ASSIGN_DB_INFO + ' (DB_NAME, DB_TYPE, DB_IP, DB_PORT, DB_USER, DB_PASSWORD, DB_ID, DB_CONNECT_MODE, DB_CONNECT_STRING, ENCRYPT_PASSWORD) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        let connectStr = db_info.db_ip + ':' + db_info.db_port + '/' + db_info.db_id;
        let crypt_passwd = tdes(db_info.db_password);
        let paramsIns = [db_info.db_name, db_info.db_type, db_info.db_ip, db_info.db_port, db_info.db_user, crypt_passwd, db_info.db_id, 'RAW', connectStr, 'yes'];

        await dbObj.preSql(db, sqlIns, paramsIns);

        return resJson;
    } else if (oper === 'QRY') {
        let sqlQ = 'select DB_TYPE, DB_IP, DB_PORT, DB_ID, DB_USER, DB_PASSWORD, ENCRYPT_PASSWORD from ' + hdrcfg.cfg.table_name.T_ETL_ASSIGN_DB_INFO + ' where DB_NAME = ?';
        let paramQ = [db_info.db_name];

        let rsQ = await dbObj.preSql(db, sqlQ, paramQ);

        if (CK.nonEmptyArray(rsQ)) {
            resJson.db_name = db_info.db_name;
            resJson.db_type = rsQ[0].DB_TYPE;
            resJson.db_ip = rsQ[0].DB_IP;
            resJson.db_port = rsQ[0].DB_PORT;
            resJson.db_id = rsQ[0].DB_ID;
            resJson.db_user = rsQ[0].DB_USER;

            if (rsQ[0].ENCRYPT_PASSWORD === 'yes'){
                resJson.db_password = detdes(rsQ[0].DB_PASSWORD);
            } else {
                resJson.db_password = rsQ[0].DB_PASSWORD;
            }
        }
        return resJson;
    }
}

async function getGroupDBinfo(db, group) {
    let sql = 'select a.ID db_name, b.PARAM_VALUE db_type FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' a, ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' b ' + ' WHERE a.ID = b.COMP_ID and a.TYPE = ? and a.GROUP_ID = ? and b.PARAM_TYPE = ? and b.PARAM_NAME = ?';
    let params = [hdrcfg.cfg.component_type1.DATABASE, group, 'NORMAL', 'db_type'];

    return await dbObj.preSql(db, sql, params);
}

module.exports = {
    getConnStr: getConnStr,
    checkMd5: checkMd5,
    getDipId: getDipId,
    dealNormalParam: dealNormalParam,
    dealExternalParam: dealExternalParam,
    delectExternalParam: delectExternalParam,
    insertWebCache: insertWebCache,
    get_nls_lang: get_nls_lang,
    openAsignDB: openAsignDB,
    setAutoCommit: setAutoCommit,
    processResult: processResult,
    processResult_noMD5: processResult_noMD5,
    exe_shell: exe_shell,
    isEmptyObj: isEmptyObj,
    getStatus: getStatus,
    tdes: tdes,
    detdes: detdes,
    judge_dbType: judge_dbType,
    get_db_type: get_db_type,
    query_db_version: query_db_version,
    check_sqlserver_envir: check_sqlserver_envir,
    check_rollback_table: check_rollback_table,
    create_rollback_table: create_rollback_table,
    db_extended_table: db_extended_table,
    get_sqltext: get_sqltext,
    getTableSqltext: getTableSqltext,
    getUserSqltext: getUserSqltext,
    getColumnSqltext: getColumnSqltext,
    getDipMysqlConn: getDipMysqlConn,
    getEtlRules: getEtlRules,
    getRuleIndex: getRuleIndex,
    dealRuleTable: dealRuleTable,
    get_sql_expression: get_sql_expression,
    check_code_num: check_code_num,
    check_etl_column: check_etl_column,
    dealDBinfo: dealDBinfo,
    getGroupDBinfo: getGroupDBinfo
};