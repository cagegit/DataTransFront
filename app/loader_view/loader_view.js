/**
 * Created by cage on 2016/9/7.
 */
(function () {
    'use strict';
    angular.module('myApp.loader_view', ['ui.bootstrap','myApp.loaderService','myApp.loaderComponent'])
        .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
            $urlRouterProvider.when('/main/loader_view/', '/main/loader_view/status');
            $stateProvider.state('/.loader_view', {
                abstract:true,
                url:'/loader_view',
                component:'rightDialog',
                resolve:{
                    title:['$filter',function($filter){
                        return $filter('translate')('Ld_pz');//<!--Loader配置-->
                    }],
                    loaderInfo:  ['$transition$','ldService',function($transition$,ldService){
                        var info =$transition$.params();
                        return ldService.getLoaderInfo(info);
                    }]
                },
                bindings:{
                    title: 'title'
                }
            })
            .state('/.loader_view.status', {
                url:'/status?gn&cn&sn&st&tt&id&cid&cpid',
                component:'loaderStatus',
                bindings:{
                    dl:'loaderInfo'
                }
            })
            .state('/.loader_view.property', {
                url:'/property?gn&cn&sn&st&tt&id&cid&cpid',
                component:'loaderProperty',
                bindings:{
                    dl:'loaderInfo'
            }
        });
    }]);
})();