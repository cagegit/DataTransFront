/**
 * Created by on 2016/12/13.
 */
let hdrcom = require('../common');
let hdrcfg = require('../../config');

const moment = require('moment');
const setenv = require('setenv');
const CK =require('check-types');
//var mysqlCn = hdrcfg.cfg.mysql_connstr.connstr;
// let mysqlCn = hdrcom.pub.getDipMysqlConn();
/*
 * ##############以下为调用apply相关方法######################
 */
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

//add_apply_property
function add_apply_property(body, res) {
    let db;
    let insertProperty =async function () {//insert T_COMP_PARAM
        console.info("insertProperty to deal T_COMP_PARAM.");
        let component_id = body.request.component_id;
        let group_id = body.request.group_id;
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        let realCompId = "";
        if (!component_id || component_id === 'undefined') {
            console.info("apply_id is not exist, to create.");
            realCompId =await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, hdrcfg.cfg.component_type.APPLY);
            if (!realCompId) {
                let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
                let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
                console.error(buf);
                throw msg;
            }
            console.info("get id success:" + realCompId);
            //遍历body，循环插入T_COMP_PARAM表
            for (let x in body.request.parameter) {
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                let params = [realCompId, x, body.request.parameter[x], 'NORMAL', 'YES', time];
                await hdrcom.db.preSql(db, sql, params);
            }
            component_id=realCompId;
        } else {//修改， T_COMP_PARAMS
            console.info("apply id is exist, to update.");
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
            console.info("[add_apply_property], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result=await insertProperty();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("add_apply_property success");
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
//add_loader_config
function add_apply_config(body, res) {
    let group_id = body.request.group_id;
    let apply_id = body.request.component_id;
    let realApplyID = "";
    let type = body.request.type;
    let time = moment().format('YYYY-MM-DD HH:mm:ss');
    let db;
    let insert_apply =async function () {
        console.info("to deal T_COMP_INFO, T_COMP_PARAM");
        if (!apply_id || apply_id === 'undefined') {
            console.info("apply id is not exist, to create.");
            let nameType = "";
            if ('transfer' === type){
                nameType = hdrcfg.cfg.component_type.TRANSFER;
            }else if ('etl' === type){
                nameType = hdrcfg.cfg.component_type.ETL;
            }else if ('qsend' === type){
                nameType = hdrcfg.cfg.component_type.QSEND;
            }else if ('qrecv' === type){
                nameType = hdrcfg.cfg.component_type.QRECV;
            }else if ('mqpublisher' === type){
                nameType = hdrcfg.cfg.component_type.MQPUBLISHER;
            }else{
                nameType = hdrcfg.cfg.component_type.APPLY;
            }
            realApplyID =await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, nameType);
            if (!realApplyID) {
                let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
                let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
                console.error(buf);
                throw msg;
            }
            console.info("get id success:" + realApplyID);
            //插入T_COMP_INFO表
            let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_INFO + '(ID, NAME, TYPE, PROGRAM, GROUP_ID, CREATE_TIME) values (?, ?, ?, ?, ?, ?)';
            let comType = '';
            let program = '';
            if (type === 'oracle') {
                comType = 'ORA_LOADER';
                program = 'dip_oraloader';
            } else if (type === 'sqlserver') {
                comType = 'MSS_LOADER';
                program = 'dip_mssloader';
            } else if (type === 'mysql') {
                comType = 'MYSQL_LOADER';
                program = 'dip_mysqlloader';
            } else if (type === 'db2') {
                comType = 'DB2_LOADER';
                program = 'dip_db2loader';
            } else if (type === 'transfer') {
                comType = 'TCLIENT';
                program = 'dip_tclient';
            } else if (type === 'etl') {
                comType = 'ETLSERVER';
                program = 'dip_etlserver';
            } else if (type === 'qsend') {
                comType = 'FTP';
                if ('qsend' === body.request.qtran.type) {
                    program = 'dip_q_send';
                } else {
                    program = 'dip_q_recv';
                }
            } else if (type === 'mqpublisher') {
                comType = 'MQ_PUBLISHER';
                program = 'dip_publisher';
            }

            let params = [realApplyID, '', comType, program, group_id, time];
            await hdrcom.db.preSql(db, sql, params);
            // 插入filter表
            if (body.request.filters) {
                let sqlFilter = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_WEB_CACHE + '(COMP_ID, CACHE) values (?, ?)';
                let selected_objs1 = JSON.stringify(body.request.filters);
                let paramsFilter = [realApplyID, selected_objs1];
                await hdrcom.db.preSql(db, sqlFilter, paramsFilter);
            }
            apply_id = realApplyID;
        } else {
            console.info("apply is exist, to update.");
            let sql = 'update ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' set NAME = ? where ID = ? and GROUP_ID = ?';
            let params = ['', apply_id, group_id];

            await hdrcom.db.preSql(db, sql, params);
            if (body.request.filters) {
                let selected_objs1 = JSON.stringify(body.request.filters);
                let isTrue=await hdrcom.pub.insertWebCache(db, apply_id, selected_objs1);
                if (!isTrue) {
                    let buf = hdrcfg.code.EOPERTABLE + ':' + hdrcfg.msg[hdrcfg.code.EOPERTABLE];
                    throw {error_code: hdrcfg.code.EOPERTABLE, error_msg: buf};
                }
            }
        }

        //遍历selected_objs，插入T_COMP_PARAM表
        if (body.request.filters) {
            let selected_objs = body.request.filters;
            if (selected_objs) {
                let filter = selected_objs.filter;
                if (CK.nonEmptyArray(filter)) {
                    for (let x = 0; x < filter.length; x++) {
                        let filterType = filter[x].filter_type;
                        let schema = filter[x].schema;
                        //删除T_COMP_PARAM中的信息，然后再插入。
                        let objId =await hdrcom.pub.dealExternalParam(db, apply_id, filterType, hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET, time);
                        if (!objId) {
                            let buf = hdrcfg.code.EEXTERNALPARAM + ':' + hdrcfg.msg[hdrcfg.code.EEXTERNALPARAM];
                            let msg = {error_code: hdrcfg.code.EEXTERNALPARAM, error_msg: buf};
                            console.error("to insert T_COMP_DB_OBJECT_SET.");
                            throw msg;
                        }

                        if (CK.nonEmptyArray(schema)) {


                            for (let y = 0; y < schema.length; y++) {
                                let name = schema[y].name;
                                let map_name = "";
                                if (schema[y].mapping_name)
                                    map_name = schema[y].mapping_name;

                                let objType = schema[y].object_type;
                                for (let z = 0; z < objType.length; z++) {
                                    let objName = objType[z].name;
                                    let objs = objType[z].object;
                                    if (CK.nonEmptyArray(objs)) {
                                        for (let i = 0; i < objs.length; i++) {
                                            let n1 = "";
                                            let map_n1 = "";
                                            n1 = objs[i].name;
                                            if (objs[i].mapping_name){
                                                map_n1 = objs[i].mapping_name;
                                            }
                                            //插入T_DB_OBJECT_SET表
                                            console.info("objs insert T_COMP_DB_OBJECT_SET...");
                                            let sqlObj = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + '(SET_ID, SCHEMA_NAME, MAP_SCHEMA_NAME, OBJECT_TYPE, OBJECT_NAME, MAP_OBJECT) values (?, ?, ?, ? ,?, ?)';
                                            let paramsObj = [objId, name, map_name, objName, n1, map_n1];

                                            await hdrcom.db.preSql(db, sqlObj, paramsObj);//出错直接向外抛出异常
                                        }
                                    } else {
                                        console.info("insert T_COMP_DB_OBJECT_SET...");
                                        let sqlObj = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + '(SET_ID, SCHEMA_NAME, MAP_SCHEMA_NAME, OBJECT_TYPE) values (?, ?, ?, ?)';
                                        let paramsObj = [objId, name, map_name, objName];

                                        await hdrcom.db.preSql(db, sqlObj, paramsObj);//出错直接向外抛出异常
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return apply_id;
        // callback(null, apply_id);
    };
    let insertParam =async function (apply_id) {//insert T_COMP_PARAM
        console.info("to insert T_COMP_PARAM.");
        let applyId = apply_id;
        let db_component_id = body.request.db_component_id;
        let time = moment().format('YYYY-MM-DD HH:mm:ss');
        //遍历body，循环插入T_COMP_PARAM表
        let paramSet = "";
        if ('transfer' === type){
            paramSet = body.request.transfer;
        }else if ('qsend' === type || 'qrecv' === type){
            paramSet = body.request.qtran;
        }else if ('etl' === type) {
            body.request.etl_config.db_name = db_component_id;
            paramSet = body.request.etl_config;
        } else if ('mqpublisher' === type) {
            body.request.parameter["log4j.rootLogger"] = "ALL, D";
            body.request.parameter["log4j.appender.D"] = "org.apache.log4j.DailyRollingFileAppender";
            body.request.parameter["log4j.appender.D.File"] = process.env['DIP_HOME'] + '/log/' + group_id + '/' + applyId + "_publisher.log";
            body.request.parameter["log4j.appender.D.Append"] = "true";
            body.request.parameter["log4j.appender.D.Threshold"] = "DEBUG";
            body.request.parameter["log4j.appender.D.layout"] = "org.apache.log4j.PatternLayout";
            body.request.parameter["log4j.appender.D.layout.ConversionPattern"] = "%-d{yyyy-MM-dd HH:mm:ss}[%p]%F:%L %m%n";
        } else {
            if ('oracle' === type) {
                //body.request.parameter["ddl_report_error"] = "no";
                body.request.parameter["clob_bind_size"] = "0";
                body.request.parameter["db_timeout"] = "0";
                //body.request.parameter["db_is_utf8"] = "no";
                //body.request.parameter["error_auto"] = "no";
                body.request.parameter["source_metadata_charset"] = "";//kong
                //body.request.parameter["user_handle_name"] = "no";//kong
                body.request.parameter["skip_large_char"] = "no";//kong
                body.request.parameter["use_merge_sql"] = 'no';
            }
            paramSet = body.request.parameter;
        }

        for (let x in paramSet) {
            let sql = 'SELECT COMP_ID FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ? AND PARAM_NAME = ? AND PARAM_TYPE = ?';
            let params = "";
            if (x === 'passward' || x === 'passwd'){
                params = [applyId, 'passwd', 'NORMAL'];
            } else{
                params = [applyId, x, 'NORMAL'];
            }
            let rs =await hdrcom.db.preSql(db, sql, params);
            if (CK.nonEmptyArray(rs)) {
                let sqlU = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                let paramsU = "";
                if (x === 'passward' || x === 'passwd') {
                    // let crypt_passwd = hdrcom.pub.tdes(paramSet[x]);
                    let crypt_passwd = paramSet[x];
                    paramsU = [crypt_passwd, time, applyId, 'passwd'];
                } else if (x === 'encrypt') {
                    if (paramSet[x] === 'yes'){
                        paramsU = ['SM4', time, applyId, x];
                    } else{
                        paramsU = ['AES', time, applyId, x];
                    }
                } else{
                    paramsU = [paramSet[x], time, applyId, x];
                }
                await hdrcom.db.preSql(db, sqlU, paramsU);
            } else {
                console.info("this apply`s params are not exist, to insert.");
                let sqlI = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                let paramsI = "";
                if (x === 'passward' || x === 'passwd') {
                    // let crypt_passwd = hdrcom.pub.tdes(paramSet[x]);
                    let crypt_passwd = paramSet[x];
                    paramsI = [applyId, 'passwd', crypt_passwd, 'NORMAL', 'YES', time];
                } else if (x === 'encrypt') {
                    if (paramSet[x] === 'yes'){
                        paramsI = [applyId, x, 'SM4', 'NORMAL', 'YES', time];
                    } else{
                        paramsI = [applyId, x, 'AES', 'NORMAL', 'YES', time];
                    }
                } else{
                    paramsI = [applyId, x, paramSet[x], 'NORMAL', 'YES', time];
                }
                await hdrcom.db.preSql(db, sqlI, paramsI);
            }
        }
        let rejson = {};
        rejson.component_id = applyId;
        return rejson;
    };
    let doJob=async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[add_apply_config], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let applyId=await insert_apply();
            let rejson=await insertParam(applyId);
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, rejson, true, body);
            console.info("end add_apply_config success");
            return rejson;
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

function query_apply_config(body, res) {
    //查询loader
    let query_loader_config =async function (body, res) {
        let db;
        let db_ora;
        let load_id = body.request.component_id;
        let load_name = body.request.component_name;
        let db_id = body.request.db_component_id;
        let db_type = body.request.db_type;
        let capture_id = body.request.capture_id;
        let connectDb= async function () {
            db =await hdrcom.db.openDb();//mysql 数据库
            // if (db_type === 'oracle') {
            //     for (let x = 0; x < 1; x++) {
            //         (function (x) {
            //             setenv.set('NLS_LANG', 'AMERICAN_AMERICA.AL32UTF8');
            //         })(x);
            //     }
            // }
            if (!capture_id || !load_name) {

            }
            db_ora =await openAsignDB(db, db_id, db_type);
            if (!db_ora) {
                let buf = hdrcfg.code.EDBOPEN + ':' + hdrcfg.msg[hdrcfg.code.EDBOPEN];
                throw {error_code: hdrcfg.code.EDBOPEN, error_msg: buf};
            }
        };
        let getObjects = async function () {
            let selected_objs = [];
            let object_type = [{"name": "INDEX"}, {"name": "TABLE"}, {"name": "VIEW"}, {"name": "SEQUENCE"}, {"name": "PROCEDURE"}, {"name": "FUNCTION"}, {"name": "PACKAGE"}, {"name": "PACKAGE_BODY"}, {"name": "TRIGGER"}, {"name": "TYPE"}, {"name": "TYPE_BODY"}];
            if (capture_id) {
                //获取数据库参数
                let sql = 'SELECT c.SCHEMA_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID';
                let params = [capture_id, hdrcfg.cfg.object_set_type.SELECTED_USERS, 'EXTERNAL'];
                let rs =await hdrcom.db.preSql(db, sql, params);
                if(CK.nonEmptyArray(rs)){
                    for (let x = 0; x < rs.length; x++) {
                        let resJson = {};
                        resJson.name = rs[x].SCHEMA_NAME;
                        resJson.object_type = object_type;
                        selected_objs.push(resJson);
                    }
                }
                return {user: selected_objs};
                // callback(null, {"user": selected_objs});
            } else {
                let sqlUser = hdrcom.pub.getUserSqltext(db_type);
                if (sqlUser === '1') {
                    let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
                    let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
                    console.error(buf);
                    throw msg;
                }
                let paramsUser = [];
                let rsUser =await hdrcom.db.executeStrSql(db_ora, sqlUser, paramsUser);
                if(CK.nonEmptyArray(rsUser)){
                    for (let x = 0; x < rsUser.length; x++) {
                        let resJson = {};
                        resJson.name = rsUser[x].USERNAME;
                        resJson.object_type = object_type;
                        selected_objs.push(resJson);
                    }
                }
                // callback(null, {"user": selected_objs});
                console.info("query_apply_config, get getObjects ok.");
                console.info("getUsers ok.");
                return {user: selected_objs};
            }
        };
        let getParams= async function () {
            let rsJson = {};
            if (load_name) {
                let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_TYPE = ?';
                let params = [load_id, 'NORMAL'];

                let rs =await hdrcom.db.preSql(db, sql, params);
                if(CK.nonEmptyArray(rs)){
                    for (let x = 0; x < rs.length; x++) {
                        rsJson[rs[x].PARAM_NAME] = rs[x].PARAM_VALUE;
                    }
                }
            } else {
                rsJson["tag_skip"] = 'no';
                rsJson["error_auto"] = 'yes';
                //rsJson["user_handle_name"] = 'skip_recode';
                //rsJson["skip_record"] = 'yes';
                rsJson["exclude_table"] = 'no';
                rsJson["unknown_error"] = 'skip';
                rsJson["execute_one"] = 'no';
                rsJson["check_old_image"] = 'yes';
                rsJson["ddl_skip"] = 'no';
                rsJson["batch_commit"] = 'yes';
                rsJson["set_tag"] = 'no';
                //rsJson["not_change_skip"] = 'yes';
                if (db_type === 'oracle') {
                    rsJson["lob_skip"] = 'no';
                    rsJson["source_nclob_charset"] = 'AL16UTF16';
                    let nls =await hdrcom.pub.get_nls_lang(db_ora);
                    if(nls){
                        rsJson["source_metadata_charset"] = nls.nls_lang;
                        rsJson["source_nchar_charset"] = nls.nchar_charset;
                        rsJson["dip_nls_lang"] = nls.nls_lang;
                        rsJson["dip_nchar_charset"] = nls.nls_characterset;
                        rsJson["source_clob_charset"] = nls.source_clob_charset;
                    }
                    rsJson["idle_connect_seconds"] = '300';
                } else {
                    //rsJson["idle_connect_seconds"] = '';
                    //rsJson["source_nchar_charset"] = '';
                    //rsJson["dip_nls_lang"] = "";
                    //rsJson["dip_nchar_charset"] = '';
                    //rsJson["source_clob_charset"] = 'AL16UTF16';
                }
                console.info("query_apply_config, getparam ok.");
            }
            return rsJson;
        };
        let getFilter= async function () {
            let result='';
            if (load_name) {
                let sql = 'SELECT CACHE FROM ' + hdrcfg.cfg.table_name.T_WEB_CACHE + ' WHERE COMP_ID = ?';
                let params = [load_id];

                let rs =await hdrcom.db.preSql(db, sql, params);
                if (CK.nonEmptyArray(rs)){
                    result=JSON.parse(rs[0].CACHE);
                }
            }
            console.info("query_apply_config, getFilter ok.\n");
            return result;
        };
        let doJob = async function () {
            try{
                await hdrcom.pub.checkMd5(body);
                await connectDb();
                let [objects,parameter,filters]=await Promise.all([getObjects(),getParams(),getFilter()]);
                let resJson = {};
                resJson.objects=objects;
                resJson.parameter=parameter;
                resJson.filters=filters;
                hdrcom.pub.processResult(res, resJson, true, body);
                return resJson;
            }catch (err){
                hdrcom.pub.processResult(res, err, false, body);
                console.error(err);
                return err;
            }finally {
                db && hdrcom.db.closeDB(db);
                db_ora && hdrcom.db.closeStrDB(db_ora).catch(err=>{
                    console.error('query_loader_config err:close odbc db err!');
                    console.error(err);
                });
                // if (!capture_id || !load_name) {
                //     if ('oracle' === db_type) {
                //         for (let x = 0; x < 1; x++) {
                //             (function (x) {
                //                 setenv.set('NLS_LANG', 'AMERICAN_AMERICA.AL32UTF8');
                //             })(x);
                //         }
                //     }
                // }
            }
        };
        return doJob();
    };
    //查询loader
    let query_mqpublisher_config = function (body, res) {
        let db;
        let apply_id = body.request.component_id;
        let apply_name = body.request.component_name;

        let getParams=async function () {
            let rsJson = {};
            if (apply_name) {
                let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_TYPE = ?';
                let params = [apply_id, 'NORMAL'];
                let rs =await hdrcom.db.preSql(db, sql, params);
                if (CK.nonEmptyArray(rs)) {
                    for (let x = 0; x < rs.length; x++) {
                        rsJson[rs[x].PARAM_NAME] = rs[x].PARAM_VALUE;
                    }
                }
            }
            console.info("query_apply_config, getparam ok.");
            return rsJson;
        };
        let doJob =async function () {
              try{
                  await hdrcom.pub.checkMd5(body);
                  db =await hdrcom.db.openDb();//mysql 数据库
                  let params=await getParams();
                  let resJson = {};
                  resJson.objects = {};
                  resJson.filters = {};
                  resJson.parameter = params;
                  hdrcom.pub.processResult(res, resJson, true, body);
                  return resJson;
              }catch (err){
                  hdrcom.pub.processResult(res, err, false, body);
                  return err;
              } finally {
                  db && hdrcom.db.closeDB(db);
              }
        };
        return doJob();
    };

    let query_ftp_config =async function (body, res) {
        let db;
        let getParams=async function () {
            let sql = 'SELECT PARAM_NAME, PARAM_VALUE ' +
                ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM +
                ' where COMP_ID = ? and PARAM_TYPE = ?';
            let val = [body.request.component_id, 'NORMAL'];

            let data = await hdrcom.db.preSql(db, sql, val);
            let ret = {};
            if(CK.nonEmptyArray(data)){
                for (let i = 0; i < data.length; i++) {
                    ret[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
                }
            }
            return ret;
        };
        let doJob =async function () {
            try{
                await hdrcom.pub.checkMd5(body);
                db =await hdrcom.db.openDb();
                let result=await getParams();
                console.debug('Call query_ftp_config success');
                hdrcom.pub.processResult(res, result, true, body);
                return true;
            }catch (err){
                console.error(err);
                console.error('Call query_ftp_config fail');
                hdrcom.pub.processResult(res, err, false, body);
                return err;
            } finally {
                db && hdrcom.db.closeDB(db);
            }
        };
        return doJob();
    };

    let type = body.request.type;
    if ('mqpublisher' === type) {
        return query_mqpublisher_config(body, res);
    } else if ('qsend' === type || 'qrecv' === type) {
        return query_ftp_config(body, res);
    } else {
        //查询loader config
       return query_loader_config(body, res);
    }
}
/**
 * @param body
 * @param res
 */
function query_apply_sourcedb_object(body, res) {
    let db;
    let db_ora;
    let group = body.request.group_id;
    let db_id = body.request.db_component_id;
    let objectType = body.request.object_type;
    let owner = body.request.owner;
    let type = body.request.type;

    let getObjects=async function () {
        if (!hdrcom.pub.judge_dbType(type)) {
            let buf = hdrcfg.code.EDBTYPE + ':' + hdrcfg.msg[hdrcfg.code.EDBTYPE];
            let msg = {error_code: hdrcfg.code.EDBTYPE, error_msg: buf};
            console.error(buf);
            throw msg;
        }

        db_ora =await openAsignDB(db, db_id, type);
        if (!db_ora) {
            let buf = hdrcfg.code.EDBOPEN + ':' + hdrcfg.msg[hdrcfg.code.EDBOPEN];
            throw {error_code: hdrcfg.code.EDBOPEN, error_msg: buf};
        }

        let rsArray = [];
        if (type === 'oracle' || type === 'mqapply') {
            // for (let x = 0; x < 1; x++) {
            //     (function (x) {
            //         setenv.set('NLS_LANG', 'AMERICAN_AMERICA.AL32UTF8');
            //     })(x);
            // }
            //获取数据库参数
            let sql = "select object_name from dba_objects where owner not in ('SYS','SYSTEM','MGMT_VIEW','DBSNMP','SYSMAN','SDE','OUTLN','MDSYS','WMSYS','FLOWS_FILES','ORDDATA','CTXSYS','ANONYMOUS','SI_INFORMTN_SCHEMA','ORDSYS','EXFSYS','APPQOSSYS','XDB','ORDPLUGINS','OWBSYS','OLAPSYS','XS$NULL','APEX_PUBLIC_USER','SPATIAL_CSW_ADMIN_USR','SPATIAL_WFS_ADMIN_USR') and object_type=? and owner=? order by object_name";
            let params = [objectType, owner];
            let rs =await hdrcom.db.executeStrSql(db_ora, sql, params);
            if(CK.nonEmptyArray(rs)){
                for (let i = 0; i < rs.length; i++) {
                    rsArray.push(rs[i].OBJECT_NAME);
                }
            }
        } else {
            let sqltext = hdrcom.pub.get_sqltext(type, objectType);
            if (sqltext !== '1') {
                let params = [owner];
                let rs =await hdrcom.db.executeStrSql(db_ora, sqltext, params);
                if(CK.nonEmptyArray(rs)){
                    for (let i = 0; i < rs.length; i++) {
                        if (type === 'db2'){
                            rsArray.push(rs[i].NAME);
                        } else{
                            rsArray.push(rs[i].name);
                        }
                    }
                }
            }
        }
        // callback(null, {"object": rsArray});
        console.info("query_apply_sourcedb_object, get getObjects ok.");
        return {object:rsArray};
    };

    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            let result=await getObjects();
            let resJson = {};
            resJson.objects = result;
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
        }catch (err){
            console.error(err);
            console.error('query_apply_sourcedb_object fail');
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            // if (type === 'oracle' || type === 'mqapply') {
            //     for (let x = 0; x < 1; x++) {
            //         (function (x) {
            //             setenv.set('NLS_LANG', ' ');
            //         })(x);
            //     }
            // }
            db && hdrcom.db.closeDB(db);
            db_ora && hdrcom.db.closeStrDB(db_ora).catch(err=>{
                console.error('query_apply_sourcedb_object err:close odbc db err!');
                console.error(err);
            });
        }
    };
    return doJob();
}
/*
* 查询排除表
* */
function query_apply_exclude_table(body, res) {
    let db;

    let getExcludeTable=async function () {
        /* get total page*/
        let result = {total: 0, list: []};
        let sql = 'SELECT COUNT(1) cnt' + ' FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_EXCLUDE_TAB;
        let page = await hdrcom.db.preSql(db, sql, []);
        if (CK.nonEmptyArray(page)) {
            if (0 === (page[0].cnt % hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER)){
                result.total = parseInt(page[0].cnt / hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);
            }else{
                result.total = parseInt(page[0].cnt / hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER) + 1;
            }
        }
        sql = 'SELECT SCHEMA_NAME `owner`, TABLE_NAME `table`, ERR_MESSAGE reason, EXCLUDE_TIME `time` ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_EXCLUDE_TAB +
            ' WHERE GROUP_ID = ? AND COMP_ID = ? ' +
            ' ORDER BY EXCLUDE_TIME ' +
            ' LIMIT ?, ?';
        let val = [body.request.group_id, body.request.component_id, hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER*(body.request.page_num - 1), hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER];
        let rows = await hdrcom.db.preSql(db, sql, val);
        if(CK.nonEmptyArray(rows)) {
            result.list = rows;
        }
        return result;
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result= await getExcludeTable();
            console.info('Query exclude table success');
            hdrcom.pub.processResult(res, result, true, body);
        }catch (err){
            console.error(err);
            console.error('Query exclude table fail');
            hdrcom.pub.processResult(res,err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}
/*
 * 删除排除表
 * */
function delete_exclude_table(body, res) {
    let db;
    let deleteExTables=async function () {
        let sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_LDR_ERR_EXCLUDE_TAB} WHERE GROUP_ID = ? AND COMP_ID = ? AND SCHEMA_NAME= ? AND TABLE_NAME = ?`;
        let val = [];
        let data =body.request;
        let result=false;
        data.object.forEach(function (e) {
            val.push([data.group_id, data.component_id, e.owner, e.table]);
        });
        if(val.length>0){
            let pms = Array.from(val, function (item) {
                return hdrcom.db.preSql(db, sql, item);
            });
            await Promise.all(pms);
            result=true;
        }
        return result;
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[apply/delete_exclude_table], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result=await deleteExTables();
            if(result){
                await hdrcom.db.dbCommit(db);
                hdrcom.pub.processResult(res, "SUCCESS", true);
            }else{
                hdrcom.pub.processResult(res, {error_msg: 'delete exclude table fail!'}, false);
            }
            return result;
        }catch (err){
            console.error(err);
            console.error('delete exclude table fail');
            db && await hdrcom.db.dbRollback(db).catch(err1=>{
                console.error(err1);
            });
            hdrcom.pub.processResult(res,err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//导出对象
module.exports = {
    query_apply_config: query_apply_config,
    add_apply_property: add_apply_property,
    add_apply_config: add_apply_config,
    query_apply_sourcedb_object: query_apply_sourcedb_object,
    query_apply_exclude_table: query_apply_exclude_table,
    delete_exclude_table: delete_exclude_table
};