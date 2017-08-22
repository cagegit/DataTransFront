/**
 * Created by cagej on 2017/3/13.
 * etlMain 为etl模块的主面板
 * etlProperty 为etl属性面板
 * eltStatus 为etl 状态面板
 * eltConf 为etl 属性配置界面
 * eltRule 为etl 规则配置界面
 * etlAddRule 添加规则界面
 * expressPanel 表达式界面
 * targetModal 目标库列表界面
 * applyToOther 当前策略应用到其他表
 * transformModal 审计表界面
 * conditionModal 记录过滤界面
 * deleteModal  删除列界面
 * mapModal 映射列界面
 * databaseModal 数据库配置界面
 * operationModal 操作转换界面
 * eltBglRule 表过滤界面
 * etlOperateRule  操作过滤界面
 * etlPlRule  批量过滤界面
 * selectTableModal 选择表界面
 * configRule 已配置规则
 * etlApplyRule  使用规则集
 */
(function () {
    "use strict";
    angular.module('myApp.component', ['ui.bootstrap'])
        .component('etlView',{
            templateUrl:'etl_view/main.component.html',
            controller:['$stateParams','$location','$state',function ($stateParams,$location,$state) {
                var $ctrl =this;
                $ctrl.state=$state;
                $ctrl.dialog=true;
                $ctrl.current=1;
                if($ctrl.state.includes('*.etl_view.status.**')){
                    $ctrl.current=1;
                }
                if($ctrl.state.includes('*.etl_view.property.**')){
                    $ctrl.current=2;
                }
                $ctrl.redirectTo=function () {
                    $state.go('/');
                };
                $ctrl.changeTo=function (state) {
                    var path =$location.url();
                    if(state==='status'){
                        var pp=$location.path();
                        path = path.replace(pp,'/main/etl_view/status');
                        $ctrl.current=1;
                    }else{
                        $ctrl.current=2;
                        path = path.replace('status','property/config');
                    }
                    $location.url(path);
                };
            }]
        })
        .component('etlStatus',{
            templateUrl:'etl_view/etl_status.component.html',
            bindings:{
                conf: '<'
            },
            controller:['$state',function ($state) {
                this.etl = {
                    etl_id:'',
                    etl_name:'',
                    etl_char:'',
                    etl_nchar:'',
                    etl_clob:'',
                    etl_nclob:'',
                    etl_jg:'',
                    etl_gs:'no',
                    etl_zh:'',
                    isGs:false
                };
                this.$onInit =function () {
                    var cfg=this.conf.data;
                    if(cfg){
                        if(cfg.cset){
                            this.etl.etl_char=cfg.cset.real_charset;
                        }
                        if(cfg.ncset){
                            this.etl.etl_nchar=cfg.ncset.real_ncharset;
                        }
                        if(cfg.cbset){
                            this.etl.etl_clob=cfg.cbset.real_clobset;
                        }
                        if(cfg.ncbset){
                            this.etl.etl_nclob=cfg.ncbset.real_nclobset;
                        }
                        if(cfg.tset){
                            this.etl.etl_zh=cfg.tset.real_tar_set;
                        }
                        this.etl.etl_jg=cfg.interval+'秒';
                        if(!cfg.full_string){
                            this.etl.etl_gs='否';
                        }else{
                            this.etl.etl_gs=cfg.full_string==='yes'?"是":"否";
                            this.etl.isGs=cfg.full_string==='yes';
                        }
                        this.etl.etl_id=this.conf.etl_id;
                        this.etl.etl_name=this.conf.etl_name;
                    }else{
                        $state.go('/');
                    }
                };
                this.params={
                    filed:false,
                    filed1:false,
                    filed2:false,
                    filed3:false,
                    filed4:false,
                    filed5:false,
                    filed6:false,
                    filed7:false,
                    filed8:false
                };
            }]
        })
        .component('etlProperty',{
            templateUrl:'etl_view/etl_property.component.html',
            controller:['$stateParams','$state','tipsService',function($stateParams,$state,dipT) {
                this.etl_title='ETL属性';
                var info=$stateParams;
                var flag=false;
                if(!info.cid || info.cid==='undefined' || info.cn==='unnamed'){
                    flag=true;
                }
                this.changeJob =function (desc) {
                    if(desc>1 && flag){
                        dipT.error('配置Etl规则之前请先完成Etl属性的配置！');
                        return;
                    }
                    switch (desc){
                        case 1:
                            this.etl_title='ETL属性';
                            break;
                        case 2:
                            this.etl_title='规则配置';
                            $state.go('/.etl_view.property.rule');
                            break;
                        case 3:
                            this.etl_title='表过滤';
                            $state.go('/.etl_view.property.bgl');
                            break;
                        case 4:
                            this.etl_title='操作过滤';
                            $state.go('/.etl_view.property.operate');
                            break;
                        case 5:
                            this.etl_title='批量配置';
                            $state.go('/.etl_view.property.batch');
                            break;
                        case 6:
                            this.etl_title='已配置规则';
                            $state.go('/.etl_view.property.configured');
                            break;
                        case 7:
                            this.etl_title='批量配置值绑定';
                            $state.go('/.etl_view.property.pl_rule_apply');
                            break;
                        default:
                            this.etl_title='ETL属性';
                            break;
                    }
                }
            }]
        })
        .component('etlConf',{
            templateUrl:'etl_view/config.component.html',
            bindings:{
                conf: '<'
            },
            controller:['$stateParams','etlService','$state',function($stateParams,etlService,$state) {
                var info= $stateParams;
                var $ctrl=this;
                $ctrl.pool={};
                $ctrl.etl = {
                    etl_id:'',
                    etl_name:'',
                    etl_char:'',
                    etl_nchar:'',
                    etl_clob:'',
                    etl_nclob:'',
                    etl_jg:5,
                    etl_gs:'no',
                    etl_zh:''
                };
                $ctrl.etlGsTip='如果进行同构数据同步，“转换通用格式”选中“否”选项，否则blob类型数据同步会发生异常。';
                $ctrl.params={
                    filed:false,
                    filed1:false,
                    filed2:false,
                    filed3:false,
                    filed4:false,
                    filed5:false,
                    filed6:false,
                    filed7:false,
                    filed8:false
                };
                $ctrl.idSave=false;
                $ctrl.$onInit = function() {
                    if($ctrl.conf.data && !$ctrl.conf.init){
                        var cfg=$ctrl.conf.data;
                        $ctrl.pool.char_list=[];
                        if(cfg.cset){
                            $ctrl.pool.char_list=angular.isArray(cfg.cset.charset)?cfg.cset.charset:[];
                            $ctrl.etl.etl_char=cfg.cset.real_charset;
                        }
                        $ctrl.pool.nchar_list=[];
                        if(cfg.ncset){
                            $ctrl.pool.nchar_list=angular.isArray(cfg.ncset.ncharset)?cfg.ncset.ncharset:[];
                            $ctrl.etl.etl_nchar=cfg.ncset.real_ncharset;
                        }
                        $ctrl.pool.clob_list=[];
                        if(cfg.cbset){
                            $ctrl.pool.clob_list=angular.isArray(cfg.cbset.clobset)?cfg.cbset.clobset:[];
                            $ctrl.etl.etl_clob=cfg.cbset.real_clobset;
                        }
                        $ctrl.pool.nlob_list=[];
                        if(cfg.ncbset){
                            $ctrl.pool.nlob_list=angular.isArray(cfg.ncbset.nclobset)?cfg.ncbset.nclobset:[];
                            $ctrl.etl.etl_nclob=cfg.ncbset.real_nclobset;
                        }
                        $ctrl.pool.zh_list=[];
                        if(cfg.tset){
                            $ctrl.pool.zh_list=angular.isArray(cfg.tset.tar_set)?cfg.tset.tar_set:[];
                            $ctrl.etl.etl_zh=cfg.tset.real_tar_set;
                        }
                        $ctrl.etl.etl_jg=parseInt(cfg.interval)?parseInt(cfg.interval):5;
                        $ctrl.etl.etl_gs=cfg.full_string==='yes'?'yes':'no';
                        $ctrl.etl.etl_id=$ctrl.conf.etl_id;
                        $ctrl.etl.etl_name=$ctrl.conf.etl_name;
                    }
                };
                $ctrl.saveEtlConfig =function () {
                    $ctrl.idSave=true;
                    etlService.saveEtlConfig(info,$ctrl.etl,$state).finally(function () {
                        $ctrl.idSave=false;
                    });
                };
            }]
        })
        .component('etlRule',{
            templateUrl:'etl_view/rule.component.html',
            bindings:{
                users:'<'
            },
            controller:['$stateParams','etlService','tipsService','$uibModal',function($stateParams,etlService,dipT,$uibModal) {
                var $ctrl =this;
                $ctrl.animationsEnabled = true;
                this.u_filter='';
                this.t_filter='';
                this.tables=[];

                //当前选择的用户及表名
                this.current_user='';
                this.current_table='';
                this.current_map='/';
                //选择规则列表
                this.rules=[];
                //全选
                this.ckAll={
                    checked:false,
                    read:false
                };
                $ctrl.onLoading = false;
                this.ckSon =[
                    {checked:false, read:false},
                    {checked:false, read:false},
                    {checked:false, read:false},
                    {checked:false, read:false},
                    {checked:false, read:false},
                    {checked:false, read:false}
                ];
                this.$onInit =function () {
                    if(!this.users || !angular.isArray(this.users)){
                        this.users=[];
                    }
                };

                //打开新增规则界面
                $ctrl.editRuleInfo=function (type) {
                    if(type==="add_column"){
                        $ctrl.openAddModal();
                    }else if(type==="delete_column"){
                        $ctrl.openDeleteModal();
                    }else if(type==="column_mapping"){
                        $ctrl.openMapModal();
                    }else if(type==="record_filter"){
                        $ctrl.openConditionModal();
                    }else if(type==="table_audit"){
                        $ctrl.openTransformModal();
                    }else if(type==="operation_transform"){
                        $ctrl.openOperationModal();
                    }
                };
                //打开添加规则界面
                $ctrl.openAddModal = function () {
                    $uibModal.open({
                        animation: $ctrl.animationsEnabled,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        component: 'etlAddRule',
                        controller:['$uibModalInstance',function ($uibModalInstance) {}],
                        size:'lg',
                        resolve: {
                            items: function () {
                                return etlService.fetchEtlAddConfig($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            clist:function () {
                                return etlService.fetchEtlYdzdList($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.current_user,tname:$ctrl.current_table};
                            }
                        }
                    });
                };
                //打开审计表界面
                $ctrl.openTransformModal = function () {
                    $uibModal.open({
                        animation: $ctrl.animationsEnabled,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        component: 'transformModal',
                        size:'lg',
                        resolve: {
                            items: function () {
                                return etlService.fetchEtlTransformConfig($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            clist:function () {
                                return etlService.fetchEtlYdzdList($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.current_user,tname:$ctrl.current_table};
                            }
                        }
                    });
                };
                //打开记录过滤界面conditionModal
                $ctrl.openConditionModal = function () {
                    $uibModal.open({
                        animation: $ctrl.animationsEnabled,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        component: 'conditionModal',
                        controller:['$uibModalInstance',function ($uibModalInstance) {}],
                        size:'lg',
                        resolve: {
                            items: function () {
                                return etlService.fetchEtlConditionConfig($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            clist:function () {
                                return etlService.fetchEtlYdzdList($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.current_user,tname:$ctrl.current_table};
                            }
                        }
                    });
                };
                //打开删除列界面
                $ctrl.openDeleteModal = function () {
                    $uibModal.open({
                        animation: $ctrl.animationsEnabled,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        component: 'deleteModal',
                        size:'lg',
                        resolve: {
                            items: function () {
                                return etlService.fetchEtlDeleteConfig($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            clist:function () {
                                return etlService.fetchEtlYdzdList($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.current_user,tname:$ctrl.current_table};
                            }
                        }
                    });
                };
                //打开映射列界面
                $ctrl.openMapModal = function () {
                    $uibModal.open({
                        animation: $ctrl.animationsEnabled,
                        component: 'mapModal',
                        size:'lg',
                        resolve: {
                            items: function () {
                                return etlService.fetchEtlMapConfig($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            clist:function () {
                                return etlService.fetchEtlYdzdList($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.current_user,tname:$ctrl.current_table};
                            }
                        }
                    });
                };
                //打开操作转换界面
                $ctrl.openOperationModal = function () {
                    $uibModal.open({
                        animation: $ctrl.animationsEnabled,
                        component: 'operationModal',
                        size:'lg',
                        resolve: {
                            clist:function () {
                                return etlService.fetchEtlYdzdList($stateParams,$ctrl.current_user,$ctrl.current_table);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.current_user,tname:$ctrl.current_table};
                            }
                        }
                    });
                };
                $ctrl.showRules=function () {
                    var ckSon=$ctrl.ckSon;
                    var rules=$ctrl.rules;
                    angular.forEach(ckSon,function (v,i) {
                        ckSon[i]={checked:false, read:false};
                        angular.forEach(rules,function (vv) {
                            if(vv.name==="add_column"){
                                ckSon[0]={checked:true, read:true};
                            }else if(vv.name==="delete_column"){
                                ckSon[1]={checked:true, read:true};
                            }else if(vv.name==="column_mapping"){
                                ckSon[2]={checked:true, read:true};
                            }else if(vv.name==="record_filter"){
                                ckSon[3]={checked:true, read:true};
                            }else if(vv.name==="table_audit"){
                                ckSon[4]={checked:true, read:true};
                            }else if(vv.name==="operation_transform"){
                                ckSon[5]={checked:true, read:true};
                            }
                        })
                    });
                    $('#dialog_confirm_map').modal('show');
                    $('.modal-backdrop').appendTo('#etl_rule_id');
                };

                $ctrl.showTables=function (uname) {
                    $ctrl.current_user=uname;
                    $ctrl.current_map=uname;
                    if(!$stateParams ||　!$stateParams.gn){
                        return;
                    }
                    $ctrl.onLoading = true;
                    $ctrl.tables=[];
                    etlService.fetchEtlTable($stateParams,uname).then(function (res) {
                        $ctrl.tables=res;
                    }).finally(function () {
                        $ctrl.onLoading = false;
                    });
                };
                $ctrl.getRuleByName=function (tname) {
                    $ctrl.current_table=tname;
                    if(!$ctrl.current_table){
                        dipT.warning('请选择表！');
                        return;
                    }
                    $ctrl.current_map=$ctrl.current_user+' > '+tname;
                    etlService.getRuleByName($stateParams,$ctrl.current_user,$ctrl.current_table).then(function (data) {
                        $ctrl.rules=data;
                    });
                };
                $ctrl.saveEtlTableRules=function () {
                    if(!$ctrl.current_user){
                        dipT.warning('请选择用户！');
                        return;
                    }
                    if(!$ctrl.current_table){
                        dipT.warning('请选择表！');
                        return;
                    }
                    var etl={};
                    etl.uname=$ctrl.current_user;
                    etl.tname=$ctrl.current_table;
                    etl.sel=$ctrl.rules;
                    etlService.saveEtlRules($stateParams,etl);
                };

                $ctrl.changeCA =function() {
                    if($ctrl.ckAll.checked){
                        angular.forEach($ctrl.ckSon,function (v,i) {
                            v.checked=true;
                        });
                    }else{
                        angular.forEach($ctrl.ckSon,function (v,i) {
                            v.checked=false;
                        });
                    }
                };
                $ctrl.sonChange=function (num) {
                    var flag=true;
                    if($ctrl.ckSon[num].checked){
                        angular.forEach($ctrl.ckSon,function (v,i) {
                            if(i!==num && !v.checked){
                                flag=false;
                            }
                        });
                        if(flag){
                            $ctrl.ckAll.checked=true;
                        }
                    }else{
                        $ctrl.ckAll.checked=false;
                    }
                };
                $ctrl.appendRules=function () {
                    angular.forEach($ctrl.ckSon,function (v,i) {
                        if(v.checked && !v.read){
                            var obj={};
                            if(i===0){
                                obj.name='add_column';
                                obj.title='增加列';
                            }else if(i===1){
                                obj.name='delete_column';
                                obj.title='删除列';
                            }else if(i===2){
                                obj.name='column_mapping';
                                obj.title='映射列';
                            }else if(i===3){
                                obj.name='record_filter';
                                obj.title='记录过滤';
                            }else if(i===4){
                                obj.name='table_audit';
                                obj.title='审计表';
                            }else if(i===5){
                                obj.name='operation_transform';
                                obj.title='操作转换';
                            }
                            $ctrl.rules.push(obj);
                        }
                    });
                    $('#dialog_confirm_map').modal('hide');
                };
                $ctrl.deleteRules=function (index) {
                    var deleteRule = function () {
                        var name =$ctrl.rules[index].name;
                        $ctrl.rules.splice(index,1);
                        var etl={};
                        etl.uname=$ctrl.current_user;
                        etl.tname=$ctrl.current_table;
                        etl.sel=[];
                        etl.del=name;
                        etlService.saveEtlRules($stateParams,etl);
                    };
                    BootstrapDialog.confirm({
                        title: 'Dip 提示',//Dip 提示
                        message:'确认要删除该规则吗？',//确认要删除该规则吗？
                        type: BootstrapDialog.TYPE_WARNING,
                        btnCancelLabel: '取消',//取消
                        btnOKLabel: '确认',//确认
                        btnOKClass: 'btn-warning',
                        callback: function(result) {
                            if(result){
                                deleteRule();
                            }
                        }
                    });
                };

            }]
        })
        .component('etlAddRule',{
            templateUrl:'etl_view/add_rule.component.html',
            bindings:{
                resolve:'<',//
                dismiss:'&',
                close:'&'
            },
            controller:['$uibModal','$log','etlService','tipsService','graphicService',function ($uibModal, $log, etlService, dipT, gSer) {
                var $ctrl = this;
                //全选按钮
                $ctrl.ckAll=false;
                //增加列列表
                $ctrl.addList=[];
                //列值
                $ctrl.model={};
                $ctrl.targetTreeJson=[];//目标库列表
                $ctrl.targetLabel='';//目标库返回文本
                $ctrl.otherTables=[];//策略用到其他表
                $ctrl.selectTab=[];
                $ctrl.mapInfo={};//映射信息
                $ctrl.$onInit=function () {
                    $ctrl.config =this.resolve.items;
                    $ctrl.comInfo =this.resolve.comInfo;
                    $ctrl.current=this.resolve.current;

                    $ctrl.fieldList=this.resolve.clist;
                    $ctrl.addList=$ctrl.config.addList;
                    var arrDb =[];
                    var targetDb = gSer.getRealIdBySourceId($ctrl.comInfo.id, 'database');
                    angular.forEach($ctrl.config.dbs, function (v) {
                        if (targetDb && v.db_name === targetDb[0]){
                            arrDb.push(v);
                        }
                    });
                    etlService.getTargetDbs($ctrl.comInfo.gn, arrDb).then(function (data) {
                        $ctrl.targetTreeJson=data;
                    });
                    $ctrl.selectTab=$ctrl.config.selectTab;
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //编辑列
                $ctrl.editColumn =function (item) {
                    $ctrl.model.name=item.name;
                    $ctrl.model.type=item.type;
                    $ctrl.model.id=item.id;
                    if(item.type!=='expression'){
                        $ctrl.model.value=item.value;
                    }else if(item.type==='expression'){
                        $ctrl.model.row={
                            bdList:item.bdList,
                            clist:$ctrl.resolve.clist,
                            dbInfo:item.dbInfo,
                            expression:item.expression,
                            connect_db:item.connect_db
                        };
                    }
                    var modalInstance = $uibModal.open({
                        ariaLabelledBy: 'modal-title1',
                        ariaDescribedBy: 'modal-body1',
                        templateUrl: 'myModalContent.html',
                        controller: ['$uibModalInstance','model',function ($uibModalInstance,model) {
                            var $ct =this;
                            $ct.model=model;
                            $ct.ok = function () {
                                $ct.model.cz='add';
                                $uibModalInstance.close($ct.model);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $ct.edit=function () {
                                $ct.model.cz='edit';
                                $uibModalInstance.close($ct.model);
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            model:function () {
                                return $ctrl.model;
                            }
                        }
                    });

                    modalInstance.result.then(function (model) {
                        $ctrl.model.name=model.name;
                        $ctrl.model.type=model.type;
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.id===model.id){
                                v.names=[];
                                v.names.push(model.name);
                                v.name=model.name;
                                v.type=model.type;
                                if(model.type==='string'){
                                    v.value=model.value;
                                    v.desc='固定字符串';
                                }else if(model.type==='sysdata'){
                                    v.value=model.value;
                                    v.desc='系统变量';
                                }else if(model.type==='expression'){
                                    v.value='';
                                    v.desc='表达式';
                                }
                            }
                        });
                        if(model.type==='expression' && model.cz==='edit'){
                            if(!$ctrl.model.row){
                                $ctrl.model.row={
                                    bdList:[],
                                    dbInfo:{},
                                    clist:$ctrl.resolve.clist,
                                    expression:'',
                                    connect_db:'yes'
                                };//首次加载
                            }
                            $ctrl.openExpressPanel($ctrl.model);
                        }
                    });
                };
                //打开表达式编辑界面
                $ctrl.openExpressPanel =function (model) {
                    var modalInstance2 = $uibModal.open({
                        component: 'expressionPanel',
                        size:'lg',
                        resolve:{
                            row:function () {
                                return model.row;
                            },
                            comInfo:function () {
                                return $ctrl.comInfo;
                            },
                            current:function () {
                                return $ctrl.current;
                            },
                            type:function () {
                                return 'normal';
                            }
                        }
                    });
                    modalInstance2.result.then(function (row) {
                        $ctrl.model.row=row;
                        $ctrl.saveExp(row);
                    });
                };
                //增加列
                $ctrl.addColumn =function () {
                    var item ={};
                    var maxNum=0;
                    if($ctrl.addList.length>0){
                        maxNum=$ctrl.addList[$ctrl.addList.length-1].id+1;
                    }
                    item.id=maxNum;
                    item.checked=false;
                    item.name='';
                    item.names=[''];
                    item.type='string';
                    item.desc='固定字符串';
                    item.value='';
                    $ctrl.addList.push(item);
                };
                //删除列
                $ctrl.deleteColumn =function () {
                    if($('input.cl-etl-input:checked').length>0){
                        var clist =angular.copy($ctrl.addList),arr=[];
                        angular.forEach(clist,function (v) {
                            if(!v.checked){
                                arr.push(v);
                            }
                        });
                        $ctrl.addList=arr;
                        $ctrl.ckAll = false;
                    }else{
                        dipT.warning('请选择要删除的列表！');
                    }
                };
                //全选不全选
                $ctrl.changeAllCheck=function () {
                    angular.forEach($ctrl.addList,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.changeOne=function (item) {
                    var num =0;
                    if(item.checked){
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.checked)num++;
                        });
                        if(num===$ctrl.addList.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //编辑列内容
                $ctrl.editItemInfo=function (item) {

                };

                //保存表达式
                $ctrl.saveExp=function (row) {
                    angular.forEach($ctrl.addList,function (v) {
                        if(v.id===$ctrl.model.id){
                            if($ctrl.model.type==='expression'){
                                v.desc='表达式';
                                if(typeof(row.expression)==='string' && row.expression.length>20){
                                    v.value=row.expression.substring(0,20)+'...';
                                }else{
                                    v.value= row.expression;
                                }
                                v.connect_db=row.connect_db;
                                v.expression=row.expression;
                                v.bdList=row.bdList;
                                v.dbInfo=row.dbInfo;
                            }
                        }
                    });
                };
                //保存addRule
                $ctrl.saveAddRule=function () {
                    var arr = [];
                    angular.forEach($ctrl.addList, function (v) {
                        if (v.name && v.value) {
                            arr.push(v);
                        }
                    });
                    if(arr.length===0){
                        dipT.error('请添加至少一条规则并且确保字段名称、字段值不能为空！');
                        return;
                    }
                    etlService.saveEtlAddConfig($ctrl.comInfo, $ctrl.current, arr, $ctrl.otherTables, $ctrl.mapInfo);
                    $ctrl.close();
                };
                Array.prototype.unique = function(){
                    var res = [];
                    var json = {};
                    for(var i = 0; i < this.length; i++){
                        if(!json[this[i]]){
                            res.push(this[i]);
                            json[this[i]] = 1;
                        }
                    }
                    return res;
                };
                //配置目标库列表界面
                $ctrl.openTargetsModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'targetTree',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            jsonTree:function () {
                                return $ctrl.targetTreeJson;
                            },
                            comInfo:function () {
                                return $ctrl.comInfo;
                            }
                        }
                    });
                    modalIns.result.then(function (tt) {
                        if(tt) {
                            $ctrl.targetLabel=tt.map_db_com_name+' 库 > '+tt.map_user+'.'+tt.map_table;
                            $ctrl.mapInfo=tt;
                            var arr=[];
                            angular.forEach($ctrl.fieldList,function (v) {
                                arr.push({column_name:v.column_name});
                            });
                            var com=angular.copy($ctrl.comInfo);
                            com.pn=tt.map_db_com_name;
                            etlService.fetchEtlYdzdList(com,tt.map_user,tt.map_table,arr).then(function (clist) {
                                var new_arr=[];
                                angular.forEach(clist,function (v) {
                                    new_arr.push(v.column_name);
                                });
                                angular.forEach($ctrl.addList,function (v) {
                                    var arr=v.names.concat(new_arr);
                                    v.names=arr.unique();
                                });
                            });
                        }else{
                            $ctrl.mapInfo={};
                        }
                    });
                };
                //打开应用到其他表模块
                $ctrl.openApplyToModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'applyToOther',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            tables:function () {
                                return etlService.fetchEtlTable($ctrl.comInfo,$ctrl.current.uname);
                            },
                            selected:function () {
                                return $ctrl.selectTab;
                            }
                        }
                    });
                    modalIns.result.then(function (arr) {
                        $ctrl.otherTables=[];
                        angular.forEach(arr,function (v) {
                            $ctrl.otherTables.push(v.name);
                        })
                    });
                };
            }]
        })
        .component('expressionPanel',{
            templateUrl:'etl_view/expression.component.html',
            bindings:{
                resolve:'<',
                close:'&',
                dismiss:'&'
            },
            controller:['$uibModal','etlService',function ($uibModal,etlService) {
                var $ctrl =this;
                $ctrl.$onInit =function () {
                    $ctrl.bindNameVisble=false;
                    $ctrl.row=this.resolve.row;
                    $ctrl.current=this.resolve.current;
                    $ctrl.comInfo=this.resolve.comInfo;
                    $ctrl.model={};
                    if($ctrl.row){
                        $ctrl.model=$ctrl.row.dbInfo;
                    }
                    $ctrl.isAllowTable = false;
                    if(this.resolve.allowTable){
                        $ctrl.isAllowTable=true;
                    }
                    if(!$ctrl.row.connect_db){
                        $ctrl.row.connect_db='yes';
                    }
                    $ctrl.type=$ctrl.resolve.type || 'normal';
                };
                //向文本框里面插入字段
                $ctrl.insertToText=function (field) {
                    if($ctrl.row.connect_db==='yes'){
                        field=':'+field;
                    }else{
                        field='{'+field+'}';
                    }
                    var bjq_expression=$("#bjq_expression");
                    bjq_expression.focus().insertToText(field);
                    $ctrl.row.expression=bjq_expression.val();
                };
                //配置数据库
                $ctrl.dbConfig=function () {
                    var modalInstance2 = $uibModal.open({
                        component: 'databaseModal',
                        size:'md',
                        resolve:{
                            model:function () {
                                return $ctrl.model;
                            }
                        }
                    });
                    modalInstance2.result.then(function (model) {
                        $ctrl.row.dbInfo=model;
                    });
                };
                //表达式合法性检查
                $ctrl.checkExpression=function () {
                    var expression= Base64.encode($ctrl.row.expression);
                    etlService.expressionCheck($ctrl.comInfo,$ctrl.current.uname,$ctrl.current.tname,$ctrl.row.connect_db,expression).then(function (list) {
                        $ctrl.row.bdList=list;
                    });
                };
                //保存表达式信息
                $ctrl.saveExpression=function () {
                    var expression= Base64.encode($ctrl.row.expression);
                    etlService.expressionCheck($ctrl.comInfo,$ctrl.current.uname,$ctrl.current.tname,$ctrl.row.connect_db,expression).then(function (list) {
                        $ctrl.row.bdList=list;
                    }).finally(function () {
                        $ctrl.close({$value:$ctrl.row});
                    });
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //选择表
                $ctrl.selectOneTable=function () {
                    var modalIns = $uibModal.open({
                        component: 'targetTree',
                        size:'sm',
                        resolve:{
                            jsonTree:function () {
                                return etlService.getSourceUserTree($ctrl.comInfo);
                            },
                            comInfo:function () {
                                return  $ctrl.comInfo;
                            },
                            title:function () {
                                return '选择单个表';
                            }
                        }
                    });
                    modalIns.result.then(function (model) {
                        $ctrl.current.uname=model.map_user;
                        $ctrl.current.tname=model.map_table;
                        etlService.fetchEtlYdzdList($ctrl.comInfo,model.map_user,model.map_table).then(function (data) {
                            $ctrl.row.clist=data;
                            $ctrl.bindNameVisble=true;
                        });
                    });
                };
            }]
        })
        .component('targetTree',{
            templateUrl:'etl_view/target_tree.component.html',
            bindings:{
                resolve:'<',//包含jsonTree,comInfo
                close:'&',
                dismiss:'&'
            },
            controller:['$log','tipsService',function ($log,dipT) {
                var $ctrl=this;
                //树结构的配置
                var setting = {
                    view: {
                        selectedMulti: false
                    },
                    async: {
                        enable: true,
                        url: "/dipserver/query_etl_table",
                        autoParam:[],
                        otherParam: {},
                        type:'get',
                        contentType: "application/json",
                        dataFilter: function (treeId, parentNode, data) {
                            var res =[];
                            if(data && data.status && data.response){
                                if(angular.isArray(data.response.tables)){
                                    angular.forEach(data.response.tables,function (v,i) {
                                        res.push({id:i,name:v});
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
                    if (treeNode && !treeNode.isParent) {
                        var pnode = treeNode.getParentNode();
                        $ctrl.targetInfo={
                            map_db_com_name:pnode.pn,
                            map_db_type:pnode.pt,
                            map_user:pnode.name,
                            map_table:treeNode.name
                        };
                    }
                }

                //初始化数据
                $ctrl.$onInit =function () {
                    //输入 树状json列表
                    $ctrl.jsonTree=$ctrl.resolve.jsonTree;
                    $ctrl.comInfo=$ctrl.resolve.comInfo;
                    $ctrl.title='目标库列表';
                    if($ctrl.resolve.title){
                        $ctrl.title=$ctrl.resolve.title;
                    }
                    //输出  节点的当前、父级、祖父级节点信息
                    $ctrl.targetInfo={};

                    setting.async.autoParam=['name=user','pt=db_type','pn=db_component_name'];
                    setting.async.otherParam={group:$ctrl.comInfo.gn};
                    //生成下拉树
                    $.fn.zTree.init($("#etlTargetTree"),setting,$ctrl.jsonTree);
                };
                //确认保存
                $ctrl.ok = function () {
                    if(!$ctrl.targetInfo.map_db_com_name || !$ctrl.targetInfo.map_user ||　!$ctrl.targetInfo.map_table){
                        dipT.warning('您未选中任何目标表！');
                        return;
                    }
                    $ctrl.close({$value:$ctrl.targetInfo});
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
            }]
        })
        .component('applyToOther',{
            templateUrl:'etl_view/apply_other.component.html',
            bindings:{
                resolve:'<',//包含tables
                close:'&',
                dismiss:'&'
            },
            controller:['$log',function ($log) {
                var $ctrl=this;
                $ctrl.tables=[];
                $ctrl.ckAll=false;
                $ctrl.localDics=[];
                $ctrl.$onInit=function () {
                    if($ctrl.resolve.tables && angular.isArray($ctrl.resolve.tables)){
                        // $log.info('$ctrl.resolve.selected',$ctrl.resolve.selected);
                        angular.forEach($ctrl.resolve.tables,function (v) {
                            var item={};
                            item.name=v;
                            item.checked = ($ctrl.resolve.selected.length > 0 && $.inArray(v, $ctrl.resolve.selected) >= 0);
                            $ctrl.tables.push(item);
                        });
                    }
                };
                //全选不全选
                $ctrl.checkAll=function () {
                    angular.forEach($ctrl.localDics,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.selectOne = function (item) {
                    var num =0;
                    if(item.checked){
                        angular.forEach($ctrl.localDics, function (v) {
                            if(v.checked){
                                num++;
                            }
                        });
                        if($ctrl.tables.length===num){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };

                //确认保存
                $ctrl.ok = function () {
                    var arr=[];
                    angular.forEach($ctrl.localDics,function (v) {
                        if(v.checked){
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
        })
        .component('transformModal',{
            templateUrl:'etl_view/transform.component.html',
            bindings:{
                resolve:'<',//
                dismiss:'&',
                close:'&'
            },
            controller:['$uibModal','$log','etlService','tipsService','graphicService',function ($uibModal,$log,etlService,dipT,gSer) {
                var $ctrl = this;
                //全选按钮
                $ctrl.ckAll=false;
                //增加列列表
                $ctrl.addList=[];
                //列值
                $ctrl.model={};
                // $ctrl.addList=[];
                $ctrl.targetTreeJson=[];//目标库列表
                $ctrl.targetLabel='';//目标库返回文本
                $ctrl.otherTables=[];//策略用到其他表
                $ctrl.mapInfo={};//映射信息
                $ctrl.transInfo={};//transform 信息
                $ctrl.selectTab=[];
                $ctrl.$onInit=function () {
                    $ctrl.config =this.resolve.items;
                    $ctrl.comInfo =this.resolve.comInfo;
                    $ctrl.current=this.resolve.current;

                    $ctrl.fieldList=this.resolve.clist;
                    if($ctrl.config){
                        $ctrl.addList=$ctrl.config.addList;
                        $ctrl.transInfo.table_prefix=$ctrl.config.table_prefix;
                        $ctrl.transInfo.table_suffix=$ctrl.config.table_suffix;
                        $ctrl.transInfo.keep_copy=$ctrl.config.keep_copy;
                        $ctrl.selectTab=$ctrl.config.selectTab;
                    }else{
                        $ctrl.config = {};
                        $ctrl.config.dbs = [];
                    }
                    var arrDb =[];
                    var targetDb = gSer.getRealIdBySourceId($ctrl.comInfo.id, 'database');
                    angular.forEach($ctrl.config.dbs, function (v) {
                        if (targetDb && v.db_name === targetDb[0]){
                            arrDb.push(v);
                        }
                    });
                    etlService.getTargetDbs($ctrl.comInfo.gn, arrDb).then(function (data) {
                        $ctrl.targetTreeJson=data;
                    });
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };

                //编辑列
                $ctrl.editColumn =function (item) {
                    $ctrl.model.name=item.name;
                    $ctrl.model.type=item.type;
                    $ctrl.model.id=item.id;
                    $ctrl.model.value=item.value;
                    var modalInstance = $uibModal.open({
                        templateUrl: 'transformModal.html',
                        controller: ['$uibModalInstance','model',function ($uibModalInstance,model) {
                            var $ct =this;
                            $ct.model=model;
                            $ct.ok = function () {
                                $ct.model.cz='add';
                                $uibModalInstance.close($ct.model);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $ct.edit=function () {
                                $ct.model.cz='edit';
                                $uibModalInstance.close($ct.model);
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            model:function () {
                                return $ctrl.model;
                            }
                        }
                    });
                    modalInstance.result.then(function (model) {
                        $ctrl.model.name=model.name;
                        $ctrl.model.type=model.type;
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.id===model.id){
                                v.names=[];
                                v.names.push(model.name);
                                v.name=model.name;
                                v.type=model.type;
                                if(model.type==='string'){
                                    v.value=model.value;
                                    v.desc='固定字符串';
                                }else if(model.type==='sysdata'){
                                    v.value=model.value;
                                    v.desc='系统变量';
                                }
                            }
                        });
                    });
                };
                //增加列
                $ctrl.addColumn =function () {
                    var item ={};
                    var maxNum=0;
                    if($ctrl.addList.length>0){
                        maxNum=$ctrl.addList[$ctrl.addList.length-1].id+1;
                    }
                    item.id=maxNum;
                    item.checked=false;
                    item.name='';
                    item.names=[''];
                    item.type='string';
                    item.desc='固定字符串';
                    item.value='';
                    $ctrl.addList.push(item);
                };
                //删除列
                $ctrl.deleteColumn =function () {
                    if($('input.cl-etl-input:checked').length>0){
                        var clist =angular.copy($ctrl.addList),arr=[];
                        angular.forEach(clist,function (v) {
                            if(!v.checked){
                                arr.push(v);
                            }
                        });
                        $ctrl.addList=arr;
                        $ctrl.ckAll=false;
                    }else{
                        dipT.warning('请选择要删除的列表！');
                    }
                };
                //全选不全选
                $ctrl.changeAllCheck=function () {
                    angular.forEach($ctrl.addList,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                 //单选
                $ctrl.changeOne=function (item) {
                    var num =0;
                    if(item.checked){
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.checked)num++;
                        });
                        if(num===$ctrl.addList.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //编辑列内容
                $ctrl.editItemInfo=function (item) {

                };
                //保存addRule
                $ctrl.saveTransformRule=function () {
                    var arr = [];
                    angular.forEach($ctrl.addList, function (v) {
                        if (v.name && v.value) {
                            arr.push(v);
                        }
                    });
                    if(arr.length===0){
                        dipT.error('请添加至少一条规则并且确保字段名称、字段值不能为空！');
                        return;
                    }
                    etlService.saveEtlTransformConfig($ctrl.comInfo, $ctrl.current, arr, $ctrl.otherTables, $ctrl.mapInfo, $ctrl.transInfo);
                    $ctrl.close();
                };
                Array.prototype.unique = function(){
                    var res = [];
                    var json = {};
                    for(var i = 0; i < this.length; i++){
                        if(!json[this[i]]){
                            res.push(this[i]);
                            json[this[i]] = 1;
                        }
                    }
                    return res;
                };
                //配置目标库列表界面
                $ctrl.openTargetsModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'targetTree',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            jsonTree:function () {
                                return $ctrl.targetTreeJson;
                            },
                            comInfo:function () {
                                return $ctrl.comInfo;
                            }
                        }
                    });
                    modalIns.result.then(function (tt) {
                        if(tt) {
                            $ctrl.targetLabel=tt.map_db_com_name+' 库 > '+tt.map_user+'.'+tt.map_table;
                            $ctrl.mapInfo=tt;
                            var arr=[];
                            angular.forEach($ctrl.fieldList,function (v) {
                                arr.push({column_name:v.column_name});
                            });
                            var com=angular.copy($ctrl.comInfo);
                            com.pn=tt.map_db_com_name;
                            etlService.fetchEtlYdzdList(com,tt.map_user,tt.map_table,arr).then(function (clist) {
                                var new_arr=[];
                                angular.forEach(clist,function (v) {
                                    new_arr.push(v.column_name);
                                });
                                angular.forEach($ctrl.addList,function (v) {
                                    var arr=v.names.concat(new_arr);
                                    v.names=arr.unique();
                                });
                            });
                        }else{
                            $ctrl.mapInfo={};
                        }
                    });
                };
                //打开应用到其他表模块
                $ctrl.openApplyToModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'applyToOther',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            tables:function () {
                                return etlService.fetchEtlTable($ctrl.comInfo,$ctrl.current.uname);
                            },
                            selected:function () {
                                return $ctrl.selectTab;
                            }
                        }
                    });
                    modalIns.result.then(function (arr) {
                        $ctrl.otherTables=[];
                        angular.forEach(arr,function (v) {
                            $ctrl.otherTables.push(v.name);
                        })
                    });
                };
            }]
        })
        .component('conditionModal',{
            templateUrl:'etl_view/condition.component.html',
            bindings:{
                resolve:'<',//
                dismiss:'&',
                close:'&'
            },
            controller:['$uibModal','$log','etlService','tipsService',function ($uibModal,$log,etlService,dipT) {
                var $ctrl = this;
                $ctrl.ruleTip='选择保留:是指只复制符合表达式条件的数据，不符合条件的会被丢弃；选择不保留:是指将符合表达式条件的数据丢弃，其它数据会被复制。';
                $ctrl.utInfo='';
                $ctrl.ckAll=false;//全选框
                $ctrl.addList=[];//配置列表
                $ctrl.clist=[];//列值列表
                $ctrl.editRow={};//正在编辑的列值
                $ctrl.comInfo={};
                $ctrl.current={};
                $ctrl.otherTables=[];//策略用到其他表
                $ctrl.selectTab=[];
                $ctrl.$onInit=function () {
                    if($ctrl.resolve){
                        $ctrl.config =$ctrl.resolve.items;
                        $ctrl.addList=$ctrl.config.addList;
                        $ctrl.clist=$ctrl.resolve.clist;
                        $ctrl.comInfo=$ctrl.resolve.comInfo;
                        $ctrl.current=$ctrl.resolve.current;
                        $ctrl.utInfo=$ctrl.current.uname+'.'+$ctrl.current.tname;
                        $ctrl.selectTab=$ctrl.config.selectTab;
                    }
                };

                //编辑列值
                $ctrl.editColumn=function (item) {
                    $ctrl.editRow={
                        id:item.id,
                        bdList:item.bdList,
                        clist:$ctrl.clist,
                        dbInfo:item.dbInfo,
                        expression:item.expression,
                        connect_db:item.connect_db
                    };
                    $ctrl.openExpressPanel($ctrl.editRow);
                };
                //打开表达式编辑界面
                $ctrl.openExpressPanel =function (model) {
                    var modalIns= $uibModal.open({
                        component: 'expressionPanel',
                        size:'lg',
                        resolve:{
                            row:function () {
                                return model;
                            },
                            comInfo:function () {
                                return $ctrl.comInfo;
                            },
                            current:function () {
                                return $ctrl.current;
                            },
                            type:function () {
                                return 'large';
                            }
                        }
                    });
                    modalIns.result.then(function (row) {
                        $ctrl.editRow=row;
                        $ctrl.updateList(row);
                    });
                };
                $ctrl.updateList=function (row) {
                    angular.forEach($ctrl.addList,function (v) {
                        if(v.id===row.id){
                            if(row.expression.length>45){
                                v.value=row.expression.substring(0,45)+'...';
                            }else{
                                v.value= row.expression;
                            }
                            v.connect_db=row.connect_db;
                            v.expression=row.expression;
                            v.bdList=row.bdList;
                        }
                    });
                };

                //保存记录过滤信息
                $ctrl.saveConditionRule=function () {
                    var arr = [];
                    angular.forEach($ctrl.addList, function (v) {
                        if (v.value) {
                            arr.push(v);
                        }
                    });
                    if(arr.length===0){
                        dipT.error('请添加至少一条规则并且确保表达式不能为空！');
                        return;
                    }
                    etlService.saveEtlConditionConfig($ctrl.comInfo, $ctrl.current, arr, $ctrl.otherTables);
                    $ctrl.close();
                };
                //全选不全选
                $ctrl.changeAll=function () {
                    angular.forEach($ctrl.addList,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.changeOne=function (item) {
                    var num =0;
                    if(item.checked){
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.checked)num++;
                        });
                        if(num===$ctrl.addList.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //增加行
                $ctrl.addColumn=function () {
                    var item={},initId=1,len=$ctrl.addList.length;
                    if(len>0){
                        initId=$ctrl.addList[len-1].id+1;
                    }
                    item.id=initId;
                    item.checked=false;
                    item.value='';
                    item.expression='';
                    item.option='yes';
                    item.connect_db='no';
                    item.bdList=[];
                    item.dbInfo={};
                    $ctrl.addList.push(item);
                };
                //删除行
                $ctrl.deleteColumn=function () {
                    if($('input.etl-condition-son:checked').length>0){
                        var clist =angular.copy($ctrl.addList),arr=[];
                        angular.forEach(clist,function (v) {
                            if(!v.checked){
                                arr.push(v);
                            }
                        });
                        $ctrl.addList=arr;
                        $ctrl.ckAll=false;
                    }else{
                        dipT.warning('请选择要删除的列表！');
                    }
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //打开应用到其他表模块
                $ctrl.openApplyToModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'applyToOther',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            tables:function () {
                                return etlService.fetchEtlTable($ctrl.comInfo,$ctrl.current.uname);
                            },
                            selected:function () {
                                return $ctrl.selectTab;
                            }
                        }
                    });
                    modalIns.result.then(function (arr) {
                        $ctrl.otherTables=[];
                        angular.forEach(arr,function (v) {
                            $ctrl.otherTables.push(v.name);
                        })
                    });
                };
            }]
        })
        .component('deleteModal',{
            templateUrl:'etl_view/delete.component.html',
            bindings:{
                resolve:'<',
                dismiss:'&',
                close:'&'
            },
            controller:['$uibModal','$log','etlService','tipsService',function ($uibModal,$log,etlService,dipT) {
                var $ctrl = this;
                $ctrl.utInfo='';
                $ctrl.ckAll=false;//全选框
                $ctrl.addList=[];//配置列表
                $ctrl.clist=[];//列值列表
                $ctrl.editRow={};//正在编辑的列值
                $ctrl.comInfo={};
                $ctrl.current={};
                $ctrl.otherTables=[];//策略用到其他表
                $ctrl.selList=[];//选中列表
                $ctrl.selectTab=[];
                $ctrl.$onInit=function () {
                    if($ctrl.resolve){
                        $ctrl.config =$ctrl.resolve.items;
                        // $ctrl.addList=$ctrl.config.addList;
                        $ctrl.clist=$ctrl.resolve.clist;
                        angular.forEach($ctrl.clist,function (v) {
                            var item ={};
                            item.checked=false;
                            angular.forEach($ctrl.config.addList,function (vv) {
                                if(vv.name===v.column_name){
                                    item.checked=true;
                                }
                            });
                            item.name=v.column_name;
                            item.type=v.column_type;
                            $ctrl.addList.push(item);
                        });
                        $ctrl.comInfo=$ctrl.resolve.comInfo;
                        $ctrl.current=$ctrl.resolve.current;
                        $ctrl.utInfo=$ctrl.current.uname+'.'+$ctrl.current.tname;
                        $ctrl.selectTab=$ctrl.config.selectTab;
                    }
                };

                //保存记录过滤信息
                $ctrl.saveDeleteRule=function () {
                    var arr=[];
                    angular.forEach($ctrl.addList,function (v) {
                        if(v.checked){
                            arr.push(v);
                        }
                    });
                    if (arr.length===0) {
                        dipT.error('请选择要保存的数据！');
                        return;
                    }
                    etlService.saveEtlDeleteConfig($ctrl.comInfo,$ctrl.current,arr,$ctrl.otherTables);
                    $ctrl.close();
                };
                //全选不全选
                $ctrl.changeAll=function () {
                    angular.forEach($ctrl.selList,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.changeOne=function (item) {
                    var num =0;
                    if(item.checked){
                        angular.forEach($ctrl.selList,function (v) {
                            if(v.checked)num++;
                        });
                        if(num===$ctrl.addList.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //删除行
                $ctrl.deleteColumn=function () {
                    if($('input.etl-condition-son:checked').length>0){
                        var clist =angular.copy($ctrl.addList),arr=[];
                        angular.forEach(clist,function (v) {
                            if(!v.checked){
                                arr.push(v);
                            }
                        });
                        $ctrl.addList=arr;
                        $ctrl.ckAll=false;
                    }else{
                        dipT.warning('请选择要删除的列表！');
                    }
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //打开应用到其他表模块
                $ctrl.openApplyToModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'applyToOther',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            tables:function () {
                                return etlService.fetchEtlTable($ctrl.comInfo,$ctrl.current.uname);
                            },
                            selected:function () {
                                return $ctrl.selectTab;
                            }
                        }
                    });
                    modalIns.result.then(function (arr) {
                        $ctrl.otherTables=[];
                        angular.forEach(arr,function (v) {
                            $ctrl.otherTables.push(v.name);
                        })
                    });
                };
            }]
        })
        .component('mapModal',{
            templateUrl:'etl_view/map.component.html',
            bindings:{
                resolve:'<',
                dismiss:'&',
                close:'&'
            },
            controller:['$uibModal','$log','etlService','tipsService','graphicService',function ($uibModal,$log,etlService,dipT, gSer) {
                var $ctrl = this;
                $ctrl.ckAll=false;//全选框
                $ctrl.addList=[];//配置列表
                $ctrl.clist=[];//列值列表
                $ctrl.editRow={};//正在编辑的列值
                $ctrl.comInfo={};
                $ctrl.current={};
                $ctrl.otherTables=[];//策略用到其他表
                $ctrl.selList=[];//选中列表
                $ctrl.targetLabel='';//目标库文本
                $ctrl.mapInfo={};//映射信息
                $ctrl.targetTreeJson=[];//目标库json
                $ctrl.selectTab=[];
                $ctrl.$onInit=function () {
                    if($ctrl.resolve){
                        $ctrl.config =$ctrl.resolve.items;
                        $ctrl.clist=$ctrl.resolve.clist;
                        $ctrl.comInfo=$ctrl.resolve.comInfo;
                        $ctrl.current=$ctrl.resolve.current;
                        var arrDb =[];
                        var targetDb = gSer.getRealIdBySourceId($ctrl.comInfo.id, 'database');
                        angular.forEach($ctrl.config.dbs, function (v) {
                            if (targetDb && v.db_name === targetDb[0]){
                                arrDb.push(v);
                            }
                        });
                        etlService.getTargetDbs($ctrl.comInfo.gn, arrDb).then(function (data) {
                            $ctrl.targetTreeJson=data;
                        });
                        angular.forEach($ctrl.clist,function (v,i) {
                            var item ={};
                            item.id=i;
                            item.checked=false;
                            item.map='';
                            item.mapType='';
                            item.maps=[];
                            item.value='';
                            item.expression='';
                            item.connect_db='no';
                            item.bdList=[];
                            item.dbInfo={};
                            item.name=v.column_name;
                            item.type=v.column_type;
                            angular.forEach($ctrl.config.addList,function (vv) {
                                if(vv.name===v.column_name){
                                    item.checked=true;
                                    item.map=vv.map;
                                    item.mapType=vv.mapType;
                                    item.maps.push(vv.map);
                                    item.value=vv.value;
                                    item.expression=vv.expression;
                                    item.connect_db=vv.connect_db;
                                    item.bdList=vv.bdList;
                                    item.dbInfo=vv.dbInfo;
                                }
                            });
                            $ctrl.addList.push(item);
                        });
                        $ctrl.selectTab = $ctrl.config.selectTab;
                    }
                };
                //编辑列
                $ctrl.editColumn =function (item) {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'etlMapModal.html',
                        controller: ['$uibModalInstance','model',function ($uibModalInstance,model) {
                            var $ct =this;
                            $ct.model=model;
                            $ct.ok = function () {
                                $ct.model.cz='add';
                                $uibModalInstance.close($ct.model);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $ct.edit=function () {
                                $ct.model.cz='edit';
                                $uibModalInstance.close($ct.model);
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            model:function () {
                                return item;
                            }
                        }
                    });
                    modalInstance.result.then(function (model) {
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.id===model.id){
                                if(model.map){
                                    v.maps=[];
                                    v.maps.push(model.map);
                                    v.map=model.map;
                                    v.checked=true;
                                }else{
                                    v.checked=false;
                                }
                            }
                        });
                        if(model.cz==='edit'){
                            var md={};
                            md.row={
                                id:model.id,
                                bdList:model.bdList,
                                dbInfo:model.dbInfo,
                                clist:$ctrl.resolve.clist,
                                expression:model.expression,
                                connect_db:model.connect_db
                            };
                            $ctrl.openExpressPanel(md);
                        }
                    });
                };
                //打开表达式编辑界面
                $ctrl.openExpressPanel =function (model) {
                    var modalInstance2 = $uibModal.open({
                        component: 'expressionPanel',
                        size:'lg',
                        resolve:{
                            row:function () {
                                return model.row;
                            },
                            comInfo:function () {
                                return $ctrl.comInfo;
                            },
                            current:function () {
                                return $ctrl.current;
                            },
                            type:function () {
                                return 'normal';
                            }
                        }
                    });
                    modalInstance2.result.then(function (row) {
                        $ctrl.saveExp(row);
                    });
                };
                //保存表达式
                $ctrl.saveExp=function (row) {
                    angular.forEach($ctrl.addList,function (v) {
                        if(v.id===row.id){
                            if(row.expression.length>30){
                                v.value=row.expression.substring(0,30)+'...';
                            }else{
                                v.value= row.expression;
                            }
                            v.connect_db=row.connect_db;
                            v.expression=row.expression;
                            v.bdList=row.bdList;
                            v.dbInfo=row.dbInfo;
                        }
                    });
                };
                //保存映射列信息
                $ctrl.saveMapRule=function () {
                    var arr=[];
                    angular.forEach($ctrl.addList,function (v) {
                        if(v.checked && v.map){
                            arr.push(v);
                        }
                    });
                    if(arr.length===0){
                        dipT.error('请选择要保存的数据并且确保选中数据的映射名不能为空！');
                        return;
                    }
                    etlService.saveEtlMapConfig($ctrl.comInfo, $ctrl.current, arr, $ctrl.otherTables, $ctrl.mapInfo);
                    $ctrl.close();
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //全选不全选
                $ctrl.changeAll=function () {
                    angular.forEach($ctrl.addList,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.changeOne=function (item) {
                    var num =0;
                    if(item.checked){
                        angular.forEach($ctrl.addList,function (v) {
                            if(v.checked)num++;
                        });
                        if(num===$ctrl.addList.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //配置目标库列表界面
                $ctrl.openTargetsModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'targetTree',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            jsonTree:function () {
                                return $ctrl.targetTreeJson;
                            },
                            comInfo:function () {
                                return $ctrl.comInfo;
                            }
                        }
                    });
                    modalIns.result.then(function (tt) {
                        if(tt) {
                            $ctrl.targetLabel=tt.map_db_com_name+' 库 > '+tt.map_user+'.'+tt.map_table;
                            $ctrl.mapInfo=tt;
                            var arr=[];
                            angular.forEach($ctrl.fieldList,function (v) {
                                arr.push({column_name:v.column_name});
                            });
                            var com=angular.copy($ctrl.comInfo);
                            com.pn=tt.map_db_com_name;
                            etlService.fetchEtlYdzdList(com,tt.map_user,tt.map_table,arr).then(function (clist) {
                                var new_arr=[];
                                angular.forEach(clist,function (v) {
                                    new_arr.push(v.column_name);
                                });
                                angular.forEach($ctrl.addList,function (v) {
                                    // v.maps=v.maps.concat(new_arr);
                                    v.map='';
                                    v.maps=new_arr;
                                });
                            });
                        }else{
                            $ctrl.mapInfo={};
                        }
                    });
                };
                //打开应用到其他表模块
                $ctrl.openApplyToModal =function () {
                    var modalIns = $uibModal.open({
                        component: 'applyToOther',
                        windowClass:'small-modal-panel',
                        size:'sm',
                        resolve:{
                            tables:function () {
                                return etlService.fetchEtlTable($ctrl.comInfo,$ctrl.current.uname);
                            },
                            selected:function () {
                                return $ctrl.selectTab;
                            }
                        }
                    });
                    modalIns.result.then(function (arr) {
                        $ctrl.otherTables=[];
                        angular.forEach(arr,function (v) {
                            $ctrl.otherTables.push(v.name);
                        })
                    });
                };
            }]
        })
        .component('databaseModal',{
            templateUrl:'etl_view/database.component.html',
            bindings:{
                resolve:'<',
                dismiss:'&',
                close:'&'
            },
            controller:['etlService',function (etlService) {
                var $ctrl = this;
                $ctrl.model={};//数据库信息
                $ctrl.notPass=true;
                $ctrl.isTest=false;
                //Dip支持的数据库类型
                $ctrl.dbs=['oracle','db2','sqlserver','gbase-8a','mysql','informix','sybase','altibase','postgresql','oscar','dameng','kingbase','vertica','dbone','kdb'];
                $ctrl.$onInit=function () {
                    if($ctrl.resolve && $ctrl.resolve.model){
                        $ctrl.model=$ctrl.resolve.model;
                        // if(!$ctrl.model.db_port){
                        //     // $ctrl.model.db_port=1521;
                        // }
                    }
                };
                //测试数据库连接
                $ctrl.testDbConnect=function () {
                    $ctrl.isTest=true;
                    etlService.testDbConnect($ctrl.model).then(function (bb) {
                        $ctrl.notPass=!bb;
                    }).finally(function () {
                        $ctrl.isTest=false;
                    });
                };
                //保存数据库信息
                $ctrl.saveDbInfo=function () {
                    $ctrl.close({$value:$ctrl.model});
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
            }]
        })
        .component('operationModal',{
            templateUrl:'etl_view/operation.component.html',
            bindings:{
                resolve:'<',
                close:'&',
                dismiss:'&'
            },
            controller:['$uibModal','etlService','$log',function ($uibModal,etlService,$log) {
                var $ctrl =this;
                $ctrl.bindNameVisble=false;
                $ctrl.model={};
                $ctrl.operate='';
                $ctrl.newTip=false;
                $ctrl.flags=[{id:1,checked:false,name:'aaa',value:'bbb'},{id:2,checked:false,name:'ccc',value:'ddd'}];
                $ctrl.selList=[];
                $ctrl.allList=[];
                $ctrl.unselList=[];
                $ctrl.$onInit =function () {
                    $ctrl.current=this.resolve.current;
                    $ctrl.comInfo=this.resolve.comInfo;
                    $ctrl.clist=this.resolve.clist;
                    angular.forEach($ctrl.clist,function (v) {
                        $ctrl.allList.push(v.column_name);
                    });
                    $ctrl.row={
                        bdList:[],
                        dbInfo:{},
                        clist:$ctrl.clist,
                        expression:'',
                        connect_db:'yes'
                    };
                };
                //切换转换类型
                $ctrl.changeOperation=function () {
                    if($ctrl.operate==='inserttoupdate'){
                        $ctrl.newTip=false;
                        $ctrl.getOperationInfo('inserttoupdate');
                    }else if($ctrl.operate==='updatetoinsert'){
                        $ctrl.newTip=true;
                        $ctrl.getOperationInfo('updatetoinsert');
                    }else if($ctrl.operate==='deletetoupdate'){
                        $ctrl.newTip=true;
                        $ctrl.getOperationInfo('deletetoupdate');
                    }else{
                        $ctrl.newTip=false;
                    }
                };
                //获取配置信息
                $ctrl.getOperationInfo=function (tt) {
                    etlService.getEtlOperationConfig($ctrl.comInfo,$ctrl.current,tt).then(function (model) {
                        if(!$.isEmptyObject(model)){
                            $ctrl.row=model;
                            $ctrl.row.clist=$ctrl.clist;
                            $ctrl.model=model.dbInfo;
                            $ctrl.flags=model.flags;
                            $ctrl.selList=model.selList;
                            if($ctrl.selList.length===0){
                                $ctrl.selList=$ctrl.allList;
                            }
                        }
                    });
                };
                //向文本框里面插入字段
                $ctrl.insertToText=function (field) {
                    if($ctrl.row.connect_db==='yes'){
                        field=':'+field;
                    }else{
                        field='{'+field+'}';
                    }
                    var bjq_expression=$("#bjq_expression");
                    bjq_expression.focus().insertToText(field);
                    $ctrl.row.expression=bjq_expression.val();
                };
                //配置数据库
                $ctrl.dbConfig=function () {
                    var modalInstance2 = $uibModal.open({
                        component: 'databaseModal',
                        size:'md',
                        resolve:{
                            model:function () {
                                return $ctrl.model;
                            }
                        }
                    });
                    modalInstance2.result.then(function (model) {
                        $ctrl.row.dbInfo=model;
                    });
                };
                //表达式合法性检查
                $ctrl.checkExpression=function () {
                    var expression= Base64.encode($ctrl.row.expression);
                    etlService.expressionCheck($ctrl.comInfo,$ctrl.current.uname,$ctrl.current.tname,$ctrl.row.connect_db,expression).then(function (list) {
                        $ctrl.row.bdList=list;
                    });
                };
                //保存表达式信息
                $ctrl.saveExpression=function () {
                    var expression= Base64.encode($ctrl.row.expression);
                    etlService.expressionCheck($ctrl.comInfo,$ctrl.current.uname,$ctrl.current.tname,$ctrl.row.connect_db,expression).then(function (list) {
                        $ctrl.row.bdList=list;
                    }).finally(function () {
                        $ctrl.row.oper_type=$ctrl.operate;
                        if($ctrl.row.oper_type==='deletetoupdate'){
                            if($ctrl.unselList.length===0){
                                $ctrl.row.reserve_all='yes';
                            }else{
                                $ctrl.row.reserve_all='no';
                            }
                            $ctrl.row.newList=[];
                            angular.forEach($ctrl.clist,function (v) {
                               if($.inArray(v.column_name,$ctrl.selList)>=0){
                                   $ctrl.row.newList.push({name:v.column_name,type:v.column_type});
                               }
                            });
                        }
                        etlService.saveEtlOperationConfig($ctrl.comInfo,$ctrl.current,$ctrl.row);
                        $ctrl.close();
                    });
                };
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
                //删除标记
                $ctrl.deleteFlag=function () {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'delete_flag.model.html',
                        controller: ['$uibModalInstance','flags','tipsService',function ($uibModalInstance,flags,dipT) {
                            var $ct =this;
                            $ct.flags=flags;
                            $ct.ckAll=false;
                            $ct.ok = function () {
                                $uibModalInstance.close($ct.flags);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $ct.addRow=function () {
                                var maxNum=0;
                                if($ct.flags.length>0){
                                    maxNum=$ct.flags[$ct.flags.length-1].id+1;
                                }
                                $ct.flags.push({id:maxNum,checked:false,name:'',value:''});
                            };
                            $ct.removeRow=function () {
                                var newArr=[];
                                angular.forEach($ct.flags,function (v) {
                                    if(!v.checked){
                                        newArr.push(v);
                                    }
                                });
                                if(newArr.length===$ct.flags.length){
                                    dipT.error('您没有选中任何行！');
                                }else{
                                    $ct.flags=newArr;
                                }
                            };
                            $ct.changeCA =function() {
                                angular.forEach($ct.flags,function (v) {
                                    v.checked=$ct.ckAll;
                                });
                            };
                            $ct.sonChange=function (item) {
                                var flag=true;
                                if(item.checked){
                                    angular.forEach($ct.flags,function (v) {
                                        if(!v.checked){
                                            flag=false;
                                        }
                                    });
                                    if(flag){
                                        $ctrl.ckAll=true;
                                    }
                                }else{
                                    $ctrl.ckAll=false;
                                }
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            flags:function () {
                                return $ctrl.flags;
                            }
                        }
                    });
                    modalInstance.result.then(function (newList) {
                        var arr=[];
                        angular.forEach(newList,function (v) {
                           if(v.name && v.value){
                               arr.push(v);
                           }
                        });
                        $ctrl.flags=arr;
                    });
                };
                //保留原值字段
                $ctrl.keepFieldList=function () {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'keepFieldList.model.html',
                        controller: ['$uibModalInstance','model',function ($uibModalInstance,model) {
                            var $ct =this;
                            $ct.selList=model.selList;
                            $ct.unselList=[];
                            angular.forEach(model.list,function (v) {
                                if($.inArray(v,model.selList)<0){
                                    $ct.unselList.push(v);
                                }
                            });
                            $ct.unselModel=[];
                            $ct.selModel=[];
                            $ct.left='>>';
                            $ct.right='<<';
                            $ct.ok = function () {
                                $uibModalInstance.close({selList:$ct.selList,unselList:$ct.unselList});
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $ct.pushSelect=function () {
                                if($ct.unselModel && $ct.unselModel.length>0){
                                    var arr=[];
                                    angular.forEach($ct.unselList,function (val) {
                                        if($.inArray(val,$ct.unselModel)<0){
                                            arr.push(val);
                                        }else{
                                            $ct.selList.push(val);
                                        }
                                    });
                                    arr.sort();
                                    $ct.unselList =arr;
                                    $ct.unselModel=[];
                                }
                            };
                            $ct.removeSelect=function () {
                                if($ct.selModel && $ct.selModel.length>0){
                                    var arr=[];
                                    angular.forEach($ct.selList,function (val) {
                                        if($.inArray(val,$ct.selModel)<0){
                                            arr.push(val);
                                        }else{
                                            $ct.unselList.push(val);
                                        }
                                    });
                                    arr.sort();
                                    $ct.selList =arr;
                                    $ct.selModel=[];
                                }
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            model:function () {
                                return {
                                    list:$ctrl.allList,
                                    selList:$ctrl.selList
                                };
                            }
                        }
                    });
                    modalInstance.result.then(function (db) {
                        $ctrl.selList=angular.copy(db.selList);
                        $ctrl.unselList=angular.copy(db.unselList);
                    });
                };
            }]
        })
        .component('etlBglRule',{
            templateUrl:'etl_view/bgl.component.html',
            bindings:{
                users:'<'
            },
            controller:['$stateParams','etlService',function($stateParams,etlService) {
                var $ctrl =this;
                $ctrl.selUsers=[];
                $ctrl.tables=[];
                $ctrl.selTables=[];
                $ctrl.tj='include';
                $ctrl.currentName='';
                $ctrl.loading=false;
                $ctrl.ckAll=false;
                $ctrl.list=[];
                $ctrl.geting = false;
                $ctrl.$onInit =function () {

                };
                //获取table
                $ctrl.getTable=function (uname, $event) {
                    if($ctrl.geting){
                        return;
                    }
                    $ctrl.geting = true;
                    createData($ctrl.currentName);
                    $ctrl.currentName=uname;
                    $ctrl.loading=true;
                    $ctrl.tables=[];
                    etlService.getEtlBglList($stateParams,uname,$ctrl.tj).then(function (data) {
                        handleData(data,uname);
                    }).finally(function () {
                        $ctrl.loading = false;
                        $ctrl.geting = false;
                    });
                    $($event.target).parent().addClass('active').siblings().removeClass('active');
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
                //保存表过滤规则
                $ctrl.saveEtlBglRule=function () {
                    createData($ctrl.currentName);
                    etlService.saveEltBglRule($stateParams,$ctrl.list);
                };
                Array.prototype.unique = function(){
                    var res = [];
                    var json = {};
                    for(var i = 0; i < this.length; i++){
                        if(!json[this[i]]){
                            res.push(this[i]);
                            json[this[i]] = 1;
                        }
                    }
                    return res;
                };
                //数据处理
                function handleData(data,uname) {
                    $ctrl.tj=data.flag;
                    angular.forEach($ctrl.list,function (v) {
                        if(v.user===uname){
                            data.tables=data.tables.concat(v.list).unique();
                            $ctrl.tj=v.flag;
                        }
                    });
                    angular.forEach(data.tables,function (v) {
                        $ctrl.tables.push({checked:true,name:v});
                    });
                    angular.forEach(data.list,function (v) {
                        $ctrl.tables.push({checked:false,name:v});
                    });
                }
                function createData(uname) {
                    var item={user:uname,flag:$ctrl.tj,list:[]},flag=true;
                    angular.forEach($ctrl.tables,function (v) {
                        if(v.checked){
                            item.list.push(v.name);
                        }
                    });
                    angular.forEach($ctrl.list,function (v) {
                        if(v.user===uname){
                            v.list=item.list;
                            v.flag=$ctrl.tj;
                            flag=false;
                        }
                    });
                    if($ctrl.tables.length>0){
                        if(flag){
                            $ctrl.list.push(item);//插入数据
                        }
                    }
                }

            }]
        })
        .component('etlOperateRule',{
            templateUrl:'etl_view/op_filter.component.html',
            bindings:{
                users:'<'
            },
            controller:['$stateParams','etlService','$log','$uibModal',function($stateParams,etlService,$log,$uibModal) {
                var $ctrl =this;
                $ctrl.selUsers=[];
                $ctrl.tables=[];
                $ctrl.selTables=[];
                $ctrl.tj='include';
                $ctrl.currentName='';
                $ctrl.loading=false;
                $ctrl.ckAll=false;
                $ctrl.list=[];
                $ctrl.$onInit =function () {

                };
                //获取table
                $ctrl.getTable=function (uname,$event) {
                    createData($ctrl.currentName);
                    $ctrl.currentName=uname;
                    $ctrl.loading=true;
                    $ctrl.tables=[];
                    etlService.getEtlCzglList($stateParams,uname).then(function (data) {
                        handleData(data,uname);
                    }).finally(function () {
                        $ctrl.loading=false;
                    });
                    $($event.target).parent().addClass('active').siblings().removeClass('active');
                };
                //编辑表达式
                $ctrl.editExpression=function (item) {
                    etlService.fetchEtlYdzdList($stateParams,$ctrl.currentName,item.name).then(function (clist) {
                        var row={
                            id:item.id,
                            bdList:item.bdList,
                            clist:clist,
                            dbInfo:item.dbInfo,
                            expression:item.expression,
                            connect_db:item.connect_db
                        };
                        $ctrl.openExpressPanel(row,item.name);
                    });
                };
                //打开表达式编辑界面
                $ctrl.openExpressPanel =function (model,tname) {
                    var modalIns= $uibModal.open({
                        component: 'expressionPanel',
                        size:'lg',
                        resolve:{
                            row:function () {
                                return model;
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:$ctrl.currentName,tname:tname};
                            },
                            type:function () {
                                return 'large';
                            }
                        }
                    });
                    modalIns.result.then(function (row) {
                        angular.forEach($ctrl.tables,function (v) {
                            if(v.id===row.id){
                                v.bdList=row.bdList;
                                v.dbInfo=row.dbInfo;
                                v.expression=row.expression;
                                v.connect_db=row.connect_db;
                            }
                        });
                    });
                };
                //全选不全选
                $ctrl.checkAll=function (num) {
                    if(num===1){
                        if($ctrl.ckAllIns){
                            angular.forEach($ctrl.selTables,function (v) {
                                v.tab_ins=true;
                            });
                        }else{
                            angular.forEach($ctrl.selTables,function (v) {
                                v.tab_ins=false;
                            });
                        }
                    }else if(num===2){
                        if($ctrl.ckAllDel){
                            angular.forEach($ctrl.selTables,function (v) {
                                v.tab_del=true;
                            });
                        }else{
                            angular.forEach($ctrl.selTables,function (v) {
                                v.tab_del=false;
                            });
                        }
                    }else if(num===3){
                        if($ctrl.ckAllUpt){
                            angular.forEach($ctrl.selTables,function (v) {
                                v.tab_upt=true;
                            });
                        }else{
                            angular.forEach($ctrl.selTables,function (v) {
                                v.tab_upt=false;
                            });
                        }
                    }
                };
                //单选
                $ctrl.checkOne=function (item,flag) {
                    var num=0;
                    if(flag===1){
                        num=0;
                        if(item.checked){
                            angular.forEach($ctrl.selTables,function (v) {
                                if(v.tab_ins){
                                    num++
                                }
                            });
                            if(num===$ctrl.tables.length){
                                $ctrl.ckAllIns=true;
                            }
                        }else{
                            $ctrl.ckAllIns=false;
                        }
                    }else if(flag===2){
                        num=0;
                        if(item.checked){
                            angular.forEach($ctrl.selTables,function (v) {
                                if(v.tab_del){
                                    num++
                                }
                            });
                            if(num===$ctrl.tables.length){
                                $ctrl.ckAllDel=true;
                            }
                        }else{
                            $ctrl.ckAllDel=false;
                        }
                    }else if(flag===3){
                        num=0;
                        if(item.checked){
                            angular.forEach($ctrl.selTables,function (v) {
                                if(v.tab_upt){
                                    num++
                                }
                            });
                            if(num===$ctrl.tables.length){
                                $ctrl.ckAllUpt=true;
                            }
                        }else{
                            $ctrl.ckAllUpt=false;
                        }
                    }
                };
                //保存操作过滤规则
                $ctrl.saveEtlCzglRule=function () {
                    createData($ctrl.currentName);
                    etlService.saveEtlCzglRule($stateParams,$ctrl.list);
                };
                //数据处理
                function handleData(data,uname) {
                    angular.forEach($ctrl.list,function (v) {
                        if(v.user===uname){
                            data.list=v.lsList;
                        }
                    });
                    $ctrl.tables=data.list;
                }
                function createData(uname) {
                    var item={user:uname,list:[],lsList:$ctrl.tables},flag=true;
                    angular.forEach($ctrl.tables,function (v) {
                        if(v.tab_ins || v.tab_del || v.tab_upt){
                            item.list.push(v);
                        }
                    });
                    angular.forEach($ctrl.list,function (v) {
                        if(v.user===uname){
                            v.list=item.list;
                            flag=false;
                        }
                    });
                    if($ctrl.tables.length>0){
                        if(flag){
                            $ctrl.list.push(item);//插入数据
                        }
                    }
                }
            }]
        })
        .component('etlPlRule',{
            templateUrl:'etl_view/pl_filter.component.html',
            bindings:{
                users:'<'
            },
            controller:['$stateParams','etlService','tipsService','$uibModal', '$log',function($stateParams,etlService,dipT,$uibModal, $log) {
                var $ctrl =this;
                $ctrl.selUsers=[];
                $ctrl.rules=[];
                $ctrl.selRules=[];
                $ctrl.loading=false;
                $ctrl.ckAll=false;
                $ctrl.addBtnTip='添加新的规则名称';
                $ctrl.applyTips='复用规则到选中表';
                $ctrl.filter_way='filter';
                $ctrl.newRuleName='';
                $ctrl.addIng=false;
                $ctrl.clist=[];
                $ctrl.currentName='';
                $ctrl.isApply=false;
                $ctrl.$onInit =function () {
                    // $ctrl.users=[];
                    if($ctrl.users && angular.isArray($ctrl.users) && $ctrl.users.length>0){
                        $ctrl.currentName = $ctrl.users[0];
                    }
                };
                //全选不全选
                $ctrl.checkAll=function () {
                    angular.forEach($ctrl.rules,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.checkOne=function (item) {
                    var num=0;
                    if(item.checked){
                        angular.forEach($ctrl.rules,function (v) {
                            if(v.checked){
                                num++
                            }
                        });
                        if(num===$ctrl.rules.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //获取当前
                $ctrl.getRule=function (name,$event) {
                    var rule={rule_type:$ctrl.filter_way,batch_name:name};
                    $ctrl.currentName=name;
                    $ctrl.rules = [];
                    $ctrl.loading=true;
                    $ctrl.ckAll=false;
                    etlService.getBatchRules($stateParams,rule).then(function (list) {
                        $ctrl.rules=list;
                    }).finally(function () {
                        $ctrl.loading=false;
                    });
                    $($event.target).parent().addClass('active').siblings().removeClass('active');
                };
                //切换规则
                $ctrl.changeRuleType=function () {
                    etlService.fetchBatchs($stateParams,$ctrl.filter_way).then(function (data) {
                        $ctrl.users=data;
                        $ctrl.rules=[];
                    });
                };
                //保存批量配置信息
                $ctrl.savePlRule=function () {
                    var arr = [];
                    var rules = angular.copy($ctrl.rules);
                    angular.forEach(rules,function (v) {
                        if(v.coder){
                            if(v.expression){
                                v.expression=Base64.encode(v.expression);
                            }
                            arr.push(v);
                        }
                    });
                    // if(arr.length===0){
                    //     dipT.error('请添加至少一条规则并且确保变量名不能为空！');
                    //     return;
                    // }
                    etlService.saveBatchRules($stateParams, $ctrl.filter_way, $ctrl.currentName, arr);
                };
                //删除行
                $ctrl.deleteColumn=function () {
                    var cks=$('#etlPlList').find('input.etl-pl-item:checked').length;
                    if(cks>0){
                        var arr =[];
                        angular.forEach($ctrl.rules,function (v) {
                            if(!v.checked){
                                arr.push(v);
                            }
                        });
                        $ctrl.rules=arr;
                        $ctrl.ckAll=false;
                    }else{
                        dipT.warning('你没有选中任何数据！');
                    }
                };
                //添加新行
                $ctrl.addNewColumn=function () {
                    var item={},num=0;
                    if($ctrl.rules.length>0){
                        num=$ctrl.rules[$ctrl.rules.length-1].id+1;
                    }
                    item.id=num;
                    item.checked=false;
                    item.coder='';
                    item.resered='yes';
                    item.expression='';
                    item.value='';
                    item.bdList=[];
                    item.dbInfo={};
                    item.list=[];
                    $ctrl.rules.push(item);
                };
                //编辑表达式
                $ctrl.editExpression=function (item) {
                    var row={
                        id: item.id,
                        bdList: item.bdList,
                        clist: [],
                        dbInfo: item.dbInfo,
                        expression: item.expression,
                        connect_db: item.connect_db ? item.connect_db:'yes'
                    };
                    $ctrl.openExpressPanel(row);
                };
                //打开表达式编辑界面
                $ctrl.openExpressPanel =function (model) {
                    var modalIns= $uibModal.open({
                        component: 'expressionPanel',
                        size:'lg',
                        resolve:{
                            row:function () {
                                return model;
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            current:function () {
                                return {uname:'',tname:''};
                            },
                            allowTable:true,
                            type:function () {
                                return 'pl';
                            }
                        }
                    });
                    modalIns.result.then(function (row) {
                        angular.forEach($ctrl.rules,function (v) {
                            if(v.id===row.id){
                                v.bdList=row.bdList;
                                v.dbInfo=row.dbInfo;
                                v.expression=row.expression;
                                if(typeof(row.expression) ==='string' && row.expression.length>10){
                                    v.value=row.expression.substring(0,10)+'...';
                                }else{
                                    v.value= row.expression;
                                }
                                v.connect_db=row.connect_db;
                            }
                        });
                    });
                };
                //应用到其他表
                $ctrl.applyRuleToOthers=function (item) {
                    $ctrl.isApply=true;
                    var modalIns= $uibModal.open({
                        component: 'selectTableModal',
                        size:'lg',
                        resolve:{
                            users:function () {
                                return etlService.fetchEtlUser($stateParams);
                            },
                            comInfo:function () {
                                return $stateParams;
                            },
                            list:function () {
                                return item.list;
                            }
                        }
                    });
                    modalIns.result.then(function (rowList) {
                        angular.forEach($ctrl.tables,function (v) {
                            if(v.id===item.id){
                                v.list=rowList;
                            }
                        });
                        $ctrl.isApply=false;
                    },function () {
                        $ctrl.isApply=false;
                    });
                };
                //添加规则名
                $ctrl.addRuleName=function () {
                    if(!/^[a-zA-Z]\w{0,29}$/.test($ctrl.newRuleName)){
                        dipT.error('规则名只能包含数字、字母、下划线，且长度不能超过30个字符');
                        return;
                    }
                    var flag=true;
                    angular.forEach($ctrl.users,function (v) {
                        if(v===$ctrl.newRuleName){
                            flag=false;
                        }
                    });
                    if(flag){
                        $ctrl.users.unshift($ctrl.newRuleName);
                        $ctrl.currentName= $ctrl.newRuleName;
                        $ctrl.newRuleName='';
                    }else{
                        dipT.error('新规则名不能与已有规则名重复！');
                    }

                };
            }]
        })
        .component('selectTableModal',{
            templateUrl:'etl_view/select_table.component.html',
            bindings:{
                resolve:'<',//users,comInfo,list
                close:'&',
                dismiss:'&'
            },
            controller:['$log','etlService',function($log,etlService) {
                var $ctrl =this;
                $ctrl.selUsers=[];
                $ctrl.tables=[];
                $ctrl.selTables=[];
                $ctrl.currentName='';
                $ctrl.loading=false;
                $ctrl.ckAll=false;
                $ctrl.list=[];
                $ctrl.$onInit =function () {
                    $ctrl.users=$ctrl.resolve.users;
                    $ctrl.comInfo=$ctrl.resolve.comInfo;
                    if($ctrl.resolve.list){
                        $ctrl.list=$ctrl.resolve.list;
                    }
                };
                //获取table
                $ctrl.getTable=function (uname,$event) {
                    createData($ctrl.currentName);
                    $ctrl.currentName=uname;
                    $ctrl.loading=true;
                    $ctrl.tables=[];
                    $ctrl.ckAll=false;
                    etlService.fetchEtlTable($ctrl.comInfo,uname).then(function (data) {
                        handleData(data,uname);
                    }).finally(function () {
                        $ctrl.loading=false;
                    });
                    $($event.target).parent().addClass('active').siblings().removeClass('active');
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
                //保存表过滤规则
                $ctrl.saveSelectList=function () {
                    createData($ctrl.currentName);
                    $ctrl.close({$value: $ctrl.list});
                };
                //数据处理
                function handleData(data,uname) {
                    var arr=[];
                    angular.forEach($ctrl.list,function (v) {
                        if(v.user===uname){
                            arr=v.list;
                        }
                    });
                    angular.forEach(data,function (v) {
                        if($.inArray(v,arr)>=0){
                            $ctrl.tables.push({checked:true,name:v});
                        }else{
                            $ctrl.tables.push({checked:false,name:v});
                        }
                    });
                }
                function createData(uname) {
                    var item={user:uname,list:[]},flag=true;
                    angular.forEach($ctrl.tables,function (v) {
                        if(v.checked){
                            item.list.push(v.name);
                        }
                    });
                    angular.forEach($ctrl.list,function (v) {
                        if(v.user===uname){
                            v.list=item.list;
                            flag=false;
                        }
                    });
                    if($ctrl.tables.length>0){
                        if(flag){
                            $ctrl.list.push(item);//插入数据
                        }
                    }
                }
                //关闭弹窗
                $ctrl.cancel = function () {
                    $ctrl.dismiss({$value: 'cancel'});
                };
            }]
        })
        .component('configRule',{
            templateUrl:'etl_view/cfg_rule.component.html',
            controller:['$stateParams','etlService','$uibModal',function($stateParams,etlService,$uibModal) {
                var $ctrl=this;
                $ctrl.currentRuleName='增加列';
                $ctrl.isBgl=false;
                $ctrl.isCzzh=false;
                $ctrl.currentCzzh='insert_to_update';
                $ctrl.isInclude='include';
                $ctrl.list=[];
                $ctrl.include=[];
                $ctrl.exclude=[];
                etlService.fetchSettingRule($stateParams,'add_column').then(function (list) {
                    $ctrl.list=list;
                });
                $ctrl.currentNum=1;
                $ctrl.$onInit=function () {

                };
                //切换是否包含
                $ctrl.changeType=function () {
                    if($ctrl.isInclude==='include'){
                        $ctrl.list=$ctrl.include;
                    }else{
                        $ctrl.list=$ctrl.exclude;
                    }
                };
                //切换操作转换
                $ctrl.changeOperation=function () {
                    // $ctrl.isCzzh=true;
                    $ctrl.currentRuleName='操作转换';
                    etlService.fetchSettingRule($stateParams,$ctrl.currentCzzh).then(function (list) {
                        $ctrl.list=list;
                    });
                };
                //切换规则
                $ctrl.changeRule=function (num) {
                    $ctrl.isBgl=false;
                    $ctrl.isCzzh=false;
                    $ctrl.currentNum=num;
                    if(num===1){
                        $ctrl.currentRuleName='增加列';
                        etlService.fetchSettingRule($stateParams,'add_column').then(function (list) {
                            $ctrl.list=list;
                        });
                    }else if(num===2){
                        $ctrl.currentRuleName='映射列';
                        etlService.fetchSettingRule($stateParams,'column_mapping').then(function (list) {
                            $ctrl.list=list;
                        });
                    }else if(num===3){
                        $ctrl.currentRuleName='删除列';
                        etlService.fetchSettingRule($stateParams,'delete_column').then(function (list) {
                            $ctrl.list=list;
                        });
                    }else if(num===4){
                        $ctrl.currentRuleName='记录过滤';
                        etlService.fetchSettingRule($stateParams,'record_filter').then(function (list) {
                            $ctrl.list=list;
                        });
                    }else if(num===5){
                        $ctrl.currentRuleName='审计表';
                        etlService.fetchSettingRule($stateParams,'table_audit').then(function (list) {
                            $ctrl.list=list;
                        });
                    }else if(num===6){
                        $ctrl.isBgl=true;
                        $ctrl.currentRuleName='表过滤';
                        etlService.fetchSettingRule($stateParams,'table_filter').then(function (list) {
                            $ctrl.include=[];
                            $ctrl.exclude=[];
                            angular.forEach(list,function (v) {
                                if(v.type==='include'){
                                    $ctrl.include.push(v);
                                }else{
                                    $ctrl.exclude.push(v);
                                }
                            });
                            $ctrl.list=$ctrl.include;
                        });
                    }else if(num===7){
                        $ctrl.currentRuleName='操作过滤';
                        etlService.fetchSettingRule($stateParams,'operation_filter').then(function (list) {
                            $ctrl.list=list;
                        });
                    }else if(num===8){
                        $ctrl.isCzzh=true;
                        $ctrl.currentRuleName='操作转换';
                        etlService.fetchSettingRule($stateParams,$ctrl.currentCzzh).then(function (list) {
                            $ctrl.list=list;
                        });
                    }
                };
                //展示详情
                $ctrl.showDetail =function (item) {
                    if($ctrl.currentNum===6){
                        return;
                    }
                    // var nowCzzhType=$ctrl.currentCzzh;
                    $uibModal.open({
                        templateUrl: 'cfgRuleDetailModal.html',
                        controller: ['$uibModalInstance','model','etlService',function ($uibModalInstance,model,etlService) {
                            var $ct =this;
                            $ct.loading=false;
                            $ct.list=[];
                            $ct.model=model;
                            //操作转换
                            $ct.nowCzzhType=$ctrl.currentCzzh;
                            $ct.czzhModel={};
                            if($ct.model.cnum===1){
                                $ct.loading=true;
                                etlService.fetchEtlAddConfig(model.comInfo,model.uname,model.tname).then(function (data) {
                                    $ct.list=data.addList;
                                }).finally(function () {
                                    $ct.loading=false;
                                });
                            }else if($ct.model.cnum===2){
                                $ct.loading=true;
                                etlService.fetchEtlMapConfig(model.comInfo,model.uname,model.tname).then(function (data) {
                                    $ct.list=data.addList;
                                }).finally(function () {
                                    $ct.loading=false;
                                });
                            }else if($ct.model.cnum===3){
                                $ct.loading=true;
                                etlService.fetchEtlDeleteConfig(model.comInfo,model.uname,model.tname).then(function (data) {
                                    $ct.list=data.addList;
                                }).finally(function () {
                                    $ct.loading=false;
                                });
                            }else if($ct.model.cnum===4){
                                $ct.loading=true;
                                etlService.fetchEtlConditionConfig(model.comInfo,model.uname,model.tname).then(function (data) {
                                    $ct.list=data.addList;
                                }).finally(function () {
                                    $ct.loading=false;
                                });
                            }else if($ct.model.cnum===5){
                                $ct.loading=true;
                                etlService.fetchEtlTransformConfig(model.comInfo,model.uname,model.tname).then(function (data) {
                                    $ct.list=data.addList;
                                }).finally(function () {
                                    $ct.loading=false;
                                });
                            }else if($ct.model.cnum===7){
                                var expression='';
                                if(model.item){
                                    if(model.item.expression){
                                        expression=Base64.decode(model.item.expression);
                                    }
                                    $ct.list.push({tab_ins:model.item.tab_ins,tab_del:model.item.tab_del,tab_upt:model.item.tab_upt,expression:expression});
                                }
                            }else if($ct.model.cnum===8){
                                $ct.czzhModel.expression='';
                                $ct.czzhModel.bjs=[];
                                $ct.czzhModel.zds='';
                                var rType='';
                                if($ct.nowCzzhType==='update_to_insert_or_delete'){
                                    rType='updatetoinsert';
                                }else{
                                    rType=$ct.nowCzzhType.replace(/_/g,'');
                                }
                                etlService.getEtlOperationConfig(model.comInfo,model,rType).then(function (data) {
                                    if(!$.isEmptyObject(data)){
                                        $ct.czzhModel.expression=data.expression;
                                        $ct.czzhModel.bjs=data.flags;
                                        $ct.czzhModel.zds=data.selList.toString();
                                    }
                                });
                            }
                            $ct.showFlags=function (list) {
                                var strTr='<tr>';
                                angular.forEach(list,function (v) {
                                    strTr+='<td>'+v.name+'</td><td>固定字符串</td><td>'+v.value+'</td>'
                                });
                                strTr+='</tr>';
                                var modelStr ='<div class="etl-flags">' +
                                    '<table  class="table table-bordered">' +
                                    '<colgroup>'+
                                    '<col style="width: 30%">'+
                                    '<col style="width: 30%">'+
                                    '<col style="width: 40%">'+
                                    '</colgroup>'+
                                    '<tr>'+
                                    '<td>字段名称</td>'+
                                    '<td>值类型</td>'+
                                    '<td>字段值</td>'+
                                    '</tr>' +
                                     strTr +
                                    '</table>' +
                                    '</div>';
                                var dialog = new BootstrapDialog({
                                    title:'删除标记列表',//导出信息
                                    message: $(modelStr),
                                    type:'type-info',
                                    closable: true,
                                    cssClass:'etl-flags-dialog-model'
                                    // size:'size-small'
                                });
                                dialog.open();
                            };
                            $ct.ok = function () {
                                $ct.model.cz='add';
                                $uibModalInstance.close($ct.model);
                            };
                            $ct.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }],
                        controllerAs: '$ct',
                        windowClass:'small-modal-panel',
                        size:'md',
                        resolve:{
                            model:function () {
                                return {uname:item.user,tname:item.table,cnum:$ctrl.currentNum,comInfo:$stateParams,item:item};
                            }
                        }
                    });
                };
            }]
        })
        .component('etlApplyRule',{
            templateUrl:'etl_view/apply_rule.component.html',
            bindings:{
                rules:'<'
            },
            controller:['etlService','tipsService','$stateParams',function(etlService,dipT,$stateParams) {
                var $ctrl =this;
                $ctrl.selUsers=[];
                // $ctrl.rules=[];
                $ctrl.selRules=[];
                $ctrl.loading=false;
                $ctrl.ckAll=false;
                $ctrl.ruleType='filter';
                $ctrl.codes=[];//字段列表
                $ctrl.selCodes=[];
                $ctrl.clist=[];
                $ctrl.$onInit =function () {
                };
                //获取Codes列表
                $ctrl.getCodes=function (item,$event) {
                    $ctrl.codes=item.codes;
                    $($event.target).parent().addClass('active').siblings().removeClass('active');
                };
                //保存 batch信息
                $ctrl.saveApplyRuleInfo=function () {
                    etlService.saveBatchInfo($stateParams,$ctrl.ruleType,$ctrl.rules);
                };
                //切换规则
                $ctrl.changeRuleType=function () {
                    etlService.getBatchCheckedList($stateParams,$ctrl.ruleType).then(function (rules) {
                        $ctrl.rules=rules;
                        $ctrl.codes=[];
                    });
                };
                //全选不全选
                $ctrl.checkAll=function () {
                    angular.forEach($ctrl.selCodes,function (v) {
                        v.checked=$ctrl.ckAll;
                    });
                };
                //单选
                $ctrl.checkOne=function (item) {
                    var num=0;
                    if(item.checked){
                        angular.forEach($ctrl.selCodes,function (v) {
                            if(v.checked){
                                num++
                            }
                        });
                        if(num===$ctrl.rules.length){
                            $ctrl.ckAll=true;
                        }
                    }else{
                        $ctrl.ckAll=false;
                    }
                };
                //删除行
                $ctrl.deleteColumn=function () {
                    var cks=$('#etlPtRulePanel').find('input.etl-pt-li-son:checked').length;
                    if(cks>0){
                        var arr =[];
                        angular.forEach($ctrl.codes,function (v) {
                            if(!v.checked){
                                arr.push(v);
                            }
                        });
                        $ctrl.codes=arr;
                        $ctrl.ckAll=false;
                    }else{
                        dipT.warning('你没有选中任何数据！');
                    }
                };
                //添加新行
                $ctrl.addNewColumn=function () {
                    var item={},num=0;
                    if($ctrl.codes.length>0){
                        num=$ctrl.codes[$ctrl.codes.length-1].id+1;
                    }
                    item.id=num;
                    item.checked=false;
                    item.code='';
                    item.name='';
                    $ctrl.codes.push(item);
                };
            }]
        });
})();