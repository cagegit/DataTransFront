/**
 * Created by 金超 on 2017/4/25.
 */
(function () {
    'use strict';
    angular.module('myApp.queueService',[])
        .service('quService',queueService);
    queueService.$inject=['httpService','tipsService','md5Service','$filter'];
    function queueService(httpSer,dipT,md5Ser,$filter) {
        /*
        * 获取queue配置信息
        * */
        this.getQueueInfo=function(comInfo){
            var args={group_id:comInfo.gn,component_id:comInfo.cid},result=null;
            args=md5Ser.md5Data(args);
            var url="/dipserver/query_queue_info";
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result=data.response;
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return result;
            });
        };
        /*
        * 保存queue配置信息
        * */

        this.saveQueueInfo=function (comInfo,queue) {
            var args ={group_id:comInfo.gn,component_name:queue.cname,queue_type:'file',size:queue.size,statis:queue.statis,queue_save_hour:queue.hour,component_id:comInfo.cid},
                result={res:false,comId:'',msg:''};
            args=md5Ser.md5Data(args);
            var url = "/dipserver/save_queue_info";
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res=true;
                        result.comId=(data.response &&　data.response.component_id) || '';
                    }else{
                        // dipT.error((data.response && data.response.error_msg));
                        result.msg=data.response.error_msg;
                    }
                }
                return result;
            });
        };
        /*
        * 删除queue队列统计信息
        * */
        this.deleteQueueStatis=function (comInfo,endTime,flag) {
            var args ={group_id:comInfo.gn,component_id:comInfo.cid,end_time:endTime,flag:flag};
            args=md5Ser.md5Data(args);
            var url = "/dipserver/delete_queue_pkg_statis";
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        dipT.success($filter('translate')('Sccg'));//删除成功！
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
    }
})();