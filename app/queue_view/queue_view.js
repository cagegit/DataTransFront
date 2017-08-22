/**
 * Created by cage on 2016/9/7.
 */
'use strict';
angular.module('myApp.queue_view', ['ui.bootstrap.datetimepicker','myApp.queueComponent','myApp.queueService'])
    .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
        $urlRouterProvider.when('/main/queue_view/', '/main/queue_view/status');
        $stateProvider.state('/.queue_view', {
            abstract:true,
            url:'/queue_view',
            component:'rightDialog',
            resolve:{
                title:['$filter',function($filter){
                    return $filter('translate')('Dl_pz');//队列配置
                }],
                queueInfo:  ['$transition$','quService',function($transition$,quService){
                    var info =$transition$.params();
                    if(info.gn && info.cn !== "unnamed" && info.cid){
                        return quService.getQueueInfo(info);
                    }else{
                        return 'init';
                    }
                }]
            },
            bindings:{
                title: 'title'
            }
        })
        .state('/.queue_view.status', {
            url:'/status?gn&cn&pt&id&cid',
            component:'queueStatus',
            bindings:{
                dl:'queueInfo'
            }
        })
        .state('/.queue_view.property', {
            url:'/property?gn&cn&pt&id&cid',//组名、当前控件名、上一个组件类型、当前控件id
            component:'queueProperty',
            bindings:{
                dl:'queueInfo'
            }
        });
}]);