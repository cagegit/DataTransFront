/**
 * Created by on 2016/12/13.
 */
let hdrcom = require('../common');
let hdrcfg = require('../../config');

//delete_component
function delete_component(body, res) {
    let group_id = body.request.group;
    let component_id = body.request.component_id;
    let type = body.request.type;
    let db;
    let checkGroupState = async function () {
        let data = await hdrcom.pub.getStatus(group_id);
        if (data === 'yes') {
            let buf = hdrcfg.code.EBUSY + ':group is ' + hdrcfg.msg[hdrcfg.code.EBUSY];
            let msg = {error_code: hdrcfg.code.EBUSY, error_msg: buf};
            console.info(buf);
            throw msg;
        }
    };

    let delEtlTab = async function (comp_id, type) {
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

    let deleComp = async function () {//删除comp相关表
        console.info("deleComp[" + type + "] begin");
        let sqlArray = [];
        let params = [component_id];
        if ('capture' === type) {
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + " WHERE SET_ID IN" +
                "(SELECT b.ID FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " a, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " b " +
                "WHERE a.COMP_ID = ? AND a.PARAM_TYPE = 'EXTERNAL' AND a.PARAM_VALUE = b.ID)");

            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_CAPTURE_RAC_INFO + " WHERE SET_ID IN" +
                "(SELECT b.ID FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " a, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " b " +
                "WHERE a.COMP_ID = ? AND a.PARAM_TYPE = 'EXTERNAL' AND a.PARAM_VALUE = b.ID)");

            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " WHERE ID IN" +
                "(SELECT PARAM_VALUE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM +
                " WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL')");

        } else if ('apply' === type) {
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DB_OBJECT_SET + " WHERE SET_ID IN" +
                "(SELECT b.ID FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " a, " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " b " +
                "WHERE a.COMP_ID = ? AND a.PARAM_TYPE = 'EXTERNAL' AND a.PARAM_VALUE = b.ID)");

            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_DEPEND_SETS + " WHERE ID IN" +
                "(SELECT PARAM_VALUE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM +
                " WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL')");

            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_WEB_CACHE + " WHERE COMP_ID IN" +
                "(SELECT ID FROM " + hdrcfg.cfg.table_name.T_COMP_INFO +
                " WHERE ID = ?)");
        }
        else if ('queue' === type) {
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_BPOINT + " WHERE QUEUE_ID = ?");
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_PKG + " WHERE QUEUE_ID = ?");
            sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_QUEUE_STATIS + " WHERE QUEUE_ID = ?");
        } else if ('etl' === type) {
            let sql = `SELECT RULE_SET_TYPE type, RULE_SET_NAME name FROM ${hdrcfg.cfg.table_name.T_ETL_BATCH_RULES} WHERE SET_ID in (SELECT PARAM_VALUE FROM ${hdrcfg.cfg.table_name.T_COMP_PARAM} WHERE COMP_ID = ? AND PARAM_TYPE = 'EXTERNAL' and PARAM_NAME in ( ?, ?, ? ) ) `;
            let ruleRec = await hdrcom.db.preSql(db, sql, [component_id, hdrcfg.cfg.object_set_type.ETL_BATCH_FILTER, hdrcfg.cfg.object_set_type.ETL_BATCH_INSERT, hdrcfg.cfg.object_set_type.ETL_BATCH_UPDATE]);

            let task = [];
            if (0 < ruleRec.length) {
                
                for (let i = 0; i < ruleRec.length; i++) {
                    sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_ETL_RULE_SET_DETAIL} WHERE GROUP_ID = ? AND RULE_SET_TYPE = ? AND RULE_SET_NAME = ? `;
                    task.push(hdrcom.db.preSql(db, sql, [group_id, ruleRec[i].type, ruleRec[i].name]));

                    sql = `DELETE FROM ${hdrcfg.cfg.table_name.T_ETL_RULE_SET} WHERE GROUP_ID = ? AND RULE_SET_TYPE = ? AND RULE_SET_NAME = ? `;
                    task.push(hdrcom.db.preSql(db, sql, [group_id, ruleRec[i].type, ruleRec[i].name]));
                }

                await Promise.all(task);
            }
            
            task = [];
            for (let tmp in hdrcfg.cfg.object_set_type) {
                task.push(delEtlTab(component_id, hdrcfg.cfg.object_set_type[tmp]));
            }

            await Promise.all(task);
        }

        if ('queue' === type || 'database' === type) {
            sqlArray.push("UPDATE " + hdrcfg.cfg.table_name.T_COMP_PARAM + " SET PARAM_VALUE='' WHERE PARAM_VALUE = ?");
        }

        sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_PARAM + " WHERE COMP_ID = ?");
        sqlArray.push("DELETE FROM " + hdrcfg.cfg.table_name.T_COMP_INFO + " WHERE ID = ?");
        for (let y = 0; y < sqlArray.length; y++) {
            console.debug(sqlArray[y]);
            await hdrcom.db.preSql(db, sqlArray[y], params);
        }
        console.debug("deleComp [" + type + "] ok");
        return 'SUCCESS';
    };

    let delFile = function () {
        let dir = [hdrcfg.cfg.macro.MN_DIR_DATA];
        let stmt = '';
        if ('capture' === type || 'transfer' === type)
            stmt = 'rm -rf ' + process.env['DIP_HOME'] + '/' + dir[0] + '/' + group_id + '/' + component_id + '.bkp';
        else if ('queue' === type) {
            stmt = 'rm -rf ' + process.env['DIP_HOME'] + '/' + dir[0] + '/' + group_id + '/' + component_id + '.ctl ' + component_id + '_[0-9]*.log';
        } else if ('apply' === type) {
            stmt = 'rm -rf ' + process.env['DIP_HOME'] + '/' + dir[0] + '/' + group_id + '/' + component_id + '.bkp ' + process.env['DIP_HOME'] + '/etc/' + group_id + '/' + 'apply_' + component_id + ".xml";
            console.info(stmt);
        }
        hdrcom.pub.exe_shell(stmt);
    };

    let doJob = async function () {
        try {
            await hdrcom.pub.checkMd5(body);
            await checkGroupState();
            db = await hdrcom.db.openDb();
            console.info("delete_component[" + type + "], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            let result = await deleComp();
            await hdrcom.db.dbCommit(db);
            //删除文件
            if (type !== 'database') {
                delFile();
            }
            hdrcom.pub.processResult(res, result, true, body);
            console.info("end delete_component db.");
            return result;
        } catch (err) {
            db && await hdrcom.db.dbRollback(db).catch(err=> {
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

//导出对象
module.exports = {
    delete_component: delete_component
};