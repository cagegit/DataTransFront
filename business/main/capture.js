/**
 * Created by on 2016/12/13.
 */
const hdrcom = require('../common');
const hdrcfg = require('../../config');

// var md5 = require('md5');
// var Q = require("q");
// let async = require('async');
let moment = require('moment');
let setenv = require('setenv');
const CK =require('check-types');

async function openAsignDB(db, db_id, type) {
    let ret_db = false;
    let dbIp = "", dbPort = "", dbId = "", dbUser = "", dbPassword = "", encrypt_password = "";
    let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ?';
    let params = [db_id];
    let rs =await hdrcom.db.preSql(db, sql, params).catch(err => {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(buf);
        console.error(err);
        ret_db = false;
    });
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
        // if (encrypt_password === 'yes'){
        //     dbPassword = hdrcom.pub.detdes(dbPassword);
        // }
        //打开数据库连接
        let constr = hdrcom.pub.getConnStr(type, dbIp, dbPort, dbId, dbUser, dbPassword);
        if (!constr) {
            let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
            console.error(buf);
            ret_db = false;
        }
        if ('oracle' === type) {
            process.env.NLS_LANG = 'AMERICAN_AMERICA.AL32UTF8';
        }
        ret_db = await hdrcom.db.openStrDB(constr).catch(err=>{
            console.error(err);
            ret_db = false;
        });
    } else {
        //数据库信息不存在
        let buf = hdrcfg.code.ENOENT + ':database info ' + hdrcfg.msg[hdrcfg.code.ENOENT];
        console.error(buf);
        ret_db = false;
    }
    return ret_db;
}

async function get_db_type(db, db_id) {
    let sql = 'select PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
    let params = [db_id, 'db_type'];
    let result = false;
    let rs =await hdrcom.db.preSql(db, sql, params).catch(err => {
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(err);
        result = false;
    });
    if (CK.nonEmptyArray(rs)) {
        result = rs[0].PARAM_VALUE;
    } else {
        //数据库信息不存在
        let buf = hdrcfg.code.ENOENT + ':database info ' + hdrcfg.msg[hdrcfg.code.ENOENT];
        console.error(buf);
        result = false;
    }
    return result;
}

async function query_db_version(db) {
    let sql = "select serverproperty('engineedition') as serverproperty";
    let params = [];
    let result = false;
    let rs =await hdrcom.db.preSql(db, sql, params).catch(err=>{
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(err);
        result = false;
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

    let rsV =await hdrcom.db.preSql(db, sqlV, paramsV).catch(err=>{
        let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
        console.error(err);
        result = false;
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
/*
 * ##############以下为调用capture相关方法######################
 */
//save_parameter
function save_parameter(body, res) {
    let db;
    let insertParam =async function () {//insert T_COMP_PARAM
        console.info("to deal T_COMP_PARAM.");
        let component_id = body.request.component_id;
        let group_id = body.request.group;
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        let realCapId = "";

        if (!component_id || component_id === 'undefined') { //capture_id is not exist, to create
            console.info("capture_id is not exist, to create.");
            realCapId = await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, hdrcfg.cfg.component_type.CAPTURE);
            if (!realCapId) {
                let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
                let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
                console.error(buf);
                throw msg;
            }
            console.info("get id success:" + realCapId);
            //遍历body，循环插入T_COMP_PARAM表
            for (let x in body.request.parameter) {
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                let params = [realCapId, x, body.request.parameter[x], 'NORMAL', 'YES', time];

                await hdrcom.db.preSql(db, sql, params);
            }
            component_id = realCapId;
        } else {//修改， T_COMP_PARAMS
            console.info("capture id is exist, to update.");
            //遍历body，循环更新T_COMP_PARAM表
            for (let x in body.request.parameter) {
                let sql = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                let params = [body.request.parameter[x], time, component_id, x];

                await hdrcom.db.preSql(db, sql, params);
            }
        }
        let rejson = {};
        rejson.component_id = component_id;
        return rejson;
    };
    let doJob=async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[capture/save_parameter], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result=await insertParam();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("end save_parameter database.\n");
            return result;
        }catch(err){
            db && await hdrcom.db.dbRollback(db).catch(err=>{
                console.error(err);
            });
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}
//add_capture
function add_capture(body, res) {
    let db;
    let get_db2_version =async function() {
        if (body.request.type !== 'db2') {
            return '';
        }
        let sql = 'SELECT PARAM_NAME nm, PARAM_VALUE val ' + 'FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ?';
        let data = await hdrcom.db.preSql(db, sql, [body.request.db_component_id]);
        let dbIp = '';
        let dbPort = '';
        let dbId = '';
        let dbUser = '';
        let dbPassword = '';

        data.forEach(function (e) {
            if ('db_ip' === e.nm) {
                dbIp = e.val;
            } else if ('db_port' === e.nm) {
                dbPort = e.val;
            } else if ('db_id' === e.nm) {
                dbId = e.val;
            } else if ('db_user' === e.nm) {
                dbUser = e.val;
            } else if ('db_password' === e.nm) {
                dbPassword = e.val;
            }
        });

        let db2, ver='';
        let constr = hdrcom.pub.getConnStr('db2', dbIp, dbPort, dbId, dbUser, dbPassword);
        if (!constr) {
            // cb({code: hdrcfg.code.EDBTYPE});
            return ver;
        }
        try{
            db2 = await hdrcom.db.openStrDB(constr);
            sql = 'SELECT substr(service_level, 6) vers FROM sysibmadm.ENV_INST_INFO ';
            let res1 = await hdrcom.db.executeStrSql(db2, sql, []);
            if(CK.nonEmptyArray(res1)){
                ver = res1[0].VERS.substr(0, 3);
            }
        }catch (err){
            db2 && hdrcom.db.closeDBSync(db2);
        }
        return ver;
    };
    let insert_capture =async function (ver) {//insert T_COMP_INFO， T_COMP_PARAM
        console.info("to deal T_COMP_INFO， T_COMP_PARAM");
        let capture_id = body.request.component_id;
        let group_id = body.request.group_id;
        let capture_name = body.request.component_name;
        let capture_type = body.request.type;
        let concurrent = body.request.parameter.concurrent;
        let snapshot_tables = body.request.snapshot_tables;
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        let readCapId = "";

        let type = "";
        let program = '';
        if (capture_type === 'oracle' && concurrent === 'no') {
            type = hdrcfg.cfg.capture.ORACLE.type;
            program = hdrcfg.cfg.capture.ORACLE.program;
        } else if (capture_type === 'oracle' && concurrent === 'yes') {
            type = hdrcfg.cfg.capture.ORACLE_RAC.type;
            program = hdrcfg.cfg.capture.ORACLE_RAC.program;
        } else if (capture_type === 'sqlserver') {
            type = hdrcfg.cfg.capture.SQLSERVER.type;
            program = hdrcfg.cfg.capture.SQLSERVER.program;
        } else if (capture_type === 'mysql') {
            type = hdrcfg.cfg.capture.MYSQL.type;
            program = hdrcfg.cfg.capture.MYSQL.program;
        } else if (capture_type === 'db2') {
            if (null === ver || '9.7' === ver) {
                type = hdrcfg.cfg.capture.DB297.type;
                program = hdrcfg.cfg.capture.DB297.program;
            } else if ('9.5' === ver) {
                type = hdrcfg.cfg.capture.DB295.type;
                program = hdrcfg.cfg.capture.DB295.program;
            }
        }

        if (!capture_id || capture_id === 'undefined') {//capture id is not exist, to create
            console.info("capture id is not exist, to create.");
            readCapId =await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, hdrcfg.cfg.component_type.CAPTURE);
            if (!readCapId) {
                let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
                let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
                console.error(buf);
                throw msg;
            }
            console.info("get id success:" + readCapId);

            //插入T_COMP_INFO表
            let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_INFO + '(ID, NAME, TYPE, PROGRAM, GROUP_ID, CREATE_TIME) values (?, ?, ?, ?, ?, ?)';
            let params = [readCapId, capture_name, type, program, group_id, time];
            await hdrcom.db.preSql(db, sql, params);
            capture_id = readCapId;
        } else {//修改T_COMP_INFO， T_COMP_PARAMS
            console.info("capture id is exist, to update.");
            let sql = 'update ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' set NAME = ?, TYPE = ?, PROGRAM = ? where ID = ? and GROUP_ID = ?';
            let params = [capture_name, type, program, capture_id, group_id];

            await hdrcom.db.preSql(db, sql, params);
        }

        //snapshot_tables
        if (snapshot_tables && snapshot_tables.schema.length > 0 && capture_type === 'sqlserver') {
            //删除T_COMP_PARAM中的信息，然后再插入。
            let objId =await hdrcom.pub.dealExternalParam(db, capture_id, hdrcfg.cfg.object_set_type.SNAPSHOT_TABLES, hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET, time);
            if (!objId) {
                console.error("to insert T_COMP_DB_OBJECT_SET.");
                let buf = hdrcfg.code.EEXTERNALPARAM + ':' + hdrcfg.msg[hdrcfg.code.EEXTERNALPARAM];
                throw {error_code: hdrcfg.code.EEXTERNALPARAM, error_msg: buf};
                // throw msg;
            }
            console.info("to isnert T_COMP_DB_OBJECT_SET.");
            for (let i = 0; i < snapshot_tables.schema.length; i++) {
                let schema = snapshot_tables.schema[i].name;
                let table = snapshot_tables.schema[i].table;

                if (CK.nonEmptyArray(table)) {
                    for (let x = 0; x < table.length; x++) {
                        let sqlObj = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + '(SET_ID, SCHEMA_NAME, OBJECT_NAME) values (?, ?, ?)';
                        let paramsObj = [objId, schema, table[x]];

                        await hdrcom.db.preSql(db, sqlObj, paramsObj);
                    }
                } else {
                    let sqlObj = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + '(SET_ID, `SCHEMA_NAME`) values (?, ?)';
                    let paramsObj = [objId, schema];

                    await hdrcom.db.preSql(db, sqlObj, paramsObj);
                }
            }
        } else {
            let isTrue=await hdrcom.pub.delectExternalParam(db, capture_id, hdrcfg.cfg.object_set_type.SNAPSHOT_TABLES);
            if (!isTrue) {
                let buf = hdrcfg.code.EOPERTABLE + ':' + hdrcfg.msg[hdrcfg.code.EOPERTABLE];
                throw {error_code: hdrcfg.code.EOPERTABLE, error_msg: buf};
                // throw msg;
            }
        }

        if (capture_type === 'sqlserver') {
            let snapshot_tables = JSON.stringify(body.request.snapshot_tables);
            let isTrue=await hdrcom.pub.insertWebCache(db, capture_id, snapshot_tables);
            if (!isTrue) {
                let buf = hdrcfg.code.EOPERTABLE + ':' + hdrcfg.msg[hdrcfg.code.EOPERTABLE];
                throw {error_code: hdrcfg.code.EOPERTABLE, error_msg: buf};
                // throw msg;
            }
        }

        //遍历selected_users，插入T_COMP_PARAM表
        let selected_users = body.request.selected_users;

        if (CK.nonEmptyArray(selected_users)) {
            //删除T_COMP_PARAM中的信息，然后再插入。
            let objId =await hdrcom.pub.dealExternalParam(db, capture_id, hdrcfg.cfg.object_set_type.SELECTED_USERS, hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET, time);
            if (!objId) {
                console.error("to insert T_COMP_DB_OBJECT_SET.");
                let buf = hdrcfg.code.EEXTERNALPARAM + ':' + hdrcfg.msg[hdrcfg.code.EEXTERNALPARAM];
                throw {error_code: hdrcfg.code.EEXTERNALPARAM, error_msg: buf};
                // throw msg;
            }
            console.info("to isnert T_COMP_DB_OBJECT_SET.");
            for (let i = 0; i < selected_users.length; i++) {
                let sqlObj = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + '(SET_ID, `SCHEMA_NAME`) values (?, ?)';
                let paramsObj = [objId, selected_users[i]];

                await hdrcom.db.preSql(db, sqlObj, paramsObj);
            }
        } else {
            let isTrue=await hdrcom.pub.delectExternalParam(db, capture_id, hdrcfg.cfg.object_set_type.SELECTED_USERS);
            if (!isTrue) {
                let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                throw {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                // throw msg;
            }
        }

        if (capture_type === 'oracle') {
            //遍历rac_info，插入T_COMP_PARAM表
            let rac_info = body.request.rac_info.instance;

            if (CK.nonEmptyArray(rac_info)) {
                //删除T_COMP_PARAM中的信息，然后再插入。
                let objId =await hdrcom.pub.dealExternalParam(db, capture_id, hdrcfg.cfg.object_set_type.RAC_INFO, hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO, time);
                if (!objId) {
                    console.error("to insert T_COMP_DB_OBJECT_SET.");
                    let buf = hdrcfg.code.EEXTERNALPARAM + ':' + hdrcfg.msg[hdrcfg.code.EEXTERNALPARAM];
                    throw {error_code: hdrcfg.code.EEXTERNALPARAM, error_msg: buf};
                    // throw msg;
                }
                console.info("to insert T_COMP_DB_OBJECT_SET.");
                for (let i = 0; i < rac_info.length; i++) {
                    let sqlObj = 'insert into ' + hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO + '(SET_ID, THREAD, NAME, IP, PORT, ENABLE) values (?, ?, ?, ?, ?, ?)';
                    let paramsObj = [objId, rac_info[i].thread, rac_info[i].name, rac_info[i].ip, rac_info[i].port, rac_info[i].enable];

                    await hdrcom.db.preSql(db, sqlObj, paramsObj);
                }
            } else {
                let isTrue=await hdrcom.pub.delectExternalParam(db, capture_id, hdrcfg.cfg.object_set_type.RAC_INFO);
                if (!isTrue) {
                    let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
                    throw {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
                    // throw msg;
                }
            }
        }
        return capture_id;
    };
    let insertParam =async function (capture_id) {//insert T_COMP_PARAM
        console.info("to insert T_COMP_PARAM.");
        let captureId = capture_id;
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        let capture_type = body.request.type;

        //遍历body，循环插入T_COMP_PARAM表
        //body.request.parameter["full_column_update"] = "no";
        // body.request.parameter["checkpoint_interval"] = "2h";
        // body.request.parameter["snapshot_interval"] = "10h";
        //body.request.parameter["exclude_sql_text"] = "";
        if (capture_type === 'oracle') {
            body.request.parameter["instances"] = body.request.rac_info.instance.length;
        }
        let isTrue=await hdrcom.pub.dealNormalParam(db, captureId, body.request.parameter, time);
        if (!isTrue) {
            let buf = hdrcfg.code.EOPERTABLE + ':' + hdrcfg.msg[hdrcfg.code.EOPERTABLE];
            throw {error_code: hdrcfg.code.EOPERTABLE, error_msg: buf};
            // throw msg;
        }

        if (capture_type === 'oracle') {
            if (body.request.downstream_info) {
                body.request.downstream_info["db_connect_mode"] = "RAW";
                body.request.downstream_info["encrypt_password"] = "yes";
                body.request.downstream_info["db_connect_string"] = body.request.downstream_info.db_ip + ':' + body.request.downstream_info.db_port + '/' + body.request.downstream_info.db_id;
                // let crypt_passwd = hdrcom.pub.tdes(body.request.downstream_info.db_password);
                // body.request.downstream_info["db_password"] = hdrcom.pub.tdes(body.request.downstream_info.db_password);
                body.request.downstream_info["db_password"] = body.request.downstream_info.db_password;
                let isTrue=await hdrcom.pub.dealNormalParam(db, captureId, body.request.downstream_info, time);
                if (!isTrue) {
                    let buf = hdrcfg.code.EOPERTABLE + ':' + hdrcfg.msg[hdrcfg.code.EOPERTABLE];
                    throw {error_code: hdrcfg.code.EOPERTABLE, error_msg: buf};
                    // throw msg;
                }
            } else {
                let sql = "SELECT COMP_ID FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " WHERE COMP_ID = ? " +
                    "AND PARAM_NAME in ('db_connect_mode', 'encrypt_password', 'db_connect_string', 'db_password', 'db_ip', 'db_port', 'db_user', 'db_id') AND PARAM_TYPE = ?";
                let params = [captureId, 'NORMAL'];

                let rs =await hdrcom.db.preSql(db, sql, params);
                if (CK.nonEmptyArray(rs)) {
                    let sql1 = "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " WHERE COMP_ID = ? " +
                        "AND PARAM_NAME in ('db_connect_mode', 'encrypt_password', 'db_connect_string', 'db_password', 'db_ip', 'db_port', 'db_user', 'db_id') AND PARAM_TYPE = ?";
                    let params1 = [captureId, 'NORMAL'];

                    await hdrcom.db.preSql(db, sql1, params1);
                }
            }
        }
        let rejson = {};
        rejson.component_id = captureId;
        return rejson;
    };
    let doJob=async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[capture/add_capture], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let version=await get_db2_version();
            let cpId=await insert_capture(version);
            let result=await insertParam(cpId);
            await hdrcom.db.dbCommit(db);
            console.info("add_capture success!");
            hdrcom.pub.processResult(res, result, true, body);
            return result;
        }catch(err){
            db && await hdrcom.db.dbRollback(db).catch(err=>{
                console.error(err);
            });
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

function query_capture_config(body, res) {
    let db;
    let db_odbc;
    let cap_id = body.request.component_id;
    let cap_name = body.request.component_name;
    let db_id = body.request.db_component_id;
    let type = body.request.type;
    //var downsteam = body.request.downstream;
    if (!hdrcom.pub.judge_dbType(type)) {
        let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
        let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
        console.error(buf);
        hdrcom.pub.processResult(res, msg, false, body);
        return;
    }
    let connectDb = async function () {
        db = await hdrcom.db.openDb();//mysql 数据库
        if (type === 'oracle') {
            for (let x = 0; x < 1; x++) {
                (function (x) {
                    setenv.set('NLS_LANG', 'AMERICAN_AMERICA.AL32UTF8');
                })(x);
            }
        }
        db_odbc = await openAsignDB(db, db_id, type);
        if (!db_odbc) {
            let buf = hdrcfg.code.EDBOPEN + ':' + hdrcfg.msg[hdrcfg.code.EDBOPEN];
            throw {error_code: hdrcfg.code.EDBOPEN, error_msg: buf};
        }
    };
    let getUsers=async function () {
        let sqlUser = hdrcom.pub.getUserSqltext(type);
        if (sqlUser === '1') {
            let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
            let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
            console.error(buf);
            throw msg;
        }
        let paramsUser = [];
        let rsUser =await hdrcom.db.executeStrSql(db_odbc, sqlUser, paramsUser);
        let users = [];
        for (let x = 0; x < rsUser.length; x++) {
            users.push(rsUser[x].USERNAME);
        }
        return  {user: users};
    };
    let getSelectedUsers=async function () {
        if (cap_name) {
            //获取数据库参数
            let sql = 'SELECT c.SCHEMA_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID';
            let params = [cap_id, hdrcfg.cfg.object_set_type.SELECTED_USERS, 'EXTERNAL'];
            let rs =await hdrcom.db.preSql(db, sql, params);
            let selected_users = [];
            if(CK.nonEmptyArray(rs)){
                for (let x = 0; x < rs.length; x++) {
                    selected_users.push(rs[x].SCHEMA_NAME);
                }
            }
            return {user:selected_users};
        } else {
            return {user:[]};
        }
    };
    let getParams=async function () {
        let rsJson = {};
        if (cap_name && cap_name!== 'undefined') {
            let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_TYPE = ?';
            let params = [cap_id, 'NORMAL'];
            let rs =await hdrcom.db.preSql(db, sql, params);
            if(CK.nonEmptyArray(rs)){
                for (let x = 0; x < rs.length; x++) {
                    rsJson[rs[x].PARAM_NAME] = rs[x].PARAM_VALUE;
                }
            }
        } else {
            rsJson["capture_interval"] = '15';
            if (type === 'oracle') {
                rsJson["full_column_update"] = 'no';
                rsJson["transaction_slot_size"] = '32K';
                rsJson["max_transaction_slot"] = '1000';
                let nls =await hdrcom.pub.get_nls_lang(db_odbc);
                rsJson["downstream"] = 'no';
                rsJson["nls_lang"] = '';
                if (nls && nls.nls_lang) {
                    rsJson["nls_lang"] = nls.nls_lang;
                }
                rsJson["capture_heartbeat"] = '300';
                rsJson["logminer_restart_time"] = '300';
                rsJson["scn_evaluate_time"] = '20';
                rsJson["back_scn"] = '10';
                //rsJson["dup_high_scn"] = '200';
                //rsJson["internal_queue_size"] = '32M';
                //rsJson["h_send_sort_scn"] = 'no';
                rsJson["lob_skip"] = 'no';
            } else if (type === 'sqlserver') {
                rsJson["checkpoint_interval"] = '2h';
                rsJson["snapshot_interval"] = '10h';
                rsJson["sync_when_extend_log"] = 'no';
                rsJson["fetch_delay_reconnect"] = '20s';
                rsJson["extend_log_when_create"] = 'yes';
                rsJson["cap_loader_data"] = 'no';
            }
        }
        return rsJson;
    };
    let getRac=async function () {
        let result={instance: []};
        if (type === 'oracle') {
            let sql = 'select count(*) as num from gv$instance';
            let params = [];
            let rs =await hdrcom.db.executeStrSql(db_odbc, sql, params);
            if (CK.nonEmptyArray(rs) && parseInt(rs[0].NUM) > 1) {
                if (cap_id) {
                    let sql = 'SELECT c.THREAD as thread, c.NAME as name, c.IP as ip, c.PORT as port, c.ENABLE as enable, c.PATH as path FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID';
                    let params = [cap_id, hdrcfg.cfg.object_set_type.RAC_INFO, 'EXTERNAL'];
                    let rs1 =await  hdrcom.db.executeStrSql(db, sql, params);
                    if (CK.nonEmptyArray(rs1)){
                        result.instance = rs1;
                    }
                } else {
                    let sql = 'select INSTANCE_NAME, HOST_NAME, THREAD# as TD  from gv$instance';
                    let params = [];
                    let rs1 =await hdrcom.db.executeStrSql(db_odbc, sql, params);
                    let arry = [];
                    if(CK.nonEmptyArray(rs1)){
                        for (let x = 0; x < rs1.length; x++) {
                            let json = {};
                            json["name"] = rs1[x].INSTANCE_NAME;
                            json["host_name"] = rs1[x].HOST_NAME;
                            json["thread"] = rs1[x].TD;
                            arry.push(json);
                        }
                    }
                    result.instance = arry;
                }
            }
        }
        return result;
    };
    let getDownstreamInfo=async function () {
        let ret='';
        if (cap_name && type === 'oracle') {
            let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_TYPE = ?';
            let params = [cap_id, 'NORMAL'];
            let rs =await hdrcom.db.preSql(db, sql, params);
            if (CK.nonEmptyArray(rs)) {
                let resJson = {};
                for (let x = 0; x < rs.length; x++) {
                    if ('db_type' === rs[x].PARAM_NAME) {
                        resJson["db_type"] = rs[x].PARAM_VALUE;
                    } else if ('db_ip' === rs[x].PARAM_NAME) {
                        resJson["db_ip"] = rs[x].PARAM_VALUE;
                    } else if ('db_port' === rs[x].PARAM_NAME) {
                        resJson["db_port"] = rs[x].PARAM_VALUE;
                    } else if ('db_user' === rs[x].PARAM_NAME) {
                        resJson["db_user"] = rs[x].PARAM_VALUE;
                    } else if ('db_password' === rs[x].PARAM_NAME) {
                        // resJson["db_password"] = hdrcom.pub.detdes(rs[x].PARAM_VALUE);
                        resJson["db_password"] = rs[x].PARAM_VALUE;
                    } else if ('db_id' === rs[x].PARAM_NAME) {
                        resJson["db_id"] = rs[x].PARAM_VALUE;
                    }
                }
                if (CK.nonEmptyObject(resJson)){
                    ret = resJson;
                }
            }
        }
        return ret;
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            await connectDb();
            // console.info("[capture/query_capture_config], conn db ok.");
            // let users=await getUsers();
            // let sUsers=await getSelectedUsers();
            // let params=await getParams();
            // let racs=await getRac();
            // let downStreamInfo=await getDownstreamInfo();
            let [users,sUsers,params,racs,downStreamInfo]=await Promise.all([getUsers(), getSelectedUsers(),getParams(),getRac(),getDownstreamInfo()]);
            let resJson = {};
            resJson["all_users"] = users;
            resJson["selected_users"] = sUsers;
            resJson["parameter"] = params;
            resJson["rac_info"] = racs;
            resJson["downstream_info"] = downStreamInfo;
            hdrcom.pub.processResult(res, resJson, true, body);
            // console.info("query_capture_config success!");
            return resJson;
        }catch(err){
            hdrcom.pub.processResult(res, err, false, body);
            console.error(err);
            return err;
        }finally {
            if (type === 'oracle') {
                for (let x = 0; x < 1; x++) {
                    (function (x) {
                        setenv.set('NLS_LANG', ' ');
                    })(x);
                }
            }
            db && hdrcom.db.closeDB(db);
            db_odbc && hdrcom.db.closeStrDB(db_odbc).catch(err=>{
                console.error('query_capture_config err:close odbc db err!');
                console.error(err);
            });
        }
    };
    return doJob();
}
function query_extended_log_table(body, res) {
    let db_id = body.request.db_name;
    let user = body.request.user;

    if (!db_id || db_id === 'undefined') {
        let buf = hdrcfg.code.ENULL + ':db_id ' + hdrcfg.msg[hdrcfg.code.ENULL];
        let msg = {error_code: hdrcfg.code.ENULL, error_msg: buf};
        console.error(buf);
        hdrcom.pub.processResult(res, msg, false, body);
        return;
    }
    let db,db_odbc;
    let query_extended_tables=async function () {
        let ret =await get_db_type(db, db_id);
        if (!ret) {
            let buf = hdrcfg.code.EGETDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EGETDBTYPE];
            let msg = {error_code: hdrcfg.code.EGETDBTYPE, error_msg: buf};
            console.error(buf);
            throw msg;
        }

        db_odbc =await openAsignDB(db, db_id, ret);
        if (!db_odbc) {
            let buf = hdrcfg.code.EDBOPEN + ':' + hdrcfg.msg[hdrcfg.code.EDBOPEN];
            throw {error_code: hdrcfg.code.EDBOPEN, error_msg: buf};
            // throw msg;
        }

        let retV =await query_db_version(db_odbc);
        if (!retV) {
            let buf = hdrcfg.code.EDBVERSION + ':' + hdrcfg.msg[hdrcfg.code.EDBVERSION];
            let msg = {error_code: hdrcfg.code.EDBVERSION, error_msg: buf};
            console.error(buf);
            throw msg;
        } else {
            if (retV === '3') {
                let buf = hdrcfg.code.ENSUPPORT + ':engineedition ' + hdrcfg.msg[hdrcfg.code.ENSUPPORT];
                let msg = {error_code: hdrcfg.code.ENSUPPORT, error_msg: buf};
                console.error(buf);
                throw msg;
            }
        }

        let ArrayJson = [];
        for (let x = 0; x < user.length; x++) {

            let resJson = {};
            resJson["user"] = user[x];
            resJson["table"] = [];

            let retSql1 = hdrcom.pub.db_extended_table(ret, retV, 'TABLE_LIST');
            if (!retSql1) {
                // callback(null, {});
                return {};
            }

            let retSql2 = hdrcom.pub.db_extended_table(ret, retV, 'TABLE_COUNT');
            if (!retSql2) {
                // callback(null, {});
                return {};
            }

            let retSql3 = hdrcom.pub.db_extended_table(ret, retV, 'TABLE_EXTEND_COUNT');
            if (!retSql3) {
                // callback(null, {});
                return {};
            }

            let params = [user[x]];

            let rs1 =await hdrcom.db.preSql(db_odbc, retSql1, params);
            if (CK.nonEmptyArray(rs1)) {
                for (let y = 0; y < rs1.length; y++) {
                    resJson.table.push(rs1[y].name);
                }
            }

            let rs2 =await hdrcom.db.preSql(db_odbc, retSql2, params);
            if(CK.nonEmptyArray(rs2)){
                resJson["sum_num"] = rs2[0].a;
            }

            let rs3 =await hdrcom.db.preSql(db_odbc, retSql3, params);
            if(CK.nonEmptyArray(rs3)){
                resJson["extend_num"] = rs3[0].a;
            }
            ArrayJson.push(resJson);
        }
        console.info("query_extended_tables ok.");
        return ArrayJson;
    };
    async function doJob() {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();//mysql 数据库
            let result=await query_extended_tables();
            let resJson = {};
            resJson["extend_table"] = result;
            hdrcom.pub.processResult(res, resJson, true, body);
            return  resJson;
        }catch (err){
            hdrcom.pub.processResult(res, err, false, body);
            console.error(err);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
            db_odbc && hdrcom.db.closeStrDB(db_odbc).catch(err=>{
                console.error('query_capture_config err:close odbc db err!');
                console.error(err);
            });
        }
    }
    return doJob();
}
function change_extended_log(body, res) {
    let db_id = body.request.db_name;
    let user = body.request.extend_table.user;
    let table = body.request.extend_table.table;
    let status = body.request.extend_table.status;

    if (!db_id || db_id === 'undefined') {
        let buf = hdrcfg.code.ENULL + ':db_id ' + hdrcfg.msg[hdrcfg.code.ENULL];
        let msg = {error_code: hdrcfg.code.ENULL, error_msg: buf};
        console.error(buf);
        hdrcom.pub.processResult(res, msg, false, body);
        return;
    }
    let db, db_odbc;
    let change_extended_tables =async function () {
        let ret =await get_db_type(db, db_id);
        if (!ret) {
            let buf = hdrcfg.code.EGETDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EGETDBTYPE];
            let msg = {error_code: hdrcfg.code.EGETDBTYPE, error_msg: buf};
            console.error(buf);
            throw msg;
        }
        db_odbc =await openAsignDB(db, db_id, ret);
        if (!db_odbc) {
            let buf = hdrcfg.code.EDBOPEN + ':' + hdrcfg.msg[hdrcfg.code.EDBOPEN];
            throw {error_code: hdrcfg.code.EDBOPEN, error_msg: buf};
            // throw msg;
        }
        let sql = "";
        if (status === 'add') {
            sql = "exec r7_extended_logging " + user + ", [" + table + "]";
        } else {
            sql = "exec r7_extended_logging " + user + ", [" + table + "], 0";
        }
        let params = [];

        await hdrcom.db.executeStrSql(db_odbc, sql, params);
        // callback(null);
        console.info("change_extended_tables ok.");
        return true;
    };
    async function doJob() {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();//mysql 数据库
            await change_extended_tables();
            hdrcom.pub.processResult(res, "SUCCESS", true, body);
            return  "SUCCESS";
        }catch (err){
            hdrcom.pub.processResult(res, err, false, body);
            console.error(err);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
            db_odbc && hdrcom.db.closeStrDB(db_odbc).catch(err=>{
                console.error('query_capture_config err:close odbc db err!');
                console.error(err);
            });
        }
    }
    return doJob();
}
function query_capture_table(body, res) {
    let db_id = body.request.db_component_name;
    let capture_id = body.request.component_name;
    let user = body.request.selected_users.user;

    let db,db_odbc;
    let query_sqlserver_unrepl_tables=async function () {
        db_odbc =await openAsignDB(db, db_id, 'sqlserver');
        if (!db_odbc) {
            let buf = hdrcfg.code.EDBOPEN + ':' + hdrcfg.msg[hdrcfg.code.EDBOPEN];
            throw {error_code: hdrcfg.code.EDBOPEN, error_msg: buf};
            // throw msg;
        }
        let arrayJson = [];
        if (CK.nonEmptyArray(user)) {
            for (let x = 0; x < user.length; x++) {
                let resJson = {};
                resJson["name"] = user[x];
                resJson["table"] = [];

                let sql = 'select name from sys.tables WHERE is_replicated = 0 and SCHEMA_NAME(schema_id) = ?';
                let params = [user[x]];

                let rs1 =await hdrcom.db.executeStrSql(db_odbc, sql, params);
                if (rs1 && rs1.length > 0) {
                    for (let y = 0; y < rs1.length; y++) {
                        resJson.table.push(rs1[y].name);
                    }
                }
                arrayJson.push(resJson);
            }
        }
        console.info("query_sqlserver_unrepl_tables ok.");
        return arrayJson;
    };
    let query_sqlserver_unrepl_tables_cfg=async function () {
        let sql = 'SELECT CACHE FROM ' + hdrcfg.cfg.table_name.T_WEB_CACHE + ' WHERE COMP_ID = ?';
        let params = [capture_id];
        let rs =await hdrcom.db.preSql(db, sql, params);
        console.info("query_sqlserver_unrepl_tables_cfg ok.");
        if (CK.nonEmptyArray(rs)){
            return JSON.parse(rs[0].CACHE);
        }else{
            return '';
        }
    };
    async function doJob() {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();//mysql 数据库
            let [allUnrepl,snapshotTabs]=await Promise.all([query_sqlserver_unrepl_tables(),query_sqlserver_unrepl_tables_cfg()]);
            let resJson = {};
            resJson["all_unrepl"] = allUnrepl;
            resJson["snapshot_tables"] = snapshotTabs;
            hdrcom.pub.processResult(res, resJson, true, body);
            return  resJson;
        }catch (err){
            hdrcom.pub.processResult(res, err, false, body);
            console.error(err);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
            db_odbc && hdrcom.db.closeStrDB(db_odbc).catch(err=>{
                console.error('query_capture_config err:close odbc db err!');
                console.error(err);
            });
        }
    }
    return doJob();
}
//导出对象
module.exports = {
    save_parameter: save_parameter,
    add_capture: add_capture,
    query_capture_config: query_capture_config,
    query_extended_log_table: query_extended_log_table,
    change_extended_log: change_extended_log,
    query_capture_table: query_capture_table
};