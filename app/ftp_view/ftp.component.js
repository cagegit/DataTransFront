/**
 * Created by cagej on 2017/5/10.
 */
(function () {
    'use strict';
    angular.module('myApp.ftpComponent',[])
        .component('ftpProperty',{
            templateUrl:'ftp_view/property.component.html',
            bindings:{
                dl:'<'
            },
            controller:['$state','$stateParams','$filter','ftpService','tipsService','graphicService',function ($state,$stateParams,$filter,ftpService,dipT,gSer) {
                var $ctrl=this;
                var comInfo=$stateParams;
                $ctrl.params={};//属性的辅助参数
                $ctrl.real={
                    com_id:''
                };
                $ctrl.property = {};
                $ctrl.property.save_time = 1;
                $ctrl.property.wait = 60;
                $ctrl.property.type='qsend';
                $ctrl.isSaving=false;//正在保存
                var saveTxt=$filter('translate')('SAVE');
                var savingTxt=$filter('translate')('SAVING');
                $ctrl.saveBtnTxt=saveTxt;
                $ctrl.$onInit=function () {
                    if(!$ctrl.dl){
                        $state.go('/');
                    }else{
                        if($ctrl.dl && angular.isObject($ctrl.dl)){
                            $ctrl.property.component_name =$stateParams.cn;
                            $ctrl.real.com_id=$stateParams.cid || '';
                            $ctrl.property.type = $ctrl.dl.type || 'qsend';
                            $ctrl.property.ip = $ctrl.dl.ip;
                            $ctrl.property.user_name = $ctrl.dl.user_name;
                            $ctrl.property.passwd = $ctrl.dl.passwd;
                            $ctrl.property.save_time = $ctrl.dl.save_time || 1;
                            $ctrl.property.wait = $ctrl.dl.wait || 60;
                            $ctrl.property.ftp_path = $ctrl.dl.ftp_path;
                            $ctrl.property.ftp_filename = $ctrl.dl.ftp_filename;
                        }
                    }
                };
                //保存Ftp数据
                $ctrl.saveFtpInfo=function () {
                    if($ctrl.property.component_name ==='unnamed'){
                        dipT.error('组件名不能为unnamed！');//组件名不能为unnamed！
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
                    ftpService.saveFtpInfo($stateParams,$ctrl.property).then(function (result) {
                        if(result.res){
                            // dipT.success('保存成功！');//保存成功！
                            $ctrl.real.com_id=result.comId;
                            var node = $("#" + comInfo.id);
                            node.find(".dragPoint").text($ctrl.property.component_name);
                            node.attr("name", $ctrl.property.component_name);
                            node.attr("type", 'qsend');
                            node.attr("realid", $ctrl.real.com_id);
                            gSer.save_graphics_no_alert(comInfo.gn).finally(function () {
                                closeAlert(true);
                            });
                            $state.go('/');
                        }else {
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
        })
        .component('ftpStatus',{
            templateUrl:'ftp_view/status.component.html',
            bindings:{
                dl:'<'
            },
            controller:['$state','$stateParams',function ($state,$stateParams) {
                var $ctrl=this;
                $ctrl.params={};//属性的辅助参数
                $ctrl.real={
                    com_id:''
                };
                $ctrl.property = {};
                $ctrl.$onInit=function () {
                    if($ctrl.dl && angular.isObject($ctrl.dl)){
                        $ctrl.property.component_name =$stateParams.cn;
                        $ctrl.real.com_id=$stateParams.cid || '';
                        $ctrl.property.type = $ctrl.dl.type==='qsend'?'发送':'接收';
                        $ctrl.property.ip = $ctrl.dl.ip;
                        $ctrl.property.user_name = $ctrl.dl.user_name;
                        $ctrl.property.passwd = '******';
                        $ctrl.property.save_time = $ctrl.dl.save_time?$ctrl.dl.save_time+'天':"1天";
                        $ctrl.property.wait = isFinite($ctrl.dl.wait)?$ctrl.dl.wait+'秒':'60秒';
                        $ctrl.property.ftp_path = $ctrl.dl.ftp_path || '';
                        $ctrl.property.ftp_filename = $ctrl.dl.ftp_filename || '';
                    }else{
                        $state.go('/');
                    }
                };
            }]
        });
})();