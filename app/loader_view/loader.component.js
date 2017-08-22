/**
 * Created by cagej on 2017/4/25.
 */
(function () {
    'use strict';
    angular.module("myApp.loaderComponent", ['rx'])
        .component('loaderStatus',{
            templateUrl:'loader_view/status.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$filter','$state','ldService','$timeout',function ($stateParams,$filter,$state,ldService,$timeout) {
                var $ctrl=this;
                var comInfo = $stateParams;
                //树状列表初始化参数
                var dbTree ={
                    zTree_inc:null,
                    zTree_inc_nodes:[],
                    zTree_exc:null,
                    zTree_exc_nodes:[],
                    zTree_all_nodes:[],
                    zTree_all:null,
                    setting: {
                        showLine : true,
                        check :{enable:true},
                        edit: {enable: true}
                    },
                    setting1: {
                        showLine : true,
                        check :{enable:false},
                        edit: {enable: false}
                    }
                };
                $ctrl.property={};
                $ctrl.data={
                    loaderName:'',
                    superConfig:false,
                    include_empty:true,//包含条件为空时显示
                    exclude_empty:true,//排除条件为空时显示
                    include_panel:true,
                    exclude_panel:false,
                    dbType:'oracle',
                    isCom:true
                };
                //参数说明
                $ctrl.params ={
                    loaderName:false,
                    tg_tag:false,
                    cw_clfs: false,
                    zd_xfsb: false,
                    wz_cwcl: false,
                    dt_zx: false,
                    jy_syzd: false,
                    sj_nchar: false,
                    hl_ddl:false,
                    pltj:false,
                    client:false,
                    c_nchar:false,
                    clob:false,
                    sj_nclob:false,
                    ysj_zfj:false,
                    sz_tag:false,
                    hl_ddsj:false,
                    hl_wxg_zd:false,
                    lodId:false,
                    zdkx_sj:false,
                    sqlm:false
                };
                $ctrl.real={
                    com_id:'',
                    zdcl:$filter('translate')('Ld_zdcl'),
                    rgcl:$filter('translate')('Ld_rgcl'),
                    hl:$filter('translate')('HL'),
                    bhl:$filter('translate')('BHL'),
                    jy:$filter('translate')('JY'),
                    bjy:$filter('translate')('BJY')
                };
                $ctrl.$onInit =function () {
                     //判断返回配置项
                    if($ctrl.dl && angular.isObject($ctrl.dl)){
                        var tree = ldService.createApplyTreeList($ctrl.dl);
                        if(tree.include　&& tree.include.length>0){
                            $ctrl.data.include_empty =false;
                            dbTree.zTree_inc_nodes = tree.include;
                        }
                        if(tree.exclude && tree.exclude.length>0){
                            $ctrl.data.exclude_empty =false;
                            dbTree.zTree_exc_nodes = tree.exclude;
                        }
                        var obj =$ctrl.dl.parameter;
                        $ctrl.property.tag_skip=obj.tag_skip || 'no';
                        $ctrl.property.error_auto=obj.error_auto || 'yes';
                        $ctrl.property.user_handle_name=obj.user_handle_name || 'skip_recode';
                        $ctrl.property.skip_record = 'yes';
                        $ctrl.property.exclude_table = 'no';
                        $ctrl.property.unknown_error=obj.unknown_error || 'skip';
                        $ctrl.property.execute_one=obj.execute_one || 'no';
                        $ctrl.property.ddl_skip=obj.ddl_skip || 'no';
                        $ctrl.property.batch_commit=obj.batch_commit || 'yes';
                        $ctrl.property.source_metadata_charset=obj.source_metadata_charset || '';
                        $ctrl.property.set_tag=obj.set_tag || 'no';
                        $ctrl.property.dip_nls_lang=obj.dip_nls_lang || '';
                        $ctrl.property.dip_nchar_charset=obj.dip_nchar_charset || '';
                        $ctrl.property.lob_skip=obj.lob_skip || 'no';
                        $ctrl.property.idle_connect_seconds=parseInt(obj.idle_connect_seconds)?parseInt(obj.idle_connect_seconds):0;
                        $ctrl.property.not_changeskip=obj.not_changeskip || 'no';
                        $ctrl.property.check_old_image=obj.check_old_image || 'yes';
                        $ctrl.property.use_merge_sql=obj.use_merge_sql || 'no';
                        $ctrl.property.source_nchar_charset=obj.source_nchar_charset || '';
                        $ctrl.property.source_clob_charset=obj.source_clob_charset || '';
                        $ctrl.property.source_nclob_charset=obj.source_nclob_charset || '';
                        $ctrl.data.isCom = comInfo.st !== comInfo.tt;//判断是否为com loader
                        if(comInfo.st==='oracle'){
                            $ctrl.data.dbType='oracle';
                        }else if(comInfo.st==='sqlserver'){
                            $ctrl.data.dbType='sqlserver';
                        }else if(comInfo.st==='mysql'){
                            $ctrl.data.dbType='mysql';
                        }else{
                            $ctrl.data.dbType='mysql';
                        }
                        if(!$ctrl.property.restart){
                            $ctrl.property.restart = 'no';
                        }
                        if(!$ctrl.property.not_changeskip){
                            $ctrl.property.not_changeskip = 'yes';
                        }
                        if(comInfo.cn !== ''){
                            $ctrl.data.loaderName = comInfo.cn!=='unnamed'?comInfo.cn:''
                        }else{
                            $ctrl.data.loaderName='';
                        }
                        if(comInfo.cid !=='undefined' && comInfo.cid){
                            $ctrl.real.com_id=comInfo.cid;
                        }
                        $timeout(function () {
                            dbTree.zTree_exc = $.fn.zTree.init($('#loaderExcTreeId'), dbTree.setting1, dbTree.zTree_exc_nodes);//生成包含表树
                            dbTree.zTree_inc = $.fn.zTree.init($('#loaderIncTreeId'), dbTree.setting1,dbTree.zTree_inc_nodes);//生成包含表树
                        });
                    }else{
                        $state.go('/');
                    }
                };
            }]
        })
        .component('loaderProperty',{
            templateUrl:'loader_view/property.component.html',
            bindings:{
                dl: '<'
            },
            controller:['$stateParams','$state','tipsService','$filter','graphicService','ldService','$timeout','$scope', 'rx', '$uibModal',function ($stateParams,$state,dipT,$filter,gSer,ldService,$timeout,$scope,rx, $uibModal) {
                var $ctrl=this;
                var comInfo = $stateParams;
                $ctrl.number =0;
                $ctrl.data = {
                    superConfig:false,//关闭高级选项
                    include_panel:true,
                    exclude_panel:false,
                    include_empty:true,//包含条件为空时显示
                    exclude_empty:true,//排除条件为空时显示
                    inc_edit:false,//包含条件编辑状态
                    inc_edit_txt:$filter('translate')('EDIT'),//编辑
                    exc_edit:false,//排除条件编辑状态
                    exc_edit_txt:$filter('translate')('EDIT'),
                    loaderName:'',
                    skip_record:'yes',
                    exclude_table:'no',
                    inc_qr_txt:$filter('translate')('OK'),
                    exc_qr_txt:$filter('translate')('OK'),
                    dbType:'oracle',
                    isCom:true
                };
                //高级选项参数说明
                $ctrl.params ={
                    loaderName:false,
                    lodTag:false,
                    lodWay:false,
                    lodRepair:false,
                    lodError:false,
                    loadSin:false,
                    lodUp:false,
                    lodDdl:false,
                    lodSub:false,
                    lodCliChar:false,
                    loadCliNchar:false,
                    lodDataNchar:false,
                    lodDataClob:false,
                    lodDataNclob:false,
                    lodEle:false,
                    loadIsTag:false,
                    loadIsIgn:false,
                    lodIsRes:false,
                    lodIsIgnNum:false,
                    zdkx_sj:false,
                    zdxfs:false,
                    wzcwd:false,
                    lodId:false,
                    hlwgx:false,
                    sqlm:false
                };
                $ctrl.property={
                    error_auto:'no',
                    set_tag:'no',
                    skip_record:'yes',
                    exclude_table:'no'
                };
                //高级选项—schema属性
                $ctrl.superCon = {
                    oldSchema:'',
                    newSchema:'',
                    schemaList:[],
                    userType:'',
                    userSearch:'',
                    userCkAll:false,
                    userList:[],//二级列表
                    schemaPanel:true,
                    loading:false,//加载中
                    pageCkAll: false,
                    selList:[]
                };
                $ctrl.superConExc = {
                    oldSchema:'',
                    newSchema:'',
                    schemaList:[],
                    userType:'',
                    userSearch:'',
                    userCkAll:false,
                    userList:[],//二级列表
                    schemaPanel:true,
                    loading:false,//加载中
                    pageCkAll: false,
                    selList:[]
                };
                //树状列表初始化参数
                var dbTree ={
                    zTree_inc:null,
                    zTree_inc_nodes:[],
                    zTree_exc:null,
                    zTree_exc_nodes:[],
                    zTree_all_nodes:[],
                    zTree_all:null,
                    setting: {
                        showLine : true,
                        check :{enable:true},
                        edit: {enable: true}
                    },
                    setting1: {
                        showLine : true,
                        check :{enable:false},
                        edit: {enable: false}
                    }
                };
                $ctrl.real={
                    com_id:''
                };
                $ctrl.isSaving=false;//正在保存
                var saveTxt=$filter('translate')('SAVE');
                var savingTxt=$filter('translate')('SAVING');
                $ctrl.saveBtnTxt=saveTxt;
                $ctrl.totalDisplayed = 50;
                // $ctrl.totalExc = 300;
                $ctrl.pageInc = {
                    currentPage: 1,
                    pageSize: $ctrl.totalDisplayed,
                    totalPage: 1,
                    pDis: false,
                    nDis: false
                };
                $ctrl.pageExc = {
                    currentPage: 1,
                    pageSize: $ctrl.totalDisplayed,
                    totalPage: 1,
                    pDis: false,
                    nDis: false
                };
                var observe$ ;
                var initIncList = [];
                var initExcList = [];
                var initIncStrs = [];
                var initExcStrs = [];
                var subscribeT$ = rx.Observable.create(function (observe) {
                    observe$ = observe;
                });
                var trans={
                    edit:$filter('translate')('EDIT'),
                    close:$filter('translate')('CLOSE'),
                    ok:$filter('translate')('OK'),
                    clz:$filter('translate')('RUNNING')
                };
                $ctrl.$onInit=function () {
                    //判断返回配置项
                    if($ctrl.dl && angular.isObject($ctrl.dl)){
                        var tree = ldService.createApplyTreeList($ctrl.dl);
                        if(tree.include && tree.include.length>0){
                            $ctrl.data.include_empty =false;
                            dbTree.zTree_inc_nodes = tree.include;
                        }
                        if(tree.exclude && tree.exclude.length>0){
                            $ctrl.data.exclude_empty =false;
                            dbTree.zTree_exc_nodes = tree.exclude;
                        }
                        dbTree.zTree_all_nodes = tree.all;
                        $ctrl.dl.parameter.idle_connect_seconds = $ctrl.dl.parameter.idle_connect_seconds?0:$ctrl.dl.parameter.idle_connect_seconds;
                        var obj =$ctrl.dl.parameter;
                        $ctrl.property.tag_skip=obj.tag_skip || 'no';
                        $ctrl.property.error_auto=obj.error_auto || 'yes';
                        $ctrl.property.user_handle_name=obj.user_handle_name || 'skip_recode';
                        $ctrl.property.skip_record = 'yes';
                        $ctrl.property.exclude_table = 'no';
                        $ctrl.property.unknown_error=obj.unknown_error || 'skip';
                        $ctrl.property.execute_one=obj.execute_one || 'no';
                        $ctrl.property.ddl_skip=obj.ddl_skip || 'no';
                        $ctrl.property.batch_commit=obj.batch_commit || 'yes';
                        $ctrl.property.source_metadata_charset=obj.source_metadata_charset || '';
                        $ctrl.property.set_tag=obj.set_tag || 'no';
                        $ctrl.property.dip_nls_lang=obj.dip_nls_lang || '';
                        $ctrl.property.dip_nchar_charset=obj.dip_nchar_charset || '';
                        $ctrl.property.lob_skip=obj.lob_skip || 'no';
                        $ctrl.property.idle_connect_seconds=parseInt(obj.idle_connect_seconds)?parseInt(obj.idle_connect_seconds):0;
                        $ctrl.property.not_changeskip=obj.not_changeskip || 'no';
                        $ctrl.property.check_old_image=obj.check_old_image || 'yes';
                        $ctrl.property.use_merge_sql=obj.use_merge_sql || 'no';
                        $ctrl.property.source_nchar_charset=obj.source_nchar_charset || '';
                        $ctrl.property.source_clob_charset=obj.source_clob_charset || '';
                        $ctrl.property.source_nclob_charset=obj.source_nclob_charset || '';
                        $ctrl.data.isCom = comInfo.st !== comInfo.tt;//判断是否为com loader
                        if(comInfo.st==='oracle'){
                            $ctrl.data.dbType='oracle';
                        }else if(comInfo.st==='sqlserver'){
                            $ctrl.data.dbType='sqlserver';
                        }else if(comInfo.st==='mysql'){
                            $ctrl.data.dbType='mysql';
                        }else{
                            $ctrl.data.dbType=comInfo.st;
                        }
                        if(!$ctrl.property.restart){
                            $ctrl.property.restart = 'no';
                        }
                        if(!$ctrl.property.not_changeskip){
                            $ctrl.property.not_changeskip = 'yes';
                        }
                        if(!$ctrl.property.idle_connect_seconds){
                            $ctrl.property.idle_connect_seconds = 0;
                        }
                        if(comInfo.cn !== ''){
                            $ctrl.data.loaderName = comInfo.cn!=='unnamed'?comInfo.cn:''
                        }else{
                            $ctrl.data.loaderName='';
                        }
                        if(comInfo.cid !=='undefined' && comInfo.cid){
                            $ctrl.real.com_id=comInfo.cid;
                        }
                        $timeout(function () {
                            dbTree.zTree_exc = $.fn.zTree.init($('#loaderExcTreeId'), dbTree.setting1, dbTree.zTree_exc_nodes);//生成包含表树
                            dbTree.zTree_inc = $.fn.zTree.init($('#loaderIncTreeId'), dbTree.setting1,dbTree.zTree_inc_nodes);//生成包含表树
                        });
                    }else{
                        $state.go('/');
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
                var newIncTree=[],newExcTree=[],nowIncSchema=null,nowExcSchema=null,nowIncObject=null,nowExcObject=null;
                //导入、导出全选、不全选变量
                // var nowIncUser=null,nowExcUser=null;
                var createCustomCheckList = function (superCon,nowObject) {
                    var curNode = dbTree.zTree_all.getSelectedNodes()[0];
                    curNode=nowObject?nowObject:curNode;
                    if(!curNode || curNode.type !=='object_type'){
                        return;
                    }
                    var arr = [],num=0;
                    var pname =curNode.getParentNode().name;
                    var tLen=superCon.userList.length;
                    angular.forEach(superCon.userList,function (vs) {
                        if(vs.checked) {
                            vs.pname=pname;
                            vs.replace_object=vs.rname;
                            vs.isNew = vs.isNew ? vs.isNew : false;
                            arr.push(vs);
                            num++;
                        }
                    });
                    if(tLen===num){
                        curNode.select_all=true;
                    }else{
                        curNode.select_all=false;
                        if(curNode.manual){
                            curNode.manual.children=arr;
                        }
                    }
                };
                var createSchemaList = function (superCon,nowSchema) {
                    var curNode = dbTree.zTree_all.getSelectedNodes()[0];
                    curNode=curNode?curNode:nowSchema;
                    if(!curNode || curNode.type !=='user'){
                        return;
                    }
                    curNode.replace_schema=superCon.newSchema;
                };
                //编辑include列表
                $ctrl.editIncConfig = function () {
                    this.data.inc_edit=!this.data.inc_edit;
                    this.data.inc_edit_txt =this.data.inc_edit_txt===trans.edit?trans.close:trans.edit;//编辑 关闭 编辑
                    this.data.inc_qr_txt=this.data.inc_qr_txt===trans.clz?trans.ok:trans.clz;//处理中... 确认 处理中...
                    $('#incSearchBox').val('');
                    $ctrl.superCon.schemaPanel=false;
                    $ctrl.superCon.userList=[];
                    if(this.data.inc_edit){
                        var setting = {
                            showLine: true,
                            check: {enable: true},
                            callback: {
                                onClick: function (event, treeId, treeNode) {
                                    if(treeNode.type === 'user'){
                                        nowIncSchema=treeNode;
                                        show_schema_data(treeNode,$ctrl.superCon);
                                    }else if(treeNode.type === 'object_type'){
                                        nowIncObject=treeNode;
                                        $scope.$apply(function () {
                                            show_object_type_data(treeNode,comInfo,$ctrl.superCon,1);
                                        });
                                    }else if(treeNode.type === 'object'){
                                        show_object_data(treeNode);
                                    }
                                },
                                onCheck: function (event, treeId, treeNode) {},
                                beforeClick:function () {//选中切换之前获取选中的列表
                                    $scope.$apply(function () {
                                        createSchemaList($ctrl.superCon,nowIncSchema);
                                        createCustomCheckList($ctrl.superCon,nowIncObject);
                                    });
                                }
                            }
                        };
                        var ztree=[];
                        if(newIncTree.length>0){
                            ztree = initApplyFilterTree(dbTree.zTree_all_nodes,newIncTree);
                        }else{
                            ztree = initApplyFilterTree(dbTree.zTree_all_nodes,dbTree.zTree_inc_nodes);
                        }
                        dbTree.zTree_all = $.fn.zTree.init($('#loaderIncEditTreeId'), setting, ztree);//生成包含表树
                        var nodes = dbTree.zTree_all.getCheckedNodes(true);
                        angular.forEach(nodes,function (vv) {
                            if(vv.type === 'user' && vv.name===$ctrl.superCon.oldSchema){
                                nowIncSchema = vv;
                            }
                        });
                    }
                };
                //保存inc 筛选的列表
                $ctrl.saveFilterTree = function () {
                    $('#incSearchBox').val('');
                    $ctrl.superCon.userList = angular.copy(initIncList);
                    createCustomCheckList($ctrl.superCon,nowIncObject);
                    createSchemaList($ctrl.superCon,nowIncSchema);
                    var newTree =fetch_loader_current_condition(dbTree.zTree_all);
                    newIncTree=newTree;//为变化的tree赋值
                    this.data.inc_edit=false;
                    this.data.inc_edit_txt =trans.edit;//编辑
                    this.data.inc_qr_txt=trans.clz;//处理中...
                    $ctrl.superCon.schemaPanel=false;
                    if(newTree.length>0){
                        dbTree.zTree_inc_nodes=newTree;
                        dbTree.zTree_inc = $.fn.zTree.init($('#loaderIncTreeId'), dbTree.setting1, newTree);//生成包含表树
                        $ctrl.data.include_empty =false;
                    }else{
                        dbTree.zTree_inc_nodes=[];
                        dbTree.zTree_inc = $.fn.zTree.init($('#loaderIncTreeId'), dbTree.setting1, newTree);//生成包含表树
                        $ctrl.data.include_empty =true;
                    }
                };
                //取消编辑inc 筛选列表
                $ctrl.exitFilterTree = function () {
                    $('#incSearchBox').val('');
                    this.data.inc_edit=false;
                    $ctrl.superCon.schemaPanel=false;
                    this.data.inc_edit_txt =trans.edit;//编辑
                };
                //inc全选不全选
                $ctrl.ckAll = function () {
                    // $ctrl.superCon.pageCkAll = $ctrl.superCon.userCkAll;
                    angular.forEach(initIncList,function (v) {
                        v.checked = $ctrl.superCon.userCkAll;
                    });
                    $ctrl.superCon.userList = angular.copy(initIncList);
                    $('input:checkbox.loader-inc-box').each(function (index, elem) {
                        $(elem).prop('checked', $ctrl.superCon.userCkAll);
                    });
                };
                $ctrl.ckPageAll = function () {
                    var isChecked = $ctrl.superCon.pageCkAll;
                    angular.forEach($ctrl.superCon.selList,function (v) {
                        $ctrl.superCon.userList[v.id].checked = isChecked;
                        initIncList[v.id].checked = isChecked;
                    });
                    $('input:checkbox.loader-inc-box').each(function (index, elem) {
                        $(elem).prop('checked', isChecked);
                    });
                };
                $ctrl.changeIncItem = function (item, $event) {
                    observe$.next({ id: item.id, val: $event.target.value, type: 1});
                };
                $ctrl.changeIncCk = function (item, $event) {
                    var pp = $($event.target).prop('checked');
                    if(!pp) {
                        $ctrl.superCon.userCkAll = false;
                    }
                    if($ctrl.superCon.userList[item.id]) {
                        $ctrl.superCon.userList[item.id].checked = pp;
                        initIncList[item.id].checked = pp;
                    }
                };
                $ctrl.changeExcCk = function (item, $event) {
                    var pp = $($event.target).prop('checked');
                    if(!pp) {
                        $ctrl.superConExc.userCkAll = false;
                    }
                    if($ctrl.superConExc.userList[item.id]) {
                        $ctrl.superConExc.userList[item.id].checked = pp;
                        initExcList[item.id].checked = pp;
                    }
                };
                $ctrl.pageIncPre = function () {
                    if($ctrl.pageInc.currentPage <= 1 ) {
                       $ctrl.pageInc.pDis = true;
                       return ;
                    }
                    $ctrl.pageInc.nDis = false;
                    $ctrl.pageInc.pDis = false;
                    $ctrl.superCon.pageCkAll = false;
                    $ctrl.pageInc.currentPage= $ctrl.pageInc.currentPage - 1;
                };
                $ctrl.pageIncNext = function () {
                    if($ctrl.pageInc.currentPage > ($ctrl.superCon.userList.length/$ctrl.pageInc.pageSize)) {
                        $ctrl.pageInc.nDis = true;
                        return ;
                    }
                    $ctrl.pageInc.nDis = false;
                    $ctrl.pageInc.pDis = false;
                    $ctrl.superCon.pageCkAll = false;
                    $ctrl.pageInc.currentPage= $ctrl.pageInc.currentPage + 1;
                };
                $ctrl.changePage = function () {
                   var num = parseInt($ctrl.pageInc.currentPage);
                   if(num) {
                       if(num < 1) {
                           $ctrl.pageInc.currentPage = 1;
                       }
                       if(num > ($ctrl.superCon.userList.length/$ctrl.pageInc.pageSize)) {
                           $ctrl.pageInc.currentPage = Math.ceil($ctrl.superCon.userList.length/$ctrl.pageInc.pageSize);
                       }
                   } else{
                       $ctrl.pageInc.currentPage = 1;
                   }
                };
                //inc子项目选择，提升全选性能
                $ctrl.isIncCheck = function (item) {
                    var num=0;
                    if(item.checked){
                        angular.forEach($ctrl.superCon.selList,function (v) {
                            if(v.checked){
                                num++
                            }
                        });
                        if(num===$ctrl.superCon.userList.length){
                            $ctrl.superCon.userCkAll=true;
                        }
                    }else{
                        $ctrl.superCon.userCkAll=false;
                    }
                };
                //编辑exclude列表
                $ctrl.editExcConfig = function () {
                    this.data.exc_edit=!this.data.exc_edit;
                    this.data.exc_edit_txt =this.data.exc_edit_txt===trans.edit?trans.close:trans.edit;//编辑 关闭 编辑
                    this.data.exc_qr_txt=this.data.exc_qr_txt===trans.clz?trans.ok:trans.clz;//处理中... 确认 处理中...
                    $('#excSearchBox').val('');
                    $ctrl.superConExc.schemaPanel=false;
                    $ctrl.superConExc.userList=[];
                    if(this.data.exc_edit){
                        var setting = {
                            showLine: true,
                            check: {enable: true},
                            callback: {
                                onClick: function (event, treeId, treeNode) {
                                    if(treeNode.type === 'user'){
                                        nowExcSchema=treeNode;
                                        show_schema_data(treeNode,$ctrl.superConExc);
                                    }else if(treeNode.type === 'object_type'){
                                        nowExcObject=treeNode;
                                        $scope.$apply(function () {
                                            show_object_type_data(treeNode, comInfo, $ctrl.superConExc,2);
                                        });
                                    }else if(treeNode.type === 'object'){
                                        show_object_data(treeNode);
                                    }
                                },
                                onCheck: function (event, treeId, treeNode) {},
                                beforeClick:function () {//选中切换之前获取选中的列表
                                    $scope.$apply(function () {
                                        createSchemaList($ctrl.superConExc,nowExcSchema);
                                        createCustomCheckList($ctrl.superConExc,nowExcObject);
                                    });
                                }
                            }
                        };
                        var ztree=[];
                        if(newExcTree.length>0){
                            ztree = initApplyFilterTree(dbTree.zTree_all_nodes,newExcTree);
                        }else{
                            ztree = initApplyFilterTree(dbTree.zTree_all_nodes,dbTree.zTree_exc_nodes);
                        }
                        dbTree.zTree_all = $.fn.zTree.init($('#loaderExcEditTreeId'), setting, ztree);//生成排除表树
                        var nodes = dbTree.zTree_all.getCheckedNodes(true);
                        angular.forEach(nodes,function (vv) {
                            if(vv.type === 'user' && vv.name===$ctrl.superConExc.oldSchema){
                                nowExcSchema=vv;
                            }
                        });
                    }
                };

                //保存exc 筛选的列表
                $ctrl.saveFilterExcTree = function () {
                    $('#excSearchBox').val('');
                    $ctrl.superConExc.userList = angular.copy(initExcList);
                    createCustomCheckList($ctrl.superConExc,nowExcObject);
                    createSchemaList($ctrl.superConExc,nowExcSchema);
                    var newTree =fetch_loader_current_condition(dbTree.zTree_all);
                    newExcTree=newTree;//为变化的tree赋值
                    this.data.exc_edit=false;
                    this.data.exc_edit_txt =trans.edit;//编辑
                    this.data.exc_qr_txt=trans.clz;//处理中...
                    $ctrl.superConExc.schemaPanel=false;
                    if(newTree.length>0){
                        dbTree.zTree_exc_nodes=newTree;
                        dbTree.zTree_exc = $.fn.zTree.init($('#loaderExcTreeId'), dbTree.setting1, newTree);//生成包含表树
                        $ctrl.data.exclude_empty =false;
                    }else{
                        dbTree.zTree_exc_nodes=[];
                        dbTree.zTree_exc = $.fn.zTree.init($('#loaderExcTreeId'), dbTree.setting1, newTree);//生成包含表树
                        $ctrl.data.exclude_empty =true;
                    }
                };
                //取消编辑exc 筛选列表
                $ctrl.exitFilterExcTree = function () {
                    $('#excSearchBox').val('');
                    $ctrl.superConExc.schemaPanel=true;
                    $ctrl.data.exc_edit=false;
                    $ctrl.data.exc_edit_txt =trans.edit;//编辑
                };
                //exc全选不全选
                $ctrl.ckExcAll = function () {
                    // angular.forEach($ctrl.superConExc.userList,function (v) {
                    //     v.checked = $ctrl.superConExc.userCkAll;
                    // });
                    angular.forEach(initExcList,function (v) {
                        v.checked  = $ctrl.superConExc.userCkAll;
                    });
                    $ctrl.superConExc.userList = angular.copy(initExcList);
                    $('input:checkbox.loader-exc-box').each(function (index, elem) {
                        $(elem).prop('checked', $ctrl.superConExc.userCkAll);
                    });
                };
                $ctrl.ckExcPageAll = function () {
                    angular.forEach($ctrl.superConExc.selList,function (v) {
                        if($ctrl.superConExc.userList[v.id]){
                            $ctrl.superConExc.userList[v.id].checked = $ctrl.superConExc.pageCkAll;
                            initExcList[v.id].checked = $ctrl.superConExc.pageCkAll;
                        }
                    });
                    $('input:checkbox.loader-exc-box').each(function (index, elem) {
                        $(elem).prop('checked', $ctrl.superConExc.pageCkAll);
                    });
                };
                $ctrl.pageExcPre = function () {
                    if($ctrl.pageExc.currentPage <= 1 ) {
                        $ctrl.pageExc.pDis = true;
                        return ;
                    }
                    $ctrl.pageExc.nDis = false;
                    $ctrl.pageExc.pDis = false;
                    $ctrl.superConExc.pageCkAll = false;
                    $ctrl.pageExc.currentPage = $ctrl.pageExc.currentPage - 1;
                };
                $ctrl.pageExcNext = function () {
                    if($ctrl.pageExc.currentPage > ($ctrl.superConExc.userList.length/$ctrl.pageExc.pageSize)) {
                        $ctrl.pageExc.nDis = true;
                        return ;
                    }
                    $ctrl.pageExc.nDis = false;
                    $ctrl.pageExc.pDis = false;
                    $ctrl.superConExc.pageCkAll = false;
                    $ctrl.pageExc.currentPage= $ctrl.pageExc.currentPage + 1;
                };
                $ctrl.changeExcPage = function () {
                    var num = parseInt($ctrl.pageExc.currentPage);
                    if(num) {
                        if(num < 1) {
                            $ctrl.pageExc.currentPage = 1;
                        }
                        if(num > ($ctrl.superConExc.userList.length/$ctrl.pageExc.pageSize)) {
                            $ctrl.pageExc.currentPage = Math.ceil($ctrl.superConExc.userList.length/$ctrl.pageExc.pageSize);
                        }
                    } else{
                        $ctrl.pageExc.currentPage = 1;
                    }
                };
                $ctrl.filterIncList = function ($event) {
                    observe$.next({ val: $event.target.value, type: 2});
                };
                $ctrl.filterExcList = function ($event) {
                    observe$.next({ val: $event.target.value, type: 3});
                };
                //exc子项目选择，提升全选性能
                $ctrl.isExcCheck = function (item) {
                    var num=0;
                    if(item.checked){
                        angular.forEach($ctrl.superConExc.selList,function (v) {
                            if(v.checked){
                                num++
                            }
                        });
                        if(num===$ctrl.superConExc.userList.length){
                            $ctrl.superConExc.userCkAll=true;
                        }
                    }else{
                        $ctrl.superConExc.userCkAll=false;
                    }
                };
                //展示Object列表
                $ctrl.showObjectIncInfo = function (item) {
                    createSchemaList($ctrl.superCon,nowIncSchema);
                    createCustomCheckList($ctrl.superCon,nowIncObject);
                    nowIncObject=item;
                    dbTree.zTree_all.selectNode(item);
                    show_object_type_data(item,comInfo,$ctrl.superCon,1);
                };
                $ctrl.showObjectExcInfo = function (item) {
                    createSchemaList($ctrl.superConExc,nowExcSchema);
                    createCustomCheckList($ctrl.superConExc,nowExcObject);
                    nowExcObject=item;
                    dbTree.zTree_all.selectNode(item);
                    show_object_type_data(item,comInfo,$ctrl.superConExc,2);
                };
                //保存LoaderInfo
                $ctrl.saveLoaderInfo = function () {
                    var filterArr = create_loader_filter_arr(dbTree);
                    var parameters = create_parameter_obj();
                    if($ctrl.data.loaderName ==='unnamed'){
                        dipT.error($filter('translate')('Ld_mcbnk'));//Loader server名称不能为unnamed！
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
                    ldService.saveLoaderInfo(comInfo,$ctrl.data.loaderName,filterArr,parameters).then(function (result) {
                        if(result.res){
                            // dipT.success($filter('translate')('Bccg'));//保存成功!
                            $ctrl.real.com_id=result.comId;
                            var node = $("#" + comInfo.id);
                            node.find(".dragPoint").text($ctrl.data.loaderName);
                            node.attr("name", $ctrl.data.loaderName);
                            node.attr("type", comInfo.st);
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

                $ctrl.saveLoaderProperty = function () {
                    if($ctrl.real.com_id===''){
                        dipT.error($filter('translate')('Cp_bcgj'));//保存高级选项前,请先完善当前组件配置信息！
                        return;
                    }
                    var params=create_parameter_obj();
                    ldService.saveLoaderSuperProperty(comInfo,params).then(function (res) {
                        if(res){
                            $state.go('/');
                        }
                    });
                };

                $ctrl.errHandler = function () {
                    if(this.property.error_auto ==='yes'){
                        $ctrl.autoXf();
                    }
                };
                $ctrl.autoXf = function () {
                    if (this.property.user_handle_name === 'skip_recode') {
                        this.data.skip_record = 'yes';
                        this.data.exclude_table = 'no';
                    }
                    if (this.property.user_handle_name === 'exclude_table') {
                        this.data.skip_record = 'no';
                        this.data.exclude_table = 'yes';
                    }
                };
                // 打开手动配置窗口
                $ctrl.openCustomPanel = function (num) {
                    if(num ===1) {
                        if($('#incSearchBox').val()) {
                            $('#incSearchBox').val('');
                            $ctrl.superCon.userList = angular.copy(initIncList);
                            $ctrl.pageInc.currentPage = 1;
                            $ctrl.pageInc.totalPage = Math.ceil(initIncList.length/$ctrl.totalDisplayed);
                        }
                    } else{
                        if($('#excSearchBox').val()){
                            $('#excSearchBox').val('');
                            $ctrl.superConExc.userList = angular.copy(initExcList);
                            $ctrl.pageExc.currentPage = 1;
                            $ctrl.pageExc.totalPage = Math.ceil(initExcList.length/$ctrl.totalDisplayed);
                        }
                    }
                    var modalIns= $uibModal.open({
                        component: 'customTableModal',
                        size:'md'
                    });
                    modalIns.result.then(function (row) {
                        var arr =[], newArr =[];
                        if(row && row.length > 0) {
                            if(num === 1) {
                              angular.forEach(row, function (v, i) {
                                  var rowIndex = initIncStrs.indexOf(v);
                                  if(rowIndex>=0 && initIncList[rowIndex]){
                                      // $ctrl.superCon.userList[rowIndex].checked = true;
                                      initIncList[rowIndex].checked = true;
                                  } else {
                                      arr.push({id: i, name: v, checked: true, rname: '', isNew: true});
                                  }
                              });
                              newArr = arr.concat(initIncList);
                              initIncStrs = [];
                              angular.forEach(newArr, function (v1, i) {
                                  v1.id = i;
                                  initIncStrs.push(v1.name);
                              });
                                $ctrl.superCon.userList = newArr;
                                initIncList = $.extend(newArr, []);
                                $ctrl.pageInc.currentPage = 1;
                                $ctrl.pageInc.totalPage = Math.ceil(newArr.length/$ctrl.totalDisplayed);
                            } else {
                                angular.forEach(row, function (v, i) {
                                    var rowIndex = initExcStrs.indexOf(v);
                                    if(rowIndex >= 0 && initExcList[rowIndex]){
                                        // $ctrl.superConExc.userList[rowIndex].checked = true;
                                        initExcList[rowIndex].checked = true;
                                    } else {
                                        arr.push({id: i, name: v, checked: true, rname: '', isNew: true});
                                    }
                                });
                                newArr = arr.concat(initExcList);
                                initExcStrs = [];
                                angular.forEach(newArr, function (v1, i) {
                                    v1.id = i;
                                    initExcStrs.push(v1.name);
                                });
                                $ctrl.superConExc.userList = newArr;
                                initExcList = $.extend(newArr, []);
                                $ctrl.pageExc.currentPage = 1;
                                $ctrl.pageExc.totalPage = Math.ceil(newArr.length/$ctrl.totalDisplayed);
                            }
                        }
                    });
                };
                function create_loader_filter_arr(dbTree) {
                    var c_filters=[],inc_filter={},exc_filter={};
                    var inc = dbTree.zTree_inc.getCheckedNodes(true);
                    inc_filter.filter_type='INCLUDE';
                    inc_filter.schema=[];
                    angular.forEach(inc, function (val) {
                        var obj={};
                        if (val.level === 0) {
                            if (val.replace_schema) {
                                obj.name=val.name;
                                obj.mapping_name=val.replace_schema;
                            } else {
                                obj.name=val.name;
                            }
                            obj.object_type=[];
                            var chd = val.children;
                            if(!chd) chd=[];
                            angular.forEach(chd, function (val1) {
                                if (val1.checked===true) {
                                    var ob={};
                                    ob.name=val1.name;
                                    ob.object=[];
                                    var chld = val1.children;
                                    if (!chld) chld = [];
                                    angular.forEach(chld, function (val2) {
                                        if (val2.checked === true) {
                                            var o={};
                                            if (val2.replace_object) {
                                                o.name=val2.name;
                                                o.mapping_name=val2.replace_object;
                                            } else {
                                                o.name=val2.name;
                                            }
                                            if(val2.isNew){
                                                o.isNew = val2.isNew;
                                            }
                                            ob.object.push(o);
                                        }
                                    });
                                    obj.object_type.push(ob);
                                }
                            });
                            inc_filter.schema.push(obj);
                        }
                    });
                    c_filters.push(inc_filter);
                    var exc = dbTree.zTree_exc.getCheckedNodes(true);
                    exc_filter.filter_type='EXCLUDE';
                    exc_filter.schema=[];
                    angular.forEach(exc, function (val) {
                        var e_obj={};
                        if (val.level === 0) {
                            if (val.replace_schema) {
                                e_obj.name=val.name;
                                e_obj.mapping_name=val.replace_schema;
                            } else {
                                e_obj.name=val.name;
                            }
                            var chd = val.children;
                            if (!chd) chd = [];
                            e_obj.object_type=[];
                            angular.forEach(chd, function (val1) {
                                if (val1.checked === true) {
                                    var c_ob={};
                                    c_ob.name=val1.name;
                                    c_ob.object=[];
                                    var chld = val1.children;
                                    if (!chld) chld = [];
                                    angular.forEach(chld, function (val2) {
                                        if (val2.checked === true) {
                                            var c_o={};
                                            if (val2.replace_object) {
                                                c_o.name=val2.name;
                                                c_o.mapping_name=val2.replace_object;
                                            }else {
                                                c_o.name=val2.name;
                                            }
                                            if(val2.isNew){
                                                c_o.isNew = val2.isNew;
                                            }
                                            c_ob.object.push(c_o);
                                        }
                                    });
                                    e_obj.object_type.push(c_ob);
                                }
                            });
                            exc_filter.schema.push(e_obj);
                        }
                    });
                    c_filters.push(exc_filter);
                    return c_filters;
                }
                //生成Parameter对象
                function create_parameter_obj() {
                    var params;
                    if($ctrl.data.isCom){
                        params={
                            tag_skip:$ctrl.property.tag_skip,
                            error_auto:$ctrl.property.error_auto,
                            check_old_image:$ctrl.property.check_old_image,
                            ddl_skip:$ctrl.property.ddl_skip,
                            batch_commit:$ctrl.property.batch_commit,
                            dip_nls_lang:$ctrl.property.dip_nls_lang,
                            exclude_table: $ctrl.data.exclude_table,
                            unknown_error:$ctrl.property.unknown_error,
                            execute_one:$ctrl.property.execute_one,
                            use_merge_sql:$ctrl.property.use_merge_sql
                        };
                    }else {
                        if (comInfo.st === 'oracle') {
                            params = {
                                tag_skip: $ctrl.property.tag_skip,
                                error_auto: $ctrl.property.error_auto,
                                //user_handle_name:$ctrl.property.user_handle_name,
                                check_old_image: $ctrl.property.check_old_image,
                                ddl_skip: $ctrl.property.ddl_skip,
                                batch_commit: $ctrl.property.batch_commit,
                                set_tag: $ctrl.property.set_tag,
                                lob_skip: $ctrl.property.lob_skip,
                                restart: $ctrl.property.restart,
                                source_nchar_charset: $ctrl.property.source_nchar_charset,
                                source_clob_charset: $ctrl.property.source_clob_charset,
                                source_nclob_charset: $ctrl.property.source_nclob_charset,
                                source_metadata_charset: $ctrl.property.source_metadata_charset,
                                dip_nchar_charset: $ctrl.property.dip_nchar_charset,
                                dip_nls_lang: $ctrl.property.dip_nls_lang,
                                //skip_record:$ctrl.data.skip_record,
                                exclude_table: $ctrl.data.exclude_table,
                                unknown_error: $ctrl.property.unknown_error,
                                execute_one: $ctrl.property.execute_one,
                                //not_changeskip:$ctrl.property.not_changeskip,
                                idle_connect_seconds: $ctrl.property.idle_connect_seconds,
                                use_merge_sql:$ctrl.property.use_merge_sql
                            };
                        } else if (comInfo.st === 'sqlserver') {
                            params = {
                                tag_skip: $ctrl.property.tag_skip,
                                error_auto: $ctrl.property.error_auto,
                                check_old_image: $ctrl.property.check_old_image,
                                ddl_skip: $ctrl.property.ddl_skip,
                                batch_commit: $ctrl.property.batch_commit,
                                set_tag: $ctrl.property.set_tag,
                                lob_skip: $ctrl.property.lob_skip,
                                exclude_table: $ctrl.data.exclude_table,
                                execute_one: $ctrl.property.execute_one,
                                not_changeskip: $ctrl.property.not_changeskip,
                                unknown_error: $ctrl.property.unknown_error,
                                skip_record:$ctrl.data.skip_record
                                // idle_connect_seconds: $ctrl.property.idle_connect_seconds
                            };
                        }else{
                            params = {
                                tag_skip: $ctrl.property.tag_skip,
                                error_auto: $ctrl.property.error_auto,
                                check_old_image: $ctrl.property.check_old_image,
                                ddl_skip: $ctrl.property.ddl_skip,
                                batch_commit: $ctrl.property.batch_commit,
                                dip_nls_lang: $ctrl.property.dip_nls_lang,
                                exclude_table: $ctrl.data.exclude_table,
                                unknown_error: $ctrl.property.unknown_error,
                                execute_one: $ctrl.property.execute_one,
                                use_merge_sql:$ctrl.property.use_merge_sql
                            };
                        }
                    }
                    return params;
                }

                //生成过滤的全部表的树
                function initApplyFilterTree(allobj,crdata) {
                    var zTreeNodes1 = [];
                    var src= '/img/ico/';
                    if(!allobj){
                        return;
                    }
                    angular.forEach(allobj,function (val,ii) {
                        var ch = null,obj = {};
                        angular.forEach(crdata,function (vl) {
                            if(val.name === vl.name){
                                ch = vl;
                            }
                        });
                        if (ch !== null) {
                            obj.name = ch.name;
                            if (ch.replace_schema) {
                                obj.icon = src+"replace_schema.png";
                            } else {
                                obj.icon = src+"schema.png";
                            }
                            obj.replace_schema = ch.replace_schema;
                            obj.checked = true;
                            obj.type = "user";
                            obj.open=ii===0;
                            obj.select_all = ch.children.length === 0;
                            obj.children = [];
                            //设置子节点的选中状态
                            var ary1 = obj.children;
                            if(!val.children){
                                return;
                            }
                            angular.forEach(val.children, function (cal) {
                                var ch1 = null,ob = {};
                                angular.forEach(ch.children, function (cl) {
                                    if (cal.name === cl.name) {
                                        ch1 = cl;
                                    }
                                });
                                ob.name = cal.name;
                                ob.type = cal.type;
                                ob.icon = src+"object_type.png";
                                if (ch1 !== null) {
                                    ob.checked = true;
                                    ob.manual = {"children": [], "isall": false};
                                    if(!ch1.children){
                                        return;
                                    }
                                    angular.forEach(ch1.children, function (ccl) {
                                        ob.manual.children[ob.manual.children.length] = {
                                            "name": ccl.name,
                                            "replace_object": ccl.replace_object,
                                            "checked": true,
                                            isNew: ccl.isNew? ccl.isNew : false
                                        };
                                    });
                                } else {
                                    ob.checked = false;
                                    ob.manual = {"children": [], "isall": true};
                                }
                                ob.children = [];
                                ary1[ary1.length] = ob;
                            });
                        }else {
                            obj.name = val.name;
                            obj.replace_schema = null;
                            obj.checked = false;
                            obj.type = "user";
                            obj.icon = src+"schema.png";
                            obj.children = [];
                            //子节点选中状态
                            var ary2 = obj.children;
                            if(!val.children){
                                return;
                            }
                            angular.forEach(val.children, function (val1) {
                                var ob = {};
                                ob.name = val1.name;
                                ob.checked = obj.checked;
                                ob.type = val1.type;
                                ob.icon = val1.icon;
                                ob.children = [];
                                ary2[ary2.length] = ob;

                                ob.manual = {"children": [], "isall": false};
                                if(!val1.children){
                                    return;
                                }
                                angular.forEach(val1.children, function (val22) {
                                    ob.manual.children[ob.manual.children.length] = {
                                        "name": val22.name,
                                        "replace_object": val22.replace_object,
                                        "checked": false,
                                        isNew: ccl.isNew?ccl.isNew : false
                                    };
                                });
                            });
                        }
                        zTreeNodes1[zTreeNodes1.length] = obj;

                        if (zTreeNodes1.length === 0) {
                            if(!crdata){
                                return;
                            }
                            angular.forEach(crdata, function (val) {
                                var ch = val;
                                var obj = {};
                                obj.name = ch.name;
                                obj.replace_schema = ch.replace_schema;
                                obj.checked = true;
                                obj.type = "user";
                                obj.icon = src+"replace_schema.png";

                                obj.children = [];
                                zTreeNodes1[zTreeNodes1.length] = obj;
                                var ary1 = obj.children;
                                if(!val.children){
                                    return;
                                }
                                angular.forEach(val.children, function (val1) {
                                    var ob = {};
                                    ob.name = val1.name;
                                    ob.checked = obj.checked;
                                    ob.type = val1.type;
                                    ob.icon = val1.icon;
                                    ob.children = [];
                                    ary1[ary1.length] = ob;
                                    if(!val1.children){
                                        return;
                                    }
                                    if ((val1.children.length === 0) && (val1.checked === true)) {
                                        ob.manual = {"children": [], "isall": true};
                                    } else {
                                        ob.manual = {"children": [], "isall": false};
                                        angular.forEach(val1.children, function (val22) {
                                            ob.manual.children[ob.manual.children.length] = {
                                                "name": val22.name,
                                                "replace_object": val22.replace_object,
                                                "checked": true,
                                                isNew: ccl.isNew?ccl.isNew : false
                                            };
                                        });
                                    }
                                });
                            });
                        }
                    });
                    //正序排序
                    // zTreeNodes1.sort(function (a, b) {
                    //     return a.name > b.name ? 1 : -1;
                    // });
                    return zTreeNodes1;
                }
                //展示Schema界面
                function show_schema_data(treeNode,superCon) {
                    $scope.$apply(function () {
                        superCon.schemaPanel=true;
                        superCon.oldSchema = treeNode.name;
                        superCon.newSchema = treeNode.replace_schema && treeNode.replace_schema.length>0 ?treeNode.replace_schema:'';
                        superCon.schemaList.length=0;
                        if(angular.isArray(treeNode.children)){
                            angular.forEach(treeNode.children,function (val) {
                                superCon.schemaList.push(val);
                            });
                        }
                    });
                }
                function show_object_data(treeNode) {
                    console.log(treeNode);
                }
                function show_object_type_data(treeNode,comInfo,superCon, nowType) {
                        superCon.schemaPanel = false;//关闭Schema面板
                        superCon.userType = treeNode.name;
                        superCon.userList = [];
                        if (nowType === 1){
                            initIncStrs = [];
                        } else {
                            initExcList = [];
                        }
                        $('#incSearchBox').val('');
                        $('#excSearchBox').val('');
                        var owner=treeNode.getParentNode().name;
                        superCon.loading = true;//显示加载中
                        ldService.getObjectDataList(comInfo,treeNode,owner).then(function (result) {
                            superCon.loading = false;
                            if(result.res){
                                var num=0, backArr = [], newArr = [];
                                angular.forEach(result.newArr,function (val, idx) {
                                    var r_name = val.replace_object?val.replace_object:'';
                                    var obj = {id: idx, name: val.name, checked: val.checked, rname: r_name, isNew: false};
                                    angular.forEach(result.oldArr,function (vl) {
                                        if(vl.name === val.name){
                                            obj.checked =vl.checked;
                                            obj.rname = vl.replace_object?vl.replace_object:'';
                                        }
                                    });
                                    if(!obj.checked){
                                        num++;
                                    }
                                    backArr.push(obj);
                                });
                                angular.forEach(result.oldArr,function (vl) {
                                    if(vl.isNew){
                                        var rp = vl.replace_object?vl.replace_object:'';
                                        newArr.push({id: 1, name: vl.name, checked: vl.checked, rname: rp, isNew: true});
                                    }
                                });
                                newArr = newArr.concat(backArr);
                                angular.forEach(newArr, function (v, i) {
                                    v.id = i;
                                    if(nowType ===1) {
                                        initIncStrs.push(v.name);
                                    } else {
                                        initExcStrs.push(v.name);
                                    }
                                });
                                superCon.userList = newArr;
                                if(nowType ===1) {
                                    initIncList = $.extend(superCon.userList, []);
                                    $ctrl.pageInc.currentPage = 1;
                                    $ctrl.pageInc.totalPage = Math.ceil(initIncList.length/$ctrl.pageInc.pageSize);
                                } else {
                                    initExcList = $.extend(superCon.userList, []);
                                    $ctrl.pageExc.currentPage = 1;
                                    $ctrl.pageExc.totalPage = Math.ceil(initExcList.length/$ctrl.pageExc.pageSize);
                                }
                                superCon.userCkAll = num === 0;
                            }
                        },function () {
                            superCon.loading = false;
                        });
                }
                //获取当前Loader配置信息
                function fetch_loader_current_condition(current_tree) {
                    var data = [],src='/img/ico/';
                    var nodes = current_tree.getCheckedNodes(true);
                    var grandSon = function (v,ary) {
                        var iconstr = '',oj = {};
                        var rname= v.rname || v.replace_object || '';
                        if (rname) {
                            iconstr = src+"replace_object.png";
                            oj.replace_object = rname;
                        }else {
                            iconstr = src+"object.png";
                        }
                        oj.isNew = v.isNew ? v.isNew : false;
                        oj.name = v.name;
                        oj.type = "object";
                        oj.icon = iconstr;
                        oj.checked = true;
                        ary[ary.length] = oj;
                    };
                    angular.forEach(nodes, function (val) {
                        if (val.type === 'user') {
                            var oj = {};
                            oj.name = val.name;
                            oj.type = val.type;
                            oj.icon = val.icon;
                            oj.checked = true;
                            oj.children = [];
                            if(val.replace_schema){
                                oj.replace_schema = val.replace_schema;
                                oj.icon = src+'replace_schema.png';
                            }else{
                                oj.replace_schema='';
                                oj.icon = src+'schema.png';
                            }
                            data[data.length] = oj;
                            var ary = oj.children;
                            if (!val.select_all) {
                                angular.forEach(val.children, function (vl) {
                                    if (vl.checked) {
                                        var oj = {};
                                        oj.name = vl.name;
                                        oj.type = vl.type;
                                        oj.icon = vl.icon;
                                        oj.checked = true;
                                        oj.children = [];
                                        ary[ary.length] = oj;
                                        var ary1 = oj.children;
                                        if(vl.manual && angular.isArray(vl.manual.children)){
                                            angular.forEach(vl.manual.children,function (v3) {
                                                grandSon(v3,ary1);
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                    return data;
                }

                // rx 处理
                subscribeT$.debounce(300).subscribe(function (v) {
                    var arr = [];
                    if(v.type === 1 ) {
                        if($ctrl.superCon.userList[v.id]) {
                            $ctrl.superCon.userList[v.id].rname = v.val;
                            initIncList[v.id].rname =v.val;
                        }
                    } else if (v.type === 2) {
                        arr = [];
                        if(v.val.length > 0) {
                            if(v.val ===':ck') {
                                angular.forEach(initIncList, function (vv) {
                                    if(vv.checked) {
                                        arr.push(vv);
                                    }
                                });
                            } else{
                                angular.forEach(initIncList, function (vv) {
                                    var isTrue = vv.name.toLowerCase().indexOf(v.val.toLowerCase());
                                    if( isTrue >= 0) {
                                        arr.push(vv);
                                    }
                                });
                            }
                        }else {
                            arr = angular.copy(initIncList);
                        }
                        $scope.$apply(function () {
                            $ctrl.pageInc.currentPage = 1;
                            $ctrl.superCon.userList = arr;
                            $ctrl.pageInc.totalPage = Math.ceil(arr.length/$ctrl.pageInc.pageSize);
                        });
                    } else if (v.type === 3) {
                        arr = [];
                        if(v.val.length > 0) {
                            if(v.val ===':ck') {
                                angular.forEach(initExcList, function (vv) {
                                    if(vv.checked) {
                                        arr.push(vv);
                                    }
                                });
                            } else {
                                angular.forEach(initExcList, function (vv) {
                                    var isTrue = vv.name.toLowerCase().indexOf(v.val.toLowerCase());
                                    if( isTrue >= 0) {
                                        arr.push(vv);
                                    }
                                });
                            }
                        }else {
                            arr = angular.copy(initExcList);
                        }
                        $scope.$apply(function () {
                            $ctrl.pageExc.currentPage = 1;
                            $ctrl.superConExc.userList = arr;
                            $ctrl.pageExc.totalPage = Math.ceil(arr.length/$ctrl.pageExc.pageSize);
                        });
                    }
                });
                $ctrl.$onDestroy = function () {
                    subscribeT$ = null;
                };
            }]
        })
        .component('customTableModal', {
            templateUrl: 'loader_view/customTables.html',
            bindings: {
                close:'&',
                dismiss:'&'
            },
            controller: [function () {
                var $ctrl = this;
                $ctrl.handle = {
                    loading: false,
                    newStr: '',
                    newList: []
                };
                $ctrl.$onInit = function () {
                };
                $ctrl.saveCustoms = function () {
                    var arr1 =  $ctrl.handle.newStr.replace(/[\r\n,]/g, ',').replace(/\s/g, '').split(',');
                    var arr = [];
                    angular.forEach(arr1, function (v) {
                        if(v) {
                            arr.push(v);
                        }
                    });
                    $ctrl.close({$value:arr});
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
            }]
        });
})();