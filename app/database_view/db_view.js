/**
 * Created by cage on 2016/9/7.
 */
'use strict';
angular.module('myApp.db_view', ['ui.bootstrap','myApp.dbService','myApp.dbComponent'])
    .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
        $urlRouterProvider.when('/main/db_view/', '/main/db_view/status');
        $stateProvider.state('/.db_view', {
            abstract:true,
            url:'/db_view',
            component:'rightDialog',
            resolve:{
                title:['$filter',function($filter){
                    return $filter('translate')('Db_sjkpz');<!--数据库配置-->
                }],
                dataList:  ['$transition$','dbService',function($transition$,dbService){
                    var info =$transition$.params();
                    if(info.gn && info.cn && info.cn !== "unnamed" && info.cid){
                        return dbService.getDbInfo(info);
                    }else{
                        return 'init';
                    }
                }]
            },
            bindings:{
                title: 'title'
            }
        }).state('/.db_view.status', {
            url:'/status?gn&cn&id&cid',
            component:'dbStatus',
            bindings:{
                dl:'dataList'
            }
        }).state('/.db_view.property', {
            url:'/property?gn&cn&id&cid',
            component:'dbProperty',
            bindings:{
                dl:'dataList'
            }
        })
            .state('/.db_model_view', {//数据库模板
                url:'/db_model_view',
                component:'dbModel',
                params:{
                    model:null
                }
            });
}]);