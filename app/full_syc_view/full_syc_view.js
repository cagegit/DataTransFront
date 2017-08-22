/**
 * Created by cage on 2016/10/10.
 */
(function () {
    'use strict';
    angular.module('myApp.ful_syc_view', ['myApp.fullSycService','myApp.fullSycComponent'])
        .config(['$urlServiceProvider','$stateProvider', function($urlServiceProvider,$stateProvider) {
            $urlServiceProvider.rules.when("/main/full_syc_view", "/main/full_syc_view/loader");
            $stateProvider.state('/.full_syc_view', {
                url:'/full_syc_view',
                component:'parentView',
                abstract:true,
                resolve:{
                    status:['$transition$','fullSycService',function($transition$,fullSycService){
                        var params=$transition$.params();
                        return fullSycService.refreshFullSyncFilters(params);
                    }]
                },
                bindings:{
                    status:'status'
                }
            })
            .state('/.full_syc_view.loader', {
                url:'/loader?gn&cn&st&sn&name&cid',
                component:'mainView',
                bindings:{
                    tree: 'sync_tree',
                    maps:'maps',
                    comInfo:'params'
                },
                resolve:{
                    sync_tree:['$transition$','fullSycService',function($transition$,fullSycService){
                        var params=$transition$.params();
                        return fullSycService.query_full_sync_filters(params);
                    }],
                    maps:['fullSycService',function(fullSycService){
                        return fullSycService.query_map_list();
                    }]
                }
            });
    }]);
})();