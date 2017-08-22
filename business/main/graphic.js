/**
 * Created by on 2016/12/13.
 */
let hdrcom = require('../common');
let hdrcfg = require('../../config');
const moment = require('moment');

//保存graphic
//1、解析relation_shape, param表中存在更新，否则插入
//2、解析line_obj和content，comp表，存在更新，否则(生成id)插入
function add_graphic(body, res) {
    //打开数据库，并开启事务
    let db;
    let group = body.request.group;

    const handleRelationShape = async function () {
        console.info("begin deal relationShape.");
        let relationShap = body.request.relation_shape;
        if (relationShap) {
            let captureObj = relationShap.capture;
            let applyObj = relationShap.apply;
            let transObj = relationShap.transfer;
            let etlObj = relationShap.etlapply;
            let ftpObj = relationShap.transftp;

            if (captureObj && captureObj.length > 0) {
                for (let x = 0; x < captureObj.length; x++) {
                    console.info("begin to deal capture`s param.");
                    let capId = captureObj[x].rid;
                    let params = "";
                    let dbId = "";
                    let quId = "";
                    /*
                     if (captureObj[x].database)
                     dbId = captureObj[x].database.rid;
                     if (captureObj[x].queue)
                     quId = captureObj[x].queue.rid;
                     */
                    let siblings = captureObj[x].siblings;
                    for (let ss=0; ss < siblings.length; ss++){
                        if (siblings[ss].type === 'database'){
                            dbId = siblings[ss].rid;
                        }
                        if (siblings[ss].type === 'queue') {
                            quId = siblings[ss].rid;
                        }
                    }
                    if (capId && dbId && quId) {
                        params = ['source_db', 'analysis_db', 'output_queue'];
                    } else if (capId && dbId && !quId) {
                        params = ['source_db', 'analysis_db'];
                    } else if (capId && !dbId && quId) {
                        params = ['output_queue'];
                    } else {
                        params = [];
                    }

                    if (capId && capId !== 'undefined') {
                        for (let i = 0; i < params.length; i++) {
                            let sql = 'select COMP_ID from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
                            let para = [capId, params[i]];
                            let rs =await hdrcom.db.preSql(db, sql, para);
                            let time = moment().format('YYYY-MM-DD HH:mm:ss');
                            if (rs && rs.length > 0) {//已经存在, to update
                                console.info('[' + capId + ']`s param:[' + params[i] + '] is exist, to update');
                                let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                                let paraUpd = "";
                                if (params[i] === 'output_queue') {
                                    paraUpd = [quId, time, capId, params[i]];
                                } else {
                                    paraUpd = [dbId, time, capId, params[i]];
                                }
                                await hdrcom.db.preSql(db, sqlUpd, paraUpd);
                            } else {//不存在, to insert
                                console.info('[' + capId + ']`s param:[' + params[i] + '] is not exist, to insert');
                                let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                                let paraIns = "";
                                if (params[i] === 'output_queue') {
                                    paraIns = [capId, params[i], quId, 'NORMAL', 'YES', time];
                                } else {
                                    paraIns = [capId, params[i], dbId, 'NORMAL', 'YES', time];
                                }
                                await hdrcom.db.preSql(db, sqlIns, paraIns);
                            }
                        }
                    }
                }
                console.info("end to deal capture`s params.");
            } else {
                console.info("relationShape`s cap is null");
            }

            if (applyObj && applyObj.length > 0) {
                for (let x = 0; x < applyObj.length; x++) {
                    console.info("begin to deal apply`s params.");
                    let apId = applyObj[x].rid;
                    let params = "";
                    let dbtId = "";
                    let quId = "";
                    let dbsId = "";
                    /*
                     if (captureObj) {
                     if (captureObj[0].database)
                     dbsId = captureObj[0].database.rid;
                     }

                     if (transObj){
                     if (transObj[0].database)
                     dbsId = transObj[0].database.rid;
                     }

                     if (applyObj[x].database)
                     dbtId = applyObj[x].database.rid;

                     if (applyObj[x].queue)
                     quId = applyObj[x].queue.rid;
                     */
                    if (captureObj){
                        for (let ss = 0; ss < captureObj[0].siblings.length; ss++){
                            if (captureObj[0].siblings[ss].type === 'database'){
                                dbsId = captureObj[0].siblings[ss].rid;
                            }
                        }
                    } else if (transObj) {
                        for (let ss1 = 0; ss1 < transObj[0].siblings.length; ss1++) {
                            if (transObj[0].siblings[ss1].type === 'database') {
                                dbsId = transObj[0].siblings[ss1].rid;
                            }
                        }
                    } else if (ftpObj) {
                        for (let ss1 = 0; ss1 < ftpObj[0].siblings.length; ss1++) {
                            if (ftpObj[0].siblings[ss1].type === 'database') {
                                dbsId = ftpObj[0].siblings[ss1].rid;
                            }
                        }
                    }

                    let siblings = applyObj[x].siblings;
                    for (let ss2=0; ss2 < siblings.length; ss2++){
                        if (siblings[ss2].type === 'database'){
                            dbtId = siblings[ss2].rid;
                        }
                        if (siblings[ss2].type === 'queue') {
                            quId = siblings[ss2].rid;
                        }
                    }

                    if (apId && dbsId && dbtId && quId) {
                        params = ['source_db', 'target_db', 'input_queue'];
                    } else if (apId && !dbsId && dbtId && quId) {
                        params = ['target_db', 'input_queue'];
                    } else {
                        params = [];
                    }

                    if (apId && apId !== 'undefined') {
                        for (let i = 0; i < params.length; i++) {
                            let sql = 'select COMP_ID from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
                            let para = [apId, params[i]];
                            let rs = await hdrcom.db.preSql(db, sql, para);
                            let time = moment().format('YYYY-MM-DD HH:mm:ss');

                            if (rs && rs.length > 0) {//已经存在, to update
                                console.info('[' + apId + ']`s param:[' + params[i] + '] is exist, to update');
                                let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                                let paraUpd = "";
                                if (params[i] === 'input_queue') {
                                    paraUpd = [quId, time, apId, params[i]];
                                } else if (params[i] === 'source_db') {
                                    paraUpd = [dbsId, time, apId, params[i]];
                                } else {
                                    paraUpd = [dbtId, time, apId, params[i]];
                                }
                                await hdrcom.db.preSql(db, sqlUpd, paraUpd);
                            } else {//不存在, to insert
                                console.info('[' + apId + ']`s param:[' + params[i] + '] is not exist, to insert');
                                let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                                let paraIns = "";
                                if (params[i] === 'input_queue') {
                                    paraIns = [apId, params[i], quId, 'NORMAL', 'YES', time];
                                } else if (params[i] === 'source_db') {
                                    paraIns = [apId, params[i], dbsId, 'NORMAL', 'YES', time];
                                } else {
                                    paraIns = [apId, params[i], dbtId, 'NORMAL', 'YES', time];
                                }
                                await hdrcom.db.preSql(db, sqlIns, paraIns);
                            }
                        }
                        //dbsId ,dbtid
                        if (dbsId !== dbtId){
                            let sqlDB = 'select PARAM_VALUE from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID in(?, ?) and PARAM_NAME = ?';
                            let paraDB = [dbsId, dbtId, 'db_type'];
                            let rsDB = await hdrcom.db.preSql(db, sqlDB, paraDB);
                            let program = "";
                            if (rsDB && rsDB.length === 2 && rsDB[0].PARAM_VALUE === rsDB[1].PARAM_VALUE){
                                console.info("db type is same.");
                                if (rsDB[0].PARAM_VALUE === 'oracle') {
                                    program = 'dip_oraloader';
                                } else if (rsDB[0].PARAM_VALUE === 'sqlserver') {
                                    program = 'dip_mssloader';
                                } else if (rsDB[0].PARAM_VALUE === 'mysql') {
                                    program = 'dip_mysqlloader';
                                } else if (rsDB[0].PARAM_VALUE === 'db2'){
                                    program = 'dip_db2loader';
                                }
                            } else {
                                program = 'dip_com_loader';
                                let sqlD = "delete from "+hdrcfg.cfg.table_name.T_COMP_PARAM+ " where COMP_ID = ? and PARAM_NAME IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                                let paramD = [apId, 'lob_skip', 'source_clob_charset', 'source_nclob_charset', 'source_metadata_charset', 'source_nchar_charset', 'dip_nchar_charset', 'db_is_utf8', 'idle_connect_seconds', 'clob_bind_size', 'set_tag', 'skip_large_char', 'db_timeout'];
                                await hdrcom.db.preSql(db, sqlD, paramD);
                            }
                            let sqlU = "update "+hdrcfg.cfg.table_name.T_COMP_INFO+ " set PROGRAM = ? where id = ?";
                            let paramU = [program, apId];
                            await hdrcom.db.preSql(db, sqlU, paramU);
                        }
                    }
                }
                console.info("end to deal apply`s params.");
            } else {
                console.info("relationShape`s apply is null");
            }

            if (transObj && transObj.length > 0) {
                for (let x = 0; x < transObj.length; x++) {
                    let tsId = transObj[x].rid;
                    //source_db、target_db, input_queue
                    let params = "";
                    let dbsId = "";
                    let quId = "";
                    /*
                     if (transObj[x].database)
                     dbsId = transObj[x].database.rid;
                     if (transObj[x].queue)
                     quId = transObj[x].queue.rid;
                     */
                    let siblings = transObj[x].siblings;
                    for (let ss=0; ss < siblings.length; ss++){
                        if (siblings[ss].type === 'database'){
                            dbsId = siblings[ss].rid;
                        }
                        if (siblings[ss].type === 'queue') {
                            quId = siblings[ss].rid;
                        }
                    }

                    if (tsId && dbsId && quId) {
                        params = ['source_db', 'output_queue'];
                    } else if (tsId && dbsId && !quId){
                        params = ['source_db'];
                    } else if (tsId && !dbsId && quId){
                        params = ['output_queue'];
                    } else {
                        params = [];
                    }

                    if (tsId && tsId !== 'undefined') {
                        for (let i = 0; i < params.length; i++) {
                            let sql = 'select COMP_ID from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
                            let para = [tsId, params[i]];
                            let rs = await hdrcom.db.preSql(db, sql, para);
                            let time = moment().format('YYYY-MM-DD HH:mm:ss');

                            if (rs && rs.length > 0) {//已经存在, to update
                                console.info('[' + tsId + ']`s param:[' + params[i] + '] is exist, to update');
                                let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                                let paraUpd = "";
                                if (params[i] === 'output_queue') {
                                    paraUpd = [quId, time, tsId, params[i]];
                                } else if (params[i] === 'source_db') {
                                    paraUpd = [dbsId, time, tsId, params[i]];
                                }
                                await hdrcom.db.preSql(db, sqlUpd, paraUpd);
                            } else {//不存在, to insert
                                console.info('[' + tsId + ']`s param:[' + params[i] + '] is not exist, to insert');
                                let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                                let paraIns = "";
                                if (params[i] === 'output_queue') {
                                    paraIns = [tsId, params[i], quId, 'NORMAL', 'YES', time];
                                } else if (params[i] === 'source_db') {
                                    paraIns = [tsId, params[i], dbsId, 'NORMAL', 'YES', time];
                                }
                                await hdrcom.db.preSql(db, sqlIns, paraIns);
                            }
                        }
                    }
                }
                console.info("end to deal transfer`s params.");
            } else {
                console.info("relationShape`s transfer is null");
            }
            if (ftpObj && ftpObj.length > 0) {
                let inQue = '';
                let outQue = '';
                for (let x = 0; x < ftpObj.length; x++) {
                    let tsId = ftpObj[x].rid;
                    //source_db、target_db, input_queue
                    let params = [];
                    let siblings = ftpObj[x].siblings;
                    for (let i = 0; i < siblings.length; i++) {
                        if (siblings[i].type === 'queue' && siblings[i].io_status === 'input') {
                            inQue = siblings[i].rid;
                            params.push('input_queue');
                        } else if (siblings[i].type === 'queue' && siblings[i].io_status === 'output') {
                            outQue = siblings[i].rid;
                            params.push('output_queue');
                        }
                    }
                    if (tsId && tsId !== 'undefined') {
                        for (let i = 0; i < params.length; i++) {
                            let sql = 'select COMP_ID from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
                            let para = [tsId, params[i]];
                            let rs = await hdrcom.db.preSql(db, sql, para);
                            let time = moment().format('YYYY-MM-DD HH:mm:ss');
                            if (rs && rs.length > 0) {//已经存在, to update
                                console.info('[' + tsId + ']`s param:[' + params[i] + '] is exist, to update');
                                let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                                let paraUpd = "";
                                if (params[i] === 'output_queue') {
                                    paraUpd = [outQue, time, tsId, params[i]];
                                } else if (params[i] === 'input_queue') {
                                    paraUpd = [inQue, time, tsId, params[i]];
                                }
                                await hdrcom.db.preSql(db, sqlUpd, paraUpd);
                            } else {//不存在, to insert
                                console.info('[' + tsId + ']`s param:[' + params[i] + '] is not exist, to insert');
                                let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                                let paraIns = "";
                                if (params[i] === 'output_queue') {
                                    paraIns = [tsId, params[i], outQue, 'NORMAL', 'YES', time];
                                } else if (params[i] === 'input_queue') {
                                    paraIns = [tsId, params[i], inQue, 'NORMAL', 'YES', time];
                                }
                                await hdrcom.db.preSql(db, sqlIns, paraIns);
                            }
                        }
                    }
                }
                console.info("end to deal transftp`s params.");
            } else {
                console.info("relationShape`s transftp is null");
            }
            if (etlObj && etlObj.length > 0) {
                for (let x = 0; x < etlObj.length; x++) {
                    console.info("begin to deal etl`s params.");
                    let etlId = etlObj[x].rid;
                    let params = "";
                    let dbsId = "";
                    let inputQ = "";
                    let outputQ = "";
                    /*
                     if (etlObj[x].queue){
                     var queueLen = etlObj[x].queue.length;
                     for (var y=0; y<queueLen; y++){
                     if (etlObj[x].queue[y].io_status == 'input')
                     inputQ = etlObj[x].queue[y].rid;
                     else if (etlObj[x].queue[y].io_status == 'output')
                     outputQ = etlObj[x].queue[y].rid;
                     }
                     }
                     */
                    if (captureObj){
                        for (let ss = 0; ss < captureObj[0].siblings.length; ss++){
                            if (captureObj[0].siblings[ss].type === 'database'){
                                dbsId = captureObj[0].siblings[ss].rid;
                            }
                        }
                    }
                    if (transObj){
                        for (let ss1 = 0; ss1 < transObj[0].siblings.length; ss1++){
                            if (transObj[0].siblings[ss1].type === 'database'){
                                dbsId = transObj[0].siblings[ss1].rid;
                            }
                        }
                    }
                    let siblings = etlObj[x].siblings;
                    for (let ss2=0; ss2 < siblings.length; ss2++){
                        if (siblings[ss2].type === 'queue' && siblings[ss2].io_status === 'input') {
                            inputQ = siblings[ss2].rid;
                        }
                        if (siblings[ss2].type === 'queue' && siblings[ss2].io_status === 'output') {
                            outputQ = siblings[ss2].rid;
                        }
                    }

                    if (etlId && dbsId && inputQ && outputQ) {
                        params = ['source_db', 'input_queue', 'output_queue'];
                    } else{
                        params = [];
                    }
                    if (etlId && etlId !== 'undefined') {
                        for (let i = 0; i < params.length; i++) {
                            let sql = 'select COMP_ID from ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' where COMP_ID = ? and PARAM_NAME = ?';
                            let para = [etlId, params[i]];
                            let rs = await hdrcom.db.preSql(db, sql, para);
                            let time = moment().format('YYYY-MM-DD HH:mm:ss');
                            if (rs && rs.length > 0) {//已经存在, to update
                                console.info('[' + etlId + ']`s param:[' + params[i] + '] is exist, to update');
                                let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_PARAM + ' set PARAM_VALUE = ?, UPDATE_TIME = ? where COMP_ID = ? and PARAM_NAME = ?';
                                let paraUpd = "";
                                if (params[i] === 'input_queue') {
                                    paraUpd = [inputQ, time, etlId, params[i]];
                                } else if (params[i] === 'output_queue') {
                                    paraUpd = [outputQ, time, etlId, params[i]];
                                } else if (params[i] === 'source_db') {
                                    paraUpd = [dbsId, time, etlId, params[i]];
                                }
                                await hdrcom.db.preSql(db, sqlUpd, paraUpd);
                            } else {//不存在, to insert
                                console.info('[' + etlId + ']`s param:[' + params[i] + '] is not exist, to insert');

                                let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_PARAM + '(COMP_ID, PARAM_NAME, PARAM_VALUE, PARAM_TYPE, VALID, INSERT_TIME) values (?, ?, ?, ?, ?, ?)';
                                let paraIns = "";
                                if (params[i] === 'input_queue') {
                                    paraIns = [etlId, params[i], inputQ, 'NORMAL', 'YES', time];
                                } else if (params[i] === 'output_queue') {
                                    paraIns = [etlId, params[i], outputQ, 'NORMAL', 'YES', time];
                                } else if (params[i] === 'source_db') {
                                    paraIns = [etlId, params[i], dbsId, 'NORMAL', 'YES', time];
                                }
                                await hdrcom.db.preSql(db, sqlIns, paraIns);
                            }
                        }
                    }
                }
                console.info("end to deal etl`s params.");
            } else {
                console.info("relationShape`s etl is null");
            }
        } else {
            console.info("relationShape is null");
        }
        console.info("end deal relationShape.");
    };

    const saveGraphicInfo = async function () {
        console.info("begin to save line & content info");
        let index = body.request.graphic.global_index;
        let line_object = body.request.graphic.line_object;
        let content = body.request.graphic.graphic_content;
        let lineObject1 = JSON.stringify(line_object);
        let content1 = JSON.stringify(content);

        //line信息存在则更新，不存在插入。
        let sqlQuery = 'select group_id from ' + hdrcfg.cfg.table_name.T_COMP_RELATION + ' where GROUP_ID = ?';
        let paramsQuery = [group];

        let rs = await hdrcom.db.preSql(db, sqlQuery, paramsQuery);
        if (rs && rs.length > 0) {//update
            console.info("the group line is exist, to update");
            let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_RELATION + ' set IDX = ?, LINE = ?, CONTENT = ? where GROUP_ID = ?';
            let paramsUpd = [index, lineObject1, content1, group];
            await hdrcom.db.preSql(db, sqlUpd, paramsUpd);
        } else {//insert
            console.info("the group line_info is not exist, to insert");
            let sqlIns = 'insert into ' + hdrcfg.cfg.table_name.T_COMP_RELATION + '(GROUP_ID, IDX, LINE, CONTENT) values (?, ?, ?, ?)';
            let paramsIns = [group, index, lineObject1, content1];
            await hdrcom.db.preSql(db, sqlIns, paramsIns);
        }
        console.info("end to save line info");
    };

    const handleComponent = async function () {
        console.info("begin to deal comp.");
        let line_object = body.request.graphic.line_object;
        let graphic_content = body.request.graphic.graphic_content;
        //var RealIdArray = [];
        //遍历graphic_content
        for (let i = 0; i < graphic_content.length; i++) {
            let RealId = graphic_content[i].RealId;
            //求出pre_id, suf_id
            let preId = "";
            let sufId = "";
            for (let j = 0; j < line_object.length; j++) {
                let sId = line_object[j].RealSourceId;
                let tId = line_object[j].RealTargetId;
                if (RealId === sId) {
                    sufId = sufId + tId + '#';
                } else if (RealId === tId) {
                    preId = preId + sId + '#';
                }
            }
            let name = graphic_content[i].Name;
            if (RealId && RealId === 'undefined') {//RealID不存在，获取id，插入comp
                console.info("RealId is exist, to update");
                let sqlUpd = 'update ' + hdrcfg.cfg.table_name.T_COMP_INFO + ' set NAME = ?,  PRE_ID = ?, SUF_ID = ? where id = ?';
                let paramsUpd = [name, preId, sufId, RealId];
                await hdrcom.db.preSql(db, sqlUpd, paramsUpd);
            }
            //把RealId返回给前端。
            /*
             var RealIdSet = {};
             RealIdSet["cid"] = BlockId;
             RealIdSet["rid"] = RealId;
             RealIdArray.push(RealIdSet);
             */
        }
    };

    let doJob = async function () {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();
            console.info("[add_graphic], conn db ok.");
            await hdrcom.pub.setAutoCommit(db);
            await hdrcom.db.dbTransaction(db);
            await  handleRelationShape();
            await  saveGraphicInfo();
            await  handleComponent();
            await hdrcom.db.dbCommit(db);
            hdrcom.pub.processResult(res, 'SUCCESS', true, body);
            return {status: true, response: 'SUCCESS'};
        }catch(err){
            db && await hdrcom.db.dbRollback(db).catch(err=>{
                console.error(err);
            });
            hdrcom.pub.processResult(res, err, false, body);
            return {status: false, response: err};
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    };
    return doJob();
}

//查询graphic
function require_graphic(body, res) {
    let db;
    let query_graphic = async function () {
        let group = body.request.group;
        let sql = 'select idx as global_index, line as line_object, content as graphic_content from ' + hdrcfg.cfg.table_name.T_COMP_RELATION + ' where GROUP_ID = ?';
        let params = [group];
        let data = await hdrcom.db.preSql(db, sql, params);
        let graphic = {};
        if (data && data.length > 0) {
            graphic.graphic = data[0];
        } else {
            graphic.graphic = "";
        }
        return graphic;
    };
    async function doJob() {
        try{
            await hdrcom.pub.checkMd5(body);
            db =await hdrcom.db.openDb();//mysql 数据库
            let data=await query_graphic();
            hdrcom.pub.processResult(res, data, true, body);
            return  {status: true, response: data};
        }catch (err){
            hdrcom.pub.processResult(res, err, false, body);
            console.error(err);
            return  {status: false, response: err};
        }finally {
            db && hdrcom.db.closeDB(db);
        }
    }
    return doJob();
}

//导出对象
module.exports = {
    add_graphic: add_graphic,
    require_graphic: require_graphic
};