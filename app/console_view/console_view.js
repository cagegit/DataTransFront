/**
 * Created by cage on 2016/9/13.
 */
(function () {
    'use strict';
    angular.module('myApp.console_view', ['luegg.directives','myApp.consoleService','myApp.consoleComponent'])
        .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
            $stateProvider.state('/.capture_con_view', {
                url:'/capture?gn&cn&pt&id',
                views:{
                    'master':{
                        component:'captureConsole'
                    }
                },
                resolve:{
                    trans:['$translate',function ($translate) {
                          return $translate(['Co_cpzqtj','Co_tj']);
                    }]
                }
            })
            .state('/.queue_con_view', {
                url:'/queue?gn&cn&pt&pn&id&tab',
                views:{
                    'master':{
                        component:'queueConsole',
                        bindings:{
                            dl:'infoData'
                        }
                    }
                },
                resolve:{
                    infoData:['$transition$','csService',function ($transition$,csService) {
                        var comInfo = $transition$.params();
                        var tabList = ['tab1','tab2','tab3'];//定义控制台标签页标题列表
                        var curTab = 'tab1';
                        if($.inArray(comInfo.tab,tabList)){
                            curTab = comInfo.tab;
                        }
                        if(comInfo.gn && comInfo.cn ){
                            if(curTab ==='tab1'){
                                return csService.getQueueStatus(comInfo);
                            }else if(curTab ==='tab2'){
                                return csService.initQueueUserTree(comInfo);
                            }else{
                                return csService.getQueueDisplayList(comInfo,0,'','','');
                            }
                        }else{
                            return {tab:'tab2'};
                        }
                    }]
                }
            })
            .state('/.loader_con_view', {
                url:'/loader?gn&cn&pt&id&tab',
                views:{
                    'master':{
                        component:'loaderConsole'
                    }
                },
                resolve:{
                    trans:['$translate',function ($translate) {
                        return $translate(['Co_ldzztj','Co_tj']);
                    }]
                }
            });
    }]);
})();