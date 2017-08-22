/**
 * Created by cagej on 2017/4/10.
 */
(function () {
    'use strict';
    angular.module('myApp.main_view.service',[])
        .config(['$qProvider',function ($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        .service('mainService',mainService);
    mainService.$inject=['httpService','tipsService','md5Service','$filter','tDes','$window'];
    function mainService(httpSer,dipT,md5Ser,$filter,tDes,$window) {
        /*
         * 删除组件
         * */
        this.deleteComponents=function (comInfo) {
            var url="/dipserver/delete_component", args={group:comInfo.group_id,component_name:comInfo.name,type:comInfo.rtype,component_id:comInfo.cid}, result=false;
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url, args).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if (data.status) {
                        result=true;
                    } else {
                        dipT.error(data.response.error_msg);
                    }
                }
                return result;
            }, function(err) {
                dipT.error($filter('translate')('M_wlscsb')); //网络错误，删除失败！
            });
        };
        /*
         * 获取组状态信息 manager
         * @params {String} groupId
         * */
        this.getGroupStatus=function (groupId) {
            var url = "/dipserver/query_one_group_status", args = "<dip_command><command>query_one_group_status</command><command_data><group>"+groupId+"</group></command_data></dip_command>";
            return httpSer.postDataList(url,{xmlDoc:args});
        };
        /*
         * 获取所有的组
         * */
        this.getAllGroups=function (pid,g_name,g_juese) {
            var url = "/dipserver/fetch_all_groups",args = {projectid: pid,users:g_name,auth: g_juese}, result={status:true,list:[]};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url, args).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if (data.status) {
                        if(data.response && angular.isObject(data.response)){
                            if(angular.isArray(data.response.group)){
                                result.list=data.response.group;
                            }else if(angular.isObject(data.response.group)){
                                result.list.push(data.response.group);
                            }
                        }else{
                            result.status=false;
                        }
                    } else {
                        data.response && dipT.error(data.response.error_msg);
                    }
                }
                return result;
            }, function() {
                dipT.error($filter('translate')('M_hqzsb')); //获取组信息失败！
            });
        };
        /*
         * 获取图形信息
         * */
        this.getGraphicByGroupId=function (group_id) {
            var url="/dipserver/require_graphic", result=false;
            var args = md5Ser.md5Data({ group: group_id });
            return httpSer.postDataList(url, args).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if (data.status) {
                        r7Plumb.drawGraphic(data);
                        result = true;
                    } else {
                        data.response && dipT.error(data.response.error_msg);
                    }
                }
                return result;
            }, function(err) {
                return err;
            });
        };
        /*
         * 获取数据库模板列表
         * */
        this.getDbModelList=function () {
            var args = md5Ser.md5Data({}), url = "/dipserver/query_fav_db", result=[];
            return httpSer.postDataList(url, args).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if (data.status) {
                        var res = data.response;
                        if (res && res.fav_dbs) {
                            var dbs = res.fav_dbs.db, arr = [];
                            if (angular.isArray(dbs)) {
                                arr = dbs;
                            } else if (angular.isObject(dbs)) {
                                arr.push(dbs);
                            }
                            angular.forEach(arr,function (v) {
                                if(v.db_password){
                                    v.db_password=tDes.de_des(v.db_password);
                                }
                            });
                            result = arr;
                        }
                    } else {
                        data.response && dipT.error(data.response.error_msg);
                    }
                }
                return result;
            });
        };
        /*
         * 获取Tserver配置信息
         * */
        this.getTserverConfig=function () {
            var url = "/dipserver/query_tserver_config", args = md5Ser.md5Data({}),result='';
            return httpSer.postDataList(url, args).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if (data.status) {
                        var res =data.response;
                        if(res && angular.isObject(res) && res.server_config && res.server_config.user){
                            result=res.server_config.user.name;
                        }
                    } else {
                        data.response && dipT.error(data.response.error_msg);
                    }
                }
                return result;
            }, function() {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
         * 获取Tserver状态 manager
         * */
        this.getTserverStatus=function () {
            var url = "/dipserver/query_tserver_status", args = "<dip_command><command>query_tserver_status</command><command_data></command_data></dip_command>", result=0;
            return httpSer.postDataList(url, { xmlDoc: args }).then(function(data) {
                if (data.command_return === "SUCCESS") {
                    var res = data.return_data;
                    if (res && res.server_info) {
                        var info = res.server_info;
                        if (info.type === 'tserver' && info.status === 'running') {
                            result=1;
                        }
                    }
                }
                return result;
            });
        };
        /*
         * 停止Tserver manager
         * */
        this.stopTServer=function () {
            var url = "/dipserver/stop_server",args = "<dip_command><command>stop_server</command><command_data><type>tserver</type></command_data></dip_command>",result=false;
            return httpSer.postDataList(url, { xmlDoc: args }).then(function(data) {
                if (data.command_return === "SUCCESS") {
                    result=true;
                }
                return result;
            });
        };
        /*
         * 删除组
         * @params {String} groupId
         * */
        this.deleteGroup =function (groupId) {
            var url="/dipserver/delete_group",args={group:groupId},result={res:false,msg:''};
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url, args).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if(data.status) {
                        result.res=true;
                    }else{
                        result.res=false;
                        if(data.response && data.response.error_msg){
                            result.msg=data.response.error_msg;
                        }
                    }
                }
                return result;
            });
        };
        /*
         * 重置组
         * @params {String} groupId 组id
         * @params {String} cleanAll yes/no
         * */
        this.resetGroup=function (groupId,cleanAll) {
            var url = "/dipserver/group_reset", args={group:groupId,clean_all:cleanAll},result={res:false,msg:''};
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args,0).then(function(data) {
                if (md5Ser.equalMd5Data(data)) {
                    if(data.status) {
                        result.res=true;
                    }else{
                        result.res=false;
                        if(data.response && data.response.error_msg){
                            result.msg=data.response.error_msg;
                        }
                    }
                }
                return result;
            });
        };
        /*
         * 判断源端是否一致
         * @params {Object} info
         * */
        this.isSourceDatabaseSame=function (info) {
            var args ={group:info.gn,sorcedb_name:info.sn,targetdb_name:info.tn},url="/dipserver/query_all_db_info",result= false;
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res = data.response;
                        if(res && res.same && res.same.toLowerCase()==='yes'){
                            result=true;
                        }
                    }else{
                        dipT.error(data.response.error_msg);
                        result='error';
                    }
                }
                return result;
            });
        };
        /*
         * 以scn启动server manager
         * @params {Object} comInfo
         * @params {String} server_type 组件类型
         * @params {String} scn
         * @params {String} low_scn
         * */
        this.startServerByScn=function (comInfo,server_type,scn,low_scn) {
            var url="/dipserver/start_server_by_scn",args = "<dip_command><command>start_server_by_scn</command><command_data><group>" + comInfo.group_id + "</group>" +
                "<type>" + server_type + "</type><name>" + comInfo.cid + "</name><start_scn>" + scn + "</start_scn><low_scn>" + low_scn + "</low_scn>" +
                "</command_data></dip_command>",result={res:false,msg:''};
            return httpSer.postDataList(url,{xmlDoc:args},0).then(function (data) {
                if(data.command_return==="ERROR"){
                    result.res=false;
                    result.msg=data.error_message || (data.return_data && data.return_data.error_message) || '';
                }else{
                    result.res=true;
                }
                return result;
            });
        };
        /*
         * 停止server manager
         * @params {Object} comInfo
         * */
        this.stopServer=function (comInfo) {
            var url = "/dipserver/stop_server",args = "<dip_command><command>stop_server</command><command_data><group>" + comInfo.group_id + "</group>" +
                "<type>"+comInfo.rtype+"</type><name>" + comInfo.cn + "</name></command_data></dip_command>",result={res:false,msg:''};
            return httpSer.postDataList(url,{xmlDoc:args},0).then(function (data) {
                if(data.command_return === "ERROR"){
                    result.res=false;
                    result.msg=data.error_message || (data.return_data && data.return_data.error_message) || '';
                }else{
                    result.res=true;
                }
                return result;
            });
        };
        /*
         * 重启server manager
         * @params {Object} comInfo
         * */
        this.restartServer=function (comInfo) {
            var url = "/dipserver/start_server",args = "<dip_command><command>restart_server</command><command_data><group>" + comInfo.group_id + "</group>" +
                "<type>"+comInfo.rtype+"</type><name>" + comInfo.cn + "</name></command_data></dip_command>",result={res:false,msg:''};
            return httpSer.postDataList(url,{xmlDoc:args},0).then(function (data) {
                if(data.command_return === "ERROR"){
                    result.res=false;
                    result.msg=data.error_message || (data.return_data && data.return_data.error_message) || '';
                }else{
                    result.res=true;
                }
                return result;
            });
        };
        /*
         * 启动server manager
         * @params {Object} comInfo
         * */
        this.startServer=function (comInfo) {
            var url = "/dipserver/start_server",args = "<dip_command><command>start_server</command><command_data><group>" + comInfo.group_id + "</group>" +
                "<type>"+comInfo.rtype+"</type><name>" + comInfo.cn + "</name></command_data></dip_command>",result={res:false,msg:''};
            return httpSer.postDataList(url,{xmlDoc:args},0).then(function (data) {
                if(data.command_return === "ERROR"){
                    result.res=false;
                    result.msg=data.error_message || (data.return_data && data.return_data.error_message) || '';
                }else{
                    result.res=true;
                }
                return result;
            });
        };
        /*
         * 获取标注模板
         * */
        this.getCommonTemplate=function () {
            var url ='/dipserver/fetch_template',args=md5Ser.md5Data({}),result={res:false,data:{}};
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res=true;
                        result.data=data;
                    }
                }
                return result;
            },function (er) {
                dipT.error($filter('translate')('M_cwsb'));//网络错误，操作失败！
            });
        };
        /*
         * 导出错误文件
         * */
        this.exportErrFile=function () {
            var args=md5Ser.md5Data({}),url ='/dipserver/export_errinfo';
            httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res = data.response;
                        if(res && res.filename){
                            $window.open('/download/'+res.filename);
                        }else{
                            dipT.warning($filter('translate')('M_mykpz'));//没有可以导出的文件
                        }
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
         * 导入配置文件
         * @params {String} fileName
         * */
        this.importConfigFile=function (fileName) {
            var url ='/dipserver/import_config',args=md5Ser.md5Data({filename:fileName}),result={res:false,errorCode:''};
            return httpSer.postDataList(url,args,0).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res=true;
                    }else{
                        result.res=false;
                        result.errorCode='';
                        if(data.response && data.response.error_code){
                            result.errorCode=data.response.error_code;
                        }
                    }
                }
                return result;
            });
        };
        /*
         * 导出配置文件
         * */
        this.exportConfigFile=function () {
            var args=md5Ser.md5Data({}),url ='/dipserver/export_config';
            httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res = data.response;
                        if(res && res.filename){
                            $window.open('/download/'+res.filename);
                        }else{
                            dipT.warning($filter('translate')('M_mykpz'));//没有可以导出的文件
                        }
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
            },function (err) {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
         * check当前用户的登录状态及信息
         * */
        this.checkCurrentUserAuth=function () {
            var result={res:false,user:null};
            return httpSer.getDataList('/isAuth',{}).then(function (res) {
                if(res.isAuth){
                    result.res=true;
                    result.user=res.user || {};
                }
                return result;
            });
        };
    }
})();