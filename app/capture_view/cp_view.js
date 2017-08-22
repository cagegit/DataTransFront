/**
 * Created by cage on 2016/9/7.
 */
'use strict';
angular.module('myApp.cp_view', ['ui.bootstrap','myApp.cpService','myApp.cpComponent'])
    .config(['$urlServiceProvider','$stateProvider', function($urlServiceProvider,$stateProvider) {
        $urlServiceProvider.rules.when('/main/cp_view/', '/main/cp_view/status');
        $stateProvider.state('/.cp_view', {
            abstract:true,
            url:'/cp_view',
            component:'rightDialog',
            resolve:{
                title:['$filter',function($filter){
                    return $filter('translate')('Cp_pz');//<!--捕获配置-->
                }],
                captureInfo:  ['$transition$','cpService',function($transition$,cpService){
                    var info =$transition$.params();
                    if(info.gn && info.pn && info.pt){
                        return cpService.getCaptureConfig(info);
                    }else{
                        return 'init';
                    }
                }]
            },
            bindings:{
                title: 'title'
            }
        })
        .state('/.cp_view.status', {
            url:'/status?gn&cn&pn&pt&id&cid',
            component:'cpStatus',
            bindings:{
                dl:'captureInfo'
            }
        })
        .state('/.cp_view.property', {
            url:'/property?gn&cn&pn&pt&id&cid',
            component:'cpProperty',
            bindings:{
                dl:'captureInfo'
            }
        });
}]);