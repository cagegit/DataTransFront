/**
 * Created by cagej on 2017/4/26.
 */
(function () {
    'use strict';
    angular.module("myApp.tcComponent",[])
        .component('tcStatus',{
            templateUrl:'tclient_view/status.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$filter','$state',function ($stateParams,$filter,$state) {
                var $ctrl = this;
                $ctrl.params ={
                    cliUser:false,
                    cliPass:false,
                    cliModu:false,
                    cliIpd:false,
                    cliPor:false,
                    cliOra:false,
                    cliGrop:false,
                    cliQue:false,
                    cliCompre:false,
                    cliEnc:false,
                    cliPacksize:false,
                    tcid:false
                };
                $ctrl.property = {};
                $ctrl.real={
                    com_id:''
                };
                $ctrl.$onInit=function () {
                    if($ctrl.dl && angular.isObject($ctrl.dl)){
                        $ctrl.property.user = $ctrl.dl.user;
                        $ctrl.property.passwd = '******';
                        $ctrl.property.component_name = $ctrl.dl.component_name?$ctrl.dl.component_name:$stateParams.cn;
                        $ctrl.property.ip = $ctrl.dl.ip;
                        $ctrl.property.port = $ctrl.dl.port;
                        $ctrl.property.db_type = $ctrl.dl.db_type;
                        $ctrl.property.group_name = $ctrl.dl.group_name;
                        $ctrl.property.queue_name = $ctrl.dl.queue_name;
                        $ctrl.property.compress = $ctrl.dl.compress;
                        $ctrl.property.encrypt = $ctrl.dl.encrypt;
                        $ctrl.property.pkg_size = parseInt($ctrl.dl.pkg_size) || 1024;
                        $ctrl.real.com_id=$stateParams.cid || '';
                    }else{
                        $state.go('/');
                    }
                };
            }]
        })
        .component('tcProperty',{
            templateUrl:'tclient_view/property.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$state','tipsService','graphicService','$filter','tcService',function ($stateParams,$state,dipT,gSer,$filter,tcService) {
                var $ctrl = this;
                var comInfo = $stateParams;
                //参数说明
                $ctrl.params ={
                    cliUser:false,
                    cliPass:false,
                    cliModu:false,
                    cliIpd:false,
                    cliPor:false,
                    cliOra:false,
                    cliGrop:false,
                    cliQue:false,
                    cliCompre:false,
                    cliEnc:false,
                    cliPacksize:false,
                    tcid:false
                };
                $ctrl.property={
                    user:"",
                    passwd:"",
                    component_name:"",
                    ip: "",
                    port: "7007",
                    db_type: "oracle",
                    group_name: "",
                    queue_name: "",
                    compress: "yes",
                    encrypt: "yes",
                    pkg_size: 1024
                };
                $ctrl.serverErr ='';
                $ctrl.real={
                    com_id:''
                };
                $ctrl.allowDbs=['oracle','db2','sqlserver','gbase-8a','mysql','informix','sybase','altibase','postgresql','oscar','dameng','kingbase','vertica','dbone','kdb'];//Dip支持的数据库类型
                $ctrl.isSaving=false;//正在保存
                var saveTxt=$filter('translate')('SAVE');
                var savingTxt=$filter('translate')('SAVING');
                $ctrl.saveBtnTxt=saveTxt;
                $ctrl.$onInit=function () {
                    if(!$ctrl.dl){
                        $state.go('/');
                    }else{
                        if($ctrl.dl && angular.isObject($ctrl.dl)){
                            $ctrl.property = $ctrl.dl;
                            $ctrl.property.component_name = $ctrl.dl.component_name?$ctrl.dl.component_name:comInfo.cn;
                            $ctrl.property.pkg_size = parseInt($ctrl.dl.pkg_size) || 1024;
                            $ctrl.real.com_id=comInfo.cid || '';
                        }
                    }
                };
                //保存Tclient信息
                $ctrl.saveTcpInfo = function () {
                    if($ctrl.property.component_name ==='unnamed'){
                        dipT.error($filter('translate')('Tc_mcbnk'));//Tclient名称不能为unnamed！
                        return;
                    }
                    $ctrl.isSaving=true;
                    $ctrl.saveBtnTxt=savingTxt;
                    var dialog = new BootstrapDialog({
                        title:'Dip Tip',
                        type:'type-primary',
                        size:'size-small',
                        message:'保存中......',
                        closable: false
                    });
                    var closeAlert=function (s,msg) {
                        if(s){
                            dialog.setType('type-success');
                            dialog.getModalBody().html('保存成功！');
                            setTimeout(function () {
                                dialog.close();
                            },300);
                        }else{
                            dialog.setType('type-danger');
                            if(msg){
                                dialog.getModalBody().html(msg);
                            }else{
                                dialog.getModalBody().html('保存失败！');
                            }
                        }
                        dialog.setClosable(true);
                    };
                    dialog.open();
                    tcService.saveTclientInfo(comInfo,$ctrl.property).then(function (result) {
                        if(result.res){
                            // dipT.success($filter('translate')('Bccg'));//保存成功！
                            $ctrl.real.com_id=result.comId;
                            var node = $("#" + comInfo.id);
                            node.find(".dragPoint").text($ctrl.property.component_name);
                            node.attr("name", $ctrl.property.component_name);
                            node.attr("type", $ctrl.property.db_type);
                            node.attr("realid", $ctrl.real.com_id);
                            gSer.save_graphics_no_alert(comInfo.gn).finally(function () {
                                closeAlert(true);
                            });
                            $state.go('/');
                        }else{
                            closeAlert(false,result.msg);
                        }
                    }).catch(function () {
                        closeAlert(false);
                    }).finally(function () {
                        $ctrl.isSaving=false;
                        $ctrl.saveBtnTxt=saveTxt;
                    });
                };
            }]
        });
})();