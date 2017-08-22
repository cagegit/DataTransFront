'use strict';
// const q = require('q');
const DB = require('odbc')();

const logger = require("../common/logger").log("log_date");
let hdrcfg = require('../../config');

// const mysql = require('mysql');
const pool = require('./mysqlPool');
const Promise = require('bluebird');

// function openDb() {
//     return new Promise((resolve,reject)=>{
//         let db = mysql.createConnection({
//             host     : 'localhost',
//             user     : 'r7',
//             password : 'r7',
//             database: 'dip',
//             port: sysCfg.mysql_port || 3306
//         });
//         db.connect(function(err) {
//             if (err){
//                 console.error('openDb err:',err);
//                 reject(err);
//                 throw err;
//             }else{
//                 console.log("connection is opening!!!");
//                 resolve(db);
//             }
//         });
//     });
// }
function openDb() {
    return new Promise(function(resolve,reject){
        pool.getConnection(function(err, db) {
            if (err){
                console.error('openDb err:',err);
                reject(err);
                // throw err;
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
    return new Promise(function(resolve, reject) {
        db.query(sql, val, function (err, result) {
            if (err) {
                console.error('SQL:[%s]', sql);
                console.error('VAL:[%s]', val);
                console.error('preSql err:',err);
                reject(err);
            } else {
                console.debug('SQL:[%s]', sql);
                console.debug('VAL:[%s]', val);
                // console.info(result);
                resolve(result);
            }
        });
    });
}
function dbTransaction(db) {
    return new Promise((resolve, reject)=>{
        db.beginTransaction(err => {
            if(err){
                console.error('beginTransaction error:');
                console.error(err);
                reject(err);
            }else{
                resolve();
            }
        });
    });
}
function dbCommit(db) {
    return new Promise((resolve, reject) => {
        db.commit( err => {
            if(err){
                console.error('commit error:');
                console.error(err);
                dbRollback(db);
                reject(err);
            }else{
                resolve();
            }
            setAutoCommitTrue(db);
        });
    });
}
function dbRollback(db) {
    return new Promise((resolve, reject) => {
        db.rollback(err => {
            if(err){
                console.error('dbRollback err:');
                console.error(err);
                reject(err);
            }else{
                resolve();
            }
            setAutoCommitTrue(db);
        });
    });
}
function setAutoCommitTrue(db) {
    db.query('set autocommit = 1'); 
}
/*
 * 关闭数据库
 * */
function closeDB(db) {
    db.release();
}
function closeDB1(db) {
    db.end(() => {
        console.log('connection is close!!!');
    });
}
//异步打开ODBC数据库连接
function openStrDB(cn) {
    return new Promise((resolve, reject) => {
        DB.open(cn, err => {
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
    return new Promise((resolve,reject) => {
        db.close( err => {
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
    return new Promise((resolve, reject) => {
        db.query(sql,params,function (err, result) {
            if (err) {
                console.error('SQL:[%s]', sql);
                console.error('PARAMS:[%s]', params);
                console.error('preSql err:',err);
                reject(err);
            } else {
                console.debug('SQL:[%s]', sql);
                console.debug('PARAMS:[%s]', params);
                // console.info('===', result);
                resolve(result);
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
        let db = require("odbc")();
        db.openSync(cn);

        db.query(sql, params, function (err, data, ct) {
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
let executeAsyn = preSql;
function executeAsynNoQuery(db, sql, val) {
    return new Promise((resolve, reject) => {
        db.prepare(sql, (err, stmt) => {
            if (err) {
                logger.error('prepare sql error');
                reject({code: hdrcfg.code.EDBPREPARE});
            } else {
                stmt.executeNonQuery(val, function (err) {
                    if (err) {
                        logger.error('SQL:[%s]', sql);
                        logger.error('VAL:[%s]', val);
                        logger.error(err);
                        reject({code: hdrcfg.code.EDBEXECUTE});
                    } else {
                        logger.debug('SQL:[%s]', sql);
                        logger.debug('VAL:[%s]', val);
                        resolve();
                    }
                });
            }
        });
    });
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
    openDb:openDb,
    setAutoCommitTrue:setAutoCommitTrue
};
