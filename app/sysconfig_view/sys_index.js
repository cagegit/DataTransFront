/**
 * Created by cage on 2016/9/12.
 */
'use strict';
var myApp = angular.module('myApp',['myApp.service','pascalprecht.translate']);
myApp.config(['$httpProvider','$translateProvider',function($httpProvider,$translateProvider) {
    var lang = window.localStorage.lang ||'cn';
    $translateProvider.preferredLanguage(lang);
    $translateProvider.useStaticFilesLoader({
        prefix: './i18n/',
        suffix: '.json'
    });
    // Enable escaping of HTML
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
}]);
myApp.run(['$rootScope','$translate',function ($rootScope,$translate) {
    $rootScope.title='';//Cf_title
    $translate('Idx_title').then(function (Idx_title) {
        $rootScope.title = Idx_title;
    });
}]);
myApp.controller('indexCtrl',['$scope','httpService','tipsService','$window','md5Service','$filter',function ($scope,httpSer,dipT,$window,md5Ser,$filter) {
    $scope.isDel = false;
    $scope.user={
        name:'admin',
        auth:'super'
    };
    $scope.proList=[];
    $scope.fetchProject = function () {
        var url = "/dipserver/query_project",args = md5Ser.md5Data({});
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                 if(data.status){
                     $scope.proList=data.response;
                 }else{
                     dipT.error(data.response.error_msg);
                 }
            }
        });
    };

    $scope.delProject = function (project) {
        var deletePro = function () {
            var url = "/dipserver/delete_project",args={id:project.id};
            args=md5Ser.md5Data(args);
            httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        $scope.fetchProject();
                        dipT.success($filter('translate')('Sccg'));//删除成功！
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
            },function (er) {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        BootstrapDialog.confirm({
            title:$filter('translate')('TIP'),//Dip 提示
            message: $filter('translate')('Idx_scxm'),//确认要删除该项目吗？
            type: BootstrapDialog.TYPE_WARNING,
            closable: false,
            btnCancelLabel: $filter('translate')('CANCEL'),//取消
            btnOKLabel: $filter('translate')('OK'),//确认
            btnOKClass: 'btn-warning',
            callback: function(result) {
                if(result) {
                    deletePro();
                }
            }
        });
    };
    $scope.addProject = function () {
        var modelStr ='<div id="mainId"><label>'+$filter('translate')('Idx_xmmc')+'</label><input class="form-control" type="text" id="scnId" placeholder="'+$filter('translate')('Idx_qsrxmm')+'"/><br>' +//项目名称： 请输入项目名称
            '<label>'+$filter('translate')('Idx_xmms')+'</label><input id="lowScnId" type="text" class="form-control" placeholder="'+$filter('translate')('Idx_qsrxgms')+'"/></div>';//项目描述： 请输入相关描述
        var dialog = new BootstrapDialog({
            title: $filter('translate')('Idx_xjxm'),//新建项目
            message: $(modelStr),
            type:'type-warning',
            buttons: [{
                label: $filter('translate')('CANCEL'),//取消
                cssClass: 'btn-default',
                action: function(dialogRef){
                    dialogRef.close();
                }
            },{
                id: 'button-c',
                label: $filter('translate')('SAVE'),//保存
                cssClass: 'btn-primary',
                hotkey: 13, // Enter.
                action: function(dialogRef) {
                    var mainDiv = dialogRef.getModalBody();
                    var scn=dialogRef.getModalBody().find('#scnId');
                    var lowScn =dialogRef.getModalBody().find('#lowScnId');
                    var pattern = /^[a-zA-Z\u4E00-\u9FA5](\w|[\u4E00-\u9FA5]|\d){0,19}$/;
                    var pattern2 = /^(\w|[\u4E00-\u9FA5]|\d){0,59}$/;
                    var scn_num='',low_scn='';
                    mainDiv.find('span').remove();
                    if(scn.val().length===0){
                        mainDiv.addClass('input-err').append('<span class="help-block">项目名称不能为空！</span>');//项目名称不能为空！
                        scn.addClass('ia').focus();
                        return;
                    }
                    if(!pattern.test(scn.val())){
                        mainDiv.addClass('input-err').append('<span class="help-block">'+$filter('translate')('Idx_tip1')+'</span>');//项目名称只能汉字、数字、字母，且只能以字母或者汉字开头，长度不超过20位！
                        scn.addClass('ia').focus();
                        return;
                    }else{
                        mainDiv.removeClass('input-err');
                        scn.removeClass('ia');
                        scn_num=scn.val();
                    }
                    if(lowScn.val().length===0){
                        mainDiv.addClass('input-err').append('<span class="help-block">项目描述不能为空！</span>');//项目描述不能为空！
                        lowScn.addClass('ia').focus();
                        return;
                    }
                    if(!pattern2.test(lowScn.val())){
                        mainDiv.addClass('input-err').append('<span class="help-block">'+$filter('translate')('Idx_tip2')+'</span>');//项目描述长度不超过60个字符，且不含特殊字符！
                        lowScn.addClass('ia').focus();
                        return;
                    }else{
                        mainDiv.removeClass('input-err');
                        lowScn.removeClass('ia');
                        low_scn=lowScn.val();
                    }
                    function getDate() {
                        var date = new Date();
                        var seperator1 = "/";
                        var year = date.getFullYear();
                        var month = date.getMonth() + 1;
                        var strDate = date.getDate();
                        if (month >= 1 && month <= 9) {
                            month = "0" + month;
                        }
                        if (strDate >= 0 && strDate <= 9) {
                            strDate = "0" + strDate;
                        }
                        return year + seperator1 + month + seperator1 + strDate;
                    }
                    var url = "/dipserver/add_project";
                    var args={name:scn.val(),create_time:getDate(),desc:lowScn.val()};
                    args=md5Ser.md5Data(args);
                    httpSer.postDataList(url,args).then(function (data) {
                        if(md5Ser.equalMd5Data(data)){
                             if(data.status){
                                 $scope.fetchProject();
                                 dipT.success($filter('translate')('Xjxmcg'));//新建项目成功！
                             }else{
                                 dipT.error(data.response.error_msg);
                             }
                        }
                        dialog.close();
                    },function (err) {
                        dialog.close();
                        dipT.error($filter('translate')('Wlcw'));//网络错误！
                    });
                }
            }],
            closable: true
        });
        dialog.open();
    };
    //是否登录的校验
    var authFail = function () {
        BootstrapDialog.alert({
            title: $filter('translate')('TIP'),//Dip 提示
            message: $filter('translate')('TIMEOUT'),//此页面已过期，请重新登录!
            type: BootstrapDialog.TYPE_WARNING,
            closable: false,
            buttonLabel: $filter('translate')('SURE'),//确定
            callback: function(result) {
                $window.location.href='/login';
            }
        });
    };
    httpSer.getDataList('/isAuth',{}).then(function (res) {
        if(res.isAuth){
            $scope.fetchProject();
            if(res.user){
                $scope.user.name=res.user.name;
                $scope.user.auth=res.user.auth;
            }
        }else{
            authFail();
        }
    },function (err) {
        authFail();
    });
    $scope.locationToMain = function (pro) {
       // $.cookie('proId',pro.id);
       // $.cookie('proName',pro.name);
       window.localStorage.setItem('proId', pro.id);
       window.localStorage.setItem('proName', pro.name);
       $window.location.href='/main';
    };
}]);