'use strict';
let dt = require('moment');
let hdrcom = require('../common');
let hdrcfg = require('../../config');

function AddUser(req, res) {
    let db;

    async function add_user() {
        let sql = 'SELECT COUNT(*) cnt ' +
            'FROM ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
            ' WHERE USER_NAME = ?';

        let userRec = await hdrcom.db.preSql(db, sql, [req.body.request.user]);

        if (0 < userRec.length) {
            sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
                ' (USER_NAME, USER_PWD, USER_AUTH, CREATE_TIME, FOUNDER) VALUES (?, ?, ?, ?, ?)';
            let val = [req.body.request.user, req.body.request.passwd, req.body.request.authority, dt().format('YYYY-MM-DD HH:mm:ss'), req.body.request.founder];

            await hdrcom.db.preSql(db, sql, val);

        } else {
            throw {error_code:hdrcfg.code.EEXIST, error_msg:hdrcfg.msg[hdrcfg.code.EEXIST]};
        }
    }

    async function doJob() {
        try {
            console.info('[dip_manuser_save_user --add begin');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await add_user();

            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[dip_manuser_save_user --add success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[dip_manuser_save_user --add fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function UpdateUser(req, res) {
    let db;
    async function user_update() {
        let sql = 'UPDATE ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
            ' SET USER_PWD = ?,' +
            ' CREATE_TIME = ? ' +
            'WHERE USER_NAME = ? ' +
            'AND USER_AUTH = ?';
        let val = [req.body.request.passwd, dt().format('YYYY-MM-DD HH:mm:ss'), req.body.request.user, req.body.request.authority];

        await hdrcom.db.preSql(db, sql, val);
    }

    async function doJob() {
        try {
            console.info('[dip_manuser_save_user --update begin');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await user_update();

            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[dip_manuser_save_user --update success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[dip_manuser_save_user --update fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}


function DelUser(req, res) {
    let db;
    async function user_delete() {
        let sql = '';
        let val = [];
        if ('super' === req.body.request.user) {
            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
                ' WHERE FOUNDER = ?';
            val = [req.body.request.founder];
        } else {
            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
                ' WHERE USER_NAME = ? ' +
                ' AND FOUNDER = ?';
            val = [req.body.request.user, req.body.request.founder];
        }

        await hdrcom.db.preSql(db, sql, val);
    }

    async function doJob() {
        try {
            console.info('[dip_manuser_save_user --delete begin');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await user_delete();

            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[dip_manuser_save_user --delete success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[dip_manuser_save_user --delete fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function QueryUser(req, res) {
    let db;
    async function user_query() {
        let sql = 'SELECT USER_NAME user, USER_PWD passwd, USER_AUTH authority ' +
            'FROM ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
            ' WHERE FOUNDER = ? ' +
            ' OR USER_NAME = ?';
        let val = [req.body.request.founder, req.body.request.founder];
        return await hdrcom.db.preSql(db, sql, val);
    }

    async function doJob() {
        try {
            console.info('[dip_manuser_query_user begin')
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();

            let result = await user_query();

            hdrcom.pub.processResult(res, {list:result}, true);
            console.info("[dip_manuser_query_user success.]");
            return {list:result};
        } catch (err) {
            console.error(err);
            console.error('[dip_manuser_query_user fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function CheckUser(req) {
    let db;
    
    async function doJob() {
        try{
            console.info('[dip_manuser_check_user begin]');
            db = await hdrcom.db.openDb();

            let sql = 'SELECT USER_AUTH auth ' +
                'FROM ' + hdrcfg.cfg.table_name.T_USER_MANAGER +
                ' WHERE USER_NAME = ? ' +
                ' AND USER_PWD = ?' +
                ' LIMIT 0, 1';
            let val = [req.body.userName, hdrcom.pub.tdes(req.body.password)];

            let usrRec = await hdrcom.db.preSql(db, sql, val);

            if (hdrcom.pub.isEmptyObj(usrRec)){
                console.error('Check fail');
                return {command_return: 'fail'}
            }else {
                return {command_return: 'SUCCESS', return_data: usrRec[0].auth}
            }
        }catch (err){
            console.error(err);
            return {command_return: 'fail'}
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    
    return doJob();
}

function UserOpt(req, res) {
    if ('add' === req.body.request.type) {
        return AddUser(req, res);
    } else if ('del' === req.body.request.type) {
        return DelUser(req, res);
    } else {
        return UpdateUser(req, res);
    }
}

module.exports = {
    dip_manuser_save_user: UserOpt,
    dip_manuser_query_user: QueryUser,
    dip_manuser_check_user: CheckUser
};
