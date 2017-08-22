'use strict';
let q = require('q');
let dt = require('moment');
let fs = require('fs');
let async = require('async');
let path = require('path');
let hdrcom = require('../common');
let hdrcfg = require('../../config');

function initEnv(req) {
    let mydefer = q.defer();
    async.waterfall([
        function (cb) {
            /* open database */
            hdrcom.db.openDb()
                .then(function (db) {
                    req.dbhdr = db;
                    cb(null);
                }, function (err) {
                    cb(err);
                });
        },
        function (cb) {
            /* set automcommit off */
            let sql = 'set autocommit=off';
            hdrcom.db.preSql(req.dbhdr, sql, [])
                .then(function () {
                    console.info('Set autocommit success!');
                    cb(null);
                }, function (err) {
                    console.error(err);
                    cb(err);
                });
        },
        function (cb) {
            /* begin transation */
            hdrcom.db.dbTransaction(req.dbhdr)
                .then(function () {
                    console.info('begin transation success');
                    cb(null);
                }, function (err) {
                    cb(err);
                });
        },
        function (cb) {
            /* check MD5*/
            hdrcom.pub.checkMd5(req.body)
                .then(function (res) {
                    cb(null, res.request);
                }, function (err) {
                    console.error(err);
                    cb({code: hdrcfg.code.EMD5});
                });
        }
    ], function (err, result) {
        if (err) {
            console.error(err);
            mydefer.reject(err);
        } else {
            mydefer.resolve(result);
        }
    });
    return mydefer.promise;
}

function query_full_sync_filter(req, res) {
    let db;
    let srcDb;

    async function get_tab_by_schema(scm, ret) {
        let sql = hdrcom.pub.getTableSqltext(req.body.request.db_type, 'TABLE');
        if (!sql) {
            throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
        }

        srcDb = await hdrcom.pub.openAsignDB(db, req.body.request.db_component_id, req.body.request.db_type);

        if (srcDb) {
            let result = await hdrcom.db.preSql(srcDb, sql, [scm]);

            if (0 < result.length) {
                result.forEach(function (e) {
                    if (req.body.request.db_type == 'db2') {
                        ret.push({scm: scm, obj: e.NAME});
                    } else {
                        ret.push({scm: scm, obj: e.name});
                    }
                });
            }
        } else {
            throw {error_code: hdrcfg.code.EDBOPEN, error_msg: hdrcfg.msg[hdrcfg.code.EDBOPEN]};
        }
    }

    async function get_tab_by_id(id) {
        let sql = 'SELECT SCHEMA_NAME scm, OBJECT_NAME obj ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET +
            ' WHERE SET_ID = ? ' +
            '   AND OBJECT_TYPE = ? ' +
            '  ORDER BY scm ';
        let val = [id, 'TABLE'];
        let result = [];

        let objRec = await hdrcom.db.preSql(db, sql, val);

        if (0 < objRec.length) {
            let scm = [];
            objRec.forEach(e=> {
                if (null == e.obj) {
                    scm.push(e.scm);
                } else {
                    result.push(e);
                }
            });

            if (0 < scm.length) {
                let task = [];
                for (let i = 0; i < scm.length; i++) {
                    task.push(get_tab_by_schema(scm[i], result));
                }

                await Promise.all(task);
            }
        }

        return result;
    }

    async function get_filter_tab() {
        let result = [];
        let incId = '';
        let excId = '';

        let sql = 'SELECT PARAM_NAME nm, PARAM_VALUE val ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM +
            ' WHERE COMP_ID = ? ' +
            ' AND PARAM_NAME IN(?, ?)';
        let val = [req.body.request.comp_id, 'INCLUDE', 'EXCLUDE'];

        let compRec = await hdrcom.db.preSql(db, sql, val);

        if (0 < compRec.length) {
            if (1 === compRec.length) {
                incId = 'INCLUDE' === compRec[0].nm ? compRec[0].val : '';
            } else {
                incId = 'INCLUDE' === compRec[0].nm ? compRec[0].val : compRec[1].val;
                excId = 'INCLUDE' === compRec[0].nm ? compRec[1].val : compRec[0].val;
            }
        }


        if (incId) {
            let incRec = [];
            let excRec = [];
            let retRec = [];

            incRec = await get_tab_by_id(incId);
            if (excId) {
                excRec = await get_tab_by_id(excId);
            }

            /* 数组做差集 */
            incRec.forEach(function (e) {
                let i = 0;
                for (; i < excRec.length; i++) {
                    if (e.scm === excRec[i].scm && e.obj === excRec[i].obj) {
                        break;
                    }
                }
                if (i === excRec.length) {
                    retRec.push(e);
                }
            });

            /* 以约定的格式生成返回对象 */
            let tmp = '';
            let obj = [];
            for (let i = 0; i < retRec.length; i++) {
                if (0 === i) {
                    tmp = retRec[0].scm;
                } else {
                    if (tmp !== retRec[i].scm) {
                        result.push({schema: tmp, table: obj});
                        obj = [];
                        tmp = retRec[i].scm;
                    }
                }

                obj.push(retRec[i].obj);

                if (i === retRec.length - 1) {
                    result.push({schema: tmp, table: obj});
                }
            }
        }

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_full_sync_filter begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();

            let result = await get_filter_tab();
            hdrcom.pub.processResult(res, {list: result}, true);
            console.info("[query_full_sync_filter success.]");
        } catch (err) {
            console.error(err);
            hdrcom.pub.processResult(res, err, false);
            console.info("[query_full_sync_filter fail.]");
        } finally {
            db && await hdrcom.db.closeDB(db);
            srcDb && hdrcom.db.closeStrDB(srcDb);
        }
    }

    doJob();
}

function create_sync_cfg(req, res) {
    function save_appoint(flag, scm, id, sql, val) {
        let mydefer = q.defer();

        async.waterfall([
            function (cb) {
                let sql = 'SELECT b.SCHEMA_NAME scm, b.MAP_SCHEMA_NAME mscm, b.OBJECT_NAME obj, b.MAP_OBJECT mobj ' +
                    ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a,' + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + ' b' +
                    ' WHERE a.comp_id = ? AND a.param_name = ? AND a.PARAM_VALUE = b.SET_ID AND b.OBJECT_TYPE = ?';
                let val = [req.body.request.comp_id, 'INCLUDE', 'TABLE'];

                hdrcom.db.preSql(req.dbhdr, sql, val)
                    .then(function (data) {
                        cb(null, data);
                    }, function (err) {
                        cb(err)
                    })
            },
            function (data, cb) {
                let stmt = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_SYNC_SPECIFIED_TABLE +
                    ' (SET_ID, SYNC_TYPE, SCHEMA_NAME, MAP_SCHEMA_NAME, OBJECT_TYPE, OBJECT_NAME, MAP_OBJECT, COND) ' +
                    ' VALUES(?,?,?,?,?,?,?,?)';
                for (let j = 0; j < scm.length; j++) {
                    let obj = scm[j].object;

                    obj.forEach(function (e) {
                        let i = 0;
                        for (; i < data.length; i++) {
                            if (scm[j].name === data[i].scm) {
                                if (data[i].obj === null || e.name === data[i].obj) {
                                    break;
                                }
                            }
                        }

                        if (data.length !== i) {
                            val.push([id, flag, data[i].scm, data[i].mscm, 'TABLE', e.name, data[i].mobj, undefined === e.clause ? null : e.clause]);
                            sql.push(stmt);
                        } else {
                            val.push([id, flag, scm[j].name, null, 'TABLE', e.name, null, undefined === e.clause ? null : e.clause]);
                            sql.push(stmt);
                        }
                    });
                }
                cb(null);
            }
        ], function (err) {
            if (err) {
                mydefer.reject(err);
            } else {
                mydefer.resolve();
            }
        });

        return mydefer.promise;
    }

    function save_table_sapce(data, id, sql, val) {
        let mydefer = q.defer();
        let stmt = 'INSERT INTO ' + hdrcfg.cfg.table_name.T_SYNC_SPECIFIED_TABLE +
            ' (SET_ID, OBJECT_TYPE, OBJECT_NAME, MAP_OBJECT)' +
            ' VALUES( ?, ?, ?, ?) ';

        if (undefined === data) {
            mydefer.resolve();
        } else {
            for (let i = 0; i < data.length; i++) {
                sql.push(stmt);
                val.push([id, 'tbs', data[i].name, data[i].map_name]);
                if (i === data.length - 1) {
                    mydefer.resolve();
                }
            }
        }
        return mydefer.promise;
    }

    function save_cfg(data) {
        let mydefer = q.defer();
        let id;
        let path = process.env['DIP_HOME'] + '/sync/' + data.group;
        let sql = [];
        let val = [];
        async.waterfall([
            function (cb) {
                sql = 'SELECT count(1) cnt, min(SET_ID) id ' +
                    ' FROM ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM;

                hdrcom.db.preSql(req.dbhdr, sql, [])
                    .then(function (res) {
                        if (res[0].cnt >= 10) {
                            cb(null, 1, res[0].id)
                        } else {
                            cb(null, 0, 0);
                        }
                    }, function (err) {
                        cb(err);
                    });
            },
            function (flag, minId, cb) {
                if (1 === flag) {
                    sql = [];
                    sql.push('DELETE FROM ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM +
                        ' WHERE SET_ID = ? ');
                    sql.push('DELETE FROM ' + hdrcfg.cfg.table_name.T_SYNC_IMPORT_PARAM +
                        ' WHERE SET_ID = ? ');
                    sql.push('DELETE FROM ' + hdrcfg.cfg.table_name.T_SYNC_SPECIFIED_TABLE +
                        ' WHERE SET_ID = ? ');

                    let pms = Array.from(sql, function (item) {
                        return hdrcom.db.preSql(req.dbhdr, item, [minId]);
                    });

                    q.all(pms)
                        .then(function () {
                            cb(null, 1, minId);
                        }, function (err) {
                            console.error(err);
                            cb(err);
                        });
                } else {
                    cb(null, 0, 0);
                }
            },
            function (flag, minId, cb) {
                if (1 === flag) {
                    let file = path + '/' + data.comp_id + '/config_' + minId;
                    let stmt = 'rm -rf ' + file;
                    hdrcom.pub.exe_shell(stmt)
                        .then(function () {
                            cb(null);
                        }, function (err) {
                            cb(err);
                        });
                } else {
                    cb(null);
                }
            },
            function (cb) {
                hdrcom.pub.getDipId(req.dbhdr, hdrcfg.cfg.type.SYNC)
                    .then(function (dipId) {
                        id = dipId;
                        cb(null);
                    }, function (err) {
                        cb(err);
                    });
            },
            function (cb) {
                sql = [];
                val = [];
                /* insert T_SYNC_EXPORT_PARAM and T_SYNC_IMPORT_PARAM */
                if (hdrcom.pub.isEmptyObj(data.exp)) {
                    sql.push('INSERT INTO ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM + '(SET_ID, GROUP_ID, LOADER_ID)' +
                        ' VALUES (?, ?, ?)');
                    val.push([id, data.group, data.comp_id]);
                } else {
                    sql.push('INSERT INTO ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM +
                        ' (SET_ID, GROUP_ID, LOADER_ID, EXP_MODE, EXP_NUM, EXP_PARALLEL_NUM, FILE_SIZE, EXP_DICT_ONLY, EXP_STRING, EXP_SCN, EXP_NLS_LANG, EXP_USE_ETL, EXP_USE_SOURCE_TBS,' +
                        ' EXP_CREATE_TABLE, EXP_CREATE_INDEX, EXP_CREATE_OBJECT, EXP_PARAM_CTIME)' +
                        ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    val.push([id, data.group, data.comp_id, data.exp.exp_mode,
                        undefined !== data.exp.exp_simu ? data.exp.exp_simu : 0, undefined !== data.exp.exp_tab_simu ? data.exp.exp_tab_simu : 0,
                        undefined !== data.exp.file_size ? data.exp.file_size : 32, undefined !== data.exp.exp_dict_only ? data.exp.exp_dict_only : 0,
                        undefined !== data.exp.exp_string ? data.exp.exp_string : 0, undefined !== data.exp.exp_scn ? data.exp.exp_scn : 0,
                        undefined !== data.exp.exp_nls_lang ? data.exp.exp_nls_lang : '', undefined !== data.exp.exp_use_etl ? data.exp.exp_use_etl : 0,
                        undefined !== data.exp.exp_source_tab ? data.exp.exp_source_tab : 0, undefined !== data.exp.exp_create_table ? data.exp.exp_create_table : 1,
                        undefined !== data.exp.exp_create_index ? data.exp.exp_create_index : 1, undefined !== data.exp.exp_create_object ? data.exp.exp_create_object : 0,
                        dt().format('YYYY-MM-DD HH:mm:ss')]);
                }

                if (hdrcom.pub.isEmptyObj(data.imp)) {
                    sql.push('INSERT INTO ' + hdrcfg.cfg.table_name.T_SYNC_IMPORT_PARAM + '(SET_ID, GROUP_ID, LOADER_ID)' +
                        ' VALUES (?, ?, ?)');
                    val.push([id, data.group, data.comp_id]);
                } else {
                    let map_id;
                    if (undefined === data.imp.imp_mmap_id || 0 === data.imp.imp_mmap_id.length) {
                        map_id = 0;
                    } else {
                        map_id = data.imp.imp_mmap_id;
                    }
                    sql.push('INSERT INTO ' + hdrcfg.cfg.table_name.T_SYNC_IMPORT_PARAM +
                        ' (SET_ID, GROUP_ID, LOADER_ID, IMP_MMAP_ID, IMP_MODE, IMP_NUM, IMP_PARALLEL_NUM, IMP_DICT_ONLY, IMP_WRITE_LOG, IMP_REBUILD_TABLE, IMP_TRUNCATE_TABLE, IMP_REBUILD_INDEX, ' +
                        ' IMP_REBUILD_OBJECT, IMP_NLS_LANG, IMP_BACKUP_FILE, IMP_PARAM_CTIME, IMP_ORA_DP, IMP_USE_TBS_MAP)' +
                        ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    val.push([id, data.group, data.comp_id, map_id, data.imp.imp_mode,
                        undefined !== data.imp.imp_simu ? data.imp.imp_simu : 0, undefined !== data.imp.imp_tab_simu ? data.imp.imp_tab_simu : 1,
                        undefined !== data.imp.imp_dict_only ? data.imp.imp_dict_only : 0, undefined !== data.imp.imp_write_log ? data.imp.imp_write_log : 0,
                        undefined !== data.imp.imp_rebuild_tab ? data.imp.imp_rebuild_tab : 1, undefined !== data.imp.imp_truncate_tab ? data.imp.imp_truncate_tab : 1,
                        undefined !== data.imp.imp_rebuild_ind ? data.imp.imp_rebuild_ind : 1, undefined !== data.imp.imp_rebuild_object ? data.imp.imp_rebuild_object : 0,
                        undefined !== data.imp.imp_nls_lang ? data.imp.imp_nls_lang : '', undefined !== data.imp.imp_backup_file ? data.imp.imp_backup_file : 1,
                        dt().format('YYYY-MM-DD HH:mm:ss'), undefined !== data.imp.imp_ora_op ? data.imp.imp_ora_op : 0, undefined !== data.imp.imp_use_tabs_map ? data.imp.imp_use_tabs_map : 0]);
                }
                cb(null);
            },
            function (cb) {
                /* save import appoint table*/
                if ('0' === data.imp.imp_mode && 0 != data.imp.imp_schema.length) {
                    save_appoint(1, data.imp.imp_schema, id, sql, val)
                        .done(function () {
                            cb(null);
                        }, function (err) {
                            cb(err);
                        })
                } else {
                    cb(null);
                }
            },
            function (cb) {
                /* save export appoint table*/
                if ('0' === data.exp.exp_mode && 0 !== data.exp.exp_schema.length) {
                    save_appoint(0, data.exp.exp_schema, id, sql, val)
                        .done(function () {
                            cb(null);
                        }, function (err) {
                            cb(err);
                        })
                } else {
                    cb(null);
                }
            },
            function (cb) {
                /* save table-space */
                if (undefined !== data.imp.table_space && 0 !== data.imp.table_space.length) {
                    save_table_sapce(data.imp.table_space, id, sql, val)
                        .done(function () {
                            cb(null);
                        }, function (err) {
                            cb(err);
                        })
                } else {
                    cb(null);
                }
            },
            function (cb) {
                let pms = Array.from(val, function (item, index) {
                    return hdrcom.db.preSql(req.dbhdr, sql[index], item);
                });

                q.all(pms)
                    .then(function () {
                        cb(null);
                    }, function (err) {
                        console.error(err);
                        cb(err);
                    });
            },
            function (cb) {
                let file = path + '/' + data.comp_id + '/config_' + id;
                let stmt = 'mkdir -p ' + file;
                hdrcom.pub.exe_shell(stmt)
                    .then(function () {
                        cb(null);
                    }, function (err) {
                        cb(err);
                    });
            }
        ], function (err) {
            if (err) {
                console.error(err);
                mydefer.reject(err);
            } else {
                mydefer.resolve(id);
            }
        });
        return mydefer.promise;
    }

    function doJob() {
        return new Promise((resolve, reject)=> {
            initEnv(req)
                .then(save_cfg)
                .done(function (data) {
                    hdrcom.db.dbCommit(req.dbhdr).catch(err=> {
                        console.error(err);
                    });
                    hdrcom.db.closeDB(req.dbhdr);
                    console.info('Add fullsync config success');
                    //hdrcom.pub.processResult(res, {sync_id: data}, 1);
                    resolve({sync_id: data});
                }, function (err) {
                    hdrcom.db.dbRollback(req.dbhdr).catch(err=> {
                        console.error(err);
                    });
                    hdrcom.db.closeDB(req.dbhdr);

                    console.error(err);
                    console.error('Add fullsync config fail');

                    if (undefined === err.msg || 0 === err.msg.length) {
                        err.msg = hdrcfg.msg[err.code];
                    }
                    //hdrcom.pub.processResult(res, {error_code: err.code, error_msg: err.code + ':' + err.msg}, 0);
                    reject(err);
                })
        })

    }

    return doJob();
}

function query_map_list(req, res) {
    let db;

    async function judge_map_file() {
        let sql = 'SELECT SET_ID id, GROUP_ID grp, LOADER_ID ld ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM;

        let result = await hdrcom.db.preSql(db, sql, []);
        let dir = [];

        if (0 < result.length) {
            for (let i = 0; i < result.length; i++) {
                let stmt = path.join(process.env['DIP_HOME'], 'sync', result[i].grp, result[i].ld, `config_${result[i].id}`, 'object_name.ctl');
                try {
                    fs.accessSync(stmt, fs.constants.F_OK);
                } catch (err) {
                    console.error(err);
                    continue;
                }
                dir.push({sync_id: result[i].id, group: result[i].grp, comp_id: result[i].ld});
            }
        }

        return dir;
    }

    async function doJob() {
        try {
            console.info('[query_map_list begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let result = await judge_map_file();
            //hdrcom.pub.processResult(res, {list: result}, true);
            console.info("[query_map_list success.]");
            return {list: result};
        } catch (err) {
            console.error(err);
            //hdrcom.pub.processResult(res, err, false);
            console.info("[query_map_list fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_db_tablespaces(req, res) {
    let db;
    let dbOra;

    async function get_table_space() {
        let sql = 'SELECT PARAM_VALUE usr ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM +
            ' WHERE COMP_ID = ? ' +
            '   AND PARAM_NAME = ? ';

        let userRec = await hdrcom.db.preSql(db, sql, [req.body.request.comp_id, 'db_user']);

        sql = 'SELECT TABLESPACE_NAME SPC ' +
            ' FROM DBA_TABLES ' +
            ' WHERE OWNER = upper(?) ' +
            ' AND TABLESPACE_NAME is not null ' +
            '   GROUP BY TABLESPACE_NAME';

        dbOra = await hdrcom.pub.openAsignDB(db, req.body.request.comp_id, hdrcfg.cfg.db_type[0]);
        let spcRec = await hdrcom.db.executeStrSql(dbOra, sql, [userRec[0].usr]);
        let result = [];
        spcRec.forEach(e=> {
            result.push(e.SPC);
        })
        return result;
    }

    async function doJob() {
        try {
            console.info('[query_db_tablespaces begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let result = await get_table_space();
            //hdrcom.pub.processResult(res, {table_space: result}, true);
            console.info("[query_db_tablespaces success.]");
            return {table_space: result};
        } catch (err) {
            console.error(err);
            //hdrcom.pub.processResult(res, err, false);
            console.info("[query_db_tablespaces fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
            dbOra && hdrcom.db.closeStrDB(dbOra);
        }
    }

    return doJob();
}

function query_full_sync_history(req, res) {
    let db;

    async function get_history() {
        let sql = 'SELECT SET_ID sync_id ' +
            '  FROM ' + hdrcfg.cfg.table_name.T_SYNC_EXPORT_PARAM +
            ' WHERE GROUP_ID = ? ' +
            '   AND LOADER_ID = ?';
        let val = [req.body.request.group, req.body.request.comp_id];

        return await hdrcom.db.preSql(db, sql, val);
    }

    async function doJob() {
        try {
            console.info('[query_full_sync_history begin]');
            await hdrcom.pub.checkMd5(req.body);
            db = await hdrcom.db.openDb();
            let result = await get_history();
            //hdrcom.pub.processResult(res, {list: result}, true);
            console.info("[query_full_sync_history success.]");
            return {list: result};
        } catch (err) {
            console.error(err);
            //hdrcom.pub.processResult(res, err, false);
            console.info("[query_full_sync_history fail.]");
            return err;
        } finally {
            db && await hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

module.exports = {
    query_full_sync_filter: query_full_sync_filter,
    create_sync_cfg: create_sync_cfg,
    query_map_list: query_map_list,
    query_db_tablespaces: query_db_tablespaces,
    query_full_sync_history: query_full_sync_history
};
