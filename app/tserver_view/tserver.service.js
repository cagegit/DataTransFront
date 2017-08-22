/**
 * Created by cagej on 2017/4/26.
 */
(function () {
    'use strict';
    angular.module('myApp.tsService',[])
        .service('tsService',tsService);
    tsService.$inject=['httpService','tipsService','md5Service','$filter','tDes'];
    function tsService(httpSer,dipT,md5Ser,$filter,tDes) {
        /*
        * 获取Tserver配置信息
        * */
        this.getTserverInfo=function () {
            var args=md5Ser.md5Data({}),url = "/dipserver/query_tserver_config",result=null;
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result= data.response;
                        if(result.server_config.user.passwd){
                            result.server_config.user.passwd = tDes.de_des(result.server_config.user.passwd);
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
        * 获取tserver状态信息
        * */
        this.getTserverStatus=function () {
            var url = "/dipserver/query_tserver_status";
            var args = "<dip_command><command>query_tserver_status</command><command_data></command_data></dip_command>",result={res:false,info:null};
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "SUCCESS"){
                    var res =data.return_data;
                    if(res && res.server_info){
                        result.res=true;
                        result.info=res.server_info;
                    }
                }
                return result;
            });
        };
        /*
        * 启动Tserver xml by manager
        * */
        this.startTserver=function () {
            var url = "/dipserver/start_server",args = "<dip_command><command>start_server</command><command_data><group></group><type>tserver</type><name></name></command_data></dip_command>"
                ,result=false;
            return httpSer.postDataList(url,{xmlDoc:args},0).then(function (data) {
                result=data.command_return === "SUCCESS";
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 保存Tserver配置信息
        * */
        this.saveTserverConfig=function (cfg) {
            cfg.user.passwd=tDes.en_des(cfg.user.passwd);
            var args=md5Ser.md5Data({server_config:cfg});
            var url = '/dipserver/add_tserver_config',result=false;
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
        };
    }
})();