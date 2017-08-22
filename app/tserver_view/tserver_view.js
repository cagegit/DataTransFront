/**
 * Created by cage on 2016/9/7.
 */
(function () {
    'use strict';
    angular.module('myApp.tserver_view', ['ui.bootstrap','myApp.tsService','myApp.tsComponent'])
        .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
            $urlRouterProvider.when('/main/tserver_view/', '/main/tserver_view/status');
            $stateProvider.state('/.tserver_view', {
                abstract:true,
                url:'/tserver_view',
                component:'rightDialog',
                resolve:{
                    title:['$filter',function($filter){
                        return $filter('translate')('Ts_pz');//数据传输组件服务器端设置
                    }],
                    tsInfo:  ['$transition$','tsService',function($transition$,tsService){
                        var info =$transition$.params();
                        if(info.cn!=="no-ne"){
                            return tsService.getTserverInfo();
                        }else{
                            return 'init';
                        }
                    }]
                },
                bindings:{
                    title: 'title'
                }
            })
            .state('/.tserver_view.status', {
                url:'/status?cn',
                component:'tsStatus'
            })
            .state('/.tserver_view.property', {
                url:'/property?cn',
                component:'tsProperty',
                bindings:{
                    dl:'tsInfo'
                }
            });
    }]);
})();