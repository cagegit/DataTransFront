/**
 * Created by cagej on 2016/12/23.
 */
'use strict';
var myApp = angular.module('myApp',['myApp.service','angular-md5']);
myApp.controller('apiCtrl',['$scope','httpService','md5','$timeout','tipsService','$window',function ($scope,httpSer,md5,$timeout,dipT,$window) {
    $scope.api={
        url:'',
        data:'',
        md5_data:'',
        result:'',
        error:false,
        success:false
    };
    $scope.sendData = function () {
        $scope.api.result='';
        $scope.api.error=false;
        $scope.api.success=false;
        var data =jsonData($scope.api.data);

        if(!data){
            return;
        }
        httpSer.postDataList($scope.api.url,data).then(function (data) {
            if (data.status) {
                var res=(data.response && JSON.stringify(data.response)) || '';
                var md_test = md5.createHash(res);
                if(md_test===data.md5){
                    $scope.api.success=true;
                }else{
                    dipT.error('md5校验失败！');
                    $scope.api.error=true;
                }
                $scope.api.result=JSON.stringify(data);
            } else {
                $scope.api.result=JSON.stringify(data);
                $scope.api.error=true;
            }
        });
    };

    $scope.reset = function () {
        $scope.api.result='';
        $scope.api.error=false;
        $scope.api.success=false;
    };

    function jsonData(data) {
        data=data.replace(/\w([^"]*):/g,'"$1":');//添加双括号
        data=data.replace(/'([^']*)'/g,'"$1"');//单引号替换为双引号
        try {
            var json =JSON.parse(data);
        }catch(e){
            dipT.error('<请求数据>格式不是标准JSON格式!');
            return null
        }
        var md5_str= md5.createHash(data);
        console.log(md5_str);
        return {
            md5:md5_str,
            request:json
        };
    }

    //是否登录的校验
    var authFail = function () {
        BootstrapDialog.alert({
            title: 'Dip 提示',
            message: '此页面已过期，请重新登录!',
            type: BootstrapDialog.TYPE_WARNING,
            closable: false,
            buttonLabel: '确定',
            callback: function(result) {
                $window.location.href='/login';
            }
        });
    };
    // httpSer.getDataList('/isAuth',{}).then(function (res) {
    //     if(!res.isAuth){
    //         authFail();
    //     }
    // },function (err) {
    //     authFail();
    // });
}]);