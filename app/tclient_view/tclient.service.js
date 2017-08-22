/**
 * Created by cagej on 2017/4/26.
 */
(function () {
    'use strict';
    angular.module('myApp.tcService',[])
        .service('tcService',tcService);
    tcService.$inject=['httpService','tipsService','md5Service','$filter','tDes'];
    function tcService(httpSer,dipT,md5Ser,$filter,tDes) {
       /*
       * 获取tclient配置信息
       * */
       this.getTclientInfo=function (comInfo) {
           var url = "/dipserver/query_qrecv_config",args={group_id:comInfo.gn,component_id:comInfo.cid},result=null;
           args=md5Ser.md5Data(args);
           return httpSer.postDataList(url,args).then(function (data) {
               if(md5Ser.equalMd5Data(data)){
                   if(data.status){
                       result=data.response;
                       if(result.passwd){
                           result.passwd=tDes.de_des(result.passwd);
                       }
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
       * 保存tclient配置信息
       * */
       this.saveTclientInfo=function (comInfo,property) {
           var url = '/dipserver/add_apply_config';
           var transferObj={group_name:property.group_name,ip:property.ip,port:property.port,compress:property.compress
               ,encrypt:property.encrypt,queue_name:property.queue_name,pkg_size:property.pkg_size,db_type:property.db_type,user:property.user,passward:property.passwd};
           transferObj.passward=tDes.en_des(transferObj.passward);
           var args={group_id:comInfo.gn,component_name:property.component_name,type:'transfer',transfer:transferObj,component_id:comInfo.cid},result={res:false,comId:'',msg:''};
           args=md5Ser.md5Data(args);
           return httpSer.postDataList(url,args).then(function (data) {
               if(md5Ser.equalMd5Data(data)){
                   if(data.status){
                       result.res =true;
                       result.comId=(data.response && data.response.component_id) || '';
                   }else{
                       // dipT.error((data.response && data.response.error_msg));
                       result.msg=data.response.error_msg;
                   }
               }
               return result;
           });
       };
    }
})();