/**
 * Created by on 2016/12/13.
 */
let hdrcom = require('../common');
let hdrcfg = require('../../config');
// let md5 = require('md5');
// let async = require('async');
//var mysqlCn = hdrcfg.cfg.mysql_connstr.connstr;
// let mysqlCn = hdrcom.pub.getDipMysqlConn();
const CK = require('check-types');
const Promise = require('bluebird');

//增加project --async this is test
function add_project(body, res) {
    let db;
    let checkProjectInfo=async function () {
        console.info("To judge whether project_name is exist...");
        let name = body.request.name;
        let sql = 'select id from ' + hdrcfg.cfg.table_name.T_PROJECT_INFO + ' where name = ?';
        let params = [name];
        let result=false;
        let rs =await hdrcom.db.preSql(db, sql, params);
        if (rs && rs.length > 0) {
            let buf = hdrcfg.code.EEXIST + ':' + 'the project [' + name + '] ' + hdrcfg.msg[hdrcfg.code.EEXIST];
            let msg = {error_code: hdrcfg.code.EEXIST, error_msg: buf};
            console.error(buf);
            throw msg;
        } else {
            let sql1 = 'select count(id) as num from ' + hdrcfg.cfg.table_name.T_PROJECT_INFO;
            let rs1 =await hdrcom.db.preSql(db, sql1, []);
            let total = (CK.nonEmptyArray(rs1) && parseInt(rs1[0].num) > 0) ? parseInt(rs1[0].num ) : 0;
            if (total >= parseInt(hdrcfg.cfg.macro.MAX_PROJECT)) {
                let buf = hdrcfg.code.EEXCEED + ':' + 'the project number is ' + hdrcfg.msg[hdrcfg.code.EEXCEED];
                let msg = {error_code: hdrcfg.code.EEXCEED, error_msg: buf};
                console.error(buf);
                throw msg;
            }else{
                result=true;
            }
        }
        return result;
    };
    let addProject =async function () {
        let name = body.request.name;
        let createtime = body.request.create_time;
        let desc = body.request.desc;

        let projectId =await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.PROJECT);
        if (!projectId) {
            let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
            let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
            console.error(buf);
            throw msg;
        }

        console.info("get project_id:" + projectId);
        let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_PROJECT_INFO + '(id, name, create_time, remark) values (?, ?, ?, ?)';
        let paramsIns = [projectId, name, createtime, desc];

        await hdrcom.db.preSql(db, sqlIns, paramsIns);
        console.info("insert project ok");
        let resJson = {};
        resJson.project_id = projectId;
        return resJson;
    };
    let doJob=async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[add_project], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            await checkProjectInfo();
            let resJson=await addProject();
            await hdrcom.db.dbCommit(db);
            console.info("end add_project database.\n");
            hdrcom.pub.processResult(res, resJson, true, body);
            return resJson;
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
//查询project
function query_project(body, res) {
    let db;
    let queProject =async function () {
        let sql = "select id, name, DATE_FORMAT(create_time, '%Y-%m-%d') AS create_time, remark as `desc` from " + hdrcfg.cfg.table_name.T_PROJECT_INFO;
        let params = [];
        let resArr = [];
        let data =await hdrcom.db.preSql(db, sql, params);
        if(data && data.length>0){
            resArr = data;
        }
        return resArr;
    };
    async function doJob() {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();//mysql 数据库
            let result=await queProject();
            hdrcom.pub.processResult(res, result, true, body);
            return  result;
        }catch (err){
            hdrcom.pub.processResult(res, err, false, body);
            console.error(err);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}
//删除project
function delete_project(body, res) {
    let db;
    //获取project_id;
    let proj_id = body.request.id;
    let groups = [];

    let getAllGroups =async function () {
        let sql = 'SELECT ID FROM ' + hdrcfg.cfg.table_name.T_GROUP_INFO + ' WHERE PROJECT_ID = ?';
        let params = [proj_id];
        groups =await hdrcom.db.preSql(db, sql, params);
        // groups = rs;
        console.info("delete_project, get all groups ok");
        return groups;
    };

    let checkGroupState =async function (groupArry0) {
        if (CK.nonEmptyArray(groupArry0)) {
            let arr = Array.from(groupArry0,item =>{
               return hdrcom.pub.getStatus(item.ID);
            });
            let status = await Promise.all(arr);
            status.forEach(item =>{
                let buf = hdrcfg.code.EBUSY + ':group is ' + hdrcfg.msg[hdrcfg.code.EBUSY];
                let msg = {error_code: hdrcfg.code.EBUSY, error_msg: buf};
                console.error(buf);
                if(item === 'yes'){
                   throw msg;
                }
            })
        }
    };

    let deleComp =async function () {//删除comp相关表
        for (let x = 0; x < groups.length; x++) {
            let sqlArray = [
                "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + " WHERE SET_ID IN" +
                "(SELECT c.ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_COMP_PARAM + " b, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " c " +
                "WHERE a.GROUP_ID = ? AND a.ID = b.COMP_ID AND b.PARAM_TYPE = 'EXTERNAL' AND b.PARAM_VALUE = c.ID)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO + " WHERE SET_ID IN" +
                "(SELECT c.ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_COMP_PARAM + " b, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " c " +
                "WHERE a.GROUP_ID = ? AND a.ID = b.COMP_ID AND b.PARAM_TYPE = 'EXTERNAL' AND b.PARAM_VALUE = c.ID)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " WHERE ID IN" +
                "(SELECT b.PARAM_VALUE FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_COMP_PARAM + " b " +
                "WHERE a.GROUP_ID = ? AND a.ID = b.COMP_ID AND b.PARAM_TYPE = 'EXTERNAL')",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " WHERE COMP_ID IN" +
                "(SELECT ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO +
                " WHERE GROUP_ID = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_WEB_CACHE + " WHERE COMP_ID IN" +
                "(SELECT ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO +
                " WHERE GROUP_ID = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " WHERE GROUP_ID = ?"
            ];

            let params = [groups[x].ID];
            let arr=Array.from(sqlArray,item=>{
               return  hdrcom.db.preSql(db, item, params);
            });
            await Promise.all(arr);
        }
        console.info("delete_project, deleComp ok");
    };

    let deleGroup =async function () {//删除group相关表
        if (groups.length > 0) {
            let sqlArray = [
                /*
                "DELETE FROM " + hdrcfg.cfg.table_name.T_GRP_SEQ + " WHERE CONCAT('group_',ID) IN " +
                "(SELECT a.ID FROM " + hdrcfg.cfg.table_name.T_GROUP_INFO + " a, " + hdrcfg.cfg.table_name.T_PROJECT_INFO + " b WHERE a.PROJECT_ID = b.ID AND b.id = ?)",
*/
                "DELETE FROM " + hdrcfg.cfg.table_name.T_GROUP_PARAM + " WHERE GROUP_ID IN " +
                "(SELECT a.ID FROM " + hdrcfg.cfg.table_name.T_GROUP_INFO + " a, " + hdrcfg.cfg.table_name.T_PROJECT_INFO + " b WHERE a.PROJECT_ID = b.ID AND b.id = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_RELATION + " WHERE GROUP_ID IN " +
                "(SELECT a.ID FROM " + hdrcfg.cfg.table_name.T_GROUP_INFO + " a, " + hdrcfg.cfg.table_name.T_PROJECT_INFO + " b WHERE a.PROJECT_ID = b.ID AND b.id = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_BPOINT + " WHERE QUEUE_ID IN" +
                "(SELECT a.id FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_GROUP_INFO + " b WHERE a.GROUP_ID = b.id AND b.PROJECT_ID = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_PKG + " WHERE QUEUE_ID IN" +
                "(SELECT a.id FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_GROUP_INFO + " b WHERE a.GROUP_ID = b.id AND b.PROJECT_ID = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_STATIS + " WHERE QUEUE_ID IN" +
                "(SELECT a.id FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_GROUP_INFO + " b WHERE a.GROUP_ID = b.id AND b.PROJECT_ID = ?)",

                "DELETE FROM " + hdrcfg.cfg.table_name.T_GROUP_INFO + " WHERE PROJECT_ID = ? "
            ];

            let params = [proj_id];
            let arr=Array.from(sqlArray,item=>{
                return  hdrcom.db.preSql(db, item, params);
            });
            await Promise.all(arr);
        }
        console.info("delete_project, deleGroup ok");
    };

    let deleProject =async function () {//删除project相关表
        let sql = "DELETE FROM " + hdrcfg.cfg.table_name.T_PROJECT_INFO + " WHERE ID = ?";
        let params = [proj_id];
        await hdrcom.db.preSql(db, sql, params);
        console.info("deleProject ok.\n");
        /*
        var sql1 = "DELETE FROM " + hdrcfg.cfg.table_name.T_PROJ_SEQ + " WHERE CONCAT('project_',ID) = ?";
        var params1 = [proj_id];

        var rs1 = hdrcom.db.executeSqlSync(db, sql1, params1);

        if (rs1.error) {
            var buf = hdrcfg.code.EDBEXECUTE + ':' + hdrcfg.msg[hdrcfg.code.EDBEXECUTE];
            var msg = {error_code: hdrcfg.code.EDBEXECUTE, error_msg: buf};
            console.error(buf);
            hdrcom.db.rollbackTransactionSync(db);
            callback(msg);
            return;
        } else {
            var ct = hdrcom.db.commitTransactionSync(db);
            console.info("deleProject ok.\n");
            callback(null, "SUCCESS");
        }
        */
        // let ct = hdrcom.db.commitTransactionSync(db);
        // console.info("deleProject ok.\n");
        // callback(null, "SUCCESS");
    };

    let delDir = function () {
        let dir = [hdrcfg.cfg.macro.MN_DIR_DATA,
            hdrcfg.cfg.macro.MN_DIR_LOG,
            hdrcfg.cfg.macro.MN_DIR_DICT,
            hdrcfg.cfg.macro.MN_DIR_SKIPSQL,
            hdrcfg.cfg.macro.MN_DIR_ERRSQL,
            hdrcfg.cfg.macro.MN_DIR_SYNC,
            hdrcfg.cfg.macro.MN_DIR_ETC,
            'web/html'];
        for (let x = 0; x < groups.length; x++) {
            for (let i = 0; i < dir.length; i++) {
                let stmt = 'rm -rf ' + process.env['DIP_HOME'] + '/' + dir[i] + '/' + groups[x].ID;
                hdrcom.pub.exe_shell(stmt);
            }
        }
    };
    let doJob=async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[delete_project], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            await getAllGroups();
            await checkGroupState();
            await deleComp();
            await deleGroup();
            await deleProject();
            await hdrcom.db.dbCommit(db);
            delDir();
            hdrcom.pub.processResult(res,"SUCCESS", true, body);
            console.info("end delete_project database.\n");
            return 'SUCCESS';
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
//导出对象
module.exports = {
    add_project: add_project,
    query_project: query_project,
    delete_project: delete_project
};