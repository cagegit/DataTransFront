/**
 * Created by cagej on 2017/4/21.
 *
 * offlineModel 离线分析模块
 * cpStatus capture状态页面
 * cpProperty capture配置页面
 * seniorProperty 高级选项界面
 */
(function () {
    'use strict';
    angular.module('myApp.cpComponent',[])
        .component('cpStatus',{
            templateUrl:'capture_view/status.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$state','$filter',function ($stateParams,$state,$filter) {
                var $ctrl=this;
                var comInfo = $stateParams;
                $ctrl.data={
                    cb:"all",
                    testing:false,
                    superConfig:false,
                    left:'>>',
                    right:'<<',
                    second:$filter('translate')('SECOND'),//秒
                    yes:$filter('translate')('YES'),
                    no:$filter('translate')('NO'),
                    hour:$filter('translate')('HOUR')
                };
                $ctrl.status = {};
                //参数说明
                $ctrl.params ={
                    captureName:false,
                    zfj:false,
                    xtjg:false,
                    cqjg:false,
                    scnxx:false,
                    racscn:false,
                    swc:false,
                    swczd:false,
                    ncdl:false,
                    lobzd:false,
                    gxqzd:false,
                    bingf:false,
                    bfgs:false,
                    maxlog:false,
                    capId:false,
                    zqjg:false,
                    skipGrant:false,
                    fullColUpdate:false,
                    onLine:false,
                    cpjg:false,
                    ssjg:false,
                    fccl:false,
                    bcrztb:false,
                    ctbcrz:false,
                    zqlzz:false,
                    hlwgx:false
                };
                //当前数据库类型配置
                $ctrl.dbConf={
                    nowDB:'oracle'
                };
                $ctrl.racs=[];
                $ctrl.real={
                    com_id:''
                };
                $ctrl.$onInit =function () {
                    if($ctrl.dl && angular.isObject($ctrl.dl)){
                        $ctrl.data.unselList=$ctrl.dl.unselList || [];
                        $ctrl.data.selList=$ctrl.dl.selList || [];
                        var obj =$ctrl.dl.property;
                        $ctrl.property= obj || {};
                        $ctrl.property.captureName= ($ctrl.dl.captureName && $ctrl.dl.captureName!=='unnamed')?$ctrl.dl.captureName:'';
                        angular.forEach($ctrl.dl.racs, function (val) {
                            if (!val.path) {
                                val.path = '';
                            }
                            val.enable = (val.enable === 'yes'|| val.enable === '是') ? $ctrl.data.yes : $ctrl.data.no;
                        });
                        $ctrl.racs = $ctrl.dl.racs;
                        if($ctrl.dl.racs.length>0){
                            // comInfo.pt='oracle-rac';
                        }
                        if(comInfo.pt==='oracle' || comInfo.pt==='oracle-rac'){
                            $ctrl.dbConf.nowDB='oracle';
                            $ctrl.property.nls_lang=obj.nls_lang || '';
                            $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                            $ctrl.property.capture_heartbeat=parseInt(obj.capture_heartbeat)?parseInt(obj.capture_heartbeat):300;
                            $ctrl.property.logminer_restart_time=parseInt(obj.logminer_restart_time)?parseInt(obj.logminer_restart_time):300;
                            $ctrl.property.back_scn=parseInt(obj.back_scn)?parseInt(obj.back_scn):10;
                            $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                            $ctrl.property.internal_queue_size=parseInt(obj.internal_queue_size)?parseInt(obj.internal_queue_size):32;
                            $ctrl.property.scn_evaluate_time=parseInt(obj.scn_evaluate_time)?parseInt(obj.scn_evaluate_time):20;
                            $ctrl.property.max_transaction_slot=parseInt(obj.max_transaction_slot)?parseInt(obj.max_transaction_slot):1000;
                            $ctrl.property.lob_skip=obj.lob_skip || 'no';
                            $ctrl.property.concurrent=obj.concurrent || 'no';
                            $ctrl.property.parallel=parseInt(obj.parallel)?parseInt(obj.parallel):1;
                            $ctrl.property.full_column_update=obj.full_column_update || 'no';
                            $ctrl.property.use_online_dict=obj.use_online_dict || 'no';
                            $ctrl.property.capture_grant=obj.capture_grant || 'no';
                        }else if(comInfo.pt==='sqlserver'){
                            $ctrl.dbConf.nowDB=comInfo.pt;
                            //属性配置
                            $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                            $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                            $ctrl.property.max_transaction_slot=parseInt(obj.max_transaction_slot)?parseInt(obj.max_transaction_slot):1000;
                            $ctrl.property.checkpoint_interval=parseInt(obj.checkpoint_interval)?parseInt(obj.checkpoint_interval):1;
                            $ctrl.property.snapshot_interval=parseInt(obj.snapshot_interval)?parseInt(obj.snapshot_interval):1;
                            $ctrl.property.full_column_update=obj.full_column_update || 'yes';
                            $ctrl.property.fetch_delay_reconnect=parseInt(obj.fetch_delay_reconnect)?parseInt(obj.fetch_delay_reconnect):20;
                            $ctrl.property.sync_when_extend_log=obj.sync_when_extend_log || 'yes';
                            $ctrl.property.extend_log_when_create=obj.extend_log_when_create || 'yes';
                            $ctrl.property.cap_loader_data=obj.cap_loader_data || 'yes';
                        } else if(comInfo.pt==='db2') {
                            $ctrl.dbConf.nowDB = 'db2';
                            $ctrl.property.max_transaction_slot=parseInt(obj.max_transaction_slot)?parseInt(obj.max_transaction_slot):1000;
                            $ctrl.property.readlog_only = parseInt(obj.readlog_only)  === 1 ? $ctrl.data.yes : $ctrl.data.no; // 只读取日志
                            $ctrl.property.db2_set_cdc = parseInt(obj.db2_set_cdc) === 1 ? $ctrl.data.yes : $ctrl.data.no; // 抓取不带cdc属性的建表语句
                            $ctrl.property.log_slot_size = (parseInt(obj.log_slot_size) ? parseInt(obj.log_slot_size) : 1000) + 'K'; // 日志槽大小
                            $ctrl.property.max_log_slot = parseInt(obj.max_log_slot) ? parseInt(obj.max_log_slot) : 1000; // 最大日志槽的个数
                            var update_ratio = parseInt(obj.update_ratio) ? parseInt(obj.update_ratio) : 0;
                            $ctrl.property.update_ratio = (update_ratio * 100) + '%'; //  update列命中率
                        }else{
                            //其他库
                            $ctrl.dbConf.nowDB=comInfo.pt;
                            //属性配置
                            $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                            $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                            $ctrl.property.cap_loader_data=obj.cap_loader_data || 'yes';
                        }
                        if(comInfo.cid !=='undefined' && comInfo.cid){
                            $ctrl.real.com_id=comInfo.cid;
                        }
                    }else{
                        $state.go('/');
                    }
                };
            }]
        })
        .component('cpProperty',{
            templateUrl:'capture_view/property.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$state','tipsService','graphicService','$filter','$uibModal','cpService', function ($stateParams,$state,dipT,gSer,$filter,$uibModal,cpService) {
                var $ctrl=this;
                var comInfo = $stateParams;
                $ctrl.number =0;
                $ctrl.data = {
                    unselList:[],
                    selList:[],
                    selModel:[],
                    unselModel:[],
                    superConfig:false,
                    serErr:null,
                    left:'>>',
                    right:'<<',
                    lxErr:'',
                    isValid:false//invalid
                };
                //参数说明
                $ctrl.params ={
                    captureName:false,
                    zfj:false,
                    xtjg:false,
                    cqjg:false,
                    scnxx:false,
                    racscn:false,
                    swc:false,
                    swczd:false,
                    ncdl:false,
                    lobzd:false,
                    gxqzd:false,
                    bingf:false,
                    bfgs:false,
                    skipGrant:false,
                    fullColUpdate:false,
                    onLine:false,
                    capId:false,
                    cpjg:false,
                    ssjg:false,
                    hlwgx:false,
                    fccl:false,
                    bcrztb:false,
                    ctbcrz:false,
                    zqlzz:false,
                    zqjg:false
                };
                $ctrl.property = {
                    captureName:'',
                    downstream: "no",
                    nls_lang: "AMERICAN_AMERICA.ZHS16GBK",
                    capture_interval: 15,
                    capture_heartbeat: 300,
                    logminer_restart_time: 300,
                    back_scn: 10,
                    transaction_slot_size: 32,
                    internal_queue_size: 32,
                    scn_evaluate_time: 20,
                    max_transaction_slot: 1000,
                    lob_skip: "no",
                    concurrent: "no",
                    parallel: 1,
                    full_column_update:'no',
                    use_online_dict:'no',
                    capture_grant:'no'
                };
                $ctrl.racs=[];
                $ctrl.rac_param_ck=true;
                $ctrl.rac_param_error='';
                //日志分析模式
                $ctrl.logFx={
                    ms:'zx',//zx:在线分析，lx：离线分析
                    db_ip:'',
                    db_id:'',
                    db_user:'',
                    db_password:'',
                    db_port:''
                };
                //当前数据库类型配置
                $ctrl.dbConf={
                    nowDB:'',
                    isEdit:false,
                    oraclePanel:false,
                    sqlserPanel:false,
                    sqlActive:0,
                    sqlLog:{
                        isEdit:false,
                        totalApp:0,
                        appNum:0,
                        totalCan:0,
                        canNum:0,
                        error:0,
                        ckAll:true,
                        excuteBtx:'执行',
                        excuteIng:false,
                        tables:[]
                    }
                };
                //组件名只读
                $ctrl.real={
                    com_id:''
                };
                //sqlserver 要选择的表树、配置快照同步表树
                var ztree_inc = null, ztree_inc1 = null;
                var ckArr=[];//选择的补充日志表
                var treeSetting = {
                    showLine: true,
                    check: {enable: true},
                    edit: {enable: true}
                };
                $ctrl.isSaving=false;//正在保存
                var saveTxt=$filter('translate')('SAVE');
                var savingTxt=$filter('translate')('SAVING');
                $ctrl.isSaving1 = false;
                $ctrl.saveBtnTxt=saveTxt;
                $ctrl.db2Param = {};
                $ctrl.isBpz = false;
                var dbZtreeInc;
                var db2Setting = {
                    showLine: true,
                    check: {
                        enable: true
                    },
                    view: {
                        selectedMulti: false
                    },
                    async: {
                        enable: true,
                        url: "/dipserver/query_db2_table",
                        autoParam:[],
                        otherParam: {},
                        type:'get',
                        contentType: "application/json",
                        dataFilter: function (treeId, parentNode, data) {
                            var res = [] , imgPath='/img/ico/';
                            if(data && data.status && data.response){
                                if(angular.isArray(data.response)){
                                    angular.forEach(data.response,function (v, i) {
                                        var isCheck = v.status === 'yes';
                                        res.push({id: i, name: v.name, ps: parentNode.name, checked: isCheck, icon: imgPath+'object.png'});
                                    });
                                }
                            }
                            return res;
                        }
                    },
                    callback: {
                        onClick: nodeClick
                    }
                };
                function nodeClick(e,treeId,treeNode) {
                    if (treeNode && treeNode.isParent) {
                        $ctrl.db2Param = {
                            group: comInfo.gn,
                            db_id: comInfo.pn,
                            schema: treeNode.name,
                            type: "table"
                        };
                    }
                }
                $ctrl.$onInit =function () {
                    if($ctrl.dl===null){
                        $state.go('/');
                    }else{
                        if ($ctrl.dl && $ctrl.dl !== 'init') {
                            $ctrl.data.unselList = $ctrl.dl.unselList || [];
                            $ctrl.data.selList = $ctrl.dl.selList || [];
                            var obj = $ctrl.dl.property;
                            if($ctrl.dl.captureName){
                                $ctrl.property.captureName = ($ctrl.dl.captureName && $ctrl.dl.captureName!=='unnamed')?$ctrl.dl.captureName:'';
                            }
                            if (!$ctrl.property.full_column_update)$ctrl.property.full_column_update = 'no';
                            if (!$ctrl.property.concurrent)$ctrl.property.concurrent = 'no';
                            if(comInfo.cid !=='undefined' && comInfo.cid){
                                $ctrl.real.com_id=comInfo.cid;
                            }
                            var racs =[];
                            angular.forEach(angular.copy($ctrl.dl.racs), function (val) {
                                if (!val.path) {
                                    val.path = '';
                                }
                                // val.enable = val.enable === 'yes' ;
                                val.enable = val.enable === 'yes' || val.enable === '是';
                                racs.push(val);
                            });
                            // if(racs.length===0){
                            //     racs=[{thread:'',name:'',ip:'',port:'',enable:false,path:''}];
                            // }
                            $ctrl.racs=racs;
                            if(comInfo.pt==='oracle' || comInfo.pt==='oracle-rac'){
                                $ctrl.dbConf.nowDB='oracle';
                                $ctrl.dbConf.oraclePanel=true;
                                $ctrl.property.nls_lang=obj.nls_lang || '';
                                $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                                $ctrl.property.capture_heartbeat=parseInt(obj.capture_heartbeat)?parseInt(obj.capture_heartbeat):300;
                                $ctrl.property.logminer_restart_time=parseInt(obj.logminer_restart_time)?parseInt(obj.logminer_restart_time):300;
                                $ctrl.property.back_scn=parseInt(obj.back_scn)?parseInt(obj.back_scn):10;
                                $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                                $ctrl.property.internal_queue_size=parseInt(obj.internal_queue_size)?parseInt(obj.internal_queue_size):32;
                                $ctrl.property.scn_evaluate_time=parseInt(obj.scn_evaluate_time)?parseInt(obj.scn_evaluate_time):20;
                                $ctrl.property.max_transaction_slot=parseInt(obj.max_transaction_slot)?parseInt(obj.max_transaction_slot):1000;
                                $ctrl.property.lob_skip=obj.lob_skip || 'no';
                                $ctrl.property.concurrent=obj.concurrent || 'no';
                                $ctrl.property.parallel=parseInt(obj.parallel)?parseInt(obj.parallel):1;
                                $ctrl.property.full_column_update=obj.full_column_update || 'no';
                                $ctrl.property.use_online_dict=obj.use_online_dict || 'no';
                                $ctrl.property.capture_grant=obj.capture_grant || 'no';
                            }else if(comInfo.pt==='sqlserver'){
                                $ctrl.dbConf.nowDB=comInfo.pt;
                                //属性配置
                                $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                                $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                                $ctrl.property.max_transaction_slot=parseInt(obj.max_transaction_slot)?parseInt(obj.max_transaction_slot):1000;
                                $ctrl.property.checkpoint_interval=parseInt(obj.checkpoint_interval)?parseInt(obj.checkpoint_interval):1;
                                $ctrl.property.snapshot_interval=parseInt(obj.snapshot_interval)?parseInt(obj.snapshot_interval):1;
                                $ctrl.property.full_column_update=obj.full_column_update || 'yes';
                                $ctrl.property.fetch_delay_reconnect=parseInt(obj.fetch_delay_reconnect)?parseInt(obj.fetch_delay_reconnect):20;
                                $ctrl.property.sync_when_extend_log=obj.sync_when_extend_log || 'yes';
                                $ctrl.property.extend_log_when_create=obj.extend_log_when_create || 'yes';
                                $ctrl.property.cap_loader_data=obj.cap_loader_data || 'yes';
                            } else if(comInfo.pt==='db2') {
                                $ctrl.dbConf.nowDB = 'db2';
                                $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                                $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                                $ctrl.property.max_transaction_slot=parseInt(obj.max_transaction_slot)?parseInt(obj.max_transaction_slot):1000;
                                $ctrl.property.cap_loader_data=obj.cap_loader_data ==='yes' ? 'yes' : 'no';
                                $ctrl.property.readlog_only = obj.readlog_only ==='yes' ? 'yes' : 'no'; // 只读取日志
                                $ctrl.property.db2_set_cdc = obj.db2_set_cdc ==='yes' ? 'yes' : 'no'; // 抓取不带cdc属性的建表语句
                                $ctrl.property.log_slot_size = parseInt(obj.log_slot_size) ? parseInt(obj.log_slot_size) : 1000; // 日志槽大小
                                $ctrl.property.max_log_slot = parseInt(obj.max_log_slot) ? parseInt(obj.max_log_slot) : 1000; // 最大日志槽的个数
                                var update_ratio = parseInt(obj.update_ratio) ? parseInt(obj.update_ratio) : 0;
                                $ctrl.property.update_ratio = update_ratio * 100; //  update列命中率
                            } else{
                                //其他库
                                $ctrl.dbConf.nowDB=comInfo.pt;
                                //属性配置
                                $ctrl.property.capture_interval=parseInt(obj.capture_interval)?parseInt(obj.capture_interval):15;
                                $ctrl.property.transaction_slot_size=parseInt(obj.transaction_slot_size)?parseInt(obj.transaction_slot_size):32;
                                $ctrl.property.cap_loader_data=obj.cap_loader_data || 'yes';
                            }
                            $ctrl.dbConf.isEdit=true;
                            if($ctrl.dl.downstream_info){
                                $ctrl.logFx.ms='lx';
                                $ctrl.logFx.db_ip=$ctrl.dl.downstream_info.db_ip || '';
                                $ctrl.logFx.db_id=$ctrl.dl.downstream_info.db_id || '';
                                $ctrl.logFx.db_user=$ctrl.dl.downstream_info.db_user || '';
                                $ctrl.logFx.db_password=$ctrl.dl.downstream_info.db_password || '';
                                $ctrl.logFx.db_port=$ctrl.dl.downstream_info.db_port || '';
                            }else{
                                $ctrl.logFx.ms='zx';
                            }
                        }
                    }
                };

                $ctrl.itemDesc = function (parma) {
                    angular.forEach($ctrl.params,function (val, i) {
                        if(parma === 'all'){
                            val = true;
                        }else if(parma === 'none'){
                            val = false;
                        }else{
                            if(i === parma){
                                val = true;
                                return false;
                            }
                        }
                    });
                };
                //离线主机配置
                $ctrl.lxMacConfig=function () {
                    var modalIns = $uibModal.open({
                        component: 'offlineModel',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            title:function () {
                                return '离线分析主机配置';
                            },
                            dbInfo:function () {
                                return $ctrl.logFx;
                            }
                        }
                    });
                    modalIns.result.then(function (tt) {
                        $ctrl.logFx=tt;
                        $ctrl.logFx.ms='lx';
                        $ctrl.data.lxErr ='';
                    });
                };

                //保存Capture的配置信息
                $ctrl.saveCaptureInfo = function () {
                    var arg = "",n_capture_name=$ctrl.property.captureName,cap_type=comInfo.pt,userList,params;
                    var dw_info='';//日志分析模式
                    if(n_capture_name ==='unnamed'){
                        dipT.error($filter('translate')('Cp_mcbnk'));//Capture名称不能为unnamed！
                        return;
                    }
                    var num = (parseInt($ctrl.property.transaction_slot_size)*parseInt($ctrl.property.max_transaction_slot))/1024+parseInt($ctrl.property.internal_queue_size);
                    if(num>1024){
                        $ctrl.data.serErr=$filter('translate')('Cp_xz');//事务槽大小 x 事务槽最大数 + 内存队列大小 不能大于 1G！
                        return;
                    }else{
                        $ctrl.data.serErr ='';
                    }
                    if($ctrl.logFx.ms==='lx'){
                        if(!$ctrl.logFx.db_ip || !$ctrl.logFx.db_id || !$ctrl.logFx.db_user || !$ctrl.logFx.db_password || !$ctrl.logFx.db_port){
                            $ctrl.data.lxErr='离线分析模式必须对离线主机进行配置！';//离线分析模式必须对离线主机进行配置！
                            return;
                        }else{
                            $ctrl.data.lxErr ='';
                        }
                        dw_info={db_ip:$ctrl.logFx.db_ip,db_id:$ctrl.logFx.db_id,db_user:$ctrl.logFx.db_user,db_password:$ctrl.logFx.db_password,db_port:$ctrl.logFx.db_port};
                    }
                    var racs = fetch_rac_info($ctrl.racs);
                    if (cap_type==="oracle" || cap_type==="oracle-rac") {
                        userList = selectedList_json($ctrl);
                        params=capture_params($ctrl.property,cap_type);
                        arg ={group_id:comInfo.gn,component_name:n_capture_name,db_component_id:comInfo.pn,type:comInfo.pt,selected_users:userList,downstream_info:dw_info,rac_info:{instance:racs},parameter:params,component_id:comInfo.cid};
                    } else if (cap_type==="sqlserver" || cap_type === "db2" || cap_type==="mysql") {
                        userList = selectedList_json($ctrl);
                        params=capture_params($ctrl.property,cap_type);
                        var nodes =getSnapshotList();
                        arg ={group_id:comInfo.gn,component_name:$ctrl.property.captureName,db_component_id:comInfo.pn,type:comInfo.pt,selected_users:userList,snapshot_tables:{schema:nodes},rac_info:{instance:racs},parameter:params,component_id:comInfo.cid};
                    }
                    $ctrl.isSaving=true;
                    $ctrl.saveBtnTxt=savingTxt;
                    var saveCapture = function () {
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
                        cpService.addCaptureProperty(arg).then(function (result) {
                            if(result.res){
                                $ctrl.real.com_id=result.comId;
                                var node = $("#" + comInfo.id);
                                node.find(".dragPoint").text(n_capture_name);
                                node.attr("name", n_capture_name);
                                node.attr("type", cap_type);
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
                    saveCapture();
                };

                //列表的选择
                $ctrl.pushSelect = function(){
                    if($ctrl.data.unselModel && $ctrl.data.unselModel.length>0){
                        var arr=[];
                        angular.forEach($ctrl.data.unselList,function (val) {
                             if($.inArray(val,$ctrl.data.unselModel)<0){
                                 arr.push(val);
                             }else{
                                 $ctrl.data.selList.push(val);
                                 $ctrl.data.selList.sort();
                             }
                        });
                        arr.sort();
                        $ctrl.data.unselList =arr;
                        $ctrl.data.unselModel=[];
                    }
                };
                $ctrl.removeSelect = function() {
                    if($ctrl.data.selModel && $ctrl.data.selModel.length>0){
                        var arr=[];
                        angular.forEach($ctrl.data.selList,function (val) {
                            if($.inArray(val,$ctrl.data.selModel)<0){
                                arr.push(val);
                            }else{
                                $ctrl.data.unselList.push(val);
                                $ctrl.data.unselList.sort();
                            }}
                        );
                        arr.sort();
                        $ctrl.data.selList =arr;
                        $ctrl.data.selModel=[];
                    }
                };
                $ctrl.onlyNonNegative_tow=function(obj) {
                    var inputChar = event.keyCode;
                    obj.value = obj.value.replace(/[^\d]/g, "");
                };
                $ctrl.blur_trans_parallel=function(obj){
                    if(obj.value<2){
                        obj.value=2;
                    }
                };
                $ctrl.saveSeniorConfig = function (pro) {
                    angular.extend($ctrl.property,pro);
                    var params = capture_params($ctrl.property,comInfo.pt);
                    cpService.saveParameter(comInfo,params).then(function (res) {
                        if(res){
                            $ctrl.saveCaptureInfo();
                        }
                    });
                };
                function fetch_rac_info(racs) {
                    var racArr=[];
                    if (racs.length ===0) {
                        return racArr;
                    }
                    angular.forEach(racs,function (val) {
                        if(val.thread && val.name && val.ip && val.port){
                            var rac_enable = val.enable?'yes':'no',rac ={};
                            rac.thread=val.thread;
                            rac.name=val.name;
                            rac.ip=val.ip;
                            rac.port=val.port;
                            rac.enable=rac_enable;
                            rac.path=val.path;
                            racArr.push(rac);
                        }
                    });
                    return racArr;
                }
                /*
                 * 展示sqlserver表配置界面
                 */
                $ctrl.showSqlPanel = function () {
                    $ctrl.dbConf.sqlserPanel=true;
                    if($ctrl.dbConf.nowDB === 'db2') {
                        $ctrl.isBpz = true;
                        db2Setting.async.autoParam=['name=schema','gp=group','db=db_id'];
                        db2Setting.async.otherParam={type: 'table'};
                        //生成下拉树
                        cpService.getDb2Schema(comInfo).then(function (item) {
                            if(item.res) {
                                dbZtreeInc = $.fn.zTree.init($("#objTreeDb2"), db2Setting, item.list);
                            }
                        }).finally(function () {
                            $ctrl.isBpz = false;
                        });
                    } else {
                        getExtendLogTable();
                    }
                };
                /*
                 * 展示sqlserver快照同步表界面
                 */
                $ctrl.showSqlKzPanel = function () {
                    $ctrl.dbConf.sqlActive=1;
                    cpService.queryCaptureTable(comInfo,$ctrl.data.selList).then(function (result) {
                        if(result.res){
                            var nodes =snapshotToTree(result.info);
                            ztree_inc1 = $.fn.zTree.init($("#objTree1"),treeSetting,nodes);//生成sql快照同步表树
                        }
                    });
                };
                /*
                 * 保存快照同步表
                 * */
                $ctrl.saveSqlKz=function () {
                    $ctrl.isSaving1 = true;
                    var cap_type =this.dbConf.nowDB;
                    if (cap_type==="sqlserver" || cap_type === "db2" || cap_type==="mysql") {
                        var nodes=getSnapshotList();
                        var userList = selectedList_json($ctrl);
                        var params=capture_params($ctrl.property,cap_type);
                        cpService.saveKzTable(comInfo,$ctrl.property.captureName,userList,nodes,params)
                            .finally(function () {
                                $ctrl.isSaving1 = false;
                        });
                    }
                };
                /*
                * 保存db2 cdc
                * */
                $ctrl.saveDb2Cdc = function () {
                    if(!dbZtreeInc) {
                        return ;
                    }
                    $ctrl.isBpz = true;
                    var arr =dbZtreeInc.getCheckedNodes(true);
                    var arr1 =dbZtreeInc.getCheckedNodes(false);
                    var nodes = dbZtreeInc.getNodes();
                    var ckList = [];
                    var ckNoList = [];
                    var nowCk = {};
                    var nowNoCk = {};
                    var nowCkLen = 0;
                    var nowCkNoLen = 0;
                    var schemas = [];
                    angular.forEach(nodes, function (v) {
                        if(v.isParent) {
                            schemas.push({name: v.name, cLen: v.children.length});
                        }
                    });
                    angular.forEach(schemas, function (vv) {
                        nowCk = {select_all:"no", schema: vv.name, table:[]};
                        nowCk.table = [];
                        nowCkLen = 0;
                        angular.forEach(arr, function (v) {
                            if(!v.isParent) {
                                if(nowCk.schema === v.ps) {
                                    nowCk.table.push(v.name);
                                    nowCkLen = nowCkLen + 1;
                                }
                            }
                        });
                        if(nowCkLen >= vv.cLen) {
                            nowCk.table = [];
                            nowCk.select_all = 'yes';
                        }
                        if(nowCk.table.length > 0 || nowCk.select_all=== 'yes') {
                            ckList.push(nowCk);
                        }
                    });
                    angular.forEach(schemas, function (vv) {
                        nowNoCk = {select_all:"no", schema: vv.name, table: []};
                        nowNoCk.table =[];
                        nowCkNoLen = 0;
                        angular.forEach(arr1, function (v) {
                           if(!v.isParent) {
                               if(nowNoCk.schema === v.ps) {
                                   nowNoCk.table.push(v.name);
                                   nowCkNoLen = nowCkNoLen + 1;
                               }
                           }
                        });
                        if(nowCkNoLen >= vv.cLen) {
                            nowNoCk.table = [];
                            nowNoCk.select_all = 'yes';
                        }
                        if(nowNoCk.table.length > 0 || nowNoCk.select_all=== 'yes') {
                            ckNoList.push(nowNoCk);
                        }
                    });
                    cpService.saveDb2CdcInfo(ckNoList, ckList, comInfo.pn).then(function (v) {
                           if(v) {
                               dipT.success('配置设置成功！');
                           }
                    }).finally(function () {
                        $ctrl.isBpz = false;
                    });
                };
                /*
                 * 选择要同步的表
                 * @return {Array[...Object]} 生成已选择表数组
                 * */
                $ctrl.selectTbTables=function () {
                    ckArr=[];
                    if(ztree_inc){
                        var ck_change_nodes=ztree_inc.getChangeCheckedNodes(),appends=0,cancels=0,id=0;
                        angular.forEach(ck_change_nodes,function (v) {
                            if(v.level===1){
                                var node={};
                                node.name=v.name;
                                node.table=[];
                                var snode={},cz='';
                                var pn=v.getParentNode().name;
                                snode.pname=pn;
                                snode.name=v.name;
                                snode.checked=v.checked;
                                id=id+1;
                                snode.id='logs_'+id;
                                snode.cid='cx_'+id;
                                cz=v.checked?'add':'del';
                                snode.data='{"name":"'+pn+'","table":"'+v.name+'","id":"'+snode.id+'","cz":"'+cz+'","cid":"'+snode.cid+'"}';
                                if(v.checked){
                                    appends++;
                                }else {
                                    cancels++;
                                }
                                ckArr.push(snode);
                            }
                        });
                    }
                    $ctrl.dbConf.sqlLog.isEdit=true;
                    $ctrl.dbConf.sqlLog.tables=ckArr;
                    $ctrl.dbConf.sqlLog.totalApp=appends;
                    $ctrl.dbConf.sqlLog.totalCan=cancels;
                    $ctrl.dbConf.sqlLog.appNum=0;
                    $ctrl.dbConf.sqlLog.canNum=0;
                    $ctrl.dbConf.sqlLog.error=0;
                    $ctrl.dbConf.sqlLog.ckAll=true;
                    return ckArr;
                };
                /*
                 * 执行添加补充日志
                 * */
                $ctrl.excuteBcLog = function () {
                    var ckList =$('#sqlLogs').find('input.sqlTbCbox:checked'),new_arr=[],index=0;
                    if(ckList.length<=0){
                        dipT.warning('请选择要执行的数据！');
                        return;
                    }
                    $ctrl.dbConf.sqlLog.excuteIng=true;
                    $ctrl.dbConf.sqlLog.excuteBtx='执行中...';
                    var sqlLog=$ctrl.dbConf.sqlLog;
                    angular.forEach(ckList,function (v) {
                        var aa=$(v).val();
                        var bb=JSON.parse(aa);
                        new_arr.push(bb);
                    });
                    var excute = function () {
                        if(index===new_arr.length){
                            $ctrl.dbConf.sqlLog.excuteIng=false;
                            $ctrl.dbConf.sqlLog.excuteBtx='执行';
                        }
                        if(index<new_arr.length){
                            var log=new_arr[index];
                            var itemId=log.id;
                            cpService.changeExtendedLog(comInfo,log).then(function (res) {
                                if(res){
                                    $("#"+itemId).html('<span class="text-success">成功！</span>');
                                    if(log.cz==='add'){
                                        sqlLog.appNum++;
                                    }else {
                                        sqlLog.canNum++;
                                    }
                                }else{
                                    $("#"+itemId).html('<span class="text-danger">失败！</span>');
                                    sqlLog.error++;
                                }
                            },function () {
                                $("#"+itemId).html('<span class="text-danger">失败！</span>');
                                sqlLog.error++;
                            })
                                .finally(function () {
                                    index++;
                                    excute();
                                });
                        }
                    };
                    if(new_arr.length>0){
                        excute();
                    }
                };
                /*
                 * 全选按钮的选中问题
                 * */
                $ctrl.qxToggle =function () {
                    if(this.dbConf.sqlLog.ckAll){
                        $('input.sqlTbCbox').prop('checked',true);
                    }else{
                        $('input.sqlTbCbox').prop('checked',false);
                    }
                };
                /*
                 * 取消按钮
                 * */
                $ctrl.cancelZx =function () {
                    this.dbConf.sqlLog.isEdit=false;
                    getExtendLogTable();
                };
                /*
                 * 获取ExtendLogTable
                 * */
                function getExtendLogTable() {
                    cpService.queryExtendLogTable(comInfo,$ctrl.data.selList).then(function (result) {
                        if(result.res){
                            var nodes =elJsonToTree(result.info);
                            ztree_inc = $.fn.zTree.init($("#objTree"),treeSetting,nodes);//生成sql列表树
                        }
                    });
                }
                function getSnapshotList() {
                    var nodes = [];
                    if(ztree_inc1) {
                        var snaps = ztree_inc1.getCheckedNodes();
                        angular.forEach(snaps, function (v) {
                            if(v.level===0){
                                var node = {};
                                node.name = v.name;
                                node.table = [];
                                if (v.level === 0) {
                                    angular.forEach(v.children, function (v1) {
                                        if (v1.checked) {
                                            node.table.push(v1.name);
                                        }
                                    });
                                }
                                nodes.push(node);
                            }
                        });
                    }
                    return nodes;
                }

                function capture_params(property,cap_type) {
                    var params={};
                    if (cap_type === "oracle" || cap_type === "oracle-rac") {
                        var downStream = $ctrl.logFx.ms==='lx'?'yes':'no';
                        var parallel = property.parallel?property.parallel:1;
                        // var max_logs = property.max_logs?property.max_logs:1;
                        params.downstream=downStream;
                        params.nls_lang=property.nls_lang;
                        params.capture_interval=property.capture_interval;
                        params.capture_heartbeat=property.capture_heartbeat;
                        params.logminer_restart_time=property.logminer_restart_time;
                        params.back_scn=property.back_scn;
                        params.transaction_slot_size=property.transaction_slot_size+'K';
                        params.internal_queue_size=property.internal_queue_size+'M';
                        // params.h_send_sort_scn=property.h_send_sort_scn;
                        params.scn_evaluate_time=property.scn_evaluate_time;
                        params.max_transaction_slot=property.max_transaction_slot;
                        // params.dup_high_scn=property.dup_high_scn;
                        params.lob_skip=property.lob_skip;
                        params.concurrent=property.concurrent;
                        params.parallel=parallel;
                        // params.max_logs=max_logs;
                        params.full_column_update=property.full_column_update || 'no';
                        params.use_online_dict=property.use_online_dict || 'no';
                        params.capture_grant=property.capture_grant || 'no';
                    } else if (cap_type==="sqlserver") {
                        params.capture_interval=property.capture_interval;
                        // params.transaction_slot_size=property.transaction_slot_size+'K';
                        // params.max_transaction_slot=property.max_transaction_slot;
                        params.checkpoint_interval=property.checkpoint_interval;
                        params.snapshot_interval=property.snapshot_interval;
                        // params.full_column_update=property.full_column_update;
                        params.fetch_delay_reconnect=property.fetch_delay_reconnect;
                        params.sync_when_extend_log=property.sync_when_extend_log;
                        params.extend_log_when_create=property.extend_log_when_create;
                        params.cap_loader_data=property.cap_loader_data;
                    } else if (cap_type==="db2") {
                        params.max_transaction_slot = property.max_transaction_slot;
                        params.capture_interval=property.capture_interval;
                        params.transaction_slot_size=property.transaction_slot_size+'K';
                        params.readlog_only = property.readlog_only; // 只读取日志
                        params.db2_set_cdc = property.db2_set_cdc; // 抓取不带cdc属性的建表语句
                        params.log_slot_size = property.log_slot_size+'K'; // 日志槽大小
                        params.max_log_slot = property.max_log_slot; // 最大日志槽的个数
                        params.cap_loader_data = property.cap_loader_data;
                        var update_ratio = parseInt(property.update_ratio) ? parseInt(property.update_ratio) : 0; //  update列命中率
                        params.update_ratio = update_ratio / 100;
                    } else{
                        params.capture_interval=property.capture_interval;
                        params.transaction_slot_size=property.transaction_slot_size+'K';
                        params.cap_loader_data=property.cap_loader_data;
                    }
                    return params;
                }
                //选中列表
                function selectedList_json($ctrl) {
                    return angular.isArray($ctrl.data.selList) ? $ctrl.data.selList : [];
                }
                /*
                 * query_extended_log_table接口返回的json数据转树形数组
                 * @param {Object} json
                 * @return {Array} trees
                 */
                function elJsonToTree(json) {
                    var trees=[],imgPath='/img/ico/';
                    if(json &&　angular.isArray(json.extend_table)){
                        angular.forEach(json.extend_table,function (v) {
                            var tnode={},flag=1;
                            var ck_num=parseInt(v.extend_num) || 0;
                            var sum_num=parseInt(v.sum_num) || 0;
                            var node_name=v.user;
                            var tables=angular.isArray(v.table)?v.table:[];
                            tnode.name=node_name;
                            tnode.children=[];
                            tnode.icon=imgPath+'schema.png';
                            tnode.checked = (ck_num===sum_num && sum_num!==0);
                            angular.forEach(tables,function (vl) {
                                var snode={};
                                snode.name=vl;
                                if(flag<=ck_num){
                                    snode.checked=true;
                                    flag++;
                                }else{
                                    snode.checked=false;
                                }
                                snode.icon=imgPath+'object.png';
                                tnode.children.push(snode);
                            });
                            trees.push(tnode);
                        });
                    }
                    return trees;
                }
                /*
                 * 转换快照同步表树表
                 * @param {Object} json
                 * @return {Array} trees
                 * */
                function snapshotToTree(json) {
                    var trees=[],strees=[],newTree=[],imgPath='/img/ico/';
                    var totalchema=(json.all_unrepl && angular.isArray(json.all_unrepl))?json.all_unrepl:[];
                    var ckSchema=(json.snapshot_tables && angular.isArray(json.snapshot_tables.schema))?json.snapshot_tables.schema:[];
                    angular.forEach(totalchema,function (v) {
                        var pnode ={},tables=v.table ||[],ctables=[],flag=0;
                        pnode.name=v.name;
                        pnode.checked=false;
                        pnode.icon=imgPath+'schema.png';
                        pnode.children=[];
                        angular.forEach(ckSchema,function (v1) {
                            if(v1.name===v.name){
                                ctables=v1.table || [];
                            }
                        });
                        angular.forEach(tables,function (vv) {
                            var snode={};
                            snode.name=vv;
                            snode.checked=false;
                            snode.icon=imgPath+'object.png';
                            if(tables.length===ctables.length){
                                snode.checked=true;
                                flag=1;
                            }else{
                                angular.forEach(ctables,function (v2) {
                                    if(v2===vv){
                                        snode.checked=true;
                                        flag=0;
                                    }
                                });
                            }
                            pnode.children.push(snode);
                        });
                        if(flag===1){
                            pnode.checked=true;
                        }
                        trees.push(pnode);
                    });
                    return trees;
                }
            }]
        })
        .component('seniorPro',{
            templateUrl:'capture_view/seniorConfig.component.html',
            bindings:{
                superF: '<',
                dbType:'<',
                property:'<',
                onSave:'&',
                comId:'<'
                // isValid:'='
            },
            controller:['$filter','$log', function ($filter,$log) {
                    var $ctrl =this;
                    $ctrl.params ={
                        captureName:false,
                        zfj:false,
                        xtjg:false,
                        cqjg:false,
                        scnxx:false,
                        racscn:false,
                        swc:false,
                        swczd:false,
                        ncdl:false,
                        lobzd:false,
                        gxqzd:false,
                        bingf:false,
                        bfgs:false,
                        skipGrant:false,
                        fullColUpdate:false,
                        onLine:false,
                        capId:false,
                        cpjg:false,
                        ssjg:false,
                        hlwgx:false,
                        fccl:false,
                        bcrztb:false,
                        ctbcrz:false,
                        zqlzz:false,
                        zqjg:false
                    };
                   $ctrl.validErr='';
                   $ctrl.$onInit=function () {

                   };
                   $ctrl.saveSeniorConfig=function () {
                       //表单验证
                       if(!$ctrl.comId ||　$ctrl.comId==='undefined'){
                           $ctrl.validErr=$filter('translate')('Cp_bcgj');//保存高级选项前,请先完善当前组件配置信息！
                           return;
                       }else{
                           $ctrl.validErr ='';
                       }
                       var num = (parseInt($ctrl.property.transaction_slot_size)*parseInt($ctrl.property.max_transaction_slot))/1024+parseInt($ctrl.property.internal_queue_size);
                       if(num>1024){
                           $ctrl.validErr=$filter('translate')('Cp_xz');//事务槽大小 x 事务槽最大数 + 内存队列大小 不能大于 1G！
                           return;
                       }else{
                           $ctrl.validErr ='';
                       }
                       $ctrl.validErr='';
                       $ctrl.onSave({pro:$ctrl.property});
                   };
             }]
        })
        .component('offlineModel',{
            templateUrl:'capture_view/offline.component.html',
            bindings:{
                resolve:'<',
                close:'&',
                dismiss:'&'
            },
            controller:['$log',function ($log) {
                var $ctrl=this;
                $ctrl.$onInit=function () {
                    $ctrl.logFx={};
                    if($ctrl.resolve.dbInfo){
                        $ctrl.logFx=$ctrl.resolve.dbInfo;
                        $ctrl.title=$ctrl.resolve.title || '离线分析主机配置';
                    }
                };
                $ctrl.ok = function () {
                    $ctrl.close({$value:$ctrl.logFx});
                };
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
            }]
        })
        .component('racModel',{
            templateUrl:'capture_view/rac.component.html',
            bindings:{
                racs:'='
            },
            controller:['$log',function ($log) {
                var $ctrl=this;
                //添加rac信息
                $ctrl.plusRacs=function () {
                    $ctrl.racs.push({thread:'',name:'',ip:'',port:'',enable:false,path:''});
                };
                //添加rac信息
                $ctrl.removeRacs=function () {
                    if($ctrl.racs.length>0){
                        $ctrl.racs.pop();
                    }
                };
            }]
        });
})();