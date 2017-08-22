/**
 * Created by on 2016/12/13.
 */
let hdrcom = require('../common');
let hdrcfg = require('../../config');

let async = require('async');
let q = require('q');

function query_etl_config(body, res) {
    let etl_id = body.request.component_id;
    let db_id = body.request.db_component_name;
    let db_type = body.request.db_type;
    let dbCom = '';
    let db = '';


    async function query_etl_params() {
        console.info("query etl params.");
        let resJson = {};
        resJson.cset = {};
        resJson.ncset = {};
        resJson.cbset = {};
        resJson.ncbset = {};
        resJson.tset = {};

        if ('oracle' === db_type) {
            dbCom = await hdrcom.pub.openAsignDB(db, db_id, db_type);

            let nls = await hdrcom.pub.get_nls_lang(dbCom);
            let cset = nls.nls_characterset;
            let ncset = nls.nchar_charset;

            let clobset = '';
            let nclobset = '';

            if (cset === 'US7ASCII')
                clobset = cset;
            else
                clobset = "AL16UTF16";

            if (ncset === 'US7ASCII')
                nclobset = ncset;
            else
                nclobset = "AL16UTF16";

            resJson.cset.real_charset = cset;
            resJson.cset.charset = [cset];

            resJson.ncset.real_ncharset = ncset;
            resJson.ncset.ncharset = [ncset];

            resJson.cbset.real_clobset = clobset;
            resJson.cbset.clobset = [clobset];

            resJson.ncbset.real_nclobset = nclobset;
            resJson.ncbset.nclobset = [nclobset];
        }

        if (!etl_id || 'undefined' === etl_id) { //id is not exist
            console.info("etl id is not exist.");

            if (db_type !== 'oracle') {
                resJson.cset.real_charset = "GBK";
                resJson.ncset.real_ncharset = "UTF16";
                resJson.cbset.real_clobset = "GBK";
                resJson.ncbset.real_nclobset = "UTF16";
            }
            resJson.tset.real_tar_set = "GBK";
            resJson.interval = '';
        } else {
            let sql = 'SELECT PARAM_NAME, PARAM_VALUE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' WHERE COMP_ID = ? AND PARAM_TYPE = ?';
            let params = [etl_id, 'NORMAL'];

            let rs = await hdrcom.db.preSql(db, sql, params);

            if (rs.length > 0) {
                let charset = '';
                let ncharset = '';
                let clobset = '';
                let nclobset = '';
                let tar_set = '';
                let full_string = '';
                let interval = '';

                for (let x = 0; x < rs.length; x++) {
                    if (rs[x].PARAM_NAME === 'charset')
                        charset = rs[x].PARAM_VALUE;
                    else if (rs[x].PARAM_NAME === 'ncharset')
                        ncharset = rs[x].PARAM_VALUE;
                    else if (rs[x].PARAM_NAME === 'clobset')
                        clobset = rs[x].PARAM_VALUE;
                    else if (rs[x].PARAM_NAME === 'nclobset')
                        nclobset = rs[x].PARAM_VALUE;
                    else if (rs[x].PARAM_NAME === 'tar_set')
                        tar_set = rs[x].PARAM_VALUE;
                    else if (rs[x].PARAM_NAME === 'full_string')
                        full_string = rs[x].PARAM_VALUE;
                    else if (rs[x].PARAM_NAME === 'interval')
                        interval = rs[x].PARAM_VALUE;
                }

                if (db_type !== 'oracle') {
                    resJson.cset.real_charset = charset;
                    resJson.ncset.real_ncharset = ncharset;
                    resJson.cbset.real_clobset = clobset;
                    resJson.ncbset.real_nclobset = nclobset;
                }

                resJson.tset.real_tar_set = tar_set;
                resJson.interval = interval;
                resJson.full_string = full_string;
            } else {
                throw {error_code: hdrcfg.code.ENOENT, error_msg: hdrcfg.msg[hdrcfg.code.ENOENT]};
            }
        }

        if (db_type != 'oracle') {
            resJson.cset.charset = [];
            resJson.ncset.ncharset = [];
            resJson.cbset.clobset = [];
            resJson.ncbset.nclobset = [];

            for (let x = 0; x < hdrcfg.cfg.char_set_list.length; x++) {
                resJson.cset.charset.push(hdrcfg.cfg.char_set_list[x]);
                resJson.ncset.ncharset.push(hdrcfg.cfg.char_set_list[x]);
                resJson.cbset.clobset.push(hdrcfg.cfg.char_set_list[x]);
                resJson.ncbset.nclobset.push(hdrcfg.cfg.char_set_list[x]);
            }
        }

        resJson.tset.tar_set = [];
        for (let x = 0; x < hdrcfg.cfg.char_set_list.length; x++) {
            resJson.tset.tar_set.push(hdrcfg.cfg.char_set_list[x]);
        }

        return resJson;

    };

    async function doJob() {
        try {
            console.info('[query_etl_config begin]');

            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_etl_params();

            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_config success]');
            return result;
        } catch (err) {
            console.error(err);
            console.error('[query_etl_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            
            return err;
        } finally {
            if (db_type === 'oracle')
                dbCom && await hdrcom.db.closeStrDB(dbCom);
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_etl_user(body, res) {
    let db;
    let dbCom = '';
    let db_id = body.request.db_component_name;
    let db_type = body.request.db_type;

    async function query_user() {
        dbCom = await hdrcom.pub.openAsignDB(db, db_id, db_type);
        let sqlUser = hdrcom.pub.getUserSqltext(db_type);
        let rsUser = await hdrcom.db.executeStrSql(dbCom, sqlUser, []);
        let list = [];
        rsUser.forEach(e=> {
            list.push(e.USERNAME);
        });
        return {user: list};
    }

    async function doJob() {
        try {
            console.info('[query_etl_user begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_user();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_user success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_user fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
            dbCom && hdrcom.db.closeStrDB(dbCom);
        }
    }

    return doJob();
}

function query_etl_table(body, res) {
    let db;
    let dbCom = '';


    async function query_table() {
        let db_type = "";
        let db_id = "";
        let user = "";
        if (body.request) {
            db_type = body.request.db_type;
            db_id = body.request.db_component_name;
            user = body.request.user;
        } else {
            db_type = body.db_type;
            db_id = body.db_component_name;
            user = body.user;
        }

        dbCom = await hdrcom.pub.openAsignDB(db, db_id, db_type);
        let sql = hdrcom.pub.getTableSqltext(db_type, 'TABLE');
        let result = await hdrcom.db.executeStrSql(dbCom, sql, [user]);
        let list = [];
        if ('db2' === db_type) {
            result.forEach(e=> {
                list.push(e.NAME);
            })
        } else {
            result.forEach(e=> {
                list.push(e.name);
            })
        }
        return {tables: list};
    }

    async function doJob() {
        try {
            console.log('[query_etl_table begin]')
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_table();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_table success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_table fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
            dbCom && hdrcom.db.closeStrDB(dbCom);
        }
    }

    return doJob();
}

function query_etl_table_rule(body, res) {
    let db;
    
    async function query_etl_rule() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;

        let resJson = [];
        let rule_type = [hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN, hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN, hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER, hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING, hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT, hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM];

        for (let x = 0; x < rule_type.length; x++) {
            let ret = await hdrcom.pub.getEtlRules(db, etl_id, user, table, rule_type[x]);
            if (ret){
                resJson.push(rule_type[x]);
            }
        }
        
        return resJson;
    }

    async function doJob() {
        try {
            console.log('[query_etl_table_rule begin]')
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_etl_rule();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_table_rule success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_table_rule fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function save_etl_table_rule(body, res) {
    let db;

    async function save_etl_rule() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;
        let save_rules = body.request.rules;
        let del_rule = body.request.del_rule;
        
        let ruleIdx;

        for (let i = 0; i < save_rules.length; i++) {
            ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, save_rules[i].name);
            await hdrcom.pub.dealRuleTable(db, ruleIdx, save_rules[i].name, table, user, 'ADD');
        }

        if (del_rule) {
            ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, del_rule);
            await hdrcom.pub.dealRuleTable(db, ruleIdx, del_rule, table, user, 'DEL')
        }
        
        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info('[save_etl_table_rule begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);

            let result = await save_etl_rule();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true);
            console.info("[save_etl_table_rule success.]");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_table_rule fail]');
            //hdrcom.pub.processResult(res, err, false);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_column_list(body, res) {
    let db;
    let dbCom = '';
    let db_type = body.request.db_type;
    let user = body.request.user;
    let table = body.request.table;
    let db_id = body.request.db_component_name;
    let exist_list = body.request.exist_list;

    async function get_column_list() {
        if (!hdrcom.pub.judge_dbType(db_type)) {
            console.error('Database type [%s] error', db_type);
            throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
        }

        dbCom = await hdrcom.pub.openAsignDB(db, db_id, db_type);
        let sql = hdrcom.pub.getColumnSqltext(db_type, user, table);
        let result = await hdrcom.db.executeStrSql(dbCom, sql, []);
        let col = [];
        result.forEach(e=> {
            if (-1 === exist_list.indexOf(e.column_name)) {
                col.push(e);
            }
        })

        return {list: col};
    }

    async function doJob() {
        try {
            console.info('[query_column_list begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await get_column_list();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_column_list success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_column_list fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            dbCom && hdrcom.db.closeStrDB(dbCom);
        }
    }

    return doJob();
}

function legal_check_expression(body, res) {
    let db;
    let db_type = body.request.db_type;
    let db_id = body.request.db_component_name;
    let user = body.request.user;
    let table = body.request.table;
    let connectDB = body.request.connect_db;
    let expression = new Buffer(body.request.expression, 'base64').toJSON().data;

    let judge_type_code = function (value) {
        switch (value) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
                return 1;

            case '+':
            case '-':
            case '*':
            case '/':
            case '%':
                return 6;

            case '(':
            case ')':
                return 2;

            case '&':
            case '|':
                return 3;

            case '!':
            case '=':
            case '<':
            case '>':
                return 4;

            case ' ' :
            case '\r':
            case '\n':
            case '\t':
            case '\v':
            case '\f':
                return 5;

            default:
                return 0;
        }
    }


    let filter_exp = function (exp) {
        let src = [];
        let rc = 0;

        let i = 0;
        while (exp[i] != undefined) {
            rc = hdrcom.pub.check_code_num(exp[i]);
            if (rc === 1) {
                if (exp[i] === ('\'').charCodeAt()) {
                    src.push(exp[i]);
                    i++;
                    while (1) {
                        if ((hdrcom.pub.check_code_num(exp[i]) === 1) && (exp[i] === ('\'').charCodeAt())) {
                            src.push(exp[i]);
                            break;
                        }

                        src.push(exp[i]);
                        i++;
                    }
                } else {
                    if (judge_type_code(String.fromCharCode(exp[i])) != 5) {
                        src.push(exp[i]);
                    }
                }
                i++;
            } else {
                while (rc != 0) {
                    src.push(exp[i]);
                    i++;
                    rc--;
                }
            }
        }
        return src;
    }

    let translate_exp = function (src) {
        let src_tran = [];
        let i = 0;
        let rc = 0;

        while (src[i] != undefined) {
            rc = hdrcom.pub.check_code_num(src[i]);
            if (rc === 1) {
                if ((String.fromCharCode(src[i]) === 'a') && (String.fromCharCode(src[i + 1]) === 'n') && (String.fromCharCode(src[i + 2]) === 'd')
                    && (String.fromCharCode(src[i - 1]) === ')') && (src[i + 3] === '(')) {
                    src_tran.push(('&').charCodeAt());
                    src_tran.push(('&').charCodeAt());
                    i += 3;
                } else if ((String.fromCharCode(src[i]) === 'o') && (String.fromCharCode(src[i + 1]) === 'r')
                    && (String.fromCharCode(src[i - 1]) === ')') && (String.fromCharCode(src[i + 2]) === '(' )) {
                    src_tran.push(('|').charCodeAt());
                    src_tran.push(('|').charCodeAt());
                    i += 2;
                } else if ((String.fromCharCode(src[i]) === '>') && (String.fromCharCode(src[i + 1]) != '=')) {
                    src_tran.push(('>').charCodeAt());
                    src_tran.push(('>').charCodeAt());
                    i += 1;
                } else if ((String.fromCharCode(src[i]) === '<') && (String.fromCharCode(src[i + 1]) != '=')) {
                    src_tran.push(('<').charCodeAt());
                    src_tran.push(('<').charCodeAt());
                    i += 1;
                } else if ((String.fromCharCode(src[i]) === '<') && (String.fromCharCode(src[i + 1]) === '=')) {
                    src_tran.push(('<').charCodeAt());
                    src_tran.push(('=').charCodeAt());
                    i += 2;
                } else if ((String.fromCharCode(src[i]) === '=') && (String.fromCharCode(src[i - 1]) != '!')) {
                    src_tran.push(('=').charCodeAt());
                    src_tran.push(('=').charCodeAt());
                    i += 1;
                } else {
                    src_tran.push(src[i]);
                    i++;
                }
            } else {
                while (rc != 0) {
                    src_tran.push(src[i]);
                    i++;
                    rc--;
                }
            }
        }

        return src_tran;
    }

    async function check_src(src) {
        let i = 0;
        let l_number = 0, r_number = 0;
        let m, lm, rm;
        let rc;
        let retJson = {};

        retJson.flag = true;
        retJson.msg = '';

        while (src[i] !== undefined) {
            rc = hdrcom.pub.check_code_num(src[i]);
            if (rc === 1) {
                if (src[i] === '\'') {
                    i++;
                    while (1) {
                        if ((hdrcom.pub.check_code_num(src[i]) === 1) && (src[i] === '\'')) {
                            break;
                        }
                        i++;
                    }
                } else if (String.fromCharCode(src[i]) === '(') {
                    l_number++;
                } else if (String.fromCharCode(src[i]) === ')') {
                    r_number++;
                } else if (judge_type_code(String.fromCharCode(src[i])) === 3) {
                    if ((judge_type_code(String.fromCharCode(src[i + 1])) === 3) && (hdrcom.pub.check_code_num(src[i + 1]) === 1)) {
                        if ((String.fromCharCode(src[i - 1]) === ')') && (String.fromCharCode(src[i + 2]) === '(') && (hdrcom.pub.check_code_num(src[i - 1]) === 1) && (hdrcom.pub.check_code_num(src[i + 2]) === 1)) {
                            lm = 1;
                            rm = 1;
                            m = i - 2;
                            while (m >= 0) {
                                if (String.fromCharCode(src[m]) === '\'') {
                                    m--;
                                    while (1) {
                                        if ((hdrcom.pub.check_code_num(src[m]) === 1) && (String.fromCharCode(src[m]) === '\'')) {
                                            break;
                                        }
                                        m--;
                                    }
                                } else if (String.fromCharCode(src[m]) === ')') {
                                    lm++;
                                } else if (String.fromCharCode(src[m]) === '(') {
                                    lm--;
                                }
                                if (lm === 0) {
                                    break;
                                }
                                m--;
                            }
                            if (m < 0) {
                                retJson.flag = false;
                                retJson.msg = "lost '(' or ')'";
                                return retJson;
                            }

                            m = i + 3;
                            while (src[m] != undefined) {
                                rc = hdrcom.pub.check_code_num(src[m]);
                                if (rc === 1) {
                                    if (String.fromCharCode(src[m]) === '\'') {
                                        m++;
                                        while (1) {
                                            if ((hdrcom.pub.check_code_num(src[m]) === 1) && (String.fromCharCode(src[m]) === '\'')) {
                                                break;
                                            }
                                            m++;
                                        }
                                    } else if (String.fromCharCode(src[m]) === '(') {
                                        rm++;
                                    } else if (String.fromCharCode(src[m]) === ')') {
                                        rm--;
                                    }
                                    if (rm === 0) {
                                        break;
                                    }
                                    m++;
                                } else {
                                    while (rc != 0) {
                                        m++;
                                        rc--;
                                    }
                                }
                            }
                            if (rm != 0) {
                                retJson.flag = false;
                                retJson.msg = "lost '(' or ')'";
                                return retJson;
                            }
                        } else {
                            retJson.flag = false;
                            retJson.msg = "lost '(' or ')'";
                            return retJson;
                        }
                    } else {
                        retJson.flag = false;
                        retJson.msg = "'&' or '|'lost one";
                        return retJson;
                    }
                    i++;
                }
                i++;
            } else {
                while (rc != 0) {
                    i++;
                    rc--;
                }
            }
        }
        if (l_number != r_number) {
            console.error('lost \'(\' or \')\'');
            throw {message: 'expression error'}
        }
        return retJson;
    }


    async function check_expression() {
        console.info("check_expression.");
        let rc = 0;
        let rz = 0;
        let flag = 0;
        let ret_columns = [];

        if (connectDB === 'yes') {
            let i = 0;
            while (expression[i] != undefined) {
                rc = hdrcom.pub.check_code_num(expression[i]);

                if (rc === 1) {
                    if (expression[i] === 39) {
                        i++;
                        while (1) {
                            if (((rz = hdrcom.pub.check_code_num(expression[i])) === 1) && (expression[i] === ('\'').charCodeAt())) {
                                break;
                            } else {
                                i += rz;
                            }
                        }
                        i++;
                    } else {
                        if (expression[i] === (':').charCodeAt()) {
                            flag = 0;
                            if (i > 0 && expression[i - 1] === ('N').charCodeAt())
                                flag = 1;
                            else if (i > 0 && expression[i - 1] === ('O').charCodeAt())
                                flag = 2;
                            i++;

                            let col = [];
                            while (expression[i] != undefined) {
                                if ((rz = hdrcom.pub.check_code_num(expression[i])) > 1) {
                                    while (rz != 0) {
                                        col.push(expression[i]);
                                        i++;
                                        rz--;
                                    }
                                } else {
                                    if (((expression[i] > 47) && (expression[i] < 58)) ||
                                        ((expression[i] > 64) && (expression[i] < 91)) ||
                                        ((expression[i] > 96) && (expression[i] < 123)) ||
                                        (expression[i] === 95)) {
                                        col.push(expression[i]);
                                        i++;
                                    } else {
                                        break;
                                    }
                                }
                            }

                            let column_name = new Buffer(col).toString();
                            if (db_id && user && table) {
                                let columnJson = {};
                                columnJson.user = user;
                                columnJson.table = table;
                                columnJson.column_name = column_name;
                                await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
                            }

                            if (flag === 1) {
                                ret_columns.push('N:' + column_name);
                            } else if (flag === 2) {
                                ret_columns.push('O:' + column_name);
                            } else {
                                ret_columns.push(column_name);
                            }

                        } else {
                            i++;
                        }
                    }
                } else {
                    while (rc != 0) {
                        i++;
                        rc--;
                    }
                }
            }
        } else {
            console.info("not connect db.");
            let i = 0;
            while (expression[i] != undefined) {
                rc = hdrcom.pub.check_code_num(expression[i]);
                if (rc === 1) {
                    if (expression[i] === 39) {
                        i++;
                        while (1) {
                            if (((rz = hdrcom.pub.check_code_num(expression[i])) === 1) && (expression[i] === ('\'').charCodeAt())) {
                                break;
                            } else {
                                i += rz;
                            }
                        }
                        i++;
                    } else {
                        if (expression[i] === ('{').charCodeAt()) {
                            flag = 0;
                            if (i > 0 && (expression[i - 1] === ('N').charCodeAt()))
                                flag = 1;
                            else if (i > 0 && (expression[i - 1] === ('O').charCodeAt()))
                                flag = 2;

                            let col2 = [];
                            i++;
                            while (1) {
                                if (((rz = hdrcom.pub.check_code_num(expression[i])) === 1) && ((expression[i] === ('}').charCodeAt()))) {
                                    break;
                                }
                                while (rz != 0) {
                                    col2.push(expression[i]);
                                    i++;
                                    rz--;
                                }
                            }


                            let column_name1 = new Buffer(col2).toString();
                            if (flag === 1) {
                                ret_columns.push('N:' + column_name1);
                            }
                            else if (flag === 2) {
                                ret_columns.push('O:' + column_name1);
                            }
                            else {
                                ret_columns.push(column_name1);
                            }

                            if (db_id && user && table) {
                                let columnJson = {};
                                columnJson.user = user;
                                columnJson.table = table;
                                columnJson.column_name = column_name1;
                                await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
                            }

                        } else {
                            i++;
                        }
                    }
                } else {
                    while (rc != 0) {
                        i++;
                        rc--;
                    }
                }
            }
            console.info("to filter exp.");
            let src = filter_exp(expression);
            console.info("to translate exp.");
            let src_tran = translate_exp(src);
            console.info("to check src exp.");
            await check_src(src_tran);
        }

        return {"column_name": ret_columns};
    }

    async function doJob() {
        try {
            console.log('[legal_check_expression begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await check_expression();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[legal_check_expression success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[legal_check_expression fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();

}

function save_etl_add_config(body, res) {
    let db;

    async function save_add_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let tmpTable = body.request.table;
        let other_tables = body.request.other_tables;
        other_tables.push(tmpTable);
        let ruleList = body.request.list;

        let db_id = body.request.db_component_name;
        let db_type = body.request.db_type;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN);

        for (let i = 0; i < other_tables.length; i++) {
            let table = other_tables[i];
            //删除表数据
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, user + '.' + table];
            await hdrcom.db.preSql(db, sql, params);

            //插入表数据
            for (let j = 0; j < ruleList.length; j++) {
                let ruleType = hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN;
                let columnName = ruleList[j].column_name;
                let dataType = ruleList[j].data_type;

                if (ruleList[j].data_type === 'expression') {

                    let connectDB = ruleList[j].connect_db;
                    let orglExpression = new Buffer(ruleList[j].expression, 'base64');
                    let sqlExpression = '';
                    let dbName = '';
                    let bindName = '';

                    if (connectDB === 'yes') {
                        if (!hdrcom.pub.isEmptyObj(ruleList[j].db_info)) {
                            dbName = ruleList[j].db_info.db_name;
                            let dbType = ruleList[j].db_info.db_type;
                            if (dbName) {
                                await hdrcom.pub.dealDBinfo(db, ruleList[j].db_info, 'INS');
                            }
                            if (dbType)
                                sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, dbType);
                        } else
                            sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, db_type);
                    }

                    for (let y = 0; y < ruleList[j].bind_name.length; y++) {
                        bindName = bindName + ruleList[j].bind_name[y] + ',';
                        if (db_id) {
                            let columnJson = {};
                            columnJson.user = user;
                            columnJson.table = table;

                            if (ruleList[j].bind_name[y][1] === ':' || ruleList[j].bind_name[y][1] === '{')
                                columnJson.column_name = ruleList[j].bind_name[y].substr(2);
                            else
                                columnJson.column_name = ruleList[j].bind_name[y];

                            await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
                        }
                    }

                    if (!bindName)
                        bindName = null;

                    let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + '(SET_ID, RULE_TYPE, OBJECT, COLUMN_NAME, DATA_TYPE, COLUMN_SOURCE, COLUMN_VALUE, SQL_EXPRESSION, CONNECT_DB, DBNAME, BIND_NAME) values (?, ?, ?, ?, ?, ? ,?, ?, ?, ? ,?)';
                    let params = [ruleIdx, ruleType, user + '.' + table, columnName, dataType, 'expression', orglExpression.toString(), sqlExpression, connectDB, dbName, bindName];
                    await hdrcom.db.preSql(db, sql, params);
                } else {
                    let columnSource = '';
                    let columnValue = '';

                    if (dataType === 'sysdata')
                        columnSource = ruleList[j].column_value;
                    else if (dataType === 'string') {
                        columnSource = 'string';
                        columnValue = ruleList[j].column_value;
                    }

                    if (!columnValue)
                        columnValue = null;

                    let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + '(SET_ID, RULE_TYPE, OBJECT, COLUMN_NAME, DATA_TYPE, COLUMN_SOURCE, COLUMN_VALUE) values (?, ?, ?, ?, ? ,?, ?)';
                    let params = [ruleIdx, ruleType, user + '.' + table, columnName, dataType, columnSource, columnValue];
                    await hdrcom.db.preSql(db, sql, params);
                }
            }
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_add_config begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_add_config();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_add_config success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_add_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}

function get_same_rule(obj) {

    let mydefer = q.defer();
    hdrcom.db.executeAsyn(obj.db, obj.sql, obj.params)
        .done(function (data) {
            if (0 === data.length) {
                mydefer.resolve();
            } else {
                let i = 0;
                for (; i < data.length; i++) {
                    if (data[i].tab === obj.table) {
                        break;
                    }
                }

                if (i !== data.length) {
                    let list = [];
                    let scm = obj.table.split('.')[0];
                    data.forEach(function (e) {
                        let tmp = e.tab.split('.');
                        if (tmp[0] === scm && e.tab !== obj.table && e.col === data[i].col) {
                            list.push(tmp[1]);
                        }
                    });

                    obj.result.select_tab = list;
                }
                mydefer.resolve();
            }
        }, function (err) {
            mydefer.reject(err);
        })

    return mydefer.promise;
}

function query_etl_add_config(body, res) {
    let db;

    async function query_add_config() {
        let group = body.request.group;
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;
        let list = [];

        let result = {};

        result.database = await hdrcom.pub.getGroupDBinfo(db, group);
        //add
        let sql = 'SELECT c.COLUMN_NAME, c.DATA_TYPE, c.COLUMN_SOURCE, c.COLUMN_VALUE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.OBJECT = ? and c.DATA_TYPE IS NOT NULL and c.DATA_TYPE != ? order by c.SET_ID';
        let params = [etl_id, hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN, 'EXTERNAL', user + '.' + table, 'expression'];
        let ret = await hdrcom.db.preSql(db, sql, params);
        ret.forEach(e=> {
            if ('string' === e.DATA_TYPE) {
                list.push({column_name: e.COLUMN_NAME, data_type: e.DATA_TYPE, column_value: e.COLUMN_VALUE})
            } else {
                list.push({column_name: e.COLUMN_NAME, data_type: e.DATA_TYPE, column_value: e.COLUMN_SOURCE})
            }
        })

        sql = 'SELECT c.COLUMN_NAME, c.DATA_TYPE, c.COLUMN_VALUE, c.CONNECT_DB, c.DBNAME, c.BIND_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.OBJECT = ? and c.DATA_TYPE = ? order by c.SET_ID';
        params = [etl_id, hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN, 'EXTERNAL', user + '.' + table, 'expression'];
        ret = await hdrcom.db.preSql(db, sql, params);

        for (let i = 0; i < ret.length; i++) {
            let info = {};
            let bind = [];
            if (ret[i].DBNAME) {
                info = await hdrcom.pub.dealDBinfo(db, {"db_name": ret[i].DBNAME}, 'QRY');
            }

            if (ret[i].BIND_NAME) {
                bind = ret[i].BIND_NAME.split(',');
            }
            list.push({
                column_name: ret[i].COLUMN_NAME,
                data_type: ret[i].DATA_TYPE,
                expression: (new Buffer(ret[i].COLUMN_VALUE).toString('base64')),
                connect_db: ret[i].CONNECT_DB,
                db_name: ret[i].DBNAME,
                bind_name: bind,
                db_info: info
            });
        }
        result.list = list;

        // get the same rule object
        let obj = {
            db: db,
            sql: 'SELECT c.OBJECT tab, GROUP_CONCAT(CASE WHEN c.COLUMN_NAME   IS NULL THEN \'\' ELSE c.COlUMN_NAME   END, ' +
            ' CASE WHEN c.DATA_TYPE     IS NULL THEN \'\' ELSE c.DATA_TYPE     END, ' +
            ' CASE WHEN c.COLUMN_SOURCE IS NULL THEN \'\' ELSE c.COLUMN_SOURCE END, ' +
            ' CASE WHEN c.COLUMN_VALUE  IS NULL THEN \'\' ELSE c.COLUMN_VALUE  END, ' +
            ' CASE WHEN c.CONNECT_DB    IS NULL THEN \'\' ELSE c.CONNECT_DB    END, ' +
            ' CASE WHEN c.DBNAME        IS NULL THEN \'\' ELSE c.DBNAME        END ORDER BY c.COLUMN_NAME) col ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + ' c ' +
            ' WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID ' +
            ' GROUP BY c.OBJECT',
            params: [etl_id, hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN, 'EXTERNAL'],
            table: user + '.' + table,
            result: result
        };

        await get_same_rule(obj);

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_add_config begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_add_config();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_add_config success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_add_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function save_etl_delete_config(body, res) {
    let db;

    async function save_delete_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let tmpTable = body.request.table;
        let other_tables = body.request.other_tables;
        other_tables.push(tmpTable);

        let ruleList = body.request.list;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN);

        for (let i = 0; i < other_tables.length; i++) {
            //delete origin data
            let table = other_tables[i];
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, user + '.' + table];
            await hdrcom.db.preSql(db, sql, params);

            //insert new data
            for (let j = 0; j < ruleList.length; j++) {
                let type = ruleList[j].column_type;

                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN + '(SET_ID, RULE_TYPE, OBJECT, COLUMN_NAME, COLUMN_TYPE) values (?, ?, ?, ?, ?)';
                let params = [ruleIdx, hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN, user + '.' + table, ruleList[j].column_name, !type ? null : type];
                await hdrcom.db.preSql(db, sql, params);
            }
        }
        return "SUCCESS";
    }

    async function doJob() {
        try {
            console.info("[save_etl_delete_config begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_delete_config();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_delete_config success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_delete_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}

function query_etl_delete_config(body, res) {
    let db;

    async function query_delete_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;

        //delete
        let sql = 'SELECT c.COLUMN_NAME column_name, c.COLUMN_TYPE column_type FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.OBJECT = ? and c.COLUMN_NAME IS NOT NULL order by c.SET_ID';
        let params = [etl_id, hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN, 'EXTERNAL', user + '.' + table];

        let result = await hdrcom.db.preSql(db, sql, params);

        //get has the same rule object
        let obj = {
            db: db,
            sql: 'SELECT c.OBJECT tab, CASE WHEN c.COLUMN_NAME IS NULL THEN \'\' ELSE c.COlUMN_NAME END col ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN + ' c ' +
            ' WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID ' +
            ' GROUP BY c.OBJECT',
            params: [etl_id, hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN, 'EXTERNAL'],
            table: user + '.' + table,
            result: {list: result}
        };

        await get_same_rule(obj);
        return obj.result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_delete_config begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_delete_config();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_delete_config success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_delete_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();

}

function save_etl_map_config(body, res) {
    let db;

    async function save_map_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let tmpTable = body.request.table;
        let other_tables = body.request.other_tables;
        other_tables.push(tmpTable);
        let ruleList = body.request.list;

        let db_id = body.request.db_component_name;
        let db_type = body.request.db_type;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING);

        for (let i = 0; i < other_tables.length; i++) {
            let table = other_tables[i];
            //删除表数据
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, user + '.' + table];
            await hdrcom.db.preSql(db, sql, params);

            //插入表数据
            for (let j = 0; j < ruleList.length; j++) {
                let ruleType = hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING;
                let columnName = ruleList[j].column_name;
                let columnType = ruleList[j].column_type;
                let mapName = ruleList[j].map_name;
                let mapType = ruleList[j].map_type;

                if (ruleList[j].expression) {

                    let connectDB = ruleList[j].connect_db;
                    let orglExpression = new Buffer(ruleList[j].expression, 'base64');
                    let sqlExpression = '';
                    let dbName = '';
                    let bindName = '';

                    if (connectDB === 'yes') {
                        if (!hdrcom.pub.isEmptyObj(ruleList[j].db_info)) {
                            dbName = ruleList[j].db_info.db_name;
                            let dbType = ruleList[j].db_info.db_type;
                            if (dbName) {
                                await hdrcom.pub.dealDBinfo(db, ruleList[j].db_info, 'INS');
                            }
                            if (dbType)
                                sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, dbType);
                        } else
                            sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, db_type);
                    }

                    for (let y = 0; y < ruleList[j].bind_name.length; y++) {
                        bindName = bindName + ruleList[j].bind_name[y] + ',';
                        if (db_id) {
                            let columnJson = {};
                            columnJson.user = user;
                            columnJson.table = table;

                            if (ruleList[j].bind_name[y][1] === ':' || ruleList[j].bind_name[y][1] === '{')
                                columnJson.column_name = ruleList[j].bind_name[y].substr(2);
                            else
                                columnJson.column_name = ruleList[j].bind_name[y];

                            await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
                        }
                    }

                    let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING + '(SET_ID, RULE_TYPE, OBJECT, COLUMN_NAME, COLUMN_TYPE, MAPPING_NAME,  MAPPING_TYPE, ORGL_EXPRESSION, SQL_EXPRESSION, CONNECT_DB, DBNAME, BIND_NAME) values (?, ?, ?, ?, ? ,?, ?, ?, ? ,?, ?, ?)';
                    let params = [ruleIdx, ruleType, user + '.' + table, columnName, columnType, mapName, mapType, orglExpression.toString(), sqlExpression, connectDB, dbName, bindName ? bindName : null];
                    await hdrcom.db.preSql(db, sql, params);
                } else {
                    let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING + '(SET_ID, RULE_TYPE, OBJECT, COLUMN_NAME, COLUMN_TYPE, MAPPING_NAME, MAPPING_TYPE) values (?, ?, ?, ?, ? ,?, ?)';
                    let params = [ruleIdx, ruleType, user + '.' + table, columnName, columnType, mapName, !mapType ? null : mapType];
                    await hdrcom.db.preSql(db, sql, params);
                }
            }
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_map_config begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_map_config();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_map_config success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_map_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}

function query_etl_map_config(body, res) {
    let db;

    async function query_map_config() {
        let group = body.request.group;
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;
        let list = [];
        let result = {};
        result.database = await hdrcom.pub.getGroupDBinfo(db, group);

        let sql = 'SELECT c.COLUMN_NAME, c.COLUMN_TYPE, c.MAPPING_NAME, c.MAPPING_TYPE, c.ORGL_EXPRESSION, c.CONNECT_DB, c.DBNAME, c.BIND_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.OBJECT = ? and c.COLUMN_NAME IS NOT NULL order by c.SET_ID';
        let params = [etl_id, hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING, 'EXTERNAL', user + '.' + table];

        let ret = await hdrcom.db.preSql(db, sql, params);

        for (let i = 0; i < ret.length; i++) {
            let info = {};
            let bind = [];
            let exp = '';
            if (ret[i].ORGL_EXPRESSION)
                exp = new Buffer(ret[i].ORGL_EXPRESSION).toString('base64');
            if (ret[i].DBNAME) {
                info = await hdrcom.pub.dealDBinfo(db, {"db_name": ret[i].DBNAME}, 'QRY');
            }

            if (ret[i].BIND_NAME) {
                bind = ret[i].BIND_NAME.split(',');
            }
            list.push({
                column_name: ret[i].COLUMN_NAME,
                column_type: ret[i].COLUMN_TYPE,
                expression: exp,
                map_name: ret[i].MAPPING_NAME,
                map_type: ret[i].MAPPING_TYPE,
                connect_db: ret[i].CONNECT_DB,
                db_name: ret[i].DBNAME,
                bind_name: bind,
                db_info: info
            })
        }
        result.list = list;
result.select_tab = [];
        let obj = {
            db: db,
            sql: 'SELECT c.OBJECT tab, GROUP_CONCAT(CASE WHEN c.COLUMN_NAME   IS NULL THEN \'\' ELSE c.COlUMN_NAME END ,' +
            ' CASE WHEN c.COLUMN_TYPE    IS NULL THEN \'\' ELSE c.COLUMN_TYPE END, ' +
            ' CASE WHEN c.MAPPING_NAME IS NULL THEN \'\' ELSE c.MAPPING_NAME END, ' +
            ' CASE WHEN c.ORGL_EXPRESSION IS NULL THEN \'\' ELSE c.ORGL_EXPRESSION END, ' +
            ' CASE WHEN c.CONNECT_DB IS NULL THEN \'\' ELSE c.CONNECT_DB END , ' +
            ' CASE WHEN c.DBNAME IS NULL THEN \'\' ELSE c.DBNAME END ORDER BY c.COLUMN_NAME) col  ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING + ' c ' +
            ' WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID ' +
            ' GROUP BY c.OBJECT',
            params: [etl_id, hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING, 'EXTERNAL'],
            table: user + '.' + table,
            result: result
        };

        await get_same_rule(obj);

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_map_config begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_map_config();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_map_config success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_map_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return er;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();

}

function save_etl_condition_config(body, res) {
    let db;

    async function save_condition_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let tmpTable = body.request.table;
        let other_tables = body.request.other_tables;
        other_tables.push(tmpTable);

        let ruleList = body.request.list;

        let db_id = body.request.db_component_name;
        let db_type = body.request.db_type;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER);

        for (let i = 0; i < other_tables.length; i++) {
            let table = other_tables[i];
            //删除表数据
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, user + '.' + table];
            await hdrcom.db.preSql(db, sql, params);

            //插入表数据
            for (let j = 0; j < ruleList.length; j++) {
                let ruleType = hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER;

                let connectDB = ruleList[j].connect_db;
                let option = ruleList[j].option;
                let orglExpression = new Buffer(ruleList[j].expression, 'base64');
                let sqlExpression = '';
                let dbName = '';
                let bindName = '';

                if (connectDB === 'yes') {
                    if (!hdrcom.pub.isEmptyObj(ruleList[j].db_info)) {
                        dbName = ruleList[j].db_info.db_name;
                        let dbType = ruleList[j].db_info.db_type;
                        if (dbName) {
                            await hdrcom.pub.dealDBinfo(db, ruleList[j].db_info, 'INS');
                        }
                        if (dbType)
                            sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, dbType);
                    } else
                        sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, db_type);
                }

                for (let y = 0; y < ruleList[j].bind_name.length; y++) {
                    bindName = bindName + ruleList[j].bind_name[y] + ',';
                    if (db_id) {
                        let columnJson = {};
                        columnJson.user = user;
                        columnJson.table = table;
                        if (ruleList[j].bind_name[y][1] === ':' || ruleList[j].bind_name[y][1] === '{')
                            columnJson.column_name = ruleList[j].bind_name[y].substr(2);
                        else
                            columnJson.column_name = ruleList[j].bind_name[y];
                        await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
                    }
                }
                if (!bindName)
                    bindName = null;
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER + '(SET_ID, RULE_TYPE, OBJECT, ORGL_EXPRESSION, SQL_EXPRESSION, OPTION1, CONNECT_DB, DBNAME, BIND_NAME) values (?, ?, ?, ?, ? ,?, ?, ?, ?)';
                let params = [ruleIdx, ruleType, user + '.' + table, orglExpression.toString(), sqlExpression, option, connectDB, dbName, bindName];
                await hdrcom.db.preSql(db, sql, params);
            }
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_condition_config begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_condition_config();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_condition_config success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_condition_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}

function query_etl_condition_config(body, res) {
    let db;

    async function query_condition_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;
        let AddList = [];

        let sql = 'SELECT c.ORGL_EXPRESSION, c.OPTION1, c.CONNECT_DB, c.DBNAME, c.BIND_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.OBJECT = ? and c.ORGL_EXPRESSION IS NOT NULL order by c.SET_ID';
        let params = [etl_id, hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER, 'EXTERNAL', user + '.' + table];

        let ret = await hdrcom.db.preSql(db, sql, params);

        for (let i = 0; i < ret.length; i++) {
            let AddJson = {};
            AddJson.expression = new Buffer(ret[i].ORGL_EXPRESSION).toString('base64');
            AddJson.option = ret[i].OPTION1;
            AddJson.connect_db = ret[i].CONNECT_DB;
            AddJson.db_name = ret[i].DBNAME;
            AddJson.bind_name = [];
            if (ret[i].BIND_NAME) {
                let tmp = ret[i].BIND_NAME.split(",");
                for (let j = 0; j < tmp.length - 1; j++)
                    AddJson.bind_name.push(tmp[j]);
            }

            if (ret[i].DBNAME) {
                let info = await hdrcom.pub.dealDBinfo(db, {"db_name": ret[i].DBNAME}, 'QRY');
                AddJson.db_info = info;
            }

            AddList.push(AddJson);
        }

        let obj = {
            db: db,
            sql: 'SELECT c.OBJECT tab, GROUP_CONCAT(CASE WHEN c.ORGL_EXPRESSION IS NULL THEN \'\' ELSE c.ORGL_EXPRESSION END, ' +
            ' CASE WHEN c.OPTION1    IS NULL THEN \'\' ELSE c.OPTION1    END, ' +
            ' CASE WHEN c.CONNECT_DB IS NULL THEN \'\' ELSE c.CONNECT_DB END, ' +
            ' CASE WHEN c.DBNAME     IS NULL THEN \'\' ELSE c.DBNAME     END ORDER BY c.ORGL_EXPRESSION DESC) col ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER + ' c ' +
            ' WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID ' +
            ' GROUP BY c.OBJECT',
            params: [etl_id, hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER, 'EXTERNAL'],
            table: user + '.' + table,
            result: {list: AddList}
        }

        await get_same_rule(obj)
        return obj.result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_condition_config begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_condition_config();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_condition_config success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_condition_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();

}

function save_etl_transform_config(body, res) {
    let db;

    async function save_transform_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let tmpTable = body.request.table;
        let other_tables = body.request.other_tables;
        other_tables.push(tmpTable);
        let ruleList = body.request.list;

        let keep_copy = body.request.keep_copy;
        let table_suffix = body.request.table_suffix;
        let table_prefix = body.request.table_prefix;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT);

        for (let i = 0; i < other_tables.length; i++) {
            let table = other_tables[i];
            //删除表数据
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, user + '.' + table];
            await hdrcom.db.preSql(db, sql, params);

            //插入表数据
            for (let j = 0; j < ruleList.length; j++) {
                let ruleType = hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT;

                let columnName = ruleList[j].column_name;
                let dataType = ruleList[j].data_type;
                let columnSource = null;
                let columnValue = null;

                if (dataType === 'sysdata') {
                    if (ruleList[j].column_value)
                        columnSource = ruleList[j].column_value;
                } else if (dataType === 'string') {
                    columnSource = 'string';
                    if (ruleList[j].column_value)
                        columnValue = ruleList[j].column_value;
                }
                if (!columnValue)
                    columnValue = null;
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT + '(SET_ID, RULE_TYPE, OBJECT, TABLE_PREFIX, TABLE_SUFFIX, KEEP_COPY, COLUMN_NAME, DATA_TYPE, COLUMN_SOURCE, COLUMN_VALUE) values (?, ?, ?, ?, ? ,?, ?, ?, ?, ?)';
                let params = [ruleIdx, ruleType, user + '.' + table, table_prefix, table_suffix, keep_copy, columnName, dataType, columnSource, columnValue];
                await hdrcom.db.preSql(db, sql, params);
            }
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_transform_config begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_transform_config();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_transform_config success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_transform_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}

function query_etl_transform_config(body, res) {
    let db;

    async function query_transform_config() {
        let group = body.request.group;
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;

        let AddList = [];
        let dbList = [];
        let ret = await hdrcom.pub.getGroupDBinfo(db, group);
        if (ret)
            dbList = ret;
        let retJson = {};
        retJson.database = dbList;
        retJson.list = AddList;

        let sql = 'SELECT c.TABLE_PREFIX, c.TABLE_SUFFIX, c.KEEP_COPY, c.COLUMN_NAME, c.DATA_TYPE, c.COLUMN_SOURCE, c.COLUMN_VALUE FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.OBJECT = ? and c.COLUMN_NAME IS NOT NULL order by c.SET_ID';
        let params = [etl_id, hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT, 'EXTERNAL', user + '.' + table];

        let rs1 = await hdrcom.db.preSql(db, sql, params);

        for (let i = 0; i < rs1.length; i++) {
            let AddJson = {};
            AddJson.column_name = rs1[i].COLUMN_NAME;
            AddJson.data_type = rs1[i].DATA_TYPE;
            if (rs1[i].DATA_TYPE === 'string')
                AddJson.column_value = rs1[i].COLUMN_VALUE;
            else
                AddJson.column_value = rs1[i].COLUMN_SOURCE;

            AddList.push(AddJson);

            if (i === 0) {
                retJson.table_prefix = rs1[i].TABLE_PREFIX;
                retJson.table_suffix = rs1[i].TABLE_SUFFIX;
                retJson.keep_copy = rs1[i].KEEP_COPY;
            }
        }

        let obj = {
            db: db,
            sql: 'SELECT c.OBJECT tab, GROUP_CONCAT(CASE WHEN c.TABLE_PREFIX IS NULL THEN \'\' ELSE c.TABLE_PREFIX END, ' +
            ' CASE WHEN c.TABLE_SUFFIX IS NULL THEN \'\' ELSE c.TABLE_SUFFIX END, ' +
            ' CASE WHEN c.KEEP_COPY    IS NULL THEN \'\' ELSE c.KEEP_COPY END, ' +
            ' CASE WHEN c.COLUMN_NAME  IS NULL THEN \'\' ELSE c.COlUMN_NAME END, ' +
            ' CASE WHEN c.DATA_TYPE    IS NULL THEN \'\' ELSE c.DATA_TYPE END, ' +
            ' CASE WHEN c.COLUMN_VALUE IS NULL THEN \'\' ELSE c.COLUMN_VALUE END ORDER BY c.COLUMN_NAME) col  ' +
            ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT + ' c ' +
            ' WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID ' +
            ' GROUP BY c.OBJECT',
            params: [etl_id, hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT, 'EXTERNAL'],
            table: user + '.' + table,
            result: retJson
        }

        await get_same_rule(obj)

        return obj.result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_transform_config begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_transform_config();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_transform_config success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_transform_config fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function save_etl_convert(body, res) {
    let db;

    async function save_config() {
        let etl_id = body.request.component_name;
        let user = body.request.user;
        let table = body.request.table;
        let type = body.request.operation.oper_type;

        let db_id = body.request.db_component_name;
        let db_type = body.request.db_type;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM);

        let typeName = '';
        if (type === 'inserttoupdate')
            typeName = 'insert_to_update';
        else if (type === 'updatetoinsert')
            typeName = 'update_to_insert_or_delete';
        else if (type === 'deletetoupdate')
            typeName = 'delete_to_update';

        if ('delete_to_update' === typeName) {
            //delete T_ETL_DELETE_TO_UPDATE_COLUMN
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_DELETE_TO_UPDATE_COLUMN + ' where SET_ID = ? and OBJECT = ?';
            await hdrcom.db.preSql(db, sql, [ruleIdx, user + '.' + table]);

            //delete T_ETL_ADD_COLUMN
            sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN + ' where SET_ID = ? and OBJECT = ?';
            await hdrcom.db.preSql(db, sql, [ruleIdx, user + '.' + table]);

        }

        //删除表数据
        let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM + ' where SET_ID = ? and RULE_TYPE = ? and OBJECT = ?';
        let params = [ruleIdx, typeName, user + '.' + table];
        await hdrcom.db.preSql(db, sql, params);

        //插入表数据
        let ruleType = typeName;
        let connectDB = body.request.operation.connect_db;
        let orglExpression = new Buffer(body.request.operation.expression, 'base64');
        let sqlExpression = '';
        let dbName = '';
        let bindName = '';

        if (connectDB === 'yes') {
            if (!hdrcom.pub.isEmptyObj(body.request.operation.db_info)) {
                dbName = body.request.operation.db_info.db_name;
                let dbType = body.request.operation.db_info.db_type;
                if (dbName) {
                    await hdrcom.pub.dealDBinfo(db, body.request.operation.db_info, 'INS');
                }
                if (dbType)
                    sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, dbType);
            } else
                sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, db_type);
        }

        for (let i = 0; i < body.request.operation.bind_name.length; i++) {
            bindName = bindName + body.request.operation.bind_name[i] + ',';
            if (db_id) {
                let columnJson = {};
                columnJson.user = user;
                columnJson.table = table;

                if (body.request.operation.bind_name[i][1] === ':' || body.request.operation.bind_name[i][1] === '{')
                    columnJson.column_name = body.request.operation.bind_name[i].substr(2);
                else
                    columnJson.column_name = body.request.operation.bind_name[i];

                await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
            }
        }
        if (!bindName)
            bindName = null;
        sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM + '(SET_ID, RULE_TYPE, OBJECT, ORGL_EXPRESSION, SQL_EXPRESSION, CONNECT_DB, DBNAME, BIND_NAME) values (?, ?, ?, ?, ? ,?, ?, ?)';
        params = [ruleIdx, ruleType, user + '.' + table, orglExpression.toString(), sqlExpression, connectDB, dbName, bindName];
        await hdrcom.db.preSql(db, sql, params);

        if ('delete_to_update' === typeName) {
            //insert T_ETL_DELETE_TO_UPDATE_COLUMN
            let res_col = body.request.reserve_column;
            let add_col = body.request.add_column;
            let sql = '';
            if ('yes' === body.request.reserve_all) {
                sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_DELETE_TO_UPDATE_COLUMN +
                    '(SET_ID, RESERVE_ALL, OBJECT) values (?, ?, ?)';
                await hdrcom.db.preSql(db, sql, [ruleIdx, 'yes', user + '.' + table]);
            } else {
                sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_DELETE_TO_UPDATE_COLUMN +
                    '(SET_ID, RESERVE_ALL, OBJECT, COLUMN_NAME, COLUMN_TYPE) values (?, ?, ?, ?, ?)';
                let task = [];
                for (let i = 0; i < res_col.length; i++) {
                    task.push(hdrcom.db.preSql(db, sql, [ruleIdx, 'no', user + '.' + table, res_col[i].name, res_col[i].type]));
                }

                await Promise.all(task);
            }

            //insert T_ETL_ADD_COLUMN
            let task = [];
            sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN +
                '(SET_ID, RULE_TYPE, OBJECT, COLUMN_NAME, DATA_TYPE, COLUMN_SOURCE, COLUMN_VALUE) values (?, ?, ?, ?, ?, ?, ?)';
            for (let i = 0; i < add_col.length; i++) {
                task.push(hdrcom.db.preSql(db, sql, [ruleIdx, 'add_column', user + '.' + table, add_col[i].name, add_col[i].type, add_col[i].source, add_col[i].value]));
            }

            await Promise.all(task);
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_convert begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_config();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_convert success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_convert fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();

}

function query_etl_convert(body, res) {
    let db;

    async function query_config() {
        let etl_id = body.request.component_name;
        let type = body.request.oper_type;
        let user = body.request.user;
        let table = body.request.table;

        let typeName = '';
        if (type === 'inserttoupdate')
            typeName = 'insert_to_update';
        else if (type === 'updatetoinsert')
            typeName = 'update_to_insert_or_delete';
        else if (type === 'deletetoupdate')
            typeName = 'delete_to_update';

        let sql = 'SELECT c.SET_ID, c.ORGL_EXPRESSION, c.CONNECT_DB, c.DBNAME, c.BIND_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.RULE_TYPE = ? and c.OBJECT = ? order by c.SET_ID';
        let params = [etl_id, hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM, 'EXTERNAL', typeName, user + '.' + table];

        let ret = await hdrcom.db.preSql(db, sql, params);

        let AddJson = {};
        for (let i = 0; i < ret.length; i++) {
            AddJson.expression = new Buffer(ret[i].ORGL_EXPRESSION).toString('base64');
            AddJson.connect_db = ret[i].CONNECT_DB;
            AddJson.db_name = ret[i].DBNAME;
            AddJson.bind_name = [];
            if (ret[i].BIND_NAME) {
                AddJson.bind_name = ret[i].BIND_NAME.split(',');
            }

            if (ret[i].DBNAME) {
                let info = await hdrcom.pub.dealDBinfo(db, {"db_name": ret[i].DBNAME}, 'QRY');
                AddJson.db_info = info;
            }

            if (type === 'deletetoupdate') {
                //add column
                //reserve column
                let sql = 'SELECT COLUMN_NAME name, DATA_TYPE type, COLUMN_SOURCE source, COLUMN_VALUE value' +
                    ' FROM ' + hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN +
                    ' WHERE SET_ID = ? ' +
                    '   AND OBJECT = ? ' +
                    '  ORDER BY COLUMN_NAME';
                let AddCol = await hdrcom.db.preSql(db, sql, [ret[i].SET_ID, user + '.' + table]);


                if (AddCol.length === 0) {
                    AddJson.add_column = [];
                } else {
                    AddJson.add_column = AddCol;
                }

                //reserve column
                sql = 'SELECT COLUMN_NAME name, COLUMN_TYPE type' +
                    ' FROM ' + hdrcfg.cfg.table_name.T_ETL_DELETE_TO_UPDATE_COLUMN +
                    ' WHERE SET_ID = ? ' +
                    '   AND OBJECT = ? ' +
                    '  ORDER BY OBJECT, COLUMN_NAME';
                let ResCol = await hdrcom.db.preSql(db, sql, [ret[i].SET_ID, user + '.' + table]);

                if (0 < ResCol.length) {
                    if (ResCol[0].name === null || ResCol[0].type === null) {
                        AddJson.reserve_all = 'yes';
                    } else {
                        AddJson.reserve_all = 'no';
                        AddJson.column = ResCol;
                    }
                } else {
                    AddJson.reserve_all = 'no';
                    AddJson.column = ResCol;
                }
            }
        }

        return AddJson;
    }

    async function doJob() {
        try {
            console.info('[query_etl_convert begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_config();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_convert success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_convert fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function save_etl_table_filter(body, res) {
    let db;

    async function save_table_filter() {

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, body.request.component_name, hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER);

        for (let i = 0; i < body.request.list.length; i++) {

            //删除表数据
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, body.request.list[i].user];

            await hdrcom.db.preSql(db, sql, params);

            let task = [];
            for (let j = 0; j < body.request.list[i].list.length; j++) {
                let tableName = body.request.list[i].list[j];
                let sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER + '(SET_ID, RULE_TYPE, OBJECT, CLUDE, TABLE_NAME) values (?, ?, ?, ?, ?)';
                let params = [ruleIdx, hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER, body.request.list[i].user, body.request.list[i].flag, !tableName ? null : tableName];
                task.push(hdrcom.db.preSql(db, sql, params));
            }

            await Promise.all(task);
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_table_filter begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_table_filter();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_table_filter success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_table_filter fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();

}

function query_etl_table_filter(body, res) {
    let db;
    let dbCom;

    async function query_table_filter() {
        if (!hdrcom.pub.judge_dbType(body.request.db_type)) {
            throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
        }

        dbCom = await hdrcom.pub.openAsignDB(db, body.request.db_component_name, body.request.db_type);

        let sql = hdrcom.pub.getTableSqltext(body.request.db_type, 'TABLE');
        let retTab = await hdrcom.db.executeStrSql(dbCom, sql, [body.request.user]);

        sql = 'SELECT c.CLUDE, c.TABLE_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID AND c.OBJECT = ?';
        let params = [body.request.component_name, hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER, 'EXTERNAL', body.request.user];
        let ret = await hdrcom.db.preSql(db, sql, params);

        let result = {};
        result.flag = "INCLUDE";
        result.tables = [];
        result.list = [];
        if (0 < ret.length) {
            result.flag = ret[0].CLUDE;
            ret.forEach(e=> {
                result.tables.push(e.TABLE_NAME);
            })
        }

        let table;
        retTab.forEach(e=> {
            table = 'db2' === body.request.db_type ? e.NAME : e.name;

            let i = 0;
            for (; i < ret.lengh; i++) {
                if (table === ret[i].TABLE_NAME) {
                    break;
                }
            }

            if (i === ret.length) {
                result.list.push(table);
            }
        });

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_table_filter begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_table_filter();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_table_filter success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_table_filter fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
            dbCom && hdrcom.db.closeStrDB(dbCom);
        }
    }

    return doJob();

}

function save_etl_operation_filter(body, res) {
    let db;

    async function save_oper_filter() {
        let etl_id = body.request.component_name;
        let db_id = body.request.db_component_name;
        let db_type = body.request.db_type;

        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER);

        for (let i = 0; i < body.request.list.length; i++) {
            let list = body.request.list[i].list;
            //删除表数据
            let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_FILTER + ' where SET_ID = ? and OBJECT = ?';
            let params = [ruleIdx, body.request.list[i].user];
            await hdrcom.db.preSql(db, sql, params);

            for (let j = 0; j < list.length; j++) {
                let tableName = list[j].name;
                let tableIns = list[j].tab_ins;
                let tableDel = list[j].tab_del;
                let tableUpt = list[j].tab_upt;
                if (tableIns)
                    tableIns = '101';
                if (tableDel)
                    tableDel = '103';
                if (tableUpt)
                    tableUpt = '102';

                let con_db = list[j].connect_db;
                let orglExpression = new Buffer(list[j].expression, 'base64');

                let sqlExpression = '';
                let dbName = '';
                let bindName = '';

                if (con_db === 'yes') {
                    if (!hdrcom.pub.isEmptyObj(list[j].dbInfo)) {
                        dbName = list[j].dbInfo.db_name;
                        let dbType = list[j].dbInfo.db_type;
                        if (dbName) {
                            await hdrcom.pub.dealDBinfo(db, list[j].dbInfo, 'INS');
                        }
                        if (dbType)
                            sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, dbType);
                    } else
                        sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, db_type);
                }

                for (let z = 0; z < list[j].bdList.length; z++) {
                    bindName = bindName + list[j].bdList[z] + ',';
                    if (db_id) {
                        let columnJson = {};
                        columnJson.user = body.request.list[i].user;
                        columnJson.table = tableName;
                        //columnJson.column_name = list[j].bdList[z];

                        if (list[j].bdList[z][1] === ':' || list[j].bdList[z][1] === '{')
                            columnJson.column_name = list[j].bdList[z].substr(2);
                        else
                            columnJson.column_name = list[j].bdList[z];

                        await hdrcom.pub.check_etl_column(db, db_id, db_type, columnJson, 'LEVEL_A');
                    }
                }

                sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_FILTER + '(SET_ID, RULE_TYPE, OBJECT, TABLE_NAME, ORGL_EXPRESSION, SQL_EXPRESSION, CONNECT_DB, DBNAME, BIND_NAME, INSERT_FLAG, DELETE_FLAG, UPDATE_FLAG) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                params = [ruleIdx, hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER, body.request.list[i].user, tableName, orglExpression.toString(), sqlExpression, con_db, dbName, bindName, tableIns, tableDel, tableUpt];
                await hdrcom.db.preSql(db, sql, params);
            }
        }

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_etl_operation_filter begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_oper_filter();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_etl_operation_filter success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_etl_operation_filter fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_etl_operation_filter(body, res) {
    let db;
    let dbCom;

    async function query_table_filter() {
        if (!hdrcom.pub.judge_dbType(body.request.db_type)) {
            throw {error_code: hdrcfg.code.EDBTYPE, error_msg: hdrcfg.msg[hdrcfg.code.EDBTYPE]};
        }

        dbCom = await hdrcom.pub.openAsignDB(db, body.request.db_component_name, body.request.db_type);

        let sql = hdrcom.pub.getTableSqltext(body.request.db_type, 'TABLE');

        let retTab = await hdrcom.db.executeStrSql(dbCom, sql, [body.request.user]);

        sql = 'SELECT c.TABLE_NAME, c.ORGL_EXPRESSION, c.CONNECT_DB, c.DBNAME, c.BIND_NAME, c.INSERT_FLAG, c.DELETE_FLAG, c.UPDATE_FLAG FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_FILTER + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID AND c.OBJECT = ?';
        let params = [body.request.component_name, hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER, 'EXTERNAL', body.request.user];

        let ret = await hdrcom.db.preSql(db, sql, params);

        let result = {};
        result.list = [];

        for (let i = 0; i < ret.length; i++) {
            let tmpJson = {};
            tmpJson.tab_name = ret[i].TABLE_NAME;
            tmpJson.tab_ins = ret[i].INSERT_FLAG === '101';
            tmpJson.tab_del = ret[i].DELETE_FLAG === '103';
            tmpJson.tab_upt = ret[i].UPDATE_FLAG === '102';

            if (ret[i].ORGL_EXPRESSION) {
                tmpJson.expression = new Buffer(ret[i].ORGL_EXPRESSION).toString('base64');
                tmpJson.bdList = [];
                tmpJson.connect_db = ret[i].CONNECT_DB;
                if (ret[i].BIND_NAME) {
                    tmpJson.bdList = ret[i].BIND_NAME.split(",");
                }

                if (ret[i].DBNAME) {
                    let info = await hdrcom.pub.dealDBinfo(db, {"db_name": ret[i].DBNAME}, 'QRY');
                    tmpJson.dbInfo = info;
                }
            }

            result.list.push(tmpJson);
        }

        retTab.forEach(e=> {
            let table = 'db2' === body.request.db_type ? e.NAME : e.name;
            let i = 0;
            for (; i < ret.length; i++) {
                if (table === ret[i].TABLE_NAME) {
                    break;
                }
            }
            if (i === ret.length) {
                result.list.push({tab_name: table, tab_ins: false, tab_del: false, tab_upt: false})
            }
        });

        return result;
    }

    async function doJob() {
        try {
            console.info('[query_etl_operation_filter begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_table_filter();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_etl_operation_filter success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_etl_operation_filter fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
            dbCom && hdrcom.db.closeStrDB(dbCom);
        }
    }

    return doJob();
}

function save_batch_codevalue(body, res) {
    let db;

    async function save_codevalue() {
        let etl_id = body.request.component_name;
        let rule_type = body.request.rule_type;
        let batch_rule = body.request.batchRules;

        let sql = '';
        let params = [];
        let ruleIdx = await hdrcom.pub.getRuleIndex(db, etl_id, rule_type);

        for (let i = 0; i < batch_rule.length; i++) {
            let task = [];
            sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_BATCH_RULES + ' where SET_ID = ? and RULE_SET_TYPE = ? and RULE_SET_NAME = ?';
            params = [ruleIdx, rule_type, batch_rule[i].name];
            task.push(hdrcom.db.preSql(db, sql, params));
            batch_rule[i].codes.forEach(e=> {
                sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_BATCH_RULES + '(SET_ID, RULE_SET_TYPE, RULE_SET_NAME, CODER, VALUE) values (?, ?, ?, ?, ?)';
                params = [ruleIdx, rule_type, batch_rule[i].name, e.code, !e.value ? null : e.value];
                task.push(hdrcom.db.preSql(db, sql, params));
            });

            await Promise.all(task);
        }
        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_batch_codevalue begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_codevalue();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_batch_codevalue success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_batch_codevalue fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_batch(body, res) {
    let db;

    async function get_batch() {
        let sql = "select rule_set_name from " + hdrcfg.cfg.table_name.T_ETL_RULE_SET + " where group_id = ? and rule_set_type = ?";
        let params = [body.request.group, body.request.rule_type];

        let ret = await hdrcom.db.preSql(db, sql, params);
        let result = [];
        ret.forEach(e=> {
            result.push(e.rule_set_name);
        });

        return {batch_name:result};
    }

    async function doJob() {
        try {
            console.info('[query_batch begin]');
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await get_batch();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info('[query_batch success]');
            return result;
        } catch (err) {
            console.info(err);
            console.info('[query_batch fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_batch_rule(body, res) {
    let db;

    let group = body.request.group;
    let batch_name = body.request.batch_name;
    let rule_type = body.request.rule_type;

    async function get_batch_rule() {
        let sql = "select cache from " + hdrcfg.cfg.table_name.T_WEB_CACHE + " where comp_id = ?";
        let params = [group + '_' + rule_type + '_' + batch_name];

        let ret = await hdrcom.db.preSql(db, sql, params);
        let result = {};
        result.rules = [];
        if (0 < ret.length) {
            result.rules = JSON.parse(ret[0].cache);
        }

        return result;
    }

    async function doJob() {
        try {
            console.info("[query_batch_rule begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await get_batch_rule();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[query_batch_rule success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            console.error('[query_batch_rule fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_batch_checked(body, res) {
    let db;
    let rule_type = body.request.rule_type;

    async function get_batch_checked() {
        let sql = "select c.RULE_SET_NAME, GROUP_CONCAT(c.CODER separator '#') AS CODER, GROUP_CONCAT(c.VALUE separator '#') AS VALUE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " a, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " b, " + hdrcfg.cfg.table_name.T_ETL_BATCH_RULES + " c where a.COMP_ID = ? and a.PARAM_NAME = ? and a.PARAM_TYPE = ? and a.PARAM_VALUE = b.ID and b.ID = c.SET_ID and c.RULE_SET_TYPE = ? group by c.RULE_SET_NAME";

        let params = [body.request.component_name, rule_type, 'EXTERNAL', rule_type];

        let batRule = await hdrcom.db.preSql(db, sql, params);

        sql = "select RULE_SET_NAME FROM " + hdrcfg.cfg.table_name.T_ETL_RULE_SET + " where GROUP_ID = ? and RULE_SET_TYPE = ?";
        params = [body.request.group, rule_type === hdrcfg.cfg.object_set_type.ETL_BATCH_FILTER ? rule_type : 'transform'];

        let ruleSet = await hdrcom.db.preSql(db, sql, params);

        let result = [];
        for (let i = 0; i < ruleSet.length; i++) {

            sql = "select distinct REPVALUE FROM " + hdrcfg.cfg.table_name.T_ETL_RULE_SET_DETAIL + " where GROUP_ID = ? and RULE_SET_TYPE = ? and RULE_SET_NAME = ?";

            params = [body.request.group, rule_type === hdrcfg.cfg.object_set_type.ETL_BATCH_FILTER ? rule_type : 'transform', ruleSet[i].RULE_SET_NAME];

            let ruleCode = await hdrcom.db.preSql(db, sql, params);

            for (var j = 0; j < batRule.length; j++){
                if (ruleSet[i].RULE_SET_NAME === batRule[j].RULE_SET_NAME){
                    break;
                }
            }

            if (batRule.length === j) {
                if (0 < ruleCode.length) {
                    let keyVal = [];
                    ruleCode.forEach(e=> {
                        keyVal.push({code: e.REPVALUE, value: ''});
                    });

                    result.push({name: ruleSet[i].RULE_SET_NAME, checked: false, codes: keyVal});
                } else {
                    result.push({name: ruleSet[i].RULE_SET_NAME, checked: false, codes: []});
                }
            } else {
                if (0 < ruleCode.length) {
                    let keyVal = [];
                    ruleCode.forEach(e=> {
                        let codes;
                        let values;
                        if (batRule[j].CODER && batRule[j].VALUE) {

                            codes = batRule[j].CODER.split('#');
                            values = batRule[j].VALUE.split('#');
                            codes.forEach((item, index)=> {
                                keyVal.push({code: item, value: values[index]});
                            })
                        } else {
                            keyVal.push({code: e.REPVALUE, value: ''});
                        }
                    });
                    result.push({name: ruleSet[i].RULE_SET_NAME, checked: false, codes: keyVal});
                } else {
                    result.push({name: ruleSet[i].RULE_SET_NAME, checked: true, codes: []});
                }
            }
        }

        return {list: result};
    }

    async function doJob() {
        try {
            console.info("[query_batch_checked begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await get_batch_checked();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[query_batch_checked success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            console.error('[query_batch_checked fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

function query_etl_rule_ptable(body, res) {
    let db;

    async function query_ptable() {
        let etl_id = body.request.component_name;
        let rule_type = body.request.rule_type;

        let tableName = '';
        if (rule_type === hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN) {
            tableName = hdrcfg.cfg.table_name.T_ETL_ADD_COLUMN;
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN) {
            tableName = hdrcfg.cfg.table_name.T_ETL_DELETE_COLUMN;
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING) {
            tableName = hdrcfg.cfg.table_name.T_ETL_COLUMN_MAPPING;
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER) {
            tableName = hdrcfg.cfg.table_name.T_ETL_RECORD_FILTER;
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT) {
            tableName = hdrcfg.cfg.table_name.T_ETL_TABLE_AUDIT;
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER) {
            tableName = hdrcfg.cfg.table_name.T_ETL_TABLE_FILTER;
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER) {
            tableName = hdrcfg.cfg.table_name.T_ETL_OPERATION_FILTER;
        }

        let sql = '';
        let params = [];
        if (rule_type === hdrcfg.cfg.object_set_type.ETL_ADD_COLUMN ||
            rule_type === hdrcfg.cfg.object_set_type.ETL_DELETE_COLUMN ||
            rule_type === hdrcfg.cfg.object_set_type.ETL_COLUMN_MAPPING ||
            rule_type === hdrcfg.cfg.object_set_type.ETL_TABLE_AUDIT) {
            sql = 'SELECT distinct c.OBJECT FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + tableName + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.COLUMN_NAME IS NOT NULL';

        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_RECORD_FILTER) {
            sql = 'SELECT distinct c.OBJECT FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + tableName + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.ORGL_EXPRESSION IS NOT NULL';
        }

        if ('insert_to_update' === rule_type || 'delete_to_update' === rule_type || 'update_to_insert_or_delete' === rule_type) {
            sql = 'SELECT c.OBJECT obj ' +
                ' FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + hdrcfg.cfg.table_name.T_ETL_OPERATION_TRANSFORM + ' c ' +
                ' WHERE a.COMP_ID = ? ' +
                '   AND a.PARAM_NAME = ? ' +
                '   AND a.PARAM_TYPE = ? ' +
                '   AND a.PARAM_VALUE = b.ID ' +
                '   AND b.ID = c.SET_ID ' +
                '   AND c.RULE_TYPE = ?';

            params = [body.request.component_name, hdrcfg.cfg.object_set_type.ETL_OPERATION_TRANSFORM, 'EXTERNAL', rule_type];

            let ret = await hdrcom.db.preSql(db, sql, params);
            let dim = [];
            let tmp = [];
            ret.forEach(e=> {
                tmp = e.obj.split('.');
                dim.push({user: tmp[0] || '', table: tmp[1] || ''});
            });

            return {list: dim};
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_TABLE_FILTER) {

            sql = 'SELECT c.OBJECT, c.TABLE_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + tableName + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.CLUDE = ?';

            params = [etl_id, rule_type, 'EXTERNAL', 'include'];

            let inTab = await hdrcom.db.preSql(db, sql, params);


            sql = 'SELECT c.OBJECT, c.TABLE_NAME FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + tableName + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID and c.CLUDE = ?';

            params = [etl_id, rule_type, 'EXTERNAL', 'exclude'];

            let exTab = await hdrcom.db.preSql(db, sql, params);

            let inArray = [];
            let exArray = [];

            inTab.forEach(e=> {
                inArray.push({user: e.OBJECT, table: e.TABLE_NAME});
            });

            exTab.forEach(e=> {
                inArray.push({user: e.OBJECT, table: e.TABLE_NAME});
            });

            return {include: inArray, exclude: exArray};
        } else if (rule_type === hdrcfg.cfg.object_set_type.ETL_OPERATION_FILTER) {
            sql = 'SELECT c.OBJECT, c.TABLE_NAME, c.ORGL_EXPRESSION, c.INSERT_FLAG, c.DELETE_FLAG, c.UPDATE_FLAG FROM ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' a, ' + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + ' b, ' + tableName + ' c WHERE a.COMP_ID = ? AND a.PARAM_NAME = ? AND a.PARAM_TYPE = ? AND a.PARAM_VALUE = b.ID AND b.ID = c.SET_ID';

            params = [etl_id, rule_type, 'EXTERNAL'];

            let ret = await hdrcom.db.preSql(db, sql, params);

            let result = [];
            ret.forEach(e=> {
                if (e.ORGL_EXPRESSION) {
                    result.push({
                        user: e.OBJECT,
                        table: e.TABLE_NAME,
                        tab_ins: '101' === e.INSERT_FLAG,
                        tab_upt: '102' === e.UPDATE_FLAG,
                        tab_del: '103' === e.DELETE_FLAG,
                        expression: new Buffer(e.ORGL_EXPRESSION).toString('base64')
                    });
                } else {
                    result.push({
                        user: e.OBJECT,
                        table: e.TABLE_NAME,
                        tab_ins: '101' === e.INSERT_FLAG,
                        tab_upt: '102' === e.UPDATE_FLAG,
                        tab_del: '103' === e.DELETE_FLAG
                    });
                }
            });

            return {list:result};
        } else {
            params = [etl_id, rule_type, 'EXTERNAL'];

            let ret = await hdrcom.db.preSql(db, sql, params);
            let result = [];
            let tmp = [];
            ret.forEach(e=> {
                if (0 < e.OBJECT.indexOf('.')) {
                    tmp = e.OBJECT.split('.');
                    result.push({user: tmp[0], table: tmp[1]});
                } else {
                    result.push({user: '', table: ''});
                }
            });

            return {list: result};
        }
    }

    async function doJob() {
        try {
            console.info("[query_etl_rule_ptable begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            let result = await query_ptable();
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[query_etl_rule_ptable success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            console.error('[query_etl_rule_ptable fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();

}

function save_batch_rule(body, res) {
    let db;

    async function save_rule() {
        let group = body.request.group;
        let rule_type = body.request.rule_type;
        let batch_name = body.request.batch_name;
        let ruleList = body.request.rules;
        let db_type = body.request.db_type;

        //insert table data
        let sql = 'delete from ' + hdrcfg.cfg.table_name.T_ETL_RULE_SET_DETAIL + ' where group_id = ? and rule_set_type = ? and rule_set_name = ?';
        let params = [group, rule_type, batch_name];
        await hdrcom.db.preSql(db, sql, params);

        if (ruleList.length > 0) {
            for (let i = 0; i < ruleList.length; i++) {
                let ruleID = ruleList[i].id;
                let coder = ruleList[i].coder;
                let resered = ruleList[i].resered;
                let connectDB = ruleList[i].connect_db;
                let orglExpression = '';
                if (ruleList[i].expression)
                    orglExpression = new Buffer(ruleList[i].expression, 'base64');
                let sqlExpression = '';
                let dbName = '';
                let bindName = '';

                if (connectDB === 'yes') {
                    if (!hdrcom.pub.isEmptyObj(ruleList[i].dbInfo)) {
                        dbName = ruleList[i].dbInfo.db_name;
                        let dbType = ruleList[i].dbInfo.db_type;
                        if (dbName) {
                            await hdrcom.pub.dealDBinfo(db, ruleList[i].dbInfo, 'INS');
                        }
                        if (dbType)
                            sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, dbType);
                    } else
                        sqlExpression = hdrcom.pub.get_sql_expression(orglExpression, db_type);
                }
                for (let y = 0; y < ruleList[i].bdList.length; y++) {
                    bindName = bindName + ruleList[i].bdList[y] + ',';
                }

                let objList = ruleList[i].list;
                for (let i = 0; i < objList.length; i++) {
                    let orgl;
                    let task = [];
                    objList[i].list.forEach(item=>{
                        orgl = 0 === orglExpression.length ? null : orglExpression.toString();
                        sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_RULE_SET_DETAIL + '(GROUP_ID, RULE_SET_TYPE, RULE_SET_NAME, OBJNAME, RULE_ID, CONNECTDB, DBNAME, OPTIONS, SQLEXP, ORIEXP, BINDVAR, REPVALUE) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                        if (connectDB === 'yes')
                            params = [group, rule_type, batch_name, objList[i].user + '.' + item, ruleID, !connectDB ? null : connectDB, dbName, resered, sqlExpression, orgl, !bindName ? null : bindName, !coder ? null : coder];
                        else
                            params = [group, rule_type, batch_name, objList[i].user + '.' + item, ruleID, !connectDB ? null : connectDB, dbName, resered, orgl, orgl, !bindName ? null : bindName, !coder ? null : coder];

                        task.push(hdrcom.db.preSql(db, sql, params));
                    });

                    await Promise.all(task);
                }
            }
            //插入T_ETL_RULE_SET
            sql = 'select id from ' + hdrcfg.cfg.table_name.T_ETL_RULE_SET + ' where GROUP_ID = ? and RULE_SET_NAME = ? and RULE_SET_TYPE = ?';
            params = [group, batch_name, rule_type];
            let ret = await hdrcom.db.preSql(db, sql, params);

            if (ret.length === 0) {
                sql = 'insert into ' + hdrcfg.cfg.table_name.T_ETL_RULE_SET + '(group_id, rule_set_name, rule_set_type) values (?, ?, ?)';
                params = [group, batch_name, rule_type];
                await hdrcom.db.preSql(db, sql, params);
            }
        }

        //insert catch
        sql = 'delete from ' + hdrcfg.cfg.table_name.T_WEB_CACHE + ' where comp_id = ?';
        params = [group + '_' + rule_type + '_' + batch_name];
        await hdrcom.db.preSql(db, sql, params);


        sql = 'insert into ' + hdrcfg.cfg.table_name.T_WEB_CACHE + ' values (?, ?)';
        params = [group + '_' + rule_type + '_' + batch_name, JSON.stringify(body.request.rules)];
        await hdrcom.db.preSql(db, sql, params);

        return 'SUCCESS';
    }

    async function doJob() {
        try {
            console.info("[save_batch_rule begin]");
            await hdrcom.pub.checkMd5(body);
            db = await hdrcom.db.openDb();
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await save_rule();
            await hdrcom.db.dbCommit(db);
            //hdrcom.pub.processResult(res, result, true, body);
            console.info("[save_batch_rule success.]\n");
            return result;
        } catch (err) {
            console.error(err);
            db && await hdrcom.db.dbRollback(db).catch(err=> {
                console.error(err);
            });
            console.error('[save_batch_rule fail]');
            //hdrcom.pub.processResult(res, err, false, body);
            return err;
        } finally {
            db && hdrcom.db.closeDB(db);
        }
    }

    return doJob();
}

let etl = {
    query_etl_config: query_etl_config,
    query_etl_user: query_etl_user,
    query_etl_table: query_etl_table,
    query_etl_table_rule: query_etl_table_rule,
    save_etl_table_rule: save_etl_table_rule,
    query_column_list: query_column_list,
    legal_check_expression: legal_check_expression,
    save_etl_add_config: save_etl_add_config,
    query_etl_add_config: query_etl_add_config,
    save_etl_delete_config: save_etl_delete_config,
    query_etl_delete_config: query_etl_delete_config,
    save_etl_map_config: save_etl_map_config,
    query_etl_map_config: query_etl_map_config,
    save_etl_condition_config: save_etl_condition_config,
    query_etl_condition_config: query_etl_condition_config,
    save_etl_transform_config: save_etl_transform_config,
    query_etl_transform_config: query_etl_transform_config,
    save_etl_convert: save_etl_convert,
    query_etl_convert: query_etl_convert,
    save_etl_table_filter: save_etl_table_filter,
    query_etl_table_filter: query_etl_table_filter,
    save_etl_operation_filter: save_etl_operation_filter,
    query_etl_operation_filter: query_etl_operation_filter,

    query_batch: query_batch,
    query_batch_rule: query_batch_rule,
    save_batch_rule: save_batch_rule,
    query_batch_checked: query_batch_checked,
    save_batch_codevalue: save_batch_codevalue,

    query_etl_rule_ptable: query_etl_rule_ptable
};

//导出对象
module.exports = etl;
