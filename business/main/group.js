'use strict';
let dt = require('moment');
let async = require('async');

let hdrcom = require('../common');
let hdrcfg = require('../../config');

let dir = [hdrcfg.cfg.macro.MN_DIR_DATA,
    hdrcfg.cfg.macro.MN_DIR_LOG,
    hdrcfg.cfg.macro.MN_DIR_DICT,
    hdrcfg.cfg.macro.MN_DIR_SKIPSQL,
    hdrcfg.cfg.macro.MN_DIR_ERRSQL,
    hdrcfg.cfg.macro.MN_DIR_SYNC,
    hdrcfg.cfg.macro.MN_DIR_ETC,
    'web/html'];

function Add(req, res) {
    let db;

    async function logical(group_id, comp_id) {
        let sql = '';
        let val = [];
        let projectId = req.body.request.projectid;
        let group = req.body.request.group;
        let description = req.body.request.description;
        let parameter = ['log_save_hour', 'users', 'auth'];
        /* judge whether the group exists */
        sql = 'SELECT count(*) cnt FROM ' + hdrcfg.cfg.table_name.T_GROUP_INFO + ' WHERE NAME = ? and PROJECT_ID = ?';
        let result = await hdrcom.db.executeAsyn(db, sql, [group, projectId]);
        if (result[0].cnt !== 0) {
            throw {error_code: hdrcfg.code.EEXIST, error_msg: hdrcfg.msg[hdrcfg.code.EEXIST]};
        }

        /* insert group infomation */
        sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_GROUP_INFO + ' (ID, NAME, PROJECT_ID, CREATE_TIME, `REMARK`) VALUES (?, ?, ?, ?, ?)';
        val = [group_id, group, projectId, dt().format('YYYY-MM-DD HH:mm:ss'), description];
        await hdrcom.db.executeAsyn(db, sql, val);

        /* insert parameter */
        sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_GROUP_PARAM + ' (GROUP_ID, PARAM_NAME, PARAM_VALUE, VALID, INSERT_TIME, UPDATE_TIME, `REMARK`)' +
            ' VALUES (?, ?, ?, ?, ?, ?, ?)';
        val = [];
        let task = [];
        for (let i = 0; i < parameter.length; i++) {
            val = [group_id, 'log_save_hour' === parameter[i] ? 'log_reserved_hour' : parameter[i], req.body.request[parameter[i]], 'yes', dt().format('YYYY-MM-DD HH:mm:ss'), dt().format('YYYY-MM-DD HH:mm:ss'), description];
            task.push(hdrcom.db.executeAsyn(db, sql, val));
        }

        /* insert component */
        sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' (ID, NAME, TYPE, GROUP_ID, PROGRAM, CREATE_TIME) VALUES (?, ?, ?, ?, ?, ?)';
        val = [comp_id, 'fullsync', 'ORA_FULLSYNC', group_id, 'dip_fullsync', dt().format('YYYY-MM-DD HH:mm:ss')];
        task.push(hdrcom.db.executeAsyn(db, sql, val));

        sql = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' (COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME, UPDATE_TIME)' +
            'VALUES (?, ?, ?, ?, ?, ?, ?)';
        val = [comp_id, 'reserved', 'yes', 'NORMAL', 'yes', dt().format('YYYY-MM-DD HH:mm:ss'), dt().format('YYYY-MM-DD HH:mm:ss')];
        task.push(hdrcom.db.executeAsyn(db, sql, val));

        /* concurrent execution */
        await Promise.all(task);
    }

    async function createDir(id) {
        let task = [];
        let path = process.env['DIP_HOME'];
        let stmt = '';
        for (let i = 0; i < dir.length; i++) {
            stmt = `mkdir -p ${path}/${dir[i]}/${id}`;
            task.push(hdrcom.pub.exe_shell(stmt));
        }

        await Promise.all(task);
    }

    async function doJob() {
        try {
            console.info('[add_group begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let group_id = await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.GROUP);
            let comp_id = await hdrcom.pub.getDipId(db, hdrcfg.cfg.type.COMPONENT, 'sync');
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            await logical(group_id, comp_id);
            await createDir(group_id);

            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {group_id: group_id}, true);
            console.info("[add_group success.]");
            return {group_id: group_id};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[add_group fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function Del(req, res) {
    let db;

    async function del_etl_rule(comp_id, type) {
        let table;

        switch (type) {
            case hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN:
                table = hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN;
                break;

            case hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN:
                table = hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN;
                break;

            case hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING:
                table = hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING;
                break;

            case hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER:
                table = hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER;
                break;

            case hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER:
                table = hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER;
                break;

            case hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER:
                table = hdrcfg.cfg.table_name.T_ETL_OPERATION_FILTER;
                break;

            case hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT:
                table = hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT;
                break;

            case hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM:
                table = hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM;
                break;

            default:
                return;
        }

        let sql = '';
        if (type === hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM) {
            sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_ETL_DELETE_TO_UPDATE_COLUMN} where SET_ID = (SELECT PARAM_VALUE FROM ${hdrcfg.cfg.table_name.T_COMP_PARAM} WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL' and PARAM_NAME = ? ) `;
            await hdrcom.db.preSql(db, sql, [comp_id, type]);
        }

        sql = `DELETE FROM ${table} where SET_ID = (SELECT PARAM_VALUE FROM ${hdrcfg.cfg.table_name.T_COMP_PARAM} WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL' and PARAM_NAME = ? ) `;
        await hdrcom.db.preSql(db, sql, [comp_id, type]);
    }

    async function del_etl() {
        let group = req.body.request.group;
        let sql = `SELECT ID FROM ${hdrcfg.cfg.table_name.T_COMP_INFO} WHERE GROUP_ID = ? `;
        let compRec = await hdrcom.db.preSql(db, sql, [group]);
        for (let i = 0; i < compRec.length; i++){
            sql = `SELECT RULE_SET_TYPE type, RULE_SET_NAME name FROM ${hdrcfg.cfg.table_name.T_ETL_BATCH_RULES} WHERE SET_ID in (SELECT PARAM_VALUE FROM ${hdrcfg.cfg.table_name.T_COMP_PARAM} WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL' and PARAM_NAME in ( ?, ?, ? ) ) `;
            let ruleRec = await hdrcom.db.preSql(db, sql, [compRec[i].ID, hdrcfg.cfg.object_set_type.ETL_BATCH_FILTER, hdrcfg.cfg.object_set_type.ETL_BATCH_INSERT, hdrcfg.cfg.object_set_type.ETL_BATCH_UPDATE]);

            let task = [];
            if (0 < ruleRec.length) {

                for (let i = 0; i < ruleRec.length; i++) {
                    sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_ETL_RULE_SET_DETAIL} WHERE GROUP_ID = ? AND RULE_SET_TYPE = ? AND RULE_SET_NAME = ? `;
                    task.push(hdrcom.db.preSql(db, sql, [group, ruleRec[i].type, ruleRec[i].name]));

                    sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_ETL_RULE_SET} WHERE GROUP_ID = ? AND RULE_SET_TYPE = ? AND RULE_SET_NAME = ? `;
                    task.push(hdrcom.db.preSql(db, sql, [group, ruleRec[i].type, ruleRec[i].name]));
                }

                await Promise.all(task);

                sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_ETL_BATCH_RULES} WHERE SET_ID in (SELECT PARAM_VALUE FROM ${hdrcfg.cfg.table_name.T_COMP_PARAM} WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL' and PARAM_NAME in ( ?, ?, ? ) ) `;
                await hdrcom.db.preSql(db, sql, [compRec[i].ID, hdrcfg.cfg.object_set_type.ETL_BATCH_FILTER, hdrcfg.cfg.object_set_type.ETL_BATCH_INSERT, hdrcfg.cfg.object_set_type.ETL_BATCH_UPDATE]);
            }

            task = [];
            for (let tmp in hdrcfg.cfg.object_set_type) {
                task.push(del_etl_rule(compRec[i].ID, hdrcfg.cfg.object_set_type[tmp]));
            }

            await Promise.all(task);
        }
    }

    async function del_relation_data() {
        let group = req.body.request.group;
        let sql = [
            'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_BPOINT + ' WHERE QUEUE_ID IN ' +
            '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE TYPE = \'' + hdrcfg.cfg.component_type1.QUEUE + '\' AND GROUP_ID = ?)',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_PKG + ' WHERE QUEUE_ID IN ' +
            '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE TYPE = \'' + hdrcfg.cfg.component_type1.QUEUE + '\' AND GROUP_ID = ?)',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS + ' WHERE QUEUE_ID IN ' +
            '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE TYPE = \'' + hdrcfg.cfg.component_type1.QUEUE + '\' AND GROUP_ID = ?)',

            "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + " WHERE SET_ID IN" +
            "(SELECT c.ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_COMP_PARAM + " b, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " c " +
            "WHERE a.GROUP_ID = ? AND a.ID = b.COMP_ID AND b.PARAM_TYPE = 'EXTERNAL' AND b.PARAM_VALUE = c.ID)",

            "DELETE FROM " + hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO + " WHERE SET_ID IN" +
            "(SELECT c.ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_COMP_PARAM + " b, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " c " +
            "WHERE a.GROUP_ID = ? AND a.ID = b.COMP_ID AND b.PARAM_TYPE = 'EXTERNAL' AND b.PARAM_VALUE = c.ID)",

            "DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " WHERE ID IN" +
            "(SELECT b.PARAM_VALUE FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " a, " + hdrcfg.cfg.table_name.T_COMP_PARAM + " b " +
            "WHERE a.GROUP_ID = ? AND a.ID = b.COMP_ID AND b.PARAM_TYPE = 'EXTERNAL')",

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_WEB_CACHE + ' WHERE COMP_ID IN' +
            '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO +
            ' WHERE GROUP_ID = ?)',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_COMP_RELATION + ' WHERE GROUP_ID = ? ',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID IN' +
            '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO +
            ' WHERE GROUP_ID = ?)',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_GROUP_PARAM + ' WHERE GROUP_ID = ? ',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE GROUP_ID = ?',

            'DELETE FROM ' + hdrcfg.cfg.table_name.T_GROUP_INFO + ' WHERE ID = ? '];

        let task = [];
        for (let i = 0; i <= 7; i++) {
            task.push(hdrcom.db.preSql(db, sql[i], [group]));
        }

        await Promise.all(task);

        await del_etl();

        await hdrcom.db.preSql(db, sql[8], [group]);

        task = [];
        task.push(hdrcom.db.preSql(db, sql[9], [group]));
        task.push(hdrcom.db.preSql(db, sql[10], [group]));
        task.push(hdrcom.db.preSql(db, sql[11], [group]));
        await Promise.all(task);
    }

    async function del_dir() {
        let task = [];
        let stmt = '';
        for (let i = 0; i < dir.length; i++) {
            stmt = 'rm -rf ' + process.env['DIP_HOME'] + '/' + dir[i] + '/' + req.body.request.group;
            task.push(hdrcom.pub.exe_shell(stmt));
        }
        await Promise.all(task);
    }

    async function doJob() {
        try {
            console.info('[delete_group begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await del_relation_data();
            await del_dir();

            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[delete_group success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[delete_group fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function Modify(req, res) {
    let db;

    async function modify_group() {
        let sql = [];
        let val = [];
        let new_group = req.body.request.new_group;
        let group = req.body.request.group_id;
        let descript = req.body.request.description;
        let log_save_hour = req.body.request.log_save_hour;
        sql.push('UPDATE ' + hdrcfg.cfg.table_name.T_GROUP_INFO + ' SET NAME = ?, REMARK = ? WHERE ID = ?');
        sql.push('UPDATE ' + hdrcfg.cfg.table_name.T_GROUP_PARAM + ' SET PARAM_VALUE = ? WHERE PARAM_NAME = ? and GROUP_ID = ?');
        val.push([new_group, descript, group]);
        val.push([log_save_hour, 'log_reserved_hour', group]);

        let task = [];
        for (let i = 0; i < sql.length; i++) {
            task.push(hdrcom.db.preSql(db, sql[i], val[i]));
        }

        await Promise.all(task);
    }

    async function doJob() {
        try {
            console.info('[modify_group begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await modify_group();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[modify_group success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[modify_group fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function Query(req, res) {
    let db;

    async function query_group() {
        let auth = {
            super_admin: ['super_admin', 'super', 'normal'],
            super: ['super', 'normal', ''],
            normal: ['normal', '', '']
        };

        let sql = 'SELECT a.ID group_id, a.NAME name, a.REMARK description, b.PARAM_VALUE log_save_hour, \'no\' as loaded ' +
            'FROM ' + hdrcfg.cfg.table_name.T_GROUP_INFO + ' a, ' + hdrcfg.cfg.table_name.T_GROUP_PARAM + ' b ' +
            'WHERE a.PROJECT_ID = ? ' +
            'AND a.ID = b.GROUP_ID ' +
            'AND b.PARAM_NAME = \'log_reserved_hour\' ' +
            'AND b.GROUP_ID IN (SELECT GROUP_ID FROM ' + hdrcfg.cfg.table_name.T_GROUP_PARAM +
            ' WHERE PARAM_VALUE in (?, ?, ?)) ' +
            ' ORDER BY a.CREATE_TIME';
        let val = [req.body.request.projectid, auth[req.body.request.auth][0], auth[req.body.request.auth][1], auth[req.body.request.auth][2]];

        let groupList = await hdrcom.db.preSql(db, sql, val);

        let status;
        for (let i = 0; i < groupList.length; i++) {
            status = await hdrcom.pub.getStatus(groupList[i].group_id);
            console.log('###', groupList[i].group_id, '---', status);
            if ('yes' === status) {
                groupList[i].loaded = 'yes';
            }
        }

        return groupList;
    }

    async function doJob() {
        try {
            console.info('[query_group begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let result = await query_group();

            hdrcom.pub.processResult(res, {group: result}, true);
            console.info("[query_group success.]");
            return {group: result};
        } catch (err) {
            console.error(err);
            console.error('[query_group fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function Reset(req, res) {
    let db;

    async function reset_group() {
        let status = hdrcom.pub.getStatus(req.body.request.group);
        let group = req.body.request.group;

        if ('yes' === status) {
            throw {error_code: hdrcfg.code.EBUSY, error_msg: hdrcfg.msg[hdrcfg.code.EBUSY]};
        }

        if ('no' === req.body.request.clean_all) {
            await hdrcom.pub.exe_shell('rm -rf ' + process.env['DIP_HOME'] + '/data/' + group + '/*.bkp');
        } else {

            let sql;
            let task = [];
            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_BPOINT + ' WHERE QUEUE_ID IN ' +
                '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE TYPE = ? AND GROUP_ID = ?)';
            task.push(hdrcom.db.preSql(db, sql, [hdrcfg.cfg.component_type1.QUEUE, group]));

            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_PKG + ' WHERE QUEUE_ID IN ' +
                '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE TYPE = ? AND GROUP_ID = ?)';
            task.push(hdrcom.db.preSql(db, sql, [hdrcfg.cfg.component_type1.QUEUE, group]));

            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_QUEUE_STATIS + ' WHERE QUEUE_ID IN ' +
                '(SELECT ID FROM ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' WHERE TYPE = ? AND GROUP_ID = ?)';
            task.push(hdrcom.db.preSql(db, sql, [hdrcfg.cfg.component_type1.QUEUE, group]));

            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_LDR_ERR_IDX + ' WHERE GROUP_ID = ? ';
            task.push(hdrcom.db.preSql(db, sql, [group]));

            await Promise.all(task);

            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_SYNC_SPECIFIED_TABLE +
                ' WHERE SET_ID IN (SELECT SET_ID FROM ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM +
                '                   WHERE GROUP_ID = ? )';
            await hdrcom.db.preSql(db, sql, [group]);

            task = [];
            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_SYNC_IMPORT_PARAM +
                ' WHERE GROUP_ID = ? ';
            task.push(hdrcom.db.preSql(db, sql, [group]));

            sql = 'DELETE FROM ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM +
                ' WHERE GROUP_ID = ? ';
            task.push(hdrcom.db.preSql(db, sql, [group]));

            await Promise.all(task);

            /* clear directory */
            let path = process.env['DIP_HOME'];
            let dir = ['data', 'log', 'errsql', 'sync'];
            let stmt = '';
            task = [];

            for (let i = 0; i < dir.length; i++) {
                stmt = `rm -rf ${path}/${dir[i]}/${group}/*`;
                task.push(hdrcom.pub.exe_shell(stmt))
            }

            await Promise.all(task);
        }

    }

    async function doJob() {
        try {
            console.info('[reset_group begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            await reset_group();

            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, {}, true);
            console.info("[reset_group success.]");
            return {};
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[reset_group fail]');
            hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}


module.exports = {
    add_group: Add,
    delete_group: Del,
    modify_group: Modify,
    fetch_all_groups: Query,
    reset_group: Reset
};
