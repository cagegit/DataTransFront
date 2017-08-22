/**
 * Created by cagej on 2017/4/27.
 */
(function () {
    'use strict';
    angular.module('myApp.groupService',[])
        .service('groupService',groupService);
    groupService.$inject=['httpService','tipsService','md5Service','$filter','$q','$window'];
    function groupService(httpSer,dipT,md5Ser,$filter,$window) {
           /*
           * 添加组
           * */
           this.addGroup=function (pid,property,g_name,g_juese) {
               var url="/dipserver/add_group",args={projectid:pid,group:property.groupName,description:property.desc,log_save_hour:property.logTime,users:g_name,auth:g_juese};
               var result={res:false,error:{},groupId:''};
               args=md5Ser.md5Data(args);
               return httpSer.postDataList(url,args).then(function (data) {
                   if(md5Ser.equalMd5Data(data)){
                       if(data.status){
                           result.res=true;
                           result.groupId=(data.response && data.response.group_id) || '';
                       }else{
                           result.res=false;
                           result.error=data.response;
                       }
                   }
                   return result;
               });
           };

           this.modifyGroup=function (property,groupId) {
               var url = "/dipserver/modify_group",
                   args={group:property.groupName,new_group:property.groupName,description:property.desc,log_save_hour:property.logTime,group_id:groupId},result=false;
               args=md5Ser.md5Data(args);
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
                   dipT.error($filter('translate')('Wlcw'));//网络错误！
               });
           }
    }
})();