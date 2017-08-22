/**
 * Created by cagej on 2017/4/27.
 */
(function () {
    'use strict';
    angular.module("myApp.groupComponent",[])
        .component('groupModel',{
            templateUrl:'group_view/groupView.component.html',
            controller:['$state','currentGroupService','$stateParams','$filter','$translate',function($state,cGr,$stateParams,$filter,$translate) {
                var $ctrl = this;
                var group = $stateParams.group;
                $ctrl.$onInit=function () {

                };
                $ctrl.menu = {
                    dialog:true,
                    mc:1,
                    createStatus:false,
                    title:''
                };
                $translate('Gp_pz').then(function (Gp_pz) {
                    $ctrl.menu.title=Gp_pz;//组配置
                });
                if(group==='new'){
                    $ctrl.menu.createStatus=true;
                    $ctrl.menu.mc=2;
                    $ctrl.menu.title=$filter('translate')('Gp_xjz');//新建组
                }
                if($state.includes('**.status')){
                    $ctrl.menu.mc=1;
                }
                if($state.includes('**.property')){
                    $ctrl.menu.mc=2;
                }
                $ctrl.changeTab = function (num) {
                    if(num === 1){
                        this.menu.mc = 1;
                        $state.go('/.group_view.status',{group:cGr.curGroup});
                    }else if(num === 2){
                        this.menu.mc = 2;
                        $state.go('/.group_view.property',{group:cGr.curGroup});
                    }
                };
                $ctrl.redirectTo = function (url) {
                    $state.go(url);
                }
            }]
        })
        .component('groupStatus',{
            templateUrl:'group_view/status.component.html',
            controller:['$state','$stateParams','$filter','$translate',function($state,$stateParams,$filter,$translate) {
                var $ctrl = this;
                var group = $stateParams.group;
                $ctrl.$onInit = function () {

                };
                $ctrl.group = {
                    dialog:true
                };
                $ctrl.params ={
                    groupName:false,
                    log:false,
                    desc:false,
                    gid:false
                };
                $ctrl.property = {
                    groupName:"",
                    logTime:48,
                    desc:""
                };
                $ctrl.real={
                    group_id:'',
                    hour:''
                };
                $translate('HOUR').then(function (HOUR) {
                    $ctrl.real.hour=HOUR;//小时
                });
                if(group){
                    $ctrl.property.groupName=group.title;
                    $ctrl.property.logTime=group.log_del_duration;
                    $ctrl.property.desc=group.desc;
                    $ctrl.real.group_id=group.group_id;
                }else{
                    $state.go('/');
                }
            }]
        })
        .component('groupProperty',{
            templateUrl:'group_view/property.component.html',
            controller:['$state','currentGroupService','tipsService','$stateParams','groupService','$filter','$rootScope',function($state,cgSer,dipT,$stateParams,gService,$filter,$rootScope) {
                var $ctrl = this;
                var group = $stateParams.group;
                $ctrl.$onInit = function () {

                };
                $ctrl.group = {
                    dialog:true
                };
                $ctrl.params ={
                    groupName:false,
                    log:false,
                    desc:false,
                    gid:false
                };
                $ctrl.property = {
                    groupName:"",
                    logTime:48,
                    desc:"",
                    group_id:''
                };
                $ctrl.back_err ={
                    show:false,
                    msg:''
                };
                //组名只读
                $ctrl.real={
                    group_id:''
                };
                $ctrl.isSaving=false;
                if(group && group!=='new'){
                    $ctrl.property.groupName=group.title;
                    $ctrl.property.logTime=group.log_del_duration;
                    $ctrl.property.desc=group.desc;
                    $ctrl.property.group_id=group.group_id;
                    $ctrl.real.group_id=group.group_id;
                }
                //保存组信息
                $ctrl.saveGroupInfo = function () {
                    if($ctrl.real.group_id && $ctrl.real.group_id !=='undefined' && group!=='new'){
                        $ctrl.modifyGroupInfo();
                        return;
                    }
                    // var g_name=$.cookie('uname'),g_juese=$.cookie('uauth'),flag=false,pid =$.cookie('proId');
                    var g_name = window.localStorage.getItem('uname'), g_juese= window.localStorage.getItem('uauth'), flag=false, pid = window.localStorage.getItem('proId');
                    if(cgSer.groupList && cgSer.groupList.length>0){
                        angular.forEach(cgSer.groupList,function (val) {
                            if(val.title===$ctrl.property.groupName){
                                flag=true;
                            }
                        });
                    }
                    if(flag && group==='new'){
                        $ctrl.back_err.show=true;
                        $ctrl.back_err.msg=$filter('translate')('Gp_zmbcf');//组名不能重复！
                        return;
                    }else{
                        $ctrl.back_err.show=false;
                        $ctrl.back_err.msg='';
                    }
                    $ctrl.isSaving=true;
                    gService.addGroup(pid,$ctrl.property,g_name,g_juese).then(function (result) {
                        if(result.res){
                            $ctrl.real.group_id=result.groupId;
                            $ctrl.property.group_id=$ctrl.real.group_id;
                            dipT.success($filter('translate')('Bccg'));//保存成功！
                            $state.go('/');
                            $rootScope.$emit("createGroup", $ctrl.property);
                        }else{
                            if(result.error && result.error.error_code){
                                if(result.error.error_code==='00009'){
                                    dipT.error('一个项目里面最多可建64个组！');
                                }else{
                                    dipT.error((result.error && result.error.error_msg));
                                }
                            }
                        }
                    }).finally(function () {
                        $ctrl.isSaving=false;
                    });
                };
                //修改信息
                $ctrl.modifyGroupInfo = function () {
                    var flag =false;
                    if(cgSer.groupList && cgSer.groupList.length>0){
                        angular.forEach(cgSer.groupList,function (val) {
                            if(val.title===$ctrl.property.groupName && $ctrl.property.group_id!==val.group_id){
                                flag=true;
                            }
                        });
                    }
                    if(flag){
                        $ctrl.back_err.show=true;
                        $ctrl.back_err.msg=$filter('translate')('Gp_zmbcf');//组名不能重复！
                        return;
                    }else{
                        $ctrl.back_err.show=false;
                        $ctrl.back_err.msg='';
                    }
                    gService.modifyGroup($ctrl.property,$ctrl.real.group_id).then(function (res) {
                        if(res){
                            $rootScope.$emit("modifyGroup", $ctrl.property);
                            dipT.success($filter('translate')('Bccg'));//保存成功！
                            $state.go('/');
                        }
                    });
                };
            }]
        });
})();