/**
 * Created by cagej on 2017/5/10.
 */
(function () {
    'use strict';
    angular.module('myApp.ftpComponent',[])
        .component('ftpProperty',{
            templateUrl:'ftp_view/property.component.html',
            bindings:{
                dl:'<'
            },
            controller:['$state','$stateParams','$filter',function ($state,$stateParams,$filter) {
                var $ctrl=this;
                $ctrl.params={};//属性的辅助参数
                $ctrl.real={
                    com_id:''
                };
                $ctrl.property = {};
                $ctrl.isSaving=false;//正在保存
                var saveTxt=$filter('translate')('SAVE');
                var savingTxt=$filter('translate')('SAVING');
                $ctrl.saveBtnTxt=saveTxt;
                $ctrl.$onInit=function () {
                    if(!$ctrl.dl){
                        $state.go('/');
                    }else{
                        if($ctrl.dl && angular.isObject($ctrl.dl)){
                            $ctrl.property.component_name =$stateParams.cn;
                            $ctrl.real.com_id=$stateParams.cid || '';
                            $ctrl.property.type = $ctrl.dl.type || 'qsend';
                            $ctrl.property.ip = $ctrl.dl.ip;
                            $ctrl.property.user_name = $ctrl.dl.user_name;
                            $ctrl.property.passwd = $ctrl.dl.passwd;
                            $ctrl.property.save_time = $ctrl.dl.save_time || 1;
                            $ctrl.property.wait = $ctrl.dl.wait || 60;
                            $ctrl.property.ftp_path = $ctrl.dl.ftp_path;
                            $ctrl.property.ftp_filename = $ctrl.dl.ftp_filename;
                        }
                    }
                };
                //保存Ftp数据
                $ctrl.saveFtpInfo=function () {

                };
            }]
        })
        .component('ftpStatus',{
            templateUrl:'ftp_view/status.component.html',
            bindings:{
                dl:'<'
            },
            controller:['$state','$stateParams',function ($state,$stateParams) {
                var $ctrl=this;
                $ctrl.params={};//属性的辅助参数
                $ctrl.real={
                    com_id:''
                };
                $ctrl.property = {};
                $ctrl.$onInit=function () {
                    if($ctrl.dl && angular.isObject($ctrl.dl)){
                        $ctrl.property.component_name =$stateParams.cn;
                        $ctrl.real.com_id=$stateParams.cid || '';
                        $ctrl.property.type = $ctrl.dl.type==='qsend'?'发送':'接收';
                        $ctrl.property.ip = $ctrl.dl.ip;
                        $ctrl.property.user_name = $ctrl.dl.user_name;
                        $ctrl.property.passwd = '******';
                        $ctrl.property.save_time = $ctrl.dl.save_time?$ctrl.dl.save_time+'天':"1天";
                        $ctrl.property.wait = isFinite($ctrl.dl.wait)?$ctrl.dl.wait+'秒':'60秒';
                        $ctrl.property.ftp_path = $ctrl.dl.ftp_path || '';
                        $ctrl.property.ftp_filename = $ctrl.dl.ftp_filename || '';
                    }else{
                        $state.go('/');
                    }
                };
            }]
        });
})();