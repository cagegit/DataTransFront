/**
 * Created by 金超 on 2017/4/24.
 */
(function () {
    'use strict';
    angular.module('myApp.cpService',[])
        .service('cpService',cpService);
    cpService.$inject=['httpService','tipsService','md5Service','$filter'];
    function cpService(httpSer,dipT,md5Ser,$filter) {
        /*
        * 获取capture配置信息
        * */
        this.getCaptureConfig=function (comInfo) {
            var cn = comInfo.cn === 'unnamed' ? '' : comInfo.cn;
            var args={group_id:comInfo.gn,db_component_id:comInfo.pn,component_id:comInfo.cid,type:comInfo.pt,component_name:cn},result=null;
            args=md5Ser.md5Data(args);
            var url = "/dipserver/query_capture_config";
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var db_type='',res = data.response;
                        if (comInfo.pt === 'oracle') {
                            db_type='oracle';
                            if(res.rac_info && res.rac_info.instance){
                                db_type='oracle-rac';
                            }
                        }
                        result=init_capture_data(comInfo,res,db_type);//初始化capture配置数据
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        //初始化capture配置数据
        function init_capture_data(comInfo,res,db_type) {
            var suser = [],auser = [],arr=res.selected_users,arr1=res.all_users,racs=[],ds_info;
            if(arr){
                var selUser = [];
                if(angular.isArray(arr.user)){
                    selUser = arr.user;
                }else{
                    selUser.push(arr.user);
                }
                angular.forEach(selUser, function (val) {
                    suser.push(val);
                });
                suser.sort();
            }
            if(arr1){
                var allUser =[];
                if(angular.isArray(arr1.user)){
                    allUser = arr1.user;
                }else{
                    allUser.push(arr1.user);
                }
                angular.forEach(allUser, function (val) {
                    var sig = 0;
                    angular.forEach(suser, function (va) {
                        if (va === val) {
                            sig = 1;
                        }
                    });
                    if (sig === 0) {
                        auser.push(val);
                    }
                });
                auser.sort();
            }
            if(db_type==='oracle-rac'){
                if(angular.isArray(res.rac_info.instance)){
                    racs=res.rac_info.instance;
                }else if(angular.isObject(res.rac_info.instance)){
                    racs.push(res.rac_info.instance);
                }
            }
            ds_info=res.downstream_info;
            if(angular.isObject(res.downstream_info)){
                ds_info=res.downstream_info;
            }
            return {
                unselList:auser,
                selList:suser,
                property:res.parameter,
                racs:racs,
                captureName:comInfo.cn,
                downstream_info:ds_info
            };
        }
        /*
        * 保存capture配置信息
        * */
        this.addCaptureProperty=function (arg) {
            var url = "/dipserver/add_capture_property",result={res:false,comId:'',msg:''};
            arg=md5Ser.md5Data(arg);
            return httpSer.postDataList(url,arg,0).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res=true;
                        result.comId=(data.response && data.response.component_id) || '';
                    }else{
                        // dipT.error((data.response && data.response.error_msg));
                        result.msg=data.response.error_msg;
                    }
                }
                return result;
            });
        };
        /*
        * 保存高级选项
        * */
        this.saveParameter=function (comInfo,params) {
            var url='/dipserver/save_parameter';
            var args={group_id:comInfo.gn,component_id:comInfo.cid,parameter:params},result=false;
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result=true;
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Bcsb'));//保存失败
            });
        };
        /*
        * 查询快照同步表 sqlserver
        * */
        this.queryCaptureTable=function (comInfo,selList) {
            var url='/dipserver/query_capture_table',args,result={res:false,info:null};
            args={group:comInfo.gn,db_component_name:comInfo.pn,component_name:comInfo.cid,selected_users:{user:selList}};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res = data.response || [];
                        result.res=true;
                        result.info=res;
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 保存快照同步表 sqlserver
        * */
        this.saveKzTable=function (comInfo,cpName,userList,nodes,params) {
            var arg ={group_id:comInfo.gn,component_name:cpName,db_component_id:comInfo.pn,type:comInfo.pt,selected_users:userList,snapshot_tables:{schema:nodes},parameter:params,component_id:comInfo.cid};
            arg=md5Ser.md5Data(arg);
            var url = "/dipserver/add_capture_property";
            return httpSer.postDataList(url,arg).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        dipT.success($filter('translate')('Bccg'));//保存成功！
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
            },function () {
                dipT.error($filter('translate')('Bcsb'));//保存失败
            });
        };
        /*
        * 添加补充日志 sqlserver
        * */
        this.changeExtendedLog=function (comInfo,log) {
            var url='/dipserver/change_extended_log',args,result=false;
            args={group:comInfo.gn,db_name:comInfo.pn,extend_table:{user:log.name,table:log.table,status:log.cz}};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args,0).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    result = !!data.status;
                }
                return result;
            });
        };
        /*
        * 查询补充日志里列表 sqlserver
        * */
        this.queryExtendLogTable=function (comInfo,selList) {
            var url='/dipserver/query_extended_log_table',args,result={res:false,info:null};
            args={group:comInfo.gn,db_name:comInfo.pn,user:selList};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res = data.response || [];
                        result.res=true;
                        result.info=res;
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 查询schema列表
        * */
        this.getDb2Schema = function (comInfo) {
            var url='/dipserver/query_db2_schema',args,imgPath='/img/ico/',result={res: false, list: []};
            args={group: comInfo.gn, db_id: comInfo.pn, type: "schema"};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res = true;
                        var arr = [];
                        if(data.response && angular.isArray(data.response)) {
                            arr = data.response;
                        }
                        angular.forEach(arr, function (v, i) {
                            result.list.push({id: i, name: v, gp: comInfo.gn, db: comInfo.pn, checked: false,icon: imgPath+'schema.png', isParent: true, children: []});
                        });
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 设置db2 cdc
        * */
        this.saveDb2CdcInfo = function (closeList, openList, dbId) {
            var url = '/dipserver/set_db2_cdc',args, result = false;
            args={close_cdc_set: closeList, open_cdc_set: openList, db_id: dbId};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status && data.response === 'SUCCESS'){
                        result = true;
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
    }
})();