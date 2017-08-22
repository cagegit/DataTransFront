'use strict';
const q = require('q');
const DB = require('odbc')();

const logger = require("../common/logger").log("log_date");
let hdrcfg = require('../../config');
let sysCfg= require('../../routes/sys_config');
const mysql =require('mysql');

function openDb() {
    return new Promise((resolve,reject)=>{
        let db=mysql.createConnection({
            host     : 'localhost',
            user     : 'r7',
            password : 'r7',
            database: 'dip',
            port: sysCfg.mysql_port || 3306
        });
        db.connect(function(err) {
            if (err){
                console.error('openDb err:',err);
                reject(err);
                throw err;
            }else{
                console.log("connection is opening!!!");
                resolve(db);
            }
        });
    });
}
/*
 * mysql 库的执行方法
 * @params db,sql,val
 * @return Promise
 * */
function preSql(db, sql, val) {
    let defer = q.defer();
    db.query(sql,val,function (err, result) {
        if (err) {
            console.error('SQL:[%s]', sql);
            console.error('VAL:[%s]', val);
            console.error('preSql err:',err);
            // defer.reject({code: hdrcfg.code.EDBEXECUTE});
            defer.reject(err);
        } else {
            console.debug('SQL:[%s]', sql);
            console.debug('VAL:[%s]', val);
            // console.info(result);
            defer.resolve(result);
        }
    });
    return defer.promise;
}
function dbTransaction(db) {
    return new Promise((resolve,reject)=>{
        db.beginTransaction(err=>{
            if(err){
                console.error('dbTransaction err:',err);
                reject(err);
            }else{
                resolve();
            }
        });
    });
}
function dbCommit(db) {
    return new Promise((resolve,reject)=>{
        db.commit((err)=>{
            if(err){
                console.error('dbCommit err:',err);
                dbRollback(db);
                reject(err);
            }else{
                resolve();
            }
        });
    });
}
function dbRollback(db) {
    return new Promise((resolve,reject)=>{
        db.rollback(err =>{
            if(err){
                console.error('dbRollback err:',err);
                console.error(err);
                reject(err);
            }else{
                resolve();
            }
        });
    });
}

//同步打开数据库连接
function openStrDBSync(cn) {
    try {
        DB.openSync(cn);
    } catch (err) {
        logger.error('CON:[%s]', cn);
        logger.error(err);
        return err;
    }
    return DB;
}
//异步打开ODBC数据库连接
function openStrDB(cn) {
    return new Promise((resolve,reject)=>{
        DB.open(cn, function (err) {
            if (err){
                console.error(err);
                reject(err)
            }else{
                console.info('Str ODBC db is opening....');
                resolve(DB);
            }
        });
    });
}
//异步关闭ODBC数据库连接
function closeStrDB(db) {
    return new Promise((resolve,reject)=>{
        db.close(function (err) {
            if(err){
                console.error(err);
                reject(err);
            }else{
                console.info('Str ODBC db is closed!');
                resolve();
            }
        });
    });
}
//异步执行ODBC Sql 语句
function executeStrSql(db, sql, params) {
    let defer = q.defer();
    db.query(sql,params,function (err, result) {
        if (err) {
            console.error('SQL:[%s]', sql);
            console.error('PARAMS:[%s]', params);
            console.error('preSql err:',err);
            defer.reject(err);
        } else {
            console.debug('SQL:[%s]', sql);
            console.debug('PARAMS:[%s]', params);
            console.info('===', result);
            defer.resolve(result);
        }
    });
    return defer.promise;
}
/*
* 打开openDBSync mysql库
* */
function openDBSync(cn) {
    let db = require("odbc")();
    try {
        db.openSync(cn);
    } catch (err) {
        logger.error('CON:[%s]', cn);
        logger.error(err);
        return err;
    }
    return db;
}
//同步执行数据库语句
function executeSqlSync(db, sql, params) {
    let rs;
    try {
        rs = db.querySync(sql, params);
    } catch (e) {
        logger.error('SQL:[%s]', sql);
        logger.error('VAL:[%s]', params);
        logger.error(e);
        return e;
    }
    logger.debug('SQL:[%s]', sql);
    logger.debug('VAL:[%s]', params);
    return rs;
}
//同步关闭数据库
function closeDBSync(db) {
    let cs;
    try {
        cs = db.closeSync();
    } catch (e) {
        logger.error(e);
        return e;
    }
    return cs;
}
/*
* 关闭数据库
* */
function closeDB(db) {
   db.end(()=>{
       console.log('connection is close!!!');
   });
}

//同步打开事务
function beginTransactionSync(db) {
    let bt;
    try {
        bt = db.beginTransactionSync();
    } catch (e) {
        logger.error(e);
        return e;
    }
    return bt;
}

//同步回滚事务
function rollbackTransactionSync(db) {
    let rt;
    try {
        rt = db.rollbackTransactionSync();
    } catch (e) {
        logger.error(e);
        return e;
    }
    return rt;
}

//同步提交事务
function commitTransactionSync(db) {
    let ct;
    try {
        ct = db.commitTransactionSync();
    } catch (e) {
        logger.error(e);
        return e;
    }
    return ct;
}

//异步执行sql select语句
function executeSql(cn, sql, params) {
    return new Promise(function (resolve, reject) {
        var db = require("odbc")();
        db.openSync(cn);

        var rs = db.query(sql, params, function (err, data, ct) {
            if (err) {
                logger.error('SQL:[%s]', sql);
                logger.error('VAL:[%s]', params);
                logger.error(err);
                reject(err);
                return db.closeSync();
            }
            //console.log(data);
            logger.debug('SQL:[%s]', sql);
            logger.debug('VAL:[%s]', params);
            resolve(data);
            if (!ct) {
                db.closeSync();
            }
        });
    });
}

//异步执行SQL
/*
function executeAsyn(db, sql, val) {
    let defer = q.defer();
    db.prepare(sql, function (err, stmt) {
        if (err) {
            logger.error('prepare sql error');
            defer.reject({code: hdrcfg.code.EDBPREPARE});
        } else {
            stmt.execute(val, function (err, result) {
                if (err) {
                    logger.error('SQL:[%s]', sql);
                    logger.error('VAL:[%s]', val);
                    logger.error(err);
                    defer.reject({code: hdrcfg.code.EDBEXECUTE});
                } else {
                    logger.debug('SQL:[%s]', sql);
                    logger.debug('VAL:[%s]', val);
                    let ret = result.fetchAllSync();
                    result.closeSync();
                    defer.resolve(ret);
                }
            });
        }
    });
    return defer.promise;
}
*/
let executeAsyn = preSql;
function executeAsynNoQuery(db, sql, val) {
    let defer = q.defer();
    db.prepare(sql, function (err, stmt) {
        if (err) {
            logger.error('prepare sql error');
            defer.reject({code: hdrcfg.code.EDBPREPARE});
        } else {
            stmt.executeNonQuery(val, function (err) {
                if (err) {
                    logger.error('SQL:[%s]', sql);
                    logger.error('VAL:[%s]', val);
                    logger.error(err);
                    defer.reject({code: hdrcfg.code.EDBEXECUTE});
                } else {
                    logger.debug('SQL:[%s]', sql);
                    logger.debug('VAL:[%s]', val);
                    defer.resolve();
                }
            });
        }
    });
    return defer.promise;
}

module.exports = {
    openDBSync: openDBSync,
    openStrDB:openStrDB,
    closeStrDB:closeStrDB,
    openStrDBSync:openStrDBSync,//使用连接字符串打开odb数据库
    executeStrSql: executeStrSql,//连接字符串形式odbc的执行异步
    executeSqlSync: executeSqlSync,
    closeDBSync: closeDBSync,
    closeDB:closeDB,
    beginTransactionSync: beginTransactionSync,
    rollbackTransactionSync: rollbackTransactionSync,
    commitTransactionSync: commitTransactionSync,
    executeSql: executeSql,
    executeAsyn: executeAsyn,
    executeAsynNoQuery: executeAsynNoQuery,
    preSql:preSql,
    dbTransaction:dbTransaction,
    dbCommit:dbCommit,
    dbRollback:dbRollback,
    openDb:openDb
};
