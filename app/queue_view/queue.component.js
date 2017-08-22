/**
 * Created by 金超 on 2017/4/25.
 */
(function () {
    'use strict';
    angular.module("myApp.queueComponent",[])
        .component('queueStatus',{
            templateUrl:'queue_view/status.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$filter','$state',function ($stateParams,$filter,$state) {
                var $ctrl = this;
                $ctrl.params ={
                    qpn:false,
                    qpsiz:false,
                    qpsati:false,
                    qpsta:false,
                    qpId:false
                };
                $ctrl.property = {};
                $ctrl.real={
                    com_id:'',
                    hour:$filter('translate')('HOUR')
                };
                $ctrl.$onInit=function () {
                    if($ctrl.dl &&　angular.isObject($ctrl.dl)){
                        $ctrl.property.queue_name = $ctrl.dl.component_name;
                        $ctrl.property.file_size = parseInt($ctrl.dl.size) || 128;
                        $ctrl.property.save_hour = parseInt($ctrl.dl.queue_save_hour) || 48;
                        $ctrl.property.charts = $ctrl.dl.statis?$ctrl.dl.statis:'no';
                        $ctrl.real.com_id = $stateParams.cid;
                    }else{
                        $state.go('/');
                    }
                };
            }]
        })
        .component('queueProperty',{
            templateUrl:'queue_view/property.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$state','tipsService','graphicService','$filter','quService', function ($stateParams,$state,dipT,gSer,$filter,quService) {
                var $ctrl = this;
                var comInfo = $stateParams;
                $ctrl.number =0;
                $ctrl.data = {
                    superConfig:false
                };
                //参数说明
                $ctrl.params ={
                    qpn:false,
                    qpsiz:false,
                    qpsati:false,
                    qpsta:false,
                    qpId:false
                };
                //删除统计数据参数、属性配置说明
                $ctrl.tj = {
                    deadline:false,
                    sw:false,
                    ct:false,
                    endTime:$filter('date')(new Date(),'yyyy-MM-dd HH:mm'),
                    sws:'no',
                    charts:'no'
                };
                //Queue属性
                $ctrl.property={
                    queue_name:'',
                    file_size:128,
                    save_hour:24,
                    charts:'no'
                };
                $ctrl.real={
                    com_id:''
                };
                $ctrl.isSaving=false;
                $ctrl.isRemoving=false;
                $ctrl.$onInit=function () {
                    if(!$ctrl.dl){
                        $state.go('/');
                    }else{
                        if($ctrl.dl && angular.isObject($ctrl.dl)){
                            $ctrl.property.queue_name = $ctrl.dl.component_name;
                            $ctrl.property.file_size = parseInt($ctrl.dl.size) || 128;
                            $ctrl.property.save_hour = parseInt($ctrl.dl.queue_save_hour) || 48;
                            $ctrl.property.charts = $ctrl.dl.statis?$ctrl.dl.statis:'no';
                            $ctrl.real.com_id = comInfo.cid;
                        }
                    }
                };
                //保存队列信息
                $ctrl.save_queue_info = function () {
                    var isChart = $ctrl.property.charts?$ctrl.property.charts:'no';
                    if($ctrl.property.queue_name ==='unnamed'){
                        dipT.error($filter('translate')('Dl_mcbnk'));//队列名称不能为unnamed！
                        return;
                    }
                    var queue={
                        cname:$ctrl.property.queue_name,
                        size:$ctrl.property.file_size,
                        statis:isChart,
                        hour:$ctrl.property.save_hour
                    };
                    $ctrl.isSaving=true;
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
                    quService.saveQueueInfo(comInfo,queue).then(function (result) {
                        if(result.res){
                            // dipT.success($filter('translate')('Bccg'));//保存成功!
                            $ctrl.real.com_id=result.comId;
                            var node = $("#"+comInfo.id);
                            node.find(".dragPoint").text($ctrl.property.queue_name);
                            node.attr("name", $ctrl.property.queue_name);
                            node.attr("type", comInfo.pt);
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
                    });
                };
                //删除统计信息
                $ctrl.removeLogData = function () {
                    $ctrl.isRemoving=true;
                    var flag = 1;
                    if($ctrl.tj.sws ==='yes' && $ctrl.tj.charts ==='yes'){
                        flag=3;
                    }else{
                        if($ctrl.tj.sws === 'yes'){
                            flag =1;
                        }
                        if($ctrl.tj.charts === 'yes'){
                            flag =2;
                        }
                    }
                    quService.deleteQueueStatis(comInfo,$ctrl.tj.endTime,flag).finally(function () {
                        $ctrl.isRemoving=false;
                    });
                }
            }]
        });
})();