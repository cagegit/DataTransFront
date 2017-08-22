/**
 * Created by on 2016/12/13.
 */
let hdrcom = require('../common');
let hdrcfg = require('../../config');
let moment = require('moment');
const CK =require('check-types');
//let mysqlCn = hdrcfg.cfg.mysql_connstr.connstr;
// let mysqlCn = hdrcom.pub.getDipMysqlConn();

/*
 * ##############以下为调用transfer相关方法######################
 */
/**
 * @param body
 * @param res
 */
//查询query_qrecv_config
function query_qrecv_config(body, res) {
    let db;
    let queTsInfo = async function () {
        let grp_id = body.request.group_id;
        let ts_id = body.request.component_id;
        let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ?';
        let params = [ts_id];
        let resJson;
        let data = await hdrcom.db.preSql(db, sql, params).catch(err => {
            let buf = err.state + ':' + err.message;
            let msg = {error_code: hdrcfg.code.EDBERROR, error_msg: buf};
            console.error(buf);
            throw msg;
        });
        if (CK.nonEmptyArray(data)) {
            resJson = {};
            let passwd = "";
            let de_passwd = '';
            for (let i = 0; i < data.length; i++) {
                if (data[i].PARAM_NAME === 'passwd'){
                    de_passwd = data[i].PARAM_VALUE;
                    // let de_passwd = hdrcom.pub.detdes(passwd); //解密
                    resJson[data[i].PARAM_NAME] = de_passwd;
                }else if (data[i].PARAM_NAME === 'encrypt'){
                    if (data[i].PARAM_VALUE === 'SM4') {
                        resJson[data[i].PARAM_NAME] = 'yes';
                    } else {
                        resJson[data[i].PARAM_NAME] = 'no';
                    }
                }else{
                    resJson[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
                }
            }
            resJson["passwd"] = de_passwd;
        }
        return resJson;
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            let result =await queTsInfo();
            hdrcom.pub.processResult(res, result, true, body);
            return result;
        }catch (err){
            console.error(err);
            console.error('[query_qrecv_config] fail');
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}
//query_tserver_config
function query_tserver_config(body, res) {
    let db;
    let queTsConfig = async function () {
        let sql = 'SELECT PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM + ' WHERE ' +
            'SERVICE_ID = (SELECT ID FROM '+ hdrcfg.cfg.table_name.T_SERVICE_INFO + ' WHERE TYPE = ?)';
        let params = [hdrcfg.cfg.service_type.TSERVER];
        let resJson;
        let data = await hdrcom.db.preSql(db, sql, params).catch(err => {
            let buf = err.state + ':' + err.message;
            let msg = {error_code: hdrcfg.code.EDBERROR, error_msg: buf};
            console.error(buf);
            console.error(err);
            throw msg;
        });
        if (CK.nonEmptyArray(data)) {
            let rJson = {};
            for (let i = 0; i < data.length; i++) {
                // if (data[i].PARAM_NAME === 'passwd'){
                //     // resJson[data[i].PARAM_NAME] = hdrcom.pub.detdes(data[i].PARAM_VALUE);
                //     // resJson[data[i].PARAM_NAME] = passwd1;
                //     rJson[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
                // }else{
                //     rJson[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
                // }
                rJson[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
            }
            resJson = {"server_config":{"user":rJson}};
        }
        return resJson;
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            let result =await queTsConfig();
            hdrcom.pub.processResult(res, result, true, body);
            return result;
        }catch (err){
            console.error(err);
            console.error('[query_tserver_config] fail');
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//add_tserver_config
function add_tserver_config(body, res) {
    let db;
    let getId = async function () {
        //获取tserverid
        let sqlid = 'SELECT ID FROM ' + hdrcfg.cfg.table_name.T_SERVICE_INFO + ' WHERE TYPE = ?';
        let paramsid = [hdrcfg.cfg.service_type.TSERVER];
        let ret = '';
        let rsid = await hdrcom.db.preSql(db, sqlid, paramsid).catch(err => {
            let buf = hdrcfg.code.ENOENT + ':' + 'tserver id ' + hdrcfg.msg[hdrcfg.code.ENOENT];
            let msg = {error_code: hdrcfg.code.ENOENT, error_msg: buf};
            console.error(err);
            throw msg;
        });
        if (CK.nonEmptyArray(rsid)){
            ret = rsid[0].ID;
        }
        return ret;
    };
    let insertParams = async function (tsid) {
        let insertTS = async function (request ,db, time) {
            //遍历body，循环插入T_COMP_PARAM表
            for (let x in request.server_config.user) {
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM + '(SERVICE_ID, PARAM_NAME, PARAM_VALUE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?)';

                let params = "";
                if (x === 'passwd'){
                    // let crypt_passwd = hdrcom.pub.tdes(request.server_config.user[x]);
                    let crypt_passwd = request.server_config.user[x];
                    params = [tsid, x, crypt_passwd, 'YES', time];
                }else if ( x === 'pri'){
                    params = [tsid, 'all_que', request.server_config.user.pri.all_que, 'YES', time];
                }else {
                    params = [tsid, x, request.server_config.user[x], 'YES', time];
                }
                await hdrcom.db.preSql(db, sql, params);
            }
            return true;
        };

        let sql = 'delete from ' + hdrcfg.cfg.table_name.T_SERVICE_PARAM + ' where service_id = ?';
        let params = [tsid];
        await hdrcom.db.preSql(db, sql, params);
        let time = moment().format('YYYY-MM-DD HH:mm:ss');

        //遍历body，循环插入T_COMP_PARAM表
        let isTrue = await insertTS(body.request ,db, time);
        if (!isTrue){
            console.error("insert database info error");
            let buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            let msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            console.error(msg);
            throw msg;
        }
        return "SUCCESS";
    };

    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[add_tserver_config], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let tsid = await getId();
            let result = await insertParams(tsid);
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("[add_tserver_config] success.");
            return result;
        }catch (err){
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=>{
                console.error(err);
            });
            console.error('[add_tserver_config] fail');
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//导出对象
module.exports = {
    query_qrecv_config: query_qrecv_config,
    query_tserver_config: query_tserver_config,
    add_tserver_config: add_tserver_config
};