/**
 * Created by cage on 2016/9/7.
 */
(function () {
    'use strict';
    angular.module('myApp.tclient_view', ['ui.bootstrap','myApp.tcService','myApp.tcComponent'])
        .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
            $urlRouterProvider.when('/main/tclient_view/', '/main/tclient_view/status');
            $stateProvider.state('/.tclient_view', {
                abstract:true,
                url:'/tclient_view',
                component:'rightDialog',
                resolve:{
                    title:['$filter',function($filter){
                        return $filter('translate')('Tc_zjsz');//数据传输组件客户端设置
                    }],
                    tcInfo:  ['$transition$','tcService',function($transition$,tcService){
                        var info =$transition$.params();
                        if(info.gn && info.cn !== "unnamed" && info.cid !== ""){
                            return tcService.getTclientInfo(info);
                        }else{
                            return 'init';
                        }
                    }]
                },
                bindings:{
                    title: 'title'
                }
            })
            .state('/.tclient_view.status', {
                url:'/status?gn&cn&id&cid',
                component:'tcStatus',
                bindings:{
                    dl:'tcInfo'
                }
            })
            .state('/.tclient_view.property', {
                url:'/property?gn&cn&id&cid',//组名、当前控件名、父组件类型、当前控件id
                component:'tcProperty',
                bindings:{
                    dl:'tcInfo'
            }
        });
    }]);
})();