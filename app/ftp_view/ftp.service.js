/**
 * Created by cagej on 2017/5/10.
 */
(function () {
    'use strict';
     angular.module('myApp.ftpService',[])
       .config(['$qProvider', function ($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
       .service('ftpService',ftpService);
    ftpService.$inject=['httpService','tipsService','md5Service','$filter','tDes'];
    function ftpService(httpSer,dipT,md5Ser,$filter,tDes) {
        /*
        * 获取ftp配置信息
        * @params comInfo{object}
        * @return result{object}
        * */
        this.getFtpInfo=function (comInfo) {
            var args={group_id:comInfo.gn,component_id:comInfo.cid,type:'qsend'};
            var url="/dipserver/query_apply_config",result=null;
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result=data.response;
                        if(result.passwd){
                            result.passwd=tDes.de_des(result.passwd);
                        }
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
        * @params ftp  ftp 配置信息
        * */
        this.saveFtpInfo=function (comInfo,ftp) {
            var url = '/dipserver/add_apply_config';
            var pz=angular.copy(ftp);
            pz.passwd=tDes.en_des(pz.passwd);
            var args={group_id:comInfo.gn,component_name:pz.component_name,type:'qsend',qtran:pz,component_id:comInfo.cid},result={res:false,comId:'',msg:''};
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