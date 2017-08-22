/**
 * Created by on 2016/12/13.
 */
const md5 = require('md5');
const Q = require("q");
const async = require('async');
const moment = require('moment');

let hdrcom = require('../common');
let hdrcfg = require('../../config');

const Promise = require('bluebird');
//let mysqlCn = hdrcfg.cfg.mysql_connstr.connstr;
// let mysqlCn = hdrcom.pub.getDipMysqlConn();
const CK =require('check-types');

/*
 * ##############以下为调用queue相关方法######################
 */
//save_queue_info
function save_queue_info(body, res) {
    let db;
    let queue_id = body.request.component_id;
    let group_id = body.request.group_id;
    let queue_name = body.request.component_name;
    let time = moment().format('YYYY-MM-DD HH:mm:ss');
    let realQueueId = "";
    let insert_queue =async function () {//insert T_COMP_INFO， T_COMP_PARAM
        console.info("to deal T_COMP_INFO, T_COMP_PARAM");
        if (!queue_id || queue_id === 'undefined') {
            console.info("queue id is not exist, to create.");
            realQueueId =await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, hdrcfg.cfg.component_type.QUEUE);
            if (!realQueueId) {
                let buf = hdrcfg.code.ENOID + ':' + hdrcfg.msg[hdrcfg.code.ENOID];
                let msg = {error_code: hdrcfg.code.ENOID, error_msg: buf};
                console.error(buf);
                throw msg;
            }
            console.info("get Q id success:" + realQueueId);
            //插入T_COMP_INFO表
            let type = hdrcfg.cfg.component_type1.QUEUE;
            let sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_INFO + '(ID, NAME, TYPE, GROUP_ID, CREATE_TIME) values (?, ?, ?, ?, ?)';
            let params = [realQueueId, queue_name, type, group_id, time];
            await hdrcom.db.preSql(db, sql, params);
            for (let x in body.request) {
                if (x === 'group' || x === 'component_id'){
                    continue;
                }
                sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';

                if (x === 'size'){
                    body.request[x] += 'M';
                }
                params = [];
                if (x === 'queue_save_hour') {
                    params = [realQueueId, 'queue_reserved_hour', body.request[x], 'NORMAL', 'YES', time];
                } else{
                    params = [realQueueId, x, body.request[x], 'NORMAL', 'YES', time];
                }
                await hdrcom.db.preSql(db, sql, params);
            }
            queue_id = realQueueId;
        } else {//修改T_COMP_INFO， T_COMP_PARAMS
            console.info("queue id is exist.");
            let sql = 'update ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' set NAME = ? where ID = ? and GROUP_ID = ?';
            let params = [queue_name, queue_id, group_id];
            // let rs;
            await hdrcom.db.preSql(db, sql, params);
            //先删除T_COMP_PARAM表信息。
            sql = 'delete from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ?';
            params = [queue_id];
            await hdrcom.db.preSql(db, sql, params);
            for (let x in body.request) {
                if (x === 'group' || x === 'component_id'){
                    continue;
                }
                sql = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';

                if (x === 'size'){
                    body.request[x] += 'M';
                }
                params = [];
                if (x === 'queue_save_hour') {
                    params = [queue_id, 'queue_reserved_hour', body.request[x], 'NORMAL', 'YES', time];
                } else{
                    params = [queue_id, x, body.request[x], 'NORMAL', 'YES', time];
                }
                await hdrcom.db.preSql(db, sql, params);
            }
        }
        let rejson = {};
        rejson.component_id = queue_id;
        return rejson;
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[save_queue_info], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result=await insert_queue();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_queue_info] success.\n");
            return result;
        }catch (err){
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=>{
                console.error(err);
            });
            console.error('[save_queue_info] fail');
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//查询query_queue_info
function query_queue_info(body, res) {
    let db;
    let grp_id = body.request.group_id;
    let que_id = body.request.component_id;
    let queQueInfo =async function () {
        let sql = 'select PARAM_NAME, PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ?';
        let params = [que_id];
        let data = await hdrcom.db.preSql(db, sql, params);

        if (CK.nonEmptyArray(data)) {
            let resJson = {};
            resJson["group"] = grp_id;
            resJson["component_name"] = que_id;
            for (let i = 0; i < data.length; i++) {
                if (data[i].PARAM_NAME === 'queue_reserved_hour'){
                    resJson["queue_save_hour"] = data[i].PARAM_VALUE;
                }else{
                    resJson[data[i].PARAM_NAME] = data[i].PARAM_VALUE;
                }
            }
            return resJson;
        } else {
            return data;
        }
    };
    let doJob =async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            let result =await queQueInfo();
            hdrcom.pub.processResult(res, result, true, body);
            return result;
        }catch (err){
            console.error(err);
            console.error('[query_queue_info] fail');
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//xml doc 请求
function Statistic(req, res) {
    let db;
    function getTmLen(req) {
        if ('yes' === req.year) {
            return 4;
        } else if ('yes' === req.month) {
            return 7;
        } else if ('yes' === req.day) {
            return 10;
        } else if ('yes' === req.hour) {
            return 13;
        } else if ('yes' === req.minute) {
            return 16;
        }
    }

    async function statistic_notop(req) {
        let buf;
        let val = [];
        // let mydefer = Q.defer();
        let sql = 'select substr(ctime, 1, ?) time, sum(ddlnum) ddl, sum(insnum) inst, sum(delnum) del, sum(updnum) upd,' +
            '(sum(ddlnum)+sum(insnum)+sum(delnum)+sum(updnum)) full, sum(alllenth) length ' +
            'from ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS +
            ' where ctime > ? and ctime < ? and queue_id = ? ';

        if ('yes' === req.full) {
            sql += 'group by time order by ctime';
            val = [getTmLen(req), req.start_time, req.end_time, req.component_name];
        } else if ('' === req.table) {
            sql += 'and owner = ? group by time order by ctime';
            val = [getTmLen(req), req.start_time, req.end_time, req.component_name, req.owner];
        } else {
            sql += 'and owner = ? and onam = ? group by time order by ctime';
            val = [getTmLen(req), req.start_time, req.end_time, req.component_name, req.owner, req.table];
        }

        console.info('SQL:[', sql, ']');
        console.info('VAL:[', val, ']');
        let rs= await hdrcom.db.preSql(db, sql, val);
        if (CK.nonEmptyArray(rs)) {
            let tmp = rs[0];
            buf = {};
            buf.list = tmp;
            buf.persent = {
                inst: (tmp.inst / tmp.full * 100).toFixed(2) + '%',
                upd: (tmp.upd / tmp.full * 100).toFixed(2) + '%',
                del: (tmp.del / tmp.full * 100).toFixed(2) + '%',
                ddl: (tmp.ddl / tmp.full * 100).toFixed(2) + '%'
            }
        }
        return buf;
    }

    async function statistic_top(req) {
        let buf;
        let val = [];
        let sql = '';
        if ('yes' === req.full) {
            switch (req.sql_type) {
                case 'DDL':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(ddlnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(ddlnum) num ';
                    }
                    break;
                case 'INS':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(insnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(insnum) num ';
                    }
                    break;
                case 'UPD':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(updnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(updnum) num ';
                    }
                    break;
                case 'DEL':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(delnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(delnum) num ';
                    }
                    break;
                case 'LEN':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(alllenth) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(alllenth) num ';
                    }

                    break;
                case 'DML':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(updnum) + sum(ddlnum) + sum(insnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(updnum) + sum(ddlnum) + sum(insnum) num ';
                    }

                    break;
                default:
                    let ret = {};
                    ret.code = hdrcfg.code.EOTHER;
                    ret.error_msg = ret.code + ':' + 'sql type error';
                    throw ret;
            }
            if ('U' === req.object_type) {
                sql += 'from ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS +
                    ' where ctime >= ? ' +
                    'and ctime <= ? ' +
                    'and queue_id = ? ' +
                    'group by owner ' +
                    'order by num  desc limit 0, 10 ';

            } else {
                sql += 'from ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS +
                    ' where ctime >= ? ' +
                    'and ctime <= ? ' +
                    'and queue_id = ? ' +
                    'group by owner, onam ' +
                    'order by num  desc limit 0, 10 ';
            }
            val = [req.start_time, req.end_time, req.component_name];

        } else {
            switch (req.sql_type) {
                case 'DDL':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(ddlnum) num ';
                    } else if ('' === req.table) {
                        sql = 'select concat(owner, \'.\', onam) object, sum(ddlnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(ddlnum) num ';
                    }

                    break;
                case 'INS':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(insnum) num ';
                    } else if ('' === req.table) {
                        sql = 'select concat(owner, \'.\', onam) object, sum(insnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(insnum) num ';
                    }

                    break;
                case 'UPD':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(updnum) num ';
                    } else if ('' === req.table) {
                        sql = 'select concat(owner, \'.\', onam) object, sum(updnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(updnum) num ';
                    }

                    break;
                case 'DEL':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(delnum) num ';
                    } else if ('' === req.table) {
                        sql = 'select concat(owner, \'.\', onam) object, sum(delnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(delnum) num ';
                    }

                    break;
                case 'LEN':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(alllenth) num ';
                    } else if ('' === req.table) {
                        sql = 'select concat(owner, \'.\', onam) object, sum(alllenth) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(alllenth) num ';
                    }

                    break;
                case 'DML':
                    if ('U' === req.object_type) {
                        sql = 'select owner object, sum(updnum) + sum(ddlnum) + sum(insnum) num ';
                    } else if ('' === req.table) {
                        sql = 'select concat(owner, \'.\', onam) object, sum(updnum) + sum(ddlnum) + sum(insnum) num ';
                    } else {
                        sql = 'select concat(owner, \'.\', onam) object, sum(updnum) + sum(ddlnum) + sum(insnum) num ';
                    }

                    break;
                default:
                    let ret = {};
                    ret.code = hdrcfg.code.EOTHER;
                    ret.error_msg = ret.code + ':' + 'sql type error';
                    throw ret;
            }
            if ('U' === req.object_type) {
                sql += 'from ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS +
                    ' where ctime >= ? ' +
                    'and ctime <= ? ' +
                    'and queue_id = ? ' +
                    'and owner = ? ' +
                    'group by 1';
                val = [req.start_time, req.end_time, req.component_name, req.owner];
            } else if ('' === req.table) {
                sql += 'from ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS +
                    ' where ctime >= ? ' +
                    'and ctime <= ? ' +
                    'and queue_id = ? ' +
                    'and owner = ? ' +
                    'group by onam ' +
                    'order by num  desc limit 0, 10 ';
                val = [req.start_time, req.end_time, req.component_name, req.owner];
            } else {
                sql += 'from ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS +
                    ' where ctime >= ? ' +
                    'and ctime <= ? ' +
                    'and queue_id = ? ' +
                    'and owner = ? ' +
                    'and onam = ? ' +
                    'group by 1';
                val = [req.start_time, req.end_time, req.component_name, req.owner, req.table];
            }
        }

        let rs =await hdrcom.db.preSql(db, sql, val);
        console.log('res:', rs);
        if (CK.nonEmptyArray(rs)) {
            buf = {};
            buf.list = res[0];
        }
        return buf;
    }

    async function statistic_logical(req) {
        if ('yes' === req.year || 'yes' === req.month || 'yes' === req.day || 'yes' === req.hour || 'yes' === req.minute) {
           return await  statistic_notop(req);
        } else {
           return await statistic_top(req);
        }
    }

    let doJob = async function () {
        try {
            db =await hdrcom.db.openDb();
            let data = await statistic_logical(req);
            console.info('Statistic queue success');
            hdrcom.pub.processResult_noMD5(res, data, 1);
            return data;
        } catch (err) {
            console.error(err);
            if(err.error_msg){
                hdrcom.pub.processResult_noMD5(res, {error_code: err.code, error_msg: err.code + ':' + err.msg}, 0);
            } else {
                hdrcom.pub.processResult_noMD5(res, {error_code: err.code, error_msg: err.message}, 0);
            }
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//xml doc 请求
function query_que_pkg(req, res) {
    let exit_flag = 0;
    let db;
    let query_que_pkg = async function () {
       let sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_BPOINT + ' WHERE NAME = ?  AND QUEUE_ID = ?';
       await hdrcom.db.preSql(db, sql, ['page_pkg', req.component_name]);
       sql = 'SELECT COUNT(*) num, MAX(ID) id FROM ' + hdrcfg.cfg.table_name.T_QUEUE_PKG + ' WHERE ';

        let val = [];
        let flag = 0;
        for (let tmp in req) {
            if ('start_time' === tmp && 0 < req[tmp].length) {
                if (1 === flag) {
                    sql += ' AND ';
                } else {
                    flag = 1;
                }
                sql += ' CTIME >= ? ';
                val.push(req[tmp]);
            } else if ('end_time' === tmp && 0 < req[tmp].length) {
                if (1 === flag) {
                    sql += ' AND ';
                } else {
                    flag = 1;
                }
                sql += ' CTIME <= ? ';
                val.push(req[tmp]);
            } else if ('xid' === tmp && 0 < req[tmp].length) {
                if (1 === flag) {
                    sql += ' AND ';
                } else {
                    flag = 1;
                }
                sql += ' XID like ? ';
                val.push(req[tmp] + '%');
            } else if ('component_name' === tmp && 0 < req[tmp].length) {
                if (1 === flag) {
                    sql += ' AND ';
                } else {
                    flag = 1;
                }
                sql += ' QUEUE_ID = ? ';
                val.push(req[tmp]);
            }
        }
        let page=0,id=0,result = {page_num: 0, list: []};
        let rs=await hdrcom.db.preSql(db, sql, val);
        if (CK.nonEmptyArray(rs)) {
            page = parseInt(rs[0].num / hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);
            (rs[0].num % hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER) > 0 ? page++ : page;
            id = rs[0].id;
            sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_QUEUE_BPOINT + ' (NUM, ID, NAME, QUEUE_ID) values (?, ?, ?, ?)';
            await hdrcom.db.preSql(db, sql, [page, id, 'page_pkg', req.component_name]);
            sql = 'SELECT XID xid,  DATE_FORMAT(CTIME, \'%Y-%m-%d %H:%i:%s\') time, NREC nrec ' + ' FROM ' + hdrcfg.cfg.table_name.T_QUEUE_PKG + ' WHERE ';
            val = [];
            flag = 0;
            for (let tmp in req) {
                if ('start_time' === tmp && 0 < req[tmp].length) {
                    if (1 === flag) {
                        sql += ' AND ';
                    } else {
                        flag = 1;
                    }
                    sql += ' CTIME >= ? ';
                    val.push(req[tmp]);
                } else if ('end_time' === tmp && 0 < req[tmp].length) {
                    if (1 === flag) {
                        sql += ' AND ';
                    } else {
                        flag = 1;
                    }
                    sql += ' CTIME <= ? ';
                    val.push(req[tmp]);
                } else if ('xid' === tmp && 0 < req[tmp].length) {
                    if (1 === flag) {
                        sql += ' AND ';
                    } else {
                        flag = 1;
                    }
                    sql += ' XID like ? ';
                    val.push(req[tmp] + '%');
                } else if ('component_name' === tmp && 0 < req[tmp].length) {
                    if (1 === flag) {
                        sql += ' AND ';
                    } else {
                        flag = 1;
                    }
                    sql += ' QUEUE_ID = ? ';
                    val.push(req[tmp]);
                }
            }
            sql += ' ORDER BY CTIME DESC LIMIT ?, ?';

            val.push((req.page_num > 0 ? req.page_num - 1 : 0) * hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);
            val.push(hdrcfg.cfg.macro.PAGE_BRANCHES_NUMBER);

            let rs1 =await hdrcom.db.preSql(db, sql, val);
            if (CK.nonEmptyArray(rs1)) {
                result={page_num: page, list: rs1};
            }
        }
        return result;
   };
    let doJob =async function () {
          try{
              // await hdrcom.pub.checkMd5(req.body);
              db = await hdrcom.db.openDb();
              await hdrcom.db.preSql(db,'set autocommit=off',[]);
              await hdrcom.db.dbTransaction(db);
              let result =await query_que_pkg();
              await hdrcom.db.dbCommit(db);
              hdrcom.pub.processResult_noMD5(res, result, 1);
              console.info("[query_que_pkg] success.\n");
              return result;
          }catch (err){
              console.error(err);
              db && await hdrcom.db.dbRollback(db).catch(err=>{
                  console.error(err);
              });
              if(err.error_msg){
                  hdrcom.pub.processResult_noMD5(res, {error_code: err.code, error_msg: err.code + ':' + err.msg}, 0);
              } else {
                  hdrcom.pub.processResult_noMD5(res, {error_code: err.code, error_msg: err.message}, 0);
              }
              return err;
          }finally {
              db && hdrcom.db.closeDB(db);
          }
    };
    return doJob();
}

function delete_queue_pkg_statis(body, res) {
    let component_id = body.request.component_id;
    let start_time = body.request.start_time;
    if (!start_time) {
        start_time = "";
    }
    let end_time = body.request.end_time;
    let flag = body.request.flag;
    let db;
    let deleQueuePkgStatis = async function () {
        console.info("deleQueuePkgStatis begin");
        let sqlArray = [];
        let params = [component_id, start_time, end_time];

        if (flag === 1) {
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_PKG + " WHERE QUEUE_ID = ? AND CTIME >= ? AND CTIME <= ?");
        } else if (flag === 2) {
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_STATIS + " WHERE QUEUE_ID = ? AND CTIME >= ? AND CTIME <= ?");
        } else if (flag === 3) {
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_PKG + " WHERE QUEUE_ID = ? AND CTIME >= ? AND CTIME <= ?");
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_STATIS + " WHERE QUEUE_ID = ? AND CTIME >= ? AND CTIME <= ?");
        }
        for (let y = 0; y < sqlArray.length; y++) {
            console.info(sqlArray[y]);
            await hdrcom.db.preSql(db, sqlArray[y], params);
        }
        console.info("delete_queue_pkg_statis ok");
        return "SUCCESS";
    };
    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            await hdrcom.db.preSql(db,'set autocommit=off',[]);
            await hdrcom.db.dbTransaction(db);
            let result =await deleQueuePkgStatis();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, result, true, body);
            console.info("delete_queue_pkg_statis, conn db ok");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err => {
                console.error(err);
            });
            hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}
//xml doc 请求
function delete_queue_pkg_xid(req, res) {
    let db;
    let deletePkg = async function () {
        let sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_PKG + ' WHERE QUEUE_ID = ? ' + ' AND XID = ?';
        let val = [];
        if (CK.array(req.xid)) {
            for (let i = 0; i < req.xid.length; i++) {
                val[i] = [req.component_name, req.xid[i]];
            }
        } else {
            val[0] = [req.component_name, req.xid];
        }
        let pms = Array.from(val, function (item) {
            return hdrcom.db.preSql(db, sql, item);
        });
        await Promise.all(pms);
        return 'SUCCESS';
    };
    let doJob = async function () {
        try {
            db =await hdrcom.db.openDb();
            await hdrcom.db.preSql(db,'set autocommit=off',[]);
            await hdrcom.db.dbTransaction(db);
            let result = await deletePkg();
            await hdrcom.db.dbCommit(db);
            console.debug('Delete  success');
            hdrcom.pub.processResult_noMD5(res, result, 1);
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err => {
                console.error(err);
            });
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

module.exports = {
    save_queue_info: save_queue_info,
    query_queue_info: query_queue_info,
    query_queue_statis: Statistic,
    delete_queue_pkg_statis: delete_queue_pkg_statis,
    query_queue_pkg: query_que_pkg,
    delete_queue_pkg_xid: delete_queue_pkg_xid
};
