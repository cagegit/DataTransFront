/**
 * Created by cage on 2016/9/12.
 */
(function () {
    'use strict';
    angular.module('myApp.group_view', ['ui.bootstrap','myApp.groupService','myApp.groupComponent'])
        .config(['$urlRouterProvider','$stateProvider', function($urlRouterProvider,$stateProvider) {
            $stateProvider.state('/.group_view', {
                url:'/group_view',
                component:'groupModel',
                params:{
                    group:null
                }
            })
            .state('/.group_view.status', {
                url:'/status',
                component:'groupStatus',
                params:{
                    group:null
                }
            })
            .state('/.group_view.property', {
                url:'/property',
                component:'groupProperty',
                params:{
                    group:null
            }
        });
    }]);
})();