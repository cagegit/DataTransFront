/**
 * Created by cagej on 2017/5/10.
 */
(function () {
    'use strict';
     angular.module('myApp.ftpService',[])
         .service('ftpService',ftpService);
    ftpService.$inject=['httpService','tipsService','md5Service','$filter'];
    function ftpService(httpSer,dipT,md5Ser,$filter) {
        /*
        * 获取ftp配置信息
        * @params comInfo{object}
        * @return result{object}
        * */
        this.getFtpInfo=function (comInfo) {
            var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt};
            var url="/dipserver/query_etl_user",result=null;
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result=data.response;
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 保存ftp配置信息
        * @params comInfo
        * @params ftp
        * */
        this.saveFtpInfo=function (comInfo,ftp) {

        };
    }
})();