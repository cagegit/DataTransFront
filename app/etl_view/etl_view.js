/**
 * Created by cagej on 2017/3/14.
 * etl module etl模块
 */
(function () {
    'use strict';
    angular.module('myApp.etl_view',['myApp.etlService','myApp.component'])
        .config(['$urlServiceProvider','$stateProvider', function($urlServiceProvider,$stateProvider) {
            $urlServiceProvider.rules.when("/main/etl_view", "/main/etl_view/status");
            $stateProvider.state('/.etl_view', {
                url:'/etl_view/',
                component:'etlView',
                abstract:true,
                resolve:{
                    etl_conf:['$transition$','etlService',function($transition$,etlService){
                        var params=$transition$.params();
                        return etlService.fetchEtlConfig(params);
                    }]
                }
            })
            .state('/.etl_view.status', {
                url:'status?gn&cn&pn&pt&id&cid',
                component:'etlStatus',
                bindings:{
                    conf: 'etl_conf'
                }
            })
            .state('/.etl_view.property', {
                url:'property?gn&cn&pn&pt&id&cid',
                component:'etlProperty'
            })
            .state('/.etl_view.property.config', {
                url:'/config',
                component:'etlConf',
                bindings:{
                    conf: 'etl_conf'
                }
            })
            .state('/.etl_view.property.rule', {
                url:'/rule',
                component:'etlRule',
                resolve:{
                    etl_users:['$transition$','etlService',function($transition$,etlService){
                        var params=$transition$.params();
                        return etlService.fetchEtlUser(params);
                    }]
                },
                bindings:{
                    users:'etl_users'
                }
            })
            .state('/.etl_view.property.bgl', {
                url:'/bgl',
                component:'etlBglRule',
                resolve:{
                    etl_users:['$transition$','etlService',function($transition$,etlService){
                        var params=$transition$.params();
                        return etlService.fetchEtlUser(params);
                    }]
                },
                bindings:{
                    users:'etl_users'
                }
            })
            .state('/.etl_view.property.operate', {
                url:'/operate',
                component:'etlOperateRule',
                resolve:{
                    etl_users:['$transition$','etlService',function($transition$,etlService){
                        var params=$transition$.params();
                        return etlService.fetchEtlUser(params);
                    }]
                },
                bindings:{
                    users:'etl_users'
                }
            })
            .state('/.etl_view.property.batch', {
                url:'/batch',
                component:'etlPlRule',
                resolve:{
                    batches:['$transition$','etlService',function($transition$,etlService){
                        var params=$transition$.params();
                        return etlService.fetchBatchs(params,'filter');
                    }]
                },
                bindings:{
                    users:'batches'
                }
            })
            .state('/.etl_view.property.configured', {
                url:'/configured',
                component:'configRule'
            })
            .state('/.etl_view.property.pl_rule_apply', {
                url:'/pl_rule_apply',
                component:'etlApplyRule',
                resolve:{
                    rules:['$transition$','etlService',function($transition$,etlService){
                        var params=$transition$.params();
                        return etlService.getBatchCheckedList(params,'filter');
                    }]
                },
                bindings:{
                    rules:'rules'
            }
        });
    }]);
})();