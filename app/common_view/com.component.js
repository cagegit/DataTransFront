/**
 * Created by cage on 2017/4/18.
 */
(function () {
    'use strict';
    angular.module('myApp.common_view',[])
        .component('rightDialog',{
            templateUrl:'common_view/main_dialog.component.html',
            bindings:{
                title:'<'
            },
            controller:['$state','$location','tipsService','$filter',function($state,$location,dipT,$filter) {
                var $ctrl =this;
                $ctrl.menu = {
                    dialog:true,
                    mc:1
                };
                $ctrl.$onInit=function () {

                };
                if($state.includes('**.status')){
                    $ctrl.menu.mc=1;
                }
                if($state.includes('**.property')){
                    $ctrl.menu.mc=2;
                }
                $ctrl.changeTab = function (num) {
                    var info =$location.search();
                    var path =$location.url();
                    if(num === 1){
                        if(!info.cn || info.cn === "unnamed"){
                            dipT.error($filter('translate')('Zjwpz'));//组件尚未配置不能查看状态！
                            return;
                        }
                        $ctrl.menu.mc = 1;
                        path = path.replace('property','status');
                    }else if(num === 2){
                        $ctrl.menu.mc = 2;
                        path = path.replace('status','property');
                    }
                    $location.url(path);
                };
                $ctrl.redirectTo = function (url) {
                    $state.go(url);
                };
            }]
        });
})();