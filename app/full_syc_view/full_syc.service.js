/**
 * Created by cagej on 2017/4/7.
 */
(function () {
    'use strict';
    angular.module('myApp.fullSycService',[])
        .config(['$qProvider',function ($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        .service('fullSycService',['httpService','tipsService','md5Service','$filter',function (httpSer,dipT,md5Ser,$filter) {
            /*
             * 查询全同步依赖数据
             * */
            this.query_full_sync_filters=function(comInfo) {
                var args = {group:comInfo.gn,db_component_id:comInfo.sn,db_type:comInfo.st,comp_id:comInfo.cn};
                var url="/dipserver/query_full_sync_filters",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res =data.response;
                            if(res && res.list && angular.isArray(res.list)){
                                angular.forEach(res.list,function (v,i) {
                                    var parent={id:i,name:v.schema,isParent:true,icon:"/img/ico/schema.png",chkDisabled:true,checked:true,open:i===0,children:[]};
                                    if(v.table){
                                        angular.forEach(v.table,function (v1,ii) {
                                            parent.children.push({id:ii,name:v1,chkDisabled:true,checked:true});
                                        });
                                    }
                                    result.push(parent);
                                });
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询schema列表
             * xml接口 manager
             * */
            this.query_map_exp_schema=function (sync) {
                var args = '<dip_command><command>query_map_exp_schema</command><command_data><group>'
                    +sync.group + '</group><component>' + sync.comp_id + '</component><sync_id>'+sync.sync_id+'</sync_id></command_data></dip_command>';
                var url = "/dipserver/query_map_exp_schema",result=[];
                return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                    if (data.command_return === "ERROR") {
                        var err = data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        if(data.return_data &&　data.return_data.schema){
                            var arr=[];
                            if(angular.isArray(data.return_data.schema)){
                                arr=data.return_data.schema;
                            }else if(angular.isString(data.return_data.schema)){
                                arr.push(data.return_data.schema);
                            }
                            angular.forEach(arr,function (v) {
                                result.push({name:v});
                            });
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询全同步table列表
             * xml接口 manager
             * */
            this.query_map_exp_table=function (sync,schema) {
                var args = '<dip_command><command>query_map_exp_table</command><command_data><group>'+sync.group+'</group><component>' + sync.comp_id +
                    '</component><schema>'+schema+'</schema><sync_id>'+sync.sync_id+'</sync_id></command_data></dip_command>';
                var url = "/dipserver/query_map_exp_table",result=[];
                return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                    if (data.command_return === "ERROR") {
                        var err = data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        var res =data.return_data;
                        if(res && res.table){
                            var arr=[];
                            if(angular.isArray(res.table)){
                                arr=res.table;
                            }else if(angular.isObject(res.table)){
                                arr.push(res.table);
                            }
                            angular.forEach(arr,function (v) {
                                v.checked=false;
                                result.push(v);
                            });
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询map列表
             * */
            this.query_map_list=function () {
                var url="/dipserver/query_map_list",args=md5Ser.md5Data({}),result=[];
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res =data.response;
                            if(res && res.list && angular.isArray(res.list)){
                                angular.forEach(res.list,function (v,i) {
                                    var name=v.group+'/'+v.comp_id+'/config'+v.sync_id;
                                    result.push({sync_id:v.sync_id,group:v.group,comp_id:v.comp_id,name:name,id:i});
                                });
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询表空间列表   query_db_tablespace
             * */
            this.queryTabSpace=function (comInfo) {
                var url="/dipserver/query_db_tablespace",args=md5Ser.md5Data({group:comInfo.gn,db_type:comInfo.st,comp_id:comInfo.sn}), result=[];
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res =data.response;
                            if(res && res.table_space && angular.isArray(res.table_space)){
                                angular.forEach(res.table_space,function (v) {
                                    result.push({name:v,map_name:''});
                                });
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    console.log(result);
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 生成全同步配置
             * */
            this.createSyncCfg=function (comInfo,exp,imp) {
                var args={group:comInfo.gn,comp_id:comInfo.cn,exp:exp,imp:imp};
                var url="/dipserver/create_sync_cfg", result='';
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            if(data.response && data.response.sync_id){
                                result=data.response.sync_id;
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 开始全同步 manager
             * */
            this.startFullSync=function (comInfo,syncId,flag) {
                var sycXml = '<dip_command><command>start_full_sync</command><command_data>'
                    + '<group>'+comInfo.gn+ '</group><component_name>'+comInfo.cn+'</component_name><sync_id>'+syncId+'</sync_id><again>'+flag+'</again></command_data></dip_command>';
                var url = "/dipserver/start_full_sync",result=false;
                return httpSer.postDataList(url,{xmlDoc:sycXml},0).then(function (data) {
                    if (data.command_return==="SUCCESS") {
                        result=true;
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询全同步概述 manager
             * */
            this.queryFullSyncSummary=function (comInfo,sync_id) {
                var xml = '<dip_command><command>query_fullsync_summary</command><command_data>'
                    + '<group>'+comInfo.gn+'</group><component>'+comInfo.cn+'</component><sync_id>'+ sync_id+'</sync_id></command_data></dip_command>';
                var url = "/dipserver/query_fullsync_summary",result={};
                return httpSer.postDataList(url,{xmlDoc:xml}).then(function (data) {
                    result.export={};
                    result.import={};
                    if (data.command_return === "ERROR") {
                        var err = data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        if(data.return_data &&　data.return_data.export){
                            var exp=data.return_data.export;
                            result.export.start_time=exp.start_time?exp.start_time:'';
                            result.export.work_time=exp.work_time?exp.work_time:'';
                            result.export.succ_num=exp.succ_num?exp.succ_num:0;
                            result.export.err_num=exp.err_num?exp.err_num:0;
                            result.export.total=exp.total?exp.total:0;
                        }
                        if(data.return_data &&　data.return_data.import){
                            var imp=data.return_data.import;
                            result.import.start_time=imp.start_time?imp.start_time:'';
                            result.import.work_time=imp.work_time?imp.work_time:'';
                            result.import.succ_num=imp.succ_num?imp.succ_num:0;
                            result.import.err_num=imp.err_num?imp.err_num:0;
                            result.import.total=imp.total?imp.total:0;
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询全同步详细 manager
             * */
            this.queryFullSyncDetail=function (comInfo,sync_id) {
                var xml = '<dip_command><command>query_fullsync_detail</command><command_data>' +
                    '<group>'+comInfo.gn+'</group><component>'+comInfo.cn+'</component><sync_id>'+ sync_id+'</sync_id></command_data></dip_command>';
                var url = "/dipserver/query_fullsync_detail",result=[];
                return httpSer.postDataList(url,{xmlDoc:xml}).then(function (data) {
                    if (data.command_return === "ERROR") {
                        var err=data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        var res =data.return_data;
                        if(res && res.detail){
                            if(angular.isArray(res.detail)){
                                result=res.detail;
                            }else if(angular.isObject(res.detail)){
                                result.push(res.detail);
                            }
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询全同步错误 manager
             * */
            this.querySyncError=function (comInfo,sync_id) {
                var xml = '<dip_command><command>query_fullsync_error</command><command_data>'
                    + '<group>'+comInfo.gn+'</group><component>'+comInfo.cn+'</component><sync_id>'+ sync_id+'</sync_id></command_data></dip_command>';
                var url = "/dipserver/query_fullsync_error",result=[];
                return httpSer.postDataList(url,{xmlDoc:xml}).then(function (data) {
                    if (data.command_return === "ERROR") {
                        var err=data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        var res =data.return_data;
                        if(res && res.record){
                            if(angular.isArray(res.record)){
                                result=res.record;
                            }else if(angular.isObject(res.record)){
                                result.push(res.record);
                            }
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 停止全同步 manager
             * */
            this.stopFullSync=function (comInfo) {
                var xml = '<dip_command><command>stop_full_sync</command><command_data><group>'+comInfo.gn+'</group><component_name>'+comInfo.cn+'</component_name></command_data></dip_command>';
                var url = "/dipserver/stop_full_sync",result=false;
                return httpSer.postDataList(url,{xmlDoc:xml},0).then(function (data) {
                    if (data.command_return === "ERROR") {
                        var err=data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        result=true;
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 获取历史全同步信息
             * */
            this.getHistoryMaps=function (comInfo) {
                var args={group:comInfo.gn,comp_id:comInfo.cn};
                var url="/dipserver/query_fullsync_history", result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res =data.response;
                            if(res && res.list && angular.isArray(res.list)){
                                angular.forEach(res.list,function (v,i) {
                                    var name=comInfo.gn+'/'+comInfo.cn+'/config'+v.sync_id;
                                    result.push({sync_id:v.sync_id,group:comInfo.gn,comp_id:comInfo.cn,name:name,id:i});
                                });
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 获取全通状态信息 manager
             * */
            this.refreshFullSyncFilters=function (comInfo) {
                var xml = '<dip_command><command>refresh_fullsync_filters</command><command_data><group>'+comInfo.gn+'</group><component>'+comInfo.cn+'</component></command_data></dip_command>';
                var url = "/dipserver/refresh_fullsync_filters",result={};
                return httpSer.postDataList(url,{xmlDoc:xml}).then(function (data) {
                    result.export={};
                    result.import={};
                    result.details=[];
                    result.syncId='';
                    result.isFinish=false;
                    if (data.command_return === "ERROR") {
                        var err=data.return_data.error_message || data.return_data.error_msg;
                        dipT.error(err);
                    }else{
                        var res =data.return_data;
                        if(res && res.summary){
                            result.export=res.summary.export;
                            result.import=res.summary.import;
                        }
                        if(res && res.detail){
                            if(angular.isArray(res.detail.record)){
                                result.details=res.detail.record;
                            }else if(angular.isObject(res.detail.record)){
                                result.details.push(res.detail.record);
                            }
                        }
                        if(res && res.sync_id!==''){
                            result.syncId=res.sync_id;
                        }
                        if(res===''){
                            result.isFinish=true;
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
        }]);
})();