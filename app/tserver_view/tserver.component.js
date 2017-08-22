/**
 * Created by cagej on 2017/4/26.
 */
(function () {
    'use strict';
    angular.module("myApp.tsComponent",[])
        .component('tsStatus',{
            templateUrl:'tserver_view/status.component.html',
            controller:['$stateParams','$filter','$state','tsService','$rootScope','tipsService',function ($stateParams,$filter,$state,tsService,$rootScope,dipT) {
                var $ctrl = this;
                var dl =$stateParams.cn;
                //参数说明
                $ctrl.params ={
                    serUser:false,
                    serPass:false,
                    serGrop:false,
                    serQue:false,
                    serAll:false
                };
                $ctrl.property = {};
                $ctrl.isRun =false;
                $ctrl.$onInit=function () {
                    if(!dl){
                        $state.go('/');
                    }else{
                        $ctrl.property.user=dl;
                        $ctrl.property.passwd = '******';
                        getTserverStatus();
                    }
                };
                function getTserverStatus () {
                    tsService.getTserverStatus().then(function (result) {
                        if(result.res){
                            if(result.info.type==='tserver' && result.info.status==='running'){
                                $ctrl.isRun=true;
                            }
                        }else{
                            $ctrl.isRun=false;
                        }
                    });
                }
                //启动Tserver
                $ctrl.startTserver = function () {
                    var comName='Tserver';
                    if(!$ctrl.property.user){
                        dipT.error($filter('translate')('Ts_wpzts'));//用户名密码尚未配置，请配置完成后启动Tserver
                        return;
                    }
                    var dialog = new BootstrapDialog({
                        title:comName+' Info',
                        type:'type-warning',
                        message: function(){
                            return '<h2 class="text-warning">'+$filter('translate')('Ts_qdz')+'</h2>';//Tserver 程序启动中.....
                        },
                        closable: false
                    });
                    dialog.open();
                    tsService.startTserver().then(function (res) {
                        if(res){
                            dialog.setType('type-success');
                            dialog.getModalBody().html('<h2 class="text-success">'+$filter('translate')('Ts_qdcg')+'<i class="green glyphicon glyphicon-ok"></i></h2>');//恭喜！Tserver 已经启动！
                            dialog.setClosable(true);
                            $rootScope.$emit("tserverStarted", {});
                            $ctrl.isRun=true;
                        }else{
                            dialog.setType('type-danger');
                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Ts_qdsb')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//抱歉！Tserver 启动失败
                            dialog.setClosable(true);
                        }
                        setTimeout(function () {
                            dialog.close();
                        },500);
                    },function () {
                        dialog.close();
                    });
                };
            }]
        })
        .component('tsProperty',{
            templateUrl:'tserver_view/property.component.html',
            bindings:{
               dl:'<'
            },
            controller:['$stateParams','$state','tipsService','$location','tsService','$filter',function ($stateParams,$state,dipT,$location,tsService,$filter) {
                var $ctrl = this;
                $ctrl.params ={
                    serUser:false,
                    serPass:false,
                    serGrop:false,
                    serQue:false,
                    serAll:false
                };
                $ctrl.property={
                    user:"",
                    passwd:"",
                    group_name: "tserver_test",
                    queue_name: "que",
                    all_que: "yes"
                };
                $ctrl.serverErr ='';
                $ctrl.isSaving=false;//正在保存
                var saveTxt=$filter('translate')('SAVE');
                var savingTxt=$filter('translate')('SAVING');
                $ctrl.saveBtnTxt=saveTxt;
                $ctrl.$onInit=function () {
                    if(!$ctrl.dl){
                        $state.go('/');
                    }else{
                        if($ctrl.dl && angular.isObject($ctrl.dl)){
                            if($ctrl.dl.server_config){
                                var user = $ctrl.dl.server_config.user;
                                $ctrl.property.user=user.name;
                                $ctrl.property.passwd=user.passwd;
                            }
                        }
                    }
                };
                //保存Tserver信息
                $ctrl.saveTcpInfo = function () {
                    $ctrl.isSaving=true;
                    $ctrl.saveBtnTxt=savingTxt;
                    var cfg={
                        user:{
                            name:$ctrl.property.user,
                            passwd:$ctrl.property.passwd,
                            pri:{
                                all_que:'yes'
                            }
                        }
                    };
                    tsService.saveTserverConfig(cfg).then(function (res) {
                        if(res){
                            dipT.success($filter('translate')('Bccg'));//保存成功！
                            $location.url('/main/tserver_view/status?cn='+$ctrl.property.user);
                        }
                    }).finally(function () {
                        $ctrl.isSaving=false;
                        $ctrl.saveBtnTxt=saveTxt;
                    });
                };
            }]
        });
})();