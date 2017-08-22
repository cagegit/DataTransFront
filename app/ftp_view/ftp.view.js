/**
 * Created by cagej on 2017/5/10.
 */
(function () {
    'use strict';
    angular.module('myApp.ftp_view', ['myApp.ftpService','myApp.ftpComponent'])
        .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
            $urlRouterProvider.when('/main/ftp_view/', '/main/ftp_view/status');
            $stateProvider.state('/.ftp_view', {
                abstract:true,
                url:'/ftp_view',
                component:'rightDialog',
                resolve:{
                    title:function(){
                        return 'FTP数组传输组件配置';//FTP数组传输组件配置
                    },
                    ftpInfo:  ['$transition$','ftpService',function($transition$,ftpService){
                        var info =$transition$.params();
                        if(info.gn && info.cn !== "unnamed" && info.cid){
                            return ftpService.getFtpInfo(info);
                        }else{
                            return 'init';
                        }
                    }]
                },
                bindings:{
                    title: 'title'
                }
            })
            .state('/.ftp_view.status', {
                url:'/status?gn&cn&id&cid',
                component:'ftpStatus',
                bindings:{
                    dl:'ftpInfo'
                }
            })
            .state('/.ftp_view.property', {
                url:'/property?gn&cn&id&cid',
                component:'ftpProperty',
                bindings:{
                    dl:'ftpInfo'
                }
            });
    }]);
})();