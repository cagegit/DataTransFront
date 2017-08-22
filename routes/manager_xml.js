/**
 * Created by cage on 2016/10/21.
 */
'use strict';
var express = require('express');
var router = express.Router();
var passport = require('passport');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var LocalStrategy = require('passport-local').Strategy;
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false, ignoreAttrs: true}); // xml -> json
var xmlParserAttr = new xml2js.Parser({explicitArray: false, ignoreAttrs: false}); // xml -> json

//tcp 转发命令到manager代码
var tcpClient = require('./tcpClient.js');

var fun = require('../business/main');
var pub = require('../business/common/public.js');

function ensureAuthenticated(req, res, next) {
    console.log('ajax  yanzheng');
    if (req.isAuthenticated()) {
        return next();
    } else {
        console.log('fail turn');
        res.status(301).json({err: 'Login Auth Fail!'});
    }
}
function resReqError(res) {
    var err = {command_return: "ERROR", error_message: 'Request parmas error!'};
    res.json(err);
}
//添加组
router.post('/add_group', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.grp.add_group(req, res);
    } else {
        resReqError(res);
    }
});
//修改组
router.post('/modify_group', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.grp.modify_group(req, res);
    } else {
        resReqError(res);
    }
});
//保存视图
router.post('/add_graphic', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.graphic.add_graphic(req.body, res);
    } else {
        resReqError(res);
    }
});
//获取视图信息
router.post('/require_graphic', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.graphic.require_graphic(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询所有组
router.post('/fetch_all_groups', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.grp.fetch_all_groups(req, res);
    } else {
        resReqError(res);
    }
});
//查询当前组的状态
router.post('/query_one_group_status', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//:::::::::::::Database命令:::::::::::::://
//保存database信息
router.post('/save_db_info', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.save_db_info(req.body, res);
    } else {
        resReqError(res);
    }
});
//获取database信息
router.post('/query_db_info', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.database.query_db_info(req.body, res);
    } else {
        resReqError(res);
    }
});
//测试database连接
router.post('/test_db_connection', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.test_db_connection(req.body, res);
    } else {
        resReqError(res);
    }
});
//测试数据库环境
router.post('/check_sourcedb_env', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.check_sourcedb_env(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询必要环境
router.post('/query_db_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        /*
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
        */
        fun.database.query_db_table(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询sqlserver数据库配置
router.post('/query_environment_status', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.database.query_environment_status(req.body, res);
    } else {
        resReqError(res);
    }
});
//重置sqlserver数据库配置
router.post('/dip_sqlcfg_rollback', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.database.dip_sqlcfg_rollback(req.body, res);
    } else {
        resReqError(res);
    }
});
//sqlserver启动recovery mode
router.post('/start_recover_mode', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.database.start_recover_mode(req.body, res);
    } else {
        resReqError(res);
    }
});
//sqlserver启动cdc
router.post('/start_cdc', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.database.start_cdc(req.body, res);
    } else {
        resReqError(res);
    }
});
//增加r7cdc
router.post('/add_r7_cdc', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.database.add_r7_cdc(req.body, res);
    } else {
        resReqError(res);
    }
});
//query_extended_log_table
router.post('/query_extended_log_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.capture.query_extended_log_table(req.body, res);
    } else {
        resReqError(res);
    }
});
//change_extended_log
router.post('/change_extended_log', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.capture.change_extended_log(req.body, res);
    } else {
        resReqError(res);
    }
});
//:::::::::::::Capture命令:::::::::::::://
//查询capture配置信息
router.post('/query_capture_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        // var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml,req,res);
        fun.capture.query_capture_config(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询capture表
router.post('/query_capture_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        // var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml, req, res);
        fun.capture.query_capture_table(req.body, res);
    } else {
        resReqError(res);
    }
});
//保存Capture配置信息
router.post('/add_capture_property', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        // var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml,req,res);
        fun.capture.add_capture(req.body, res);
    } else {
        resReqError(res);
    }
});
//保存高级选项的参数
router.post('/save_parameter', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        // var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml,req,res);
        fun.capture.save_parameter(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询错误列表
router.post('/query_error_detail', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查询Capture状态信息
router.post('/query_capture_status', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//启动server
router.post('/start_server', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//停止server
router.post('/stop_server', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//:::::::::::::Queure命令:::::::::::::://
//获取Queue配置信息
router.post('/query_queue_info', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        // var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml,req,res);
        fun.queue.query_queue_info(req.body, res);
    } else {
        resReqError(res);
    }
});
//保存Queue配置信息
router.post('/save_queue_info', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.queue.save_queue_info(req.body, res);
    } else {
        resReqError(res);
    }
});
//获取Queue状态信息
router.post('/query_queue_info_status', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查询Queue事务列表信息
router.post('/query_queue_pkg', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);

        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.que.query_queue_pkg(result.dip_command.command_data, res);
            }
        });

    } else {
        resReqError(res);
    }
});
//删除事务Queue事务列表信息
router.post('/delete_queue_pkg_xid', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.que.delete_queue_pkg_xid(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//获取Queue详情信息列表
router.post('/query_queue_rec', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//获取Queue事务的对应Sql
router.post('/query_queue_sql', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//删除队列统计信息
router.post('/delete_queue_pkg_statis', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        fun.queue.delete_queue_pkg_statis(req.body, res);
    } else {
        resReqError(res);
    }
});
//:::::::::::::Apply命令:::::::::::::://
//获取Apply配置信息命令
router.post('/query_apply_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.apply.query_apply_config(req.body, res);
    } else {
        resReqError(res);
    }
});
//获取源端Object对象的列表
router.post('/query_apply_sourcedb_object', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.apply.query_apply_sourcedb_object(req.body, res);
    } else {
        resReqError(res);
    }
});
//保存Apply配置信息命令
router.post('/add_apply_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.apply.add_apply_config(req.body, res);
    } else {
        resReqError(res);
    }
});
//保存Apply高级选项命令
router.post('/add_apply_property', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.apply.add_apply_property(req.body, res);
    } else {
        resReqError(res);
    }
});
//查看排除表
router.post('/query_apply_exclude_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.apply.query_apply_exclude_table(req.body, res);
    } else {
        resReqError(res);
    }
});
//删除排除表
router.post('/delete_exclude_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.apply.delete_exclude_table(req.body, res);
    } else {
        resReqError(res);
    }
});

//获取Loader 错误列表
router.post('/query_apply_full_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.err.query_apply_full_error(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//导出历史错误为Excel
router.post('/download_error_file', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.err.download_error_file(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//标记为已读方法
router.post('/marked_apply_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.err.marked_apply_error(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//清除错误日志方法
router.post('/trunc_apply_error_record', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.err.trunc_apply_error_record(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//获取错误统计信息列表
router.post('/query_apply_error_statistics', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//排除错误表
router.post('/exclude_select_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//重新同步表
router.post('/sync_table_part', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//获取当前错误
router.post('/query_apply_current_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml, req, res);
        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.err.query_apply_current_error(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//当前错误命令>修复错误
router.post('/auto_fix_data', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//当前错误命令>跳过错误
router.post('/skip_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//当前错误命令>排除错误
router.post('/exclude_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//当前错误命令>重试错误
router.post('/retry_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//当前错误命令>强制修改
router.post('/force_update', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//:::::::::::::Full_syc命令:::::::::::::://
//获取MAP文件中schema列表
router.post('/query_map_exp_schema', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//获取MAP文件中指定schema的所有表
router.post('/query_map_exp_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查看指定批次同步操作概要信息
router.post('/query_fullsync_summary', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查看指定批次同步操作明细信息
router.post('/query_fullsync_detail', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查看指定批次同步操作错误信息
router.post('/query_fullsync_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查看全同步历史信息
router.post('/query_fullsync_history', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.sync.query_full_sync_history(req, res);
    } else {
        resReqError(res);
    }
});
//获取MAP文件列表
router.post('/query_map_list', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.sync.query_map_list(req, res);
    } else {
        resReqError(res);
    }
});
//生成配置文件
router.post('/create_sync_cfg', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        fun.sync.create_sync_cfg(req, res);
    } else {
        resReqError(res);
    }
});
//查询数据库表空间
router.post('/query_db_tablespace', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //    var sendXml = req.body.xmlDoc;
        //    tcpClient.getXml(sendXml, req, res);
        fun.sync.query_db_tablespaces(req, res);
    } else {
        resReqError(res);
    }
});
//获取Loader的默认配置
router.post('/query_full_sync_filters', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
    //    var sendXml = req.body.xmlDoc;
    //    tcpClient.getXml(sendXml, req, res);
        fun.sync.query_full_sync_filter(req, res);
    } else {
        resReqError(res);
    }
});
//获取指定表列表
router.post('/query_appoint_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//开始全同步命令
router.post('/create_full_sync_file', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//启动全同步命令
router.post('/start_full_sync', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查询数据库是否同源
router.post('/query_all_db_info', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.query_all_db_info(req.body, res);
    } else {
        resReqError(res);
    }
});
//指定scn启动
router.post('/start_server_by_scn', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//重置组命令
router.post('/group_reset', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.grp.reset_group(req, res);
    } else {
        resReqError(res);
    }
});
//删除组命令
router.post('/delete_group', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.grp.delete_group(req, res);
    } else {
        resReqError(res);
    }
});
//:::::::::::::Tserver Tclient命令:::::::::::::://
//获取Tclient命令
router.post('/query_qrecv_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.transfer.query_qrecv_config(req.body, res);
    } else {
        resReqError(res);
    }
});
//获取Tserver命令
router.post('/query_tserver_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.transfer.query_tserver_config(req.body, res);
    } else {
        resReqError(res);
    }
});
//保存Tserver配置
router.post('/add_tserver_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.transfer.add_tserver_config(req.body, res);
    } else {
        resReqError(res);
    }
});
//队列统计的命令============
//获取全部用户
/*
router.post('/query_etl_user', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//获取用户下的表
router.post('/query_etl_table', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
*/
//获取统计信息
router.post('/query_queue_statis', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);

        xmlParserAttr.parseString(req.body.xmlDoc, function (err, result) {
            if (err) {
                resReqError(res);
            } else {
                fun.que.query_queue_statis(result.dip_command.command_data, res);
            }
        });
    } else {
        resReqError(res);
    }
});
//获取全同步错误信息
router.post('/query_syn_error', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//停止全同步
router.post('/stop_full_sync', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//刷新全同步状态
router.post('/refresh_fullsync_filters', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//查看已完成的全同步信息
router.post('/query_finish_sync_info', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//删除组件信息
router.post('/delete_component', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.component.delete_component(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询Tserver状态信息
router.post('/query_tserver_status', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml, req, res);
    } else {
        resReqError(res);
    }
});
//===================== 系统设置部分命令===============
//查询系统配置错误检测系统参数
router.post('/query_reporter_conf', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml,req,res);
        fun.sys.query_reporter_conf(req, res);
    } else {
        resReqError(res);
    }
});
//查询系统配置错误发送系统参数
router.post('/query_monitor_conf', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.sys.query_monitor_conf(req, res);
    } else {
        resReqError(res);
    }
});
//查询系统配置用户列表
router.post('/dip_manuser_query_user', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //   tcpClient.getXml(sendXml,req,res);
        fun.usr.dip_manuser_query_user(req, res);
    } else {
        resReqError(res);
    }
});
//保存系统配置错误检测系统参数
router.post('/save_reporter_conf', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.sys.save_reporter_conf(req, res);
    } else {
        resReqError(res);
    }
});
//保存系统配置错误发送系统参数
router.post('/save_monitor_conf', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        // tcpClient.getXml(sendXml,req,res);
        fun.sys.save_monitor_conf(req, res);
    } else {
        resReqError(res);
    }
});
//系统配置添加新用户
router.post('/dip_manuser_save_user', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //    tcpClient.getXml(sendXml,req,res);
        fun.usr.dip_manuser_save_user(req, res);
    } else {
        resReqError(res);
    }
});
//系统配置添加新用户
router.post('/dip_manuser_save_user', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //    tcpClient.getXml(sendXml,req,res);
        fun.usr.dip_manuser_save_user(req, res);
    } else {
        resReqError(res);
    }
});
//系统配置添加、修改、删除用户
router.post('/dip_manuser_save_user', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //    tcpClient.getXml(sendXml,req,res);
        fun.usr.dip_manuser_save_user(req, res);
    } else {
        resReqError(res);
    }
});
//=========project========
//添加项目
router.post('/add_project', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.project.add_project(req.body, res);
    } else {
        resReqError(res);
    }
});
//查询项目
router.post('/query_project', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.project.query_project(req.body, res);
    } else {
        resReqError(res);
    }
});
//修改项目
router.post('/delete_project', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.project.delete_project(req.body, res);
    } else {
        resReqError(res);
    }
});
//导出文件
router.post('/export_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.bak.export_config(req, res);
    } else {
        resReqError(res);
    }
});
//导入文件
router.post('/import_config', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.bak.import_config(req, res);
    } else {
        resReqError(res);
    }
});
//导出错误
router.post('/export_errinfo', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.err.exp_err(req, res);
    } else {
        resReqError(res);
    }
});
//添加数据源
router.post('/add_fav_db', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.add_fav_db(req.body, res);
    } else {
        resReqError(res);
    }
});
//获取数据源
router.post('/query_fav_db', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.query_fav_db(req.body, res);
    } else {
        resReqError(res);
    }
});
//删除数据源
router.post('/delete_fav_db', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if (req.body) {
        //var sendXml = req.body.xmlDoc;
        //tcpClient.getXml(sendXml,req,res);
        fun.database.delete_fav_db(req.body, res);
    } else {
        resReqError(res);
    }
});
//上传文件
router.post('/upload_licence', ensureAuthenticated, function (req, res) {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    form.uploadDir = path.resolve(__dirname, '../../etc');	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = 8192;   //文件大小
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.json({command_return: "ERROR", error_message: err});
            return;
        }
        if (files.file.size !== 8192) {
            res.json({command_return: "ERROR", error_message: 'file is not licence'});
            fs.unlinkSync(files.file.path);
            return;
        }
        res.json({command_return: "SUCCESS", error_message: 'upload success'});
        var newName = form.uploadDir + "/" + files.file.name;
        fs.renameSync(files.file.path, newName);  //重命名
    });
});
//上传配置
router.post('/upload_config', ensureAuthenticated, function (req, res) {
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = path.resolve(__dirname, '../app/download');
    form.keepExtensions = true;
    form.maxFieldsSize = 1048576;
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.json({command_return: "ERROR", error_message: err});
            return;
        }
        if (files.file.size > 1048576) {
            res.json({command_return: "ERROR", error_message: '文件大小不能超过1M'});
            fs.unlinkSync(files.file.path);
            return;
        }
        if (files.file.type === 'application/x-gzip' || files.file.type === 'application/gzip') {
            res.json({command_return: "SUCCESS", error_message: 'upload success', fileName: files.file.name});
            var newName = form.uploadDir + "/" + files.file.name;
            fs.renameSync(files.file.path, newName);  //重命名
        } else {
            res.json({command_return: "ERROR", error_message: '上传配置文件类型只支持tar.gz类型'});
            fs.unlinkSync(files.file.path);
        }
    });
});
//获取数据模板
router.post('/fetch_template', ensureAuthenticated, function (req, res) {
    var lineObj = '[{"ConnectionId":"con_71","PageSourceId":"database20","PageTargetId":"capture21","Connector":"Flowchart"},{"ConnectionId":"con_82","PageSourceId":"capture21","PageTargetId":"queue22","Connector":"Flowchart"},{"ConnectionId":"con_93","PageSourceId":"queue22","PageTargetId":"loader23","Connector":"Flowchart"},{"ConnectionId":"con_104","PageSourceId":"loader23","PageTargetId":"database24","Connector":"Flowchart"}]';
    var graphicCnt = '[{"BlockId":"database20","BlockClass":"km-btn-full database-bg drag-cir","BlockTxt":"unnamed","BlockX":"138px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"94px","ParentId":"flowbox","Rtype":"database","Name":"unnamed","Class":"component database jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor   "},{"BlockId":"capture21","BlockClass":"km-btn-full capture-bg drag-cir","BlockTxt":"unnamed","BlockX":"343px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"95px","ParentId":"flowbox","Rtype":"capture","Name":"unnamed","Class":"component capture jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor   "},{"BlockId":"queue22","BlockClass":"km-btn-full queue-bg drag-cir","BlockTxt":"unnamed","BlockX":"532px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"95px","ParentId":"flowbox","Rtype":"queue","Name":"unnamed","Class":"component queue jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor   "},{"BlockId":"loader23","BlockClass":"km-btn-full loader-bg drag-cir","BlockTxt":"unnamed","BlockX":"736px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"95px","ParentId":"flowbox","Rtype":"apply","Name":"unnamed","Class":"component apply jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor    "},{"BlockId":"database24","BlockClass":"km-btn-full database-bg drag-cir","BlockTxt":"unnamed","BlockX":"920px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"94px","ParentId":"flowbox","Rtype":"database","Name":"unnamed","Class":"component database jsplumb-draggable jsplumb-droppable _jsPlumb_endpoint_anchor _jsPlumb_connected  "}]';
    var data = {graphic: {global_index: 14, line_object: lineObj, graphic_content: graphicCnt}};
    pub.processResult(res, data, true, req.body);
});

//大屏显示-dip状态信息
router.post('/query_display_status',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml,req,res);
    }else{
        resReqError(res);
    }
});
//大屏显示--系统信息
router.post('/query_display_procinfo',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        var sendXml = req.body.xmlDoc;
        tcpClient.getXml(sendXml,req,res);
    }else{
        resReqError(res);
    }
});

//ETL相关操作
//查询etl属性
router.post('/query_etl_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询etl用户
router.post('/query_etl_user',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_user(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询etl table
router.post('/query_etl_table',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_table(req.body, res);
    }else{
        resReqError(res);
    }
});
//
router.get('/query_etl_table',ensureAuthenticated, function (req, res) {
    console.log(req.query);
    if(req.query){
        fun.etl.query_etl_table(req.query, res);
    }else{
        resReqError(res);
    }
});

//查询etl table rule
router.post('/query_etl_table_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_table_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存etl table rule
router.post('/save_etl_table_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_table_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询列
router.post('/query_column_list',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_column_list(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存增加列
router.post('/save_etl_add_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_add_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询增加列
router.post('/query_etl_add_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_add_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存表审计
router.post('/save_etl_transform_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_transform_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询表审计
router.post('/query_etl_transform_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_transform_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存记录过滤
router.post('/save_etl_condition_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_condition_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询记录过滤
router.post('/query_etl_condition_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_condition_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存删除列
router.post('/save_etl_delete_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_delete_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询删除列
router.post('/query_etl_delete_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_delete_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存映射列
router.post('/save_etl_map_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_map_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询映射列
router.post('/query_etl_map_config',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_map_config(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询操作转换
router.post('/query_etl_convert',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_convert(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存操作转换
router.post('/save_etl_convert',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_convert(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询表过滤
router.post('/query_etl_table_filter',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_table_filter(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存表过滤
router.post('/save_etl_table_filter',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_table_filter(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询表操作过滤
router.post('/query_etl_operation_filter',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_operation_filter(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存表操作过滤
router.post('/save_etl_operation_filter',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_etl_operation_filter(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询etl已配置规则
router.post('/query_etl_rule_ptable',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_etl_rule_ptable(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询组内的批量规则集
router.post('/query_batch',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_batch(req.body, res);
    }else{
        resReqError(res);
    }
});

//保存批量规则集
router.post('/save_batch_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_batch_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询规则集内规则
router.post('/query_batch_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_batch_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询etl选中的规则集
router.post('/query_batch_checked',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_batch_checked(req.body, res);
    }else{
        resReqError(res);
    }
});


//保存etl选择批量规则
router.post('/save_batch_codevalue',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.save_batch_codevalue(req.body, res);
    }else{
        resReqError(res);
    }
});

//查询规则集内规则的codes
router.post('/query_batch_codes',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.query_batch_codes(req.body, res);
    }else{
        resReqError(res);
    }
});

//在规则集内插入规则
router.post('/insert_batch_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.insert_batch_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//在规则集内删除规则
router.post('/delete_batch_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.delete_batch_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//在规则集内更新规则
router.post('/update_batch_rule',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.update_batch_rule(req.body, res);
    }else{
        resReqError(res);
    }
});

//表达式校验
router.post('/legal_check_expression',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.etl.legal_check_expression(req.body, res);
    }else{
        resReqError(res);
    }
});

//获取db2 schema
router.post('/query_db2_schema',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.database.query_db2_schema(req.body, res);
    }else{
        resReqError(res);
    }
});

//获取db2 table
router.get('/query_db2_table',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.database.query_db2_table(req.body, res);
    }else{
        resReqError(res);
    }
});

//设置db2 cdc
router.post('/set_db2_cdc',ensureAuthenticated, function (req, res) {
    console.log(req.body);
    if(req.body){
        fun.database.set_db2_cdc(req.body, res);
    }else{
        resReqError(res);
    }
});

module.exports = router;
