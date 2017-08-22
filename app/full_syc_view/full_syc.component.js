/**
 * Created by cagej on 2017/4/7.
 */
(function () {
    "use strict";
    angular.module('myApp.fullSycComponent', ['ui.bootstrap'])
        .component('parentView',{
            templateUrl:'full_syc_view/main.component.html',
            bindings:{
                status:'<'
            },
            controller:['$stateParams','$location','$state','$uibModal','fullSycService','tipsService','$scope','graphicService','$rootScope',function ($stateParams,$location,$state,$uibModal,fullSycService,dipT,$scope,gSer,$rootScope) {
                var $ctrl=this;
                var loaders =gSer.getLoaders();
                var newArr=[];
                angular.forEach(loaders,function (v) {
                    var item={};
                    item.gn=$stateParams.gn;
                    item.cn=v.name;
                    item.name=v.cname;
                    item.st=v.st;
                    item.sn=v.sn;
                    item.cid=v.cid;
                    newArr.push(item);
                });
                $ctrl.currentLoaderName='';
                $ctrl.currentLoader=$stateParams;
                angular.forEach(newArr,function (v) {
                    if(v.cn===$stateParams.cn){
                        $ctrl.selectedItem=v;
                        $ctrl.currentLoaderName=v.name;
                    }
                });
                $ctrl.loaders=newArr;
                $ctrl.dialog=true;
                $ctrl.current=1;
                $ctrl.export={};
                $ctrl.import={};
                $ctrl.loaderTip='数据同步基于loader组件的基础上进行';
                $ctrl.isRun=false;
                $ctrl.currentSyncId='';
                $ctrl.$onInit=function () {
                    if($ctrl.status.export.status==='1' || $ctrl.status.import.status==='1'){
                        $ctrl.isRun=true;
                        $ctrl.currentSyncId=$ctrl.status.syncId;
                        openFullModal($ctrl.currentLoader,$ctrl.currentSyncId);
                    }
                };
                var exportListener = $scope.$on('exportChange',function (event,exp) {
                    if(exp && !$.isEmptyObject(exp)){
                        if(exp.exp_simu==='0' &&  exp.exp_create_object==='0'){
                            dipT.error('系统检测到导出规则里面（导出任务并发数、导出其他对象）均未配置，将导致全同步导出无法启动，请至少配置其中一项！');
                            $ctrl.export={};//清空导出的已配置信息
                            return;
                        }
                    }
                    if(exp && exp.exp_mode==='0' && exp.exp_schema.length===0){
                        dipT.error('系统检测到你未配置任何表，请选择要导出的表！');
                        $ctrl.export={};
                        return ;
                    }
                    $ctrl.export=exp;
                    dipT.success('导出配置已保存！');
                    event.stopPropagation();
                });
                var importListener = $scope.$on('importChange',function (event,imp) {
                    if(imp &&　!$.isEmptyObject(imp)){
                        if(imp.imp_simu==='0' &&  imp.imp_rebuild_object==='0'){
                            dipT.error('系统检测到导入规则里面（导入任务并发数、重建对象）均未配置，将导致全同步导入无法启动，请至少配置其中一项！');
                            $ctrl.import={};//清空导出的已配置信息
                            return;
                        }
                    }
                    if(imp && imp.imp_mode==='0' && imp.imp_schema.length===0){
                        dipT.error('系统检测到你未配置任何表，请选择要导入的表！');
                        $ctrl.import={};
                        return ;
                    }
                    $ctrl.import=imp;
                    dipT.success('导入配置已保存！');
                    event.stopPropagation();
                });
                var cleanSyncListener = $rootScope.$on('fullSyncIsRun', function (e, isRun) {
                    $ctrl.isRun = isRun;
                });
                //页面退出时解除事件绑定
                $scope.$on('$destroy', function() {
                    cleanSyncListener();
                    exportListener();
                    importListener();
                });
                //切换loader
                $ctrl.changeLoader=function () {
                    var el=$ctrl.selectedItem;
                    var nowParams={gn:el.gn,cn:el.cn,st:el.st,sn:el.sn,name:el.name,cid:el.cid};
                    $ctrl.currentLoaderName=el.name;
                    $ctrl.currentLoader=nowParams;
                    fullSycService.refreshFullSyncFilters(nowParams).then(function (res) {
                        if(res.export.status==='1' || res.import.status==='1'){
                            $ctrl.isRun=true;
                            $ctrl.currentSyncId=res.syncId;
                            openFullModal(nowParams,res.syncId);
                        }else{
                            $ctrl.isRun=false;
                        }
                    }).finally(function () {
                        $state.go('/.full_syc_view.loader',nowParams);
                    });
                };
                $ctrl.redirectTo=function () {
                    $state.go('/');
                };
                //开始全同步
                $ctrl.beginToFullSync=function () {
                    if($.isEmptyObject($ctrl.export) && $.isEmptyObject($ctrl.import)){
                        dipT.error('请至少配置一项全同步规则，再执行该操作！');
                        return;
                    }else{
                        if($.isEmptyObject($ctrl.export) && !$.isEmptyObject($ctrl.import)){
                            if($ctrl.import &&　$ctrl.import.imp_mode==='1'){
                                dipT.warning('请配置导出规则或者导入规则里面从已有数据文件导入其中至少一种规则才能启动全同步！');
                                return;
                            }
                        }
                    }
                    if($.isEmptyObject($ctrl.import)){
                        BootstrapDialog.confirm({
                            title: 'Dip 提示',//Dip 提示
                            message:'系统检测到您尚未配置导入选项，系统将只执行导出，是否继续？',//系统检测到您尚未配置导入选项，系统将只执行导出，是否继续？
                            type: BootstrapDialog.TYPE_WARNING,
                            btnCancelLabel:'取消',//取消
                            btnOKLabel:'继续',//继续
                            btnOKClass: 'btn-warning',
                            callback: function(result) {
                                if(result){
                                    operateFullSync();
                                }
                            }
                        });
                    }else{
                        BootstrapDialog.confirm({
                            title: 'Dip 提示',//Dip 提示
                            message:'确认要同步这些表吗？',//确认要同步这些表吗？
                            type: BootstrapDialog.TYPE_WARNING,
                            btnCancelLabel:'取消',//取消
                            btnOKLabel:'确认',//确认
                            btnOKClass: 'btn-warning',
                            callback: function(result) {
                                if(result){
                                    operateFullSync();
                                }
                            }
                        });
                    }
                };
                //执行全同步操作
                function operateFullSync() {
                    fullSycService.createSyncCfg($ctrl.currentLoader,$ctrl.export,$ctrl.import).then(function (res) {
                        if(res){
                            $ctrl.currentSyncId=res;
                            startFullSync($ctrl.currentLoader,res,0);
                        }
                    });
                }
                //查看进行中的全同步
                $ctrl.workingFullSync=function () {
                    openFullModal($ctrl.currentLoader,$ctrl.currentSyncId);
                };
                //开始全同步
                function startFullSync(comInfo,syncId,flag) {
                    var dialog = new BootstrapDialog({
                        title:'Full Sync Info',
                        type:'type-warning',
                        message: function(){
                            return '<h2 class="text-warning">全同步操作启动中......</h2>';//全同步操作启动中......
                        },
                        closable: true
                    });
                    dialog.open();
                    var fullSync=fullSycService.startFullSync(comInfo,syncId,flag);
                    fullSync.then(function (res) {
                        dialog.onhide=function(){
                            BootstrapDialog.confirm('全同步操作启动中，确认要停止全同步吗？', function(result){//全同步操作启动中，确认要停止全同步吗？
                                if(result){
                                    fullSync.abort();
                                    dialog.close();
                                }
                            });
                        };
                        if (res) {
                            dialog.setType('type-success');
                            dialog.getModalBody().html('<h2 class="text-success">恭喜！全同步已经启动！<i class="green glyphicon glyphicon-ok"></i></h2>');//恭喜！全同步已经启动！
                            openFullModal(comInfo,syncId);
                            $ctrl.isRun=true;
                        }else{
                            dialog.setType('type-danger');
                            dialog.getModalBody().html('<h2 class="text-error">抱歉！全同步启动失败！<i class="red glyphicon glyphicon-remove"></i></h2>');//抱歉！全同步启动失败！
                            $ctrl.isRun=false;
                        }
                        setTimeout(function () {
                            dialog.close();
                        },500);
                    });
                }
                //打开全同步界面
                function openFullModal(comInfo,syncId) {
                    var modalInstance=$uibModal.open({
                        component: 'fullSyncModal',
                        size:'lg',
                        resolve:{
                            summary:function () {
                                return fullSycService.queryFullSyncSummary(comInfo,syncId);
                            },
                            detail:function () {
                                return fullSycService.queryFullSyncDetail(comInfo,syncId);
                            },
                            info:function () {
                                return {loader:comInfo,syncId:syncId};
                            }
                        }
                    });
                    modalInstance.result.then(function (res) {
                        $ctrl.isRun = res;
                    });
                }
                //打开历史全同步界面
                $ctrl.getFullSyncHistory=function() {
                    fullSycService.getHistoryMaps($ctrl.currentLoader).then(function (list) {
                        if(list.length>0){
                            openHistory(list);
                        }else{
                            dipT.warning('没有全同步历史数据！');
                        }
                    });
                };
                function openHistory(list) {
                    $uibModal.open({
                        component: 'historyModal',
                        size:'lg',
                        resolve:{
                            info:function () {
                                return $ctrl.currentLoader;
                            },
                            maps:function () {
                                return list;
                            }
                        }
                    });
                }
            }]
        })
        .component('mainView',{
            templateUrl:'full_syc_view/loader.component.html',
            bindings:{
                tree: '<',
                maps:'<'
            },
            controller:['$rootScope','tipsService','$stateParams','$scope',function ($rootScope,dipT,$stateParams,$scope) {
                var $ctrl=this;
                $ctrl.$onInit=function () {
                    $ctrl.isExport=true;
                    $ctrl.isImport=false;
                    //导入导出配置信息
                    $ctrl.export={};
                    $ctrl.import={};
                    $ctrl.currentLoader=$stateParams || {};
                };
                //配置Export
                $ctrl.cfgExport=function(exp){
                    $ctrl.export=exp;
                    $scope.$emit("exportChange", exp);
                };
                //配置Import
                $ctrl.cfgImport=function(imp){
                    $scope.$emit("importChange", imp);
                    $ctrl.import=imp;
                };
            }]
        })
        .component('exportCom',{
            templateUrl:'full_syc_view/export.component.html',
            bindings:{
                tree: '<',
                loader:'=',
                onSave: '&'
            },
            controller:['$stateParams','tipsService','$uibModal','graphicService',function($stateParams,dipT,$uibModal,gSer) {
                var $ctrl=this;
                var setting = {
                    check: {
                        enable: true,
                        chkDisabledInherit: true
                    },
                    data: {
                        simpleData: {
                            enable: true
                        }
                    }
                };
                $ctrl.exportAll=true;//导出全部表默认选中
                $ctrl.schemasList=[];
                $ctrl.tables=[];
                $ctrl.selTables=[];
                $ctrl.exportSchemas=[];
                $ctrl.currentSechema='';

                $ctrl.charset=['ZHS16GBK','ASCII','GB18030','BIG5','GB2312','UTF-8','UTF-16BE','UTF-16LE','UTF8','UTF16','GBK',
                    'US7ASCII','ZHT16BIG5','ZHS16CGB231280','AL32UTF8','AL16UTF16','AL16UTF16LE','WE8MSWIN1252','CP1252','UTF-16',
                    'UTF-32','UTF-7','UTF-32BE','UTF-32LE','UTF7','UTF32','UTF16BE','UTF16LE','UTF32BE','UTF32LE','UCS-2','UCS-2LE','UCS-2BE','UCS2'];
                $ctrl.ckAll=false;
                $ctrl.exp={
                    exp_simu:1,//导出并发数
                    exp_tab_simu:1,//表内任务并发数
                    exp_dict_only:'0',
                    exp_string:false,//将数据导出为字符串
                    exp_scn:'',//指定SCN号
                    exp_nls_lang:'ZHS16GBK',
                    exp_use_etl:false,//使用etl规则
                    exp_create_table:true,//创建表结构
                    exp_create_index:true,//导出表索引及约束
                    exp_create_object:false,//导出其他对象
                    file_size:32//导出文件大小
                };
                //判断是否是Oracle数据库
                $ctrl.isOracle = false;
                $ctrl.isOracleToOther=false;
                $ctrl.isOther=false;//非oracle源端
                $ctrl.$onInit=function () {
                    //生成默认Tree
                    $.fn.zTree.init($("#fullSycTree"), setting, $ctrl.tree);
                    angular.forEach($ctrl.tree,function (v) {
                        var item={name:v.name,tables:[]};
                        angular.forEach(v.children,function (v1) {
                            item.tables.push({name:v1.name,checked:false,pname:v.name,clause:''});
                        });
                        $ctrl.schemasList.push(item);
                    });
                    var db=gSer.getChild($ctrl.loader.cid);
                    if(db && db.rtype==='database'){
                        if($ctrl.loader.st === 'oracle'){
                            if(db.type==='oracle'){
                                $ctrl.isOracle=true;
                            }
                            if(db.type==='mysql'){
                                $ctrl.isOracleToOther=true;
                                $ctrl.exp.exp_nls_lang='AL32UTF8';
                                $ctrl.exp.exp_string=true;
                            }
                            if(db.type==='sqlserver'){
                                $ctrl.isOracleToOther=true;
                                $ctrl.exp.exp_nls_lang='ZHS16GBK';
                                $ctrl.exp.exp_string=true;
                            }
                        }
                        if($ctrl.loader.st === 'mysql'){
                            $ctrl.isOther=true;
                            if(db.type==='mysql'){
                                $ctrl.exp.exp_nls_lang='AL32UTF8';
                            }
                            if(db.type==='oracle'){
                                $ctrl.exp.exp_nls_lang='AL32UTF8';
                                $ctrl.exp.exp_string=true;
                            }
                            if(db.type==='sqlserver'){
                                $ctrl.exp.exp_nls_lang='ZHS16GBK';
                                $ctrl.exp.exp_string=true;
                            }
                        }
                        if($ctrl.loader.st === 'sqlserver'){
                            $ctrl.isOther=true;
                            if(db.type==='mysql'){
                                $ctrl.exp.exp_nls_lang='AL32UTF8';
                                $ctrl.exp.exp_string=true;
                            }
                            if(db.type==='oracle'){
                                $ctrl.exp.exp_nls_lang='AL32UTF8';
                                $ctrl.exp.exp_string=true;
                            }
                            if(db.type==='sqlserver'){
                                $ctrl.exp.exp_nls_lang='ZHS16GBK';
                                $ctrl.exp.exp_string=true;
                            }
                        }
                        if($ctrl.loader.st === 'db2'){
                            if(db.type==='db2'){
                                $ctrl.isOther=true;
                                $ctrl.exp.exp_nls_lang='AL32UTF8';
                                $ctrl.exp.exp_string=true;
                            }
                        }
                    }
                };
                //选择schema
                $ctrl.schemaCheck=function (item,$event) {
                    var target=$event.target;
                    $(target).addClass('active').siblings().removeClass('active');
                    changeTables();
                    $ctrl.currentSechema=item.name;
                    var arr= angular.copy(item.tables);
                    handleData(arr,item.name);
                };
                //全选不全选
                $ctrl.checkAll=function () {
                    if($ctrl.ckAll){
                        angular.forEach($ctrl.selTables,function (v) {
                            v.checked=true;
                        });
                    }else{
                        angular.forEach($ctrl.selTables,function (v) {
                            v.checked=false;
                        });
                    }
                };
                //单选
                $ctrl.checkOne=function (item) {
                    var num=0;
                    if(item.checked){
                        angular.forEach($ctrl.selTables,function (v) {
                            if(v.checked){
                                num++
                            }
                        });
                        if(num===$ctrl.tables.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //编辑clause条件
                $ctrl.editClause=function (item) {
                    var modalIns = $uibModal.open({
                        templateUrl: 'exportRuleModal.html',
                        controller: ['$uibModalInstance','rule',function ($uibModalInstance,rule) {
                            var $ct =this;
                            $ct.rule=rule;
                            $ct.save = function () {
                                $uibModalInstance.close($ct.rule);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            rule:function () {
                                return item.clause;
                            }
                        }
                    });
                    modalIns.result.then(function (rule) {
                        angular.forEach($ctrl.tables,function (v) {
                            if(v.name===item.name){
                                v.clause=rule;
                            }
                        });
                    });
                };
                function changeTables() {
                    var flag=false,ckTables=[];
                    angular.forEach($ctrl.tables,function (v) {
                        if(v.checked){
                            ckTables.push(v);
                        }
                    });
                    angular.forEach($ctrl.exportSchemas,function (v) {
                        if(v.name===$ctrl.currentSechema){
                            v.object=ckTables;
                            flag=true;
                        }
                    });
                    if(!flag && ckTables.length>0){
                        $ctrl.exportSchemas.push({name:$ctrl.currentSechema,object:ckTables});
                    }
                }
                //保存配置信息
                $ctrl.saveExportCfg=function () {
                    changeTables();
                    //配置参数信息
                    var expInfo={
                        exp_source_tab:'0'
                    };
                    expInfo.exp_dict_only=''+$ctrl.exp.exp_dict_only;//切换导出方式
                    expInfo.exp_mode=$ctrl.exportAll?'1':'0';
                    expInfo.exp_schema=$ctrl.exportSchemas;
                    if(expInfo.exp_dict_only==='0'){
                        expInfo.file_size=$ctrl.exp.file_size>=0?''+$ctrl.exp.file_size:'0';
                        expInfo.exp_simu=$ctrl.exp.exp_simu>=0?''+$ctrl.exp.exp_simu:'0';//导出任务并发
                        expInfo.exp_tab_simu=$ctrl.exp.exp_tab_simu>=0?''+$ctrl.exp.exp_tab_simu:'0';//导出表任务并发
                        // expInfo.exp_dict_only=$ctrl.exp.exp_dict_only+'';//切换导出方式
                        expInfo.exp_string=$ctrl.exp.exp_string?'1':'0';//导出字符串
                        expInfo.exp_scn=$ctrl.exp.exp_scn;
                        expInfo.exp_nls_lang=''+$ctrl.exp.exp_nls_lang;//字符集
                        expInfo.exp_use_etl=$ctrl.exp.exp_use_etl?'1':'0';
                        expInfo.exp_create_table=$ctrl.exp.exp_create_table?'1':'0';
                        expInfo.exp_create_index=$ctrl.exp.exp_create_index?'1':'0';
                        expInfo.exp_create_object=$ctrl.exp.exp_create_object?'1':'0';//导出其他对象
                    }else{
                        expInfo.exp_simu=$ctrl.exp.exp_simu>=0?''+$ctrl.exp.exp_simu:'0';//导出任务并发
                        expInfo.exp_create_object=$ctrl.exp.exp_create_object?'1':'0';//导出其他对象
                        expInfo.exp_use_etl=$ctrl.exp.exp_use_etl?'1':'0';
                    }
                    $ctrl.onSave({exp:expInfo});
                };
                //数据处理
                function handleData(data,uname) {
                    var arr=[];
                    $ctrl.tables=[];
                    angular.forEach($ctrl.exportSchemas,function (v) {
                        if(v.name===uname){
                            angular.forEach(v.object,function (v1) {
                                arr.push(v1.name);
                            });
                        }
                    });
                    angular.forEach(data,function (v) {
                        var item ={checked:false,name:v.name,status:v.status,clause:v.clause};
                        item.checked = $.inArray(v.name, arr) >= 0;
                        $ctrl.tables.push(item);
                    });
                }
            }]
        })
        .component('importCom',{
            templateUrl:'full_syc_view/import.component.html',
            bindings:{
                maps:'<',
                loader:'=',
                onSave:'&'
            },
            controller:['$stateParams','tipsService','$uibModal','fullSycService','graphicService',function($stateParams,dipT,$uibModal,fullSycService,gSer) {
                var $ctrl=this;
                $ctrl.fromOldData=false;//从已有文件导入 默认false
                $ctrl.selectSync={};
                $ctrl.schemasList=[];

                $ctrl.tables=[];
                $ctrl.selTables=[];
                $ctrl.importSchemas=[];
                $ctrl.currentSechema='';

                $ctrl.isErrorOnly=false;
                $ctrl.isError='';
                $ctrl.charset=['ZHS16GBK','ASCII','GB18030','BIG5','GB2312','UTF-8','UTF-16BE','UTF-16LE','UTF8','UTF16','GBK',
                    'US7ASCII','ZHT16BIG5','ZHS16CGB231280','AL32UTF8','AL16UTF16','AL16UTF16LE','WE8MSWIN1252','CP1252','UTF-16',
                    'UTF-32','UTF-7','UTF-32BE','UTF-32LE','UTF7','UTF32','UTF16BE','UTF16LE','UTF32BE','UTF32LE','UCS-2','UCS-2LE','UCS-2BE','UCS2'];
                $ctrl.ckAll=false;
                $ctrl.loading=false;
                $ctrl.loading1=false;
                $ctrl.tableSpaces=[];//表空间映射
                $ctrl.imp={
                    imp_simu:1,//任务并发数
                    imp_tab_simu:1,//表内任务并发数
                    imp_dict_only:'0',//选择导入方式
                    imp_write_log:false,//导入时记录redo日志
                    imp_rebuild_tab:true,//重建目标表
                    imp_nls_lang:'ZHS16GBK',//字符集
                    imp_truncate_tab:true,//清空目标表
                    imp_rebuild_ind:true,//重建索引
                    imp_rebuild_object:false,//重建对象
                    imp_backup_file:false,//保留数据文件
                    imp_ora_op:'1',//是否DP形式
                    imp_use_tabs_map:false//表空间映射
                };
                //判断是否是Oracle数据库
                $ctrl.isOracle = false;
                $ctrl.isOther=false;
                $ctrl.$onInit=function () {
                    $ctrl.comInfo=$ctrl.loader;
                    if($ctrl.maps && angular.isArray($ctrl.maps)){
                        if($ctrl.maps.length>0){
                            $ctrl.selectSync=$ctrl.maps[0];
                            fullSycService.query_map_exp_schema($ctrl.selectSync).then(function (list) {
                                $ctrl.schemasList=list;
                            });
                        }
                    }
                    var db=gSer.getChild($ctrl.loader.cid);
                    if(db && db.rtype==='database'){
                        if($ctrl.loader.st === 'oracle'){
                            if(db.type==='oracle'){
                                $ctrl.isOracle=true;
                            }
                            if(db.type==='mysql'){
                                $ctrl.isOther=true;
                                $ctrl.imp.imp_nls_lang='AL32UTF8';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                            if(db.type==='sqlserver'){
                                $ctrl.isOther=true;
                                $ctrl.imp.imp_nls_lang='ZHS16GBK';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                        }
                        if($ctrl.loader.st === 'mysql'){
                            $ctrl.isOther=true;
                            if(db.type==='mysql'){
                                $ctrl.imp.imp_nls_lang='AL32UTF8';
                            }
                            if(db.type==='oracle'){
                                $ctrl.imp.imp_nls_lang='AL32UTF8';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                            if(db.type==='sqlserver'){
                                $ctrl.imp.imp_nls_lang='ZHS16GBK';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                        }
                        if($ctrl.loader.st === 'sqlserver'){
                            $ctrl.isOther=true;
                            if(db.type==='mysql'){
                                $ctrl.imp.imp_nls_lang='AL32UTF8';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                            if(db.type==='oracle'){
                                $ctrl.imp.imp_nls_lang='AL32UTF8';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                            if(db.type==='sqlserver'){
                                $ctrl.imp.imp_nls_lang='ZHS16GBK';
                            }
                        }
                        if($ctrl.loader.st === 'db2'){
                            if(db.type==='db2'){
                                $ctrl.isOther=true;
                                $ctrl.imp.imp_nls_lang='AL32UTF8';
                                $ctrl.imp.imp_rebuild_tab=false;
                                $ctrl.imp.imp_rebuild_ind=false;
                                $ctrl.imp.imp_truncate_tab=false;
                            }
                        }
                    }
                };
                //全选不全选
                $ctrl.checkAll=function () {
                    angular.forEach($ctrl.selTables,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.checkOne=function (item) {
                    var num=0;
                    if(item.checked){
                        angular.forEach($ctrl.selTables,function (v) {
                            if(v.checked){
                                num++
                            }
                        });
                        if(num===$ctrl.tables.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //选择schema
                $ctrl.schemaCheck=function (item,$event) {
                    $ctrl.ckAll=false;
                    var target=$event.target;
                    $(target).addClass('active').siblings().removeClass('active');
                    changeTables();
                    $ctrl.currentSechema=item.name;
                    $ctrl.loading=true;
                    $ctrl.tables=[];
                    fullSycService.query_map_exp_table($ctrl.selectSync,item.name).then(function (tables) {
                        handleData(tables,item.name);
                    }).finally(function () {
                        $ctrl.loading=false;
                    });
                };
                //切换只显示错误
                $ctrl.errorOnlyChange=function () {
                    $ctrl.isError=$ctrl.isErrorOnly?'error':'';
                };
                //切换sync
                $ctrl.changeSync=function () {
                    $ctrl.loading1=true;
                    $ctrl.schemasList=[];
                    $ctrl.tables=[];
                    $ctrl.selTables=[];
                    $ctrl.importSchemas=[];
                    $ctrl.currentSechema='';
                    fullSycService.query_map_exp_schema($ctrl.selectSync).then(function (list) {
                        $ctrl.schemasList=list;
                    }).finally(function () {
                        $ctrl.loading1=false;
                    });
                };
                //保存Import信息
                $ctrl.saveImport=function () {
                    changeTables();
                    var importInfo={};
                    if($ctrl.fromOldData){
                        importInfo.imp_mmap_id=$ctrl.selectSync.sync_id?$ctrl.selectSync.sync_id+'':'';
                        importInfo.imp_mode='0';
                    }else{
                        importInfo.imp_mmap_id='';
                        importInfo.imp_mode='1';
                    }
                    importInfo.imp_dict_only=$ctrl.imp.imp_dict_only+'';
                    importInfo.imp_schema=$ctrl.importSchemas;
                    importInfo.imp_ora_op=$ctrl.imp.imp_ora_op+'';
                    importInfo.imp_write_log=$ctrl.imp.imp_write_log?'1':'0';
                    importInfo.table_space=$ctrl.tableSpaces;
                    if(importInfo.imp_dict_only==='0'){
                        importInfo.imp_simu=$ctrl.imp.imp_simu>=0?$ctrl.imp.imp_simu+'':'0';
                        importInfo.imp_tab_simu=$ctrl.imp.imp_tab_simu>=0?$ctrl.imp.imp_tab_simu+'':'0';
                        importInfo.imp_rebuild_tab=$ctrl.imp.imp_rebuild_tab?'1':'0';
                        importInfo.imp_nls_lang=$ctrl.imp.imp_nls_lang+'';
                        importInfo.imp_truncate_tab=$ctrl.imp.imp_truncate_tab?'1':'0';
                        importInfo.imp_rebuild_ind=$ctrl.imp.imp_rebuild_ind?'1':'0';
                        importInfo.imp_rebuild_object=$ctrl.imp.imp_rebuild_object?'1':'0';
                        importInfo.imp_backup_file=$ctrl.imp.imp_backup_file?'1':'0';
                        importInfo.imp_use_tabs_map=$ctrl.imp.imp_use_tabs_map?'1':'0';
                    }else{
                        importInfo.imp_simu=$ctrl.imp.imp_simu>=0?$ctrl.imp.imp_simu+'':'0';
                        importInfo.imp_rebuild_tab=$ctrl.imp.imp_rebuild_tab?'1':'0';
                        importInfo.imp_truncate_tab=$ctrl.imp.imp_truncate_tab?'1':'0';
                        importInfo.imp_rebuild_ind=$ctrl.imp.imp_rebuild_ind?'1':'0';
                        importInfo.imp_rebuild_object=$ctrl.imp.imp_rebuild_object?'1':'0';
                        importInfo.imp_backup_file=$ctrl.imp.imp_backup_file?'1':'0';
                        importInfo.imp_use_tabs_map=$ctrl.imp.imp_use_tabs_map?'1':'0';
                    }
                    $ctrl.onSave({imp:importInfo});
                };
                //编辑表空间映射
                $ctrl.editTableSpace=function () {
                    var modalIns = $uibModal.open({
                        templateUrl: 'tableSpaceModal.html',
                        controller: ['$uibModalInstance','tables',function ($uibModalInstance,tables) {
                            var $ct =this;
                            $ct.tableSpaces=tables;
                            $ct.save = function () {
                                $uibModalInstance.close($ct.tableSpaces);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            tables:function () {
                                return fullSycService.queryTabSpace($ctrl.loader);
                            }
                        }
                    });
                    modalIns.result.then(function (tables) {
                        $ctrl.tableSpaces=tables;
                    });
                };
                function changeTables() {
                    var flag=false,ckTables=[];
                    angular.forEach($ctrl.tables,function (v) {
                        if(v.checked){
                            ckTables.push(v);
                        }
                    });
                    angular.forEach($ctrl.importSchemas,function (v) {
                        if(v.name===$ctrl.currentSechema){
                            v.object=ckTables;
                            flag=true;
                        }
                    });
                    if(!flag && ckTables.length>0){
                        $ctrl.importSchemas.push({name:$ctrl.currentSechema,object:ckTables});
                    }
                }
                //数据处理
                function handleData(data,uname) {
                    var arr=[];
                    angular.forEach($ctrl.importSchemas,function (v) {
                        if(v.name===uname){
                            angular.forEach(v.object,function (v1) {
                                arr.push(v1.name);
                            });
                        }
                    });
                    angular.forEach(data,function (v) {
                        var item ={checked:false,name:v.name,status:v.status};
                        item.checked = $.inArray(v.name, arr) >= 0;
                        $ctrl.tables.push(item);
                    });
                }
            }]
        })
        .component('fullSyncModal',{
            templateUrl:'full_syc_view/full_sync.component.html',
            bindings:{
                resolve:'<',
                dismiss:'&',
                close:'&'
            },
            controller:['fullSycService','tipsService','$interval','$scope','$rootScope',function(fullSycService,dipT,$interval,$scope,$rootScope) {
                var $ctrl=this;
                var stopTimer;
                $ctrl.export={};
                $ctrl.import={};
                $ctrl.isImportShow=false;
                $ctrl.errors=[];
                $ctrl.loading1=false;
                $ctrl.loading2=false;
                $ctrl.stopFlag=false;
                $ctrl.isRun=true;
                $ctrl.$onInit=function () {
                    $ctrl.details=$ctrl.resolve.detail || [];
                    if($ctrl.resolve.summary){
                        $ctrl.export= $ctrl.resolve.summary.export;
                        $ctrl.import= $ctrl.resolve.summary.import;
                        if($ctrl.import && !$.isEmptyObject($ctrl.import)){
                            $ctrl.isImportShow=true;
                        }
                    }
                    $ctrl.info=$ctrl.resolve.info || {};
                    stopTimer =$interval(function () {
                        refreshData();
                    },5000);
                    $scope.$on('$destroy', function() {
                        $rootScope.$emit('fullSyncIsRun', $ctrl.isRun);
                        clearInterval(stopTimer);
                    });
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.close({$value:$ctrl.isRun});
                };
                //停止全同步
                $ctrl.stopFullSync=function () {
                    $ctrl.stopFlag=true;
                    fullSycService.stopFullSync($ctrl.info.loader).then(function (res) {
                        if(res){
                            dipT.success('全同步操作停止成功！');//全同步操作停止成功！
                            $ctrl.isRun=false;
                            $ctrl.close({$value:$ctrl.isRun});
                        }else{
                            dipT.warning('全同步操作停止失败！');//全同步操作停止失败！
                        }
                    }).finally(function () {
                        $ctrl.stopFlag=false;
                    });
                };
                //获取error信息
                $ctrl.getSyncErrors=function () {
                    $ctrl.loading1=true;
                    $ctrl.errors=[];
                    fullSycService.querySyncError($ctrl.info.loader,$ctrl.info.syncId).then(function (list) {
                        $ctrl.errors=list;
                    }).finally(function () {
                        $ctrl.loading1=false;
                    });
                };
                function clearInterval(){
                    if (angular.isDefined(stopTimer)) {
                        $interval.cancel(stopTimer);
                        stopTimer=undefined;
                        $ctrl.stopFlag=true;
                    }
                    $ctrl.isRun=false;
                }
                function refreshData() {
                    fullSycService.refreshFullSyncFilters($ctrl.info.loader).then(function (res) {
                        if(res.isFinish){
                            clearInterval();
                            fullSycService.queryFullSyncSummary($ctrl.info.loader,$ctrl.info.syncId).then(function (summary) {
                                $ctrl.export= summary.export;
                                $ctrl.import= summary.import;
                                if($ctrl.import && !$.isEmptyObject($ctrl.import)){
                                    $ctrl.isImportShow=true;
                                }
                            });
                            fullSycService.queryFullSyncDetail($ctrl.info.loader,$ctrl.info.syncId).then(function (details) {
                                $ctrl.details=details;
                            });
                        }else{
                            $ctrl.export= res.export;
                            $ctrl.import= res.import;
                            if($ctrl.import && !$.isEmptyObject($ctrl.import)){
                                $ctrl.isImportShow=true;
                            }
                            $ctrl.details=res.details;
                            if($ctrl.export.status==='0' && $ctrl.import.status==='0'){
                                clearInterval();
                            }
                            $ctrl.isRun=true;
                        }
                    });
                }
            }]
        })
        .component('historyModal',{
            templateUrl:'full_syc_view/history.component.html',
            bindings:{
                resolve:'<',
                dismiss:'&',
                close:'&'
            },
            controller:['$uibModal','fullSycService',function($uibModal,fullSycService) {
                var $ctrl=this;
                $ctrl.export={};//导出信息
                $ctrl.import={};//导入信息
                $ctrl.details=[];//详情
                $ctrl.loading1=false;
                $ctrl.loading2=false;
                $ctrl.isImportShow=false;
                $ctrl.currentActive=0;
                $ctrl.$onInit=function () {
                    $ctrl.selectSync={};
                    $ctrl.maps=$ctrl.resolve.maps || [];
                    $ctrl.info=$ctrl.resolve.info || {};
                    if($ctrl.maps && angular.isArray($ctrl.maps)){
                        $ctrl.selectSync=$ctrl.maps[0];
                    }
                    createData();
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //继续该批次导入
                $ctrl.reTryFullSync=function () {
                    BootstrapDialog.confirm({
                        title: 'Dip 提示',//Dip 提示
                        message:'确定要执行该批次的数据导入吗？',//确定要执行该批次的数据导入吗？
                        type: BootstrapDialog.TYPE_WARNING,
                        btnCancelLabel:'取消',//取消
                        btnOKLabel:'确认',//确认
                        btnOKClass: 'btn-warning',
                        callback: function(result) {
                            if(result){
                                startFullSync($ctrl.info,$ctrl.selectSync.sync_id,1);
                            }
                        }
                    });
                };
                //切换map列表
                $ctrl.changeSyncId=function () {
                    $ctrl.currentActive=0;
                    $ctrl.errors=[];
                    createData();
                };
                //获取error信息
                $ctrl.getSyncErrors=function () {
                    $ctrl.loading1=true;
                    $ctrl.errors=[];
                    fullSycService.querySyncError($ctrl.info,$ctrl.selectSync.sync_id).then(function (list) {
                        $ctrl.errors=list;
                    }).finally(function () {
                        $ctrl.loading1=false;
                    });
                };
                //开始全同步
                function startFullSync(comInfo,syncId,flag) {
                    var dialog = new BootstrapDialog({
                        title:'Full Sync Info',
                        type:'type-warning',
                        message: function(){
                            return '<h2 class="text-warning">全同步操作启动中......</h2>';//全同步操作启动中......
                        },
                        closable: true
                    });
                    dialog.open();
                    var fullSync=fullSycService.startFullSync(comInfo,syncId,flag);
                    fullSync.then(function (res) {
                        dialog.onhide=function(){
                            BootstrapDialog.confirm('全同步操作启动中，确认要停止全同步吗？', function(result){//全同步操作启动中，确认要停止全同步吗？
                                if(result){
                                    fullSync.abort();
                                    dialog.close();
                                }
                            });
                        };
                        if (res) {
                            dialog.setType('type-success');
                            dialog.getModalBody().html('<h2 class="text-success">恭喜！全同步已经启动！<i class="green glyphicon glyphicon-ok"></i></h2>');//恭喜！全同步已经启动！
                            openFullModal(comInfo,syncId);
                        }else{
                            dialog.setType('type-danger');
                            dialog.getModalBody().html('<h2 class="text-error">抱歉！全同步启动失败！<i class="red glyphicon glyphicon-remove"></i></h2>');//抱歉！全同步启动失败！
                        }
                        setTimeout(function () {
                            dialog.close();
                        },500);
                    });
                }
                //打开全同步界面
                function openFullModal(comInfo,syncId) {
                    $ctrl.dismiss({$value: 'cancel'});
                    $uibModal.open({
                        component: 'fullSyncModal',
                        size:'lg',
                        resolve:{
                            summary:function () {
                                return fullSycService.queryFullSyncSummary(comInfo,syncId);
                            },
                            detail:function () {
                                return fullSycService.queryFullSyncDetail(comInfo,syncId);
                            },
                            info:function () {
                                return {loader:comInfo,syncId:syncId};
                            }
                        }
                    });
                }
                function createData() {
                    var comInfo={gn:$ctrl.selectSync.group,cn:$ctrl.selectSync.comp_id};
                    fullSycService.queryFullSyncSummary(comInfo,$ctrl.selectSync.sync_id).then(function (res) {
                        $ctrl.export= res.export;
                        $ctrl.import= res.import;
                        if($ctrl.import && !$.isEmptyObject($ctrl.import)){
                            $ctrl.isImportShow=true;
                        }
                    });
                    $ctrl.loading2=true;
                    $ctrl.details=[];
                    fullSycService.queryFullSyncDetail(comInfo,$ctrl.selectSync.sync_id).then(function (list) {
                        $ctrl.details=list;
                    }).finally(function () {
                        $ctrl.loading2=false;
                    });
                }
            }]
        })
        .directive("glNum", function(){
            return {
                restrict: 'A',
                link: function (scope, element) {
                    element.on('keyup', function () {
                        var name = this.value;
                        if (!name) {
                            name = '0';
                        } else {
                            name = name.toString();
                            name = name.replace(/[^0-9]*/g, '');
                            name = name.replace(/^0(.+)/, '$1');
                            if (name === '') {
                                name = '0';

                            }
                        }
                        this.value = parseInt(name);
                    });
                }
             }
        });
})();