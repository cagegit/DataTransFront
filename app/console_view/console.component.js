/**
 * Created by cagej on 2017/4/26.
 */
(function () {
    'use strict';
    angular.module("myApp.consoleComponent",[])
        .component('captureConsole',{
            templateUrl:'console_view/captureCon.component.html',
            bindings:{
                trans:'<'
            },
            controller:['$scope','$rootScope','$stateParams','tipsService','$interval','$filter','$q','csService',function ($scope,$rootScope,$stateParams,dipT,$interval,$filter,$q,csService) {
                var $ctrl = this;
                var comInfo = $stateParams;
                $ctrl.cons = {
                    cons:true,
                    currentTab:'tab1',
                    chart:null,
                    option:null
                };
                $ctrl.data = {
                    start_scn:'',
                    complete_scn: 0,
                    complete_xid: 0,
                    servers:[],
                    offset:0,
                    errors:[],
                    logs:'',
                    isFresh:false,
                    freshWay:'1'
                };
                //Capture 抓取统计
                var thread,stopTime,error_num=0,log_errs=0,conEventRes;
                $ctrl.$onInit=function () {
                    //生成Chart图形
                    createCharts($q,$ctrl.trans.Co_cpzqtj,$ctrl.trans.Co_tj).then(function (res) {
                        $ctrl.cons.chart = res.chart;
                        $ctrl.cons.option = res.option;
                        //获取Capture组件的状态信息
                        fetchCaptureStatus().then(function (dat) {
                            if(!comInfo){
                                return;
                            }
                            if(dat.status===3){
                                thread=dat.data;
                                $ctrl.data.currentId=thread.pid;
                                fetchLogs(csService,$ctrl,comInfo,thread,dipT,log_errs);
                                stopTime = $interval(function () {
                                    fetchCaptureStatus().then(function (da) {
                                        if(da.status===1){
                                            error_num++;
                                            if(error_num<2){
                                                dipT.error(da.msg);
                                            }
                                        }else if(da.status===3){
                                            error_num=0;
                                            fetchLogs(csService,$ctrl,comInfo,da.data,dipT,log_errs);
                                        }
                                    });
                                },5000);
                            }else if(dat.status===1){
                                dipT.error(dat.msg);
                            }
                            $scope.$on('$destroy', function() {
                                if (angular.isDefined(stopTime)) {
                                    $interval.cancel(stopTime);
                                    stopTime = undefined;
                                }
                                if(conEventRes && angular.isFunction(conEventRes)){
                                    conEventRes();
                                }
                            });
                        });
                    });
                };
                $ctrl.getNewLog = function () {
                    if(comInfo && thread){
                        fetchLogsAndErrors(csService,$ctrl,comInfo,thread);
                    }
                };
                $ctrl.getDetail = function (item) {
                    thread=item;
                    $ctrl.data.currentId=item.pid;
                };
                $ctrl.showTab = function (num) {
                    $ctrl.cons.currentTab='tab'+num;
                };
                conEventRes=$rootScope.$on('consoleView',function (e, data) {
                    var captureChart=$('#Capture_chart_id'),ms =captureChart.width();
                    if(data){
                        captureChart.width(ms-193);
                    }else{
                        captureChart.width(ms+193);
                    }
                    $ctrl.cons.chart && $ctrl.cons.chart.resize();
                });
                //查询Capture组件状态
                function fetchCaptureStatus() {
                    var res_data={status:1,msg:'',data:null};
                    return csService.getCaptureStatus(comInfo).then(function (result) {
                        if(result.res){
                            var res=result.data;
                            if(res){
                                $ctrl.data.start_scn =res.breakpoint.start_scn;
                                $ctrl.data.complete_scn =res.breakpoint.complete_scn;
                                $ctrl.data.complete_xid =res.breakpoint.complete_xid;
                                $ctrl.data.servers=[];
                                var nowServer={};
                                if(res.server_info){
                                    if(angular.isArray(res.server_info.server)){
                                        $ctrl.data.servers=res.server_info.server;
                                    }else if(angular.isObject(res.server_info.server)){
                                        $ctrl.data.servers.push(res.server_info.server);
                                    }
                                }
                                if($ctrl.data.servers.length>0){
                                    angular.forEach($ctrl.data.servers,function (v) {
                                        if(!v.off_set){
                                            v.off_set=0;
                                        }else{
                                            thread && (v.off_set=thread.off_set);
                                        }
                                    });
                                    if(!thread){
                                        thread=$ctrl.data.servers[0];
                                    }
                                    res_data.status=3;
                                    res_data.data=thread;
                                    nowServer=$ctrl.data.servers[0];
                                }else{
                                    res_data.status=4;
                                }
                                // 动态数据接口 addData
                                if($ctrl.cons.chart && nowServer){
                                    var da=nowServer,toDate=res.timestamp.split(' ')[1];
                                    $ctrl.cons.chart.addData([
                                        [
                                            0,        // 系列索引
                                            da.op_insert, // 新增数据
                                            false,     // 新增数据是否从队列头部插入
                                            false,     // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                            toDate
                                        ],
                                        [
                                            1,        // 系列索引
                                            da.op_delete, // 新增数据
                                            false,    // 新增数据是否从队列头部插入
                                            false    // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                        ],
                                        [
                                            2,        // 系列索引
                                            da.op_update, // 新增数据
                                            false,    // 新增数据是否从队列头部插入
                                            false    // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                        ],
                                        [
                                            3,        // 系列索引
                                            da.op_ddl, // 新增数据
                                            false,    // 新增数据是否从队列头部插入
                                            false    // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                        ]
                                    ]);
                                }
                            }else{
                                res_data.status=2;
                            }
                        }else{
                            res_data.status=1;
                            res_data.msg=result.data;
                        }
                        return res_data;
                    });
                }
            }]
        })
        .component('queueConsole',{
            templateUrl:'console_view/queueCon.component.html',
            bindings:{
               dl:'<'
            },
            controller:['$scope','$rootScope','$stateParams','tipsService','$interval','$filter','$q','$timeout','csService',function ($scope,$rootScope,$stateParams,dipT,$interval,$filter,$q,$timeout,csService) {
                var $ctrl = this;
                //队列状态
                $ctrl.info = {};//Queue信息
                $ctrl.fileList = [];//Log文件列表
                //队列展示<<--
                $ctrl.swList = [];//Queue事务列表
                $ctrl.ptotal= 1;//主页面页面总数
                $ctrl.pnum =1;//主页面的当前页
                $ctrl.clist = [];
                $ctrl.ctotal=1;//详细页的页面总数
                $ctrl.cnum =1;//详情页的当前页
                $ctrl.detailTitle = '';
                $ctrl.detailXid=0;
                $ctrl.mck=false;//主页面的全选
                $ctrl.fy={
                    snum:'',
                    csnum:''
                };
                $ctrl.pz={
                    mainL:true,
                    detailL:false,
                    detail:false,
                    mainLoading:false,
                    detailLoading:false
                };
                $ctrl.mainParam = {
                    startTime:'',
                    endTime:'',
                    swNumber:''
                };
                $ctrl.detailParam = {
                    userName:'',
                    tabName:'',
                    option:'',
                    scnNumber:''
                };
                $ctrl.detail={
                    sql:'',
                    hg:''
                };
                var comInfo = $stateParams;
                $ctrl.cons = {
                    cons:true,
                    currentTab:'tab1',
                    chart:null,
                    option:null
                };
                var myChart1=null,options={option1:{},option2:{}},now_user,now_tab,isAll= true,cname = '';
                //队列统计部分代码<！=================================================================
                //队列展示-->>
                //统计部分参数
                $ctrl.tj = {
                    c_type:'bar',
                    begin_time:'',
                    end_time:'',
                    isTop:false
                };
                $ctrl.user_t="U";
                $ctrl.ut="DML";

                $ctrl.nowType="yy";
                $ctrl.datalist=[];
                $ctrl.pielist=[];
                $ctrl.owner=now_user;
                $ctrl.table=now_tab;
                $ctrl.chart = null;

                $ctrl.nowType_repeat="yy";
                $ctrl.a_show=true;
                $ctrl.b_show=false;
                $ctrl.c_show=false;
                $ctrl.$onInit=function () {
                    if(!$ctrl.dl){
                        $state.go('/');
                    }else{
                        var arr ;
                        if($ctrl.dl && !$ctrl.dl.data){
                            return ;
                        }
                        if($ctrl.dl.tab ==='tab1'){
                            var info = $ctrl.dl.data;
                            $ctrl.info =info.queue_info;
                            $ctrl.fileList=[];
                            if(info && info.queue_file_list){
                                if(angular.isArray(info.queue_file_list.queue_file)){
                                    $ctrl.fileList =info.queue_file_list.queue_file;
                                }else if(angular.isObject(info.queue_file_list.queue_file)){
                                    $ctrl.fileList.push(info.queue_file_list.queue_file);
                                }
                            }
                            $ctrl.cons.currentTab= 'tab1';
                        }else if($ctrl.dl.tab ==='tab3'){
                            if($ctrl.dl.res){
                                $ctrl.swList = $ctrl.dl.list;
                                $ctrl.ptotal= $ctrl.dl.total;
                            }
                            $ctrl.cons.currentTab= 'tab3';
                            $timeout(function () {
                                var startD = $('#dl-dark-sh-start'),endD=$('#dl-dark-sh-end');
                                startD.datetimepicker({
                                    theme:'dark',
                                    format:"Y-m-d H:i:s",
                                    onShow:function(){
                                        this.setOptions({
                                            maxDate:endD.val()?endD.val():$filter('date')(new Date(),'yyyy-MM-dd HH:mm:ss')
                                        })
                                    }
                                });
                                endD.datetimepicker({
                                    theme:'dark',
                                    format:"Y-m-d H:i:s",
                                    minDate:new Date(),
                                    onShow:function(){
                                        this.setOptions({
                                            minDate:startD.val()?startD.val():false
                                        })
                                    }
                                });
                            });
                        }else if($ctrl.dl.tab ==='tab2'){
                            $ctrl.cons.currentTab= 'tab2';
                            //生成树状结构
                            var setting = {
                                view: {
                                    selectedMulti: false
                                },
                                async: {
                                    enable: true,
                                    url: "/dipserver/query_etl_table",
                                    autoParam:['name=user'],
                                    otherParam:{group:comInfo.gn,db_type:comInfo.pt,db_component_name:comInfo.pn},
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
                                    onMouseUp: function (event,treeId,treeNode) {
                                        if(treeNode && !treeNode.isParent){
                                            var pNode=treeNode.getParentNode();
                                            now_user=pNode.name;
                                            now_tab=treeNode.name;
                                            isAll = false;
                                            $ctrl.selectUserData();
                                        }
                                    },
                                    beforeClick:function (treeId, treeNode) {
                                        if(treeNode && treeNode.isParent){
                                            //树形结构的父节点
                                            $ctrl.now_user=treeNode.name;
                                            $ctrl.now_tab="";
                                            isAll = false;
                                            //$ctrl.selectUserData();
                                            return (treeNode.id !== 1);
                                        }
                                    },
                                    beforeAsync:function (treeId, treeNode) {
                                        if(treeNode){
                                            cname =treeNode.name;
                                        }
                                        return (treeNode.id !== 1);
                                    }
                                }
                            };
                            crateQueueTjCharts().then(function (res) {
                                $ctrl.chart =res.chart;
                                options.option1 = res.option1;
                                options.option2 = res.option2;
                                $.fn.zTree.init($("#queue_tj_tree"),setting,$ctrl.dl.data);
                                $ctrl.selectAllData();
                            });//生成图表
                            $timeout(function () {
                                var startD = $('#dl-dark-start'),endD=$('#dl-dark-end');
                                startD.datetimepicker({
                                    theme:'dark',
                                    format:"Y-m-d H:i:s",
                                    onShow:function(){
                                        this.setOptions({
                                            maxDate:endD.val()?endD.val():$filter('date')(new Date(),'yyyy-MM-dd HH:mm:ss')
                                        })
                                    }
                                });
                                endD.datetimepicker({
                                    theme:'dark',
                                    format:"Y-m-d H:i:s",
                                    minDate:new Date(),
                                    onShow:function(){
                                        this.setOptions({
                                            minDate:startD.val()?startD.val():false
                                        })
                                    }
                                });
                            });
                        }
                    }
                };
                //获取主列表信息
                var getList= function(pnum) {
                    if($ctrl.mainParam.startTime && !angular.isDate(new Date($ctrl.mainParam.startTime))){
                        dipT.warning('开始时间格式不正确，请重新输入！');
                        return;
                    }
                    if($ctrl.mainParam.endTime && !angular.isDate(new Date($ctrl.mainParam.endTime))){
                        dipT.warning('结束时间格式不正确，请重新输入！');
                        return;
                    }
                    var stime=$ctrl.mainParam.startTime?$ctrl.mainParam.startTime:"";
                    var etime=$ctrl.mainParam.endTime?$ctrl.mainParam.endTime:"";
                    var xid=$ctrl.mainParam.swNumber?$ctrl.mainParam.swNumber:"";
                    var pri=csService.getQueueDisplayList(comInfo,pnum,stime,etime,xid);
                    pri.then(function(result){
                        if(result.res){
                            $ctrl.swList = result.list;
                            $ctrl.ptotal= result.total;
                            if($ctrl.pnum>=$ctrl.ptotal){
                                $ctrl.pnum=$ctrl.ptotal;
                            }
                        }else{
                            $ctrl.swList=[];
                            $ctrl.ptotal=1;
                            $ctrl.pnum=1;
                        }
                    });
                };
                //获取详情页信息
                var getDetailList = function(cnum,xid){
                    $ctrl.clist=[];
                    var uname=$ctrl.detailParam.userName?$ctrl.detailParam.userName:"";
                    var tname=$ctrl.detailParam.tabName?$ctrl.detailParam.tabName:"";
                    var opc=$ctrl.detailParam.option?$ctrl.detailParam.option:"";
                    var scn=$ctrl.detailParam.scnNumber?$ctrl.detailParam.scnNumber:"";
                    var promise = csService.getQueueDetailList(comInfo,cnum,xid,opc,uname,tname,scn);
                    promise.then(function(result){
                        if(result.res){
                            $ctrl.clist = result.list;
                            $ctrl.ctotal=result.total;
                            if($ctrl.cnum>=$ctrl.ctotal){
                                $ctrl.cnum=$ctrl.ctotal;
                            }
                        }else{
                            $ctrl.clist=[];
                            $ctrl.ctotal=1;//详细页的页面总数
                            $ctrl.cnum =1;//详情页的当前页
                        }
                    });
                };
                $ctrl.pagePre=function(){
                    if($ctrl.ptotal===1){
                        $ctrl.pnum=1;
                    }else{
                        if($ctrl.pnum-1>0){
                            $ctrl.pnum=$ctrl.pnum-1;
                        }
                    }
                    getList($ctrl.pnum);
                };
                $ctrl.pageNext=function(){
                    if($ctrl.ptotal===1){
                        $ctrl.pnum= 1;
                    }if($ctrl.ptotal===$ctrl.pnum){
                        $ctrl.pnum=$ctrl.ptotal;
                    }else{
                        if($ctrl.pnum+1<=$ctrl.ptotal){
                            $ctrl.pnum=$ctrl.pnum+1;
                        }
                    }
                    getList($ctrl.pnum);
                };
                $ctrl.tiao=function(){
                    if($ctrl.fy.snum===''){
                        return;
                    }
                    $ctrl.pnum=parseInt($ctrl.fy.snum) || $ctrl.pnum;
                    $ctrl.fy.snum='';
                    getList($ctrl.pnum);
                };
                //清除选中列表
                $ctrl.clearSelected = function () {
                    $ctrl.mck=false;
                    var xList="";
                    var leg=$(".mainCbList:checked");
                    angular.forEach(leg,function(chk){
                        xList+="<xid>"+chk.value+"</xid>";
                    });
                    if(xList===''){
                        dipT.warning('请勾选您要清除的队列信息！');
                        return;
                    }
                    $("input.mainCbList").prop('checked',false);
                    csService.deleteQueuePkgXid(comInfo,xList).then(function (res) {
                          if(res){
                              $ctrl.pnum= 1;
                              getList(0);
                              dipT.success($filter('translate')('Co_qccg'));//清除选中数据成功！
                          }
                    });
                };
                $ctrl.selectedAll = function () {
                    if($ctrl.mck){
                        $("input.mainCbList").prop('checked',true);
                    }else{
                        $("input.mainCbList").prop('checked',false);
                    }
                };
                $ctrl.searchListByParams = function () {
                    $ctrl.pnum=1;
                    getList(0);
                };
                $ctrl.resetParams=function () {
                    $ctrl.pnum=1;
                    $ctrl.mainParam.startTime='';
                    $ctrl.mainParam.endTime='';
                    $ctrl.mainParam.swNumber='';
                    getList(0);
                };
                //查询事务详细信息
                $ctrl.getDetail = function (item) {
                    $ctrl.detailTitle =$filter('translate')('Co_swxxlb');//> 事务详细信息列表
                    $ctrl.pz.mainL =false;
                    $ctrl.pz.detailL =true;
                    $ctrl.pz.detail =false;
                    $ctrl.detailXid =item.xid;
                    getDetailList(0,item.xid);
                };
                //回滚当前事务
                $ctrl.backDetail = function (item) {

                };
                //返回主页面
                $ctrl.backToMain = function () {
                    $ctrl.detailTitle ='';
                    $ctrl.pz.mainL =true;
                    $ctrl.pz.detailL =false;
                    $ctrl.pz.detail =false;
                    $ctrl.detailParam.option='';
                };
                //展示Sql详情
                $ctrl.showSql = function (item) {
                    var rec_oft=item.rec_oft,qno=item.qno,oft=item.oft;
                    csService.getSqlInfoByXid(comInfo,rec_oft,qno,oft).then(function (data) {
                        if(data){
                            $ctrl.detail.sql = data.sql;
                            $ctrl.detail.hg = data.rollback_sql;
                            $ctrl.pz.detail = true;
                        }
                    });
                };
                //关闭sql详情面板
                $ctrl.closeSqlPanel = function () {
                    $ctrl.pz.detail = false;
                };
                //详细页的搜索方法
                $ctrl.searchDetailList = function () {
                    $ctrl.cnum=1;
                    getDetailList(0,$ctrl.detailXid);
                };
                $ctrl.resetDetailList = function () {
                    $ctrl.cnum=1;
                    $ctrl.detailParam.userName="";
                    $ctrl.detailParam.tabName="";
                    $ctrl.detailParam.option="";
                    $ctrl.detailParam.scnNumber="";
                    getDetailList(0,$ctrl.detailXid);
                };
                //详细页的上一页实现
                $ctrl.cpagePre=function(){
                    if($ctrl.ctotal===1){
                        $ctrl.cnum=1;
                    }else{
                        if($ctrl.cnum-1>0){
                            $ctrl.cnum=$ctrl.cnum-1;
                        }
                    }
                    getDetailList($ctrl.cnum,$ctrl.detailXid);
                };
                //详细页的下一页实现
                $ctrl.cpageNext=function(){
                    if($ctrl.ctotal===1){
                        $ctrl.cnum= 1;
                    }if($ctrl.ctotal===$ctrl.cnum){
                        $ctrl.cnum=$ctrl.ctotal
                    }else{
                        if($ctrl.cnum+1<=$ctrl.ctotal){
                            $ctrl.cnum=$ctrl.cnum+1;
                        }
                    }
                    getDetailList($ctrl.cnum,$ctrl.detailXid);
                };
                //详细页的跳转实现
                $ctrl.ctiao=function(){
                    if($ctrl.fy.csnum===''){
                        return;
                    }
                    $ctrl.cnum=parseInt($ctrl.fy.csnum) || $ctrl.cnum;
                    $ctrl.fy.csnum='';
                    getDetailList($ctrl.cnum,$ctrl.detailXid);
                };

                //代表网页上面的年、月、天、小时、分
                var selectData=function(yearData){
                    var chart;
                    if($ctrl.tj.c_type==='pie'){
                        chart = options.option2;
                    }else{
                        chart = options.option1;
                    }
                    var arr=[];
                    var arr1=[];
                    var arr2=[];
                    var arr3=[];
                    var arr4=[];
                    for(var i=0;i<yearData.length;i++){
                        arr.push(parseInt(yearData[i].insert));
                        arr1.push(parseInt(yearData[i].update));
                        arr2.push(parseInt(yearData[i].del));
                        arr3.push(parseInt(yearData[i].ddl));
                        arr4.push(parseInt(yearData[i].total));
                    }
                    var mm=[arr,arr1,arr2,arr3,arr4];
                    for(var ii=0;ii<chart.series.length;ii++) {
                        chart.series[ii].data=mm[ii];
                    }
                };
                //更新年份坐标
                var updateX=function(s,t){
                    var chart;
                    if($ctrl.tj.c_type==='pie'){
                        return;
                    }else{
                        chart = options.option1;
                    }
                    s= s.getFullYear();
                    var arr=[];
                    for(var i=0;i<=t;i++){
                        arr.push(s);
                        s++;
                    }
                    if(chart.xAxis){
                        chart.xAxis[0].data.length=0;
                        chart.xAxis[0].data = arr;
                        chart.xAxis[0].axisLabel.formatter='{value}';
                    }
                    $ctrl.chart.setOption(chart,true);
                    $ctrl.chart.hideLoading();
                };
                //更新月份横坐标
                var updateMonX=function(stime,num){
                    var chart;
                    if($ctrl.tj.c_type==='pie'){
                        return;
                    }else{
                        chart = options.option1;
                    }
                    var sm=stime.getMonth()+1;
                    var yy=stime.getFullYear();
                    var arr=[];
                    for(var i=0;i<=num;i++){
                        if(sm>12){
                            sm=1;
                            yy++;
                        }
                        arr.push(yy+"."+sm);
                        sm++;
                    }
                    if(chart.xAxis){
                        chart.xAxis[0].data.length=0;
                        chart.xAxis[0].data = arr;
                        chart.xAxis[0].axisLabel.formatter='{value}M';
                    }
                    $ctrl.chart.setOption(chart,true);
                    $ctrl.chart.hideLoading();
                };
                //更新天份横坐标
                var updateDayX=function(stime,ma,num){
                    var chart;
                    if($ctrl.tj.c_type==='pie'){
                        return;
                    }else{
                        chart = options.option1;
                    }
                    var mm=stime.getMonth()+1;
                    var sm=stime.getDate();
                    var arr=[];
                    for(var i=0;i<=num;i++){
                        if(sm>ma){
                            sm=1;
                            mm++;
                        }
                        arr.push(mm+"."+sm);
                        sm++;
                    }
                    if(chart.xAxis){
                        chart.xAxis[0].data = arr;
                        chart.xAxis[0].axisLabel.formatter='{value}D';
                    }
                    $ctrl.chart.setOption(chart,true);
                    $ctrl.chart.hideLoading();
                };
                //更新小时横坐标
                var updateHourX=function(stime,num){
                    var chart;
                    if($ctrl.tj.c_type==='pie'){
                        return;
                    }else{
                        chart = options.option1;
                    }
                    var hour=stime.getHours();
                    var arr=[];
                    for(var i=0;i<num;i++){
                        if(hour>23){
                            hour=0;
                        }
                        arr.push(hour);
                        hour++;
                    }
                    if(chart.xAxis){
                        chart.xAxis[0].data.length=0;
                        chart.xAxis[0].data = arr;
                        chart.xAxis[0].axisLabel.formatter='{value}H';
                    }
                    $ctrl.chart.setOption(chart,true);
                    $ctrl.chart.hideLoading();
                };
                //更新分钟坐标
                var updateMinuteX=function(stime,num){
                    var chart;
                    if($ctrl.tj.c_type==='pie'){
                        return;
                    }else{
                        chart = options.option1;
                    }
                    var mi=stime.getMinutes();
                    var arr=[];
                    for(var i=0;i<num;i++){
                        if(mi>60){
                            mi=1;
                        }
                        arr.push(mi);
                        mi++;
                    }
                    if(chart.xAxis){
                        chart.xAxis[0].data.length=0;
                        chart.xAxis[0].data = arr;
                        chart.xAxis[0].axisLabel.formatter='{value}m';
                    }
                    $ctrl.chart.setOption(chart,true);
                    $ctrl.chart.hideLoading();
                };

                //更新饼图里面的数据
                var updatePie=function(pl){
                    var chart=options.option2;
                    var ob=pl[0];
                    var arr=[];
                    for(var min in ob){
                        var ar={};
                        ar.name=min.toUpperCase();
                        var da=ob[min].replace(/%/,"");
                        da=parseFloat(da);
                        ar.value=da;
                        arr.push(ar);
                    }
                    chart.series[0].data=arr;
                };
                function NewDate(str){
                    var a=str.substring(0,10);
                    var b=str.substring(10,19);
                    var str_a = a.split('-');
                    var	str_b = b.split(':');
                    //str_a=str_a.concat(str_b);
                    var date = new Date();
                    date.setUTCFullYear(str_a[0], str_a[1] - 1, str_a[2]);
                    date.setUTCHours( str_b[0]-8,str_b[1],str_b[2], 0);
                    return date;
                }
                Date.prototype.Format = function(fmt) { //author: meizz
                    var o = {
                        "M+" : this.getMonth()+1,                 //月份
                        "d+" : this.getDate(),                    //日
                        "h+" : this.getHours(),                   //小时
                        "m+" : this.getMinutes(),                 //分
                        "s+" : this.getSeconds(),                 //秒
                        "q+" : Math.floor((this.getMonth()+3)/3), //季度
                        "S"  : this.getMilliseconds()             //毫秒
                    };
                    if(/(y+)/.test(fmt))
                        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
                    for(var k in o)
                        if(new RegExp("("+ k +")").test(fmt))
                            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length===1)?(o[k]):(("00"+ o[k]).substr((""+ o[k]).length)));
                    return fmt;
                };
                //获得上个月在昨天这一天的日期
                function getLastMonthYestdy(date){
                    var daysInMonth = [[0],[31],[28],[31],[30],[31],[30],[31],[31],[30],[31],[30],[31]];
                    var strYear = date.getFullYear();
                    var strDay = date.getDate();
                    var strMonth = date.getMonth()+1;
                    if(strYear%4 === 0 && strYear%100 !== 0){
                        daysInMonth[2] = 29;
                    }
                    if(strMonth - 1 === 0) {
                        strYear -= 1;
                        strMonth = 12;
                    } else {
                        strMonth -= 1;
                    }
                    strDay = daysInMonth[strMonth] >= strDay ? strDay : daysInMonth[strMonth];
                    if(strMonth<10) {
                        strMonth="0"+strMonth;
                    }
                    if(strDay<10) {
                        strDay="0"+strDay;
                    }
                    var datastr = strYear+"-"+strMonth+"-"+strDay+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
                    return new Date(datastr);
                }
                //获得上一年在昨天这一天的日期
                function getLastYearYestdy(date){
                    var strYear = date.getFullYear() - 1;
                    var strDay = date.getDate();
                    var strMonth = date.getMonth()+1;
                    if(strMonth<10) {
                        strMonth="0"+strMonth;
                    }
                    if(strDay<10) {
                        strDay="0"+strDay;
                    }
                    var datastr = strYear+"-"+strMonth+"-"+strDay+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
                    return  new Date(datastr);
                }
                //异步方式从服务器获取后台数据
                var getDataListAsysc=function(full,owner,table,st,et,ut,sql){
                    st.setSeconds(0);
                    if(isAll){
                        full="yes";
                        owner="";
                        table="";
                    }else{
                        full="no";
                    }
                    var stime=st.Format("yyyy-MM-dd hh:mm:ss");
                    var etime=et.Format("yyyy-MM-dd hh:mm:ss");
                    var mm=$ctrl.nowType==="mm"?"yes":"no";
                    var hh=$ctrl.nowType==="hh"?"yes":"no";
                    var dd=$ctrl.nowType==="dd"?"yes":"no";
                    var mo=$ctrl.nowType==="mo"?"yes":"no";
                    var yy=$ctrl.nowType==="yy"?"yes":"no";
                    return csService.queryQueueTj(comInfo,full,owner,table,stime,etime,mm,hh,dd,mo,yy,ut,sql);
                };
                //验证日期
                var getArr = function (item) {
                    var arr = [];
                    if(angular.isArray(item)){
                        arr = item;
                    }else if(angular.isObject(item)){
                        arr.push(item);
                    }
                    return arr;
                };
                var fullData= function (data) {
                    var res = data.return_data;
                    if(!res || angular.isString(res) || $.isEmptyObject(res)){
                        return;
                    }
                    $ctrl.datalist=[];
                    $ctrl.pielist=[];
                    $ctrl.user_x=[];
                    $ctrl.user_y=[];
                    $ctrl.table_x=[];
                    $ctrl.table_y=[];
                    var qlist=getArr(res.list);
                    var persent=getArr(res.persent);
                    var arr=[];
                    angular.forEach(qlist,function(val){
                        var ar={};
                        ar.time=val.time;
                        ar.insert=parseInt(val.inst);
                        ar.update=parseInt(val.del);
                        ar.del=parseInt(val.upd);
                        ar.ddl=parseInt(val.ddl);
                        ar.total=parseInt(val.full);
                        arr.push(ar);
                    });
                    var pp=[];
                    angular.forEach(persent,function(val){
                        var pi={};
                        pi.insert=val.inst;
                        pi.update=val.upd;
                        pi.del=val.del;
                        pi.ddl=val.ddl;
                        pp.push(pi);
                    });
                    $ctrl.datalist=arr;
                    $ctrl.pielist=pp;
                };
                //切换事件
                $ctrl.changeTj = function () {
                    var chart = options.option1,item=this.tj.c_type;
                    if(item==='line'){
                        angular.forEach(chart.series,function(val) {
                            val.type ='line';
                        });
                    }else if(item==='bar'){
                        angular.forEach(chart.series,function(val) {
                            val.type ='bar';
                        });
                    }else if(item==='pie'){
                        chart=options.option2;
                        angular.forEach(chart.series,function(val) {
                            val.type ='pie';
                        });
                    }
                    $ctrl.nowType=$ctrl.nowType_repeat;
                    $ctrl.chart.setOption(chart,true);
                };

                //客户条件查询
                $ctrl.selectUserData=function(){
                    var stime=$ctrl.tj.start_time;
                    var etime=$ctrl.tj.end_time;
                    $ctrl.owner=now_user;
                    $ctrl.table=now_tab;
                    //TOP10数据
                    if($ctrl.nowType === "top"){
                        stime=$("#startTime").val();
                        etime=$("#endTime").val();
                        if($ctrl.tj.start_time !==""  && $ctrl.tj.end_time !==""){
                            var et=angular.isDate(new Date($ctrl.tj.end_time))?new Date($ctrl.tj.end_time):NewDate($ctrl.tj.end_time);
                            var st=angular.isDate(new Date($ctrl.tj.start_time))?new Date($ctrl.tj.start_time):NewDate($ctrl.tj.start_time);
                            if (et< st) {
                                // art.dialog.alert(userLang.queue_analyse_tip3);
                                return;
                            }
                        }
                        var ut=$("#user_table").val(),sql=$("#operation").val();
                        if(!etime){
                            etime=new Date();
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            etime=angular.isDate(new Date(etime))?new Date(etime):NewDate(etime);
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }

                        if(!stime){
                            stime=new Date();
                            stime.setFullYear(stime.getFullYear()-10);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            stime=angular.isDate(new Date(stime))?new Date(stime):NewDate(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }

                        getDataListAsysc("no",now_user,now_tab,stime,etime,ut,sql).then(function(data){
                            fullData(data);
                            //top10
                            if(ut==="U"){
                                updateuser($ctrl.user_y);
                                updateuserx($ctrl.user_x,$ctrl.user_num);
                            }else if(ut==="T"){
                                updateuser($ctrl.table_y);
                                updateuserx($ctrl.table_x,$ctrl.table_num);
                            }
                        });
                    }
                    //年为间隔
                    if($ctrl.nowType === "yy"){
                        $ctrl.nowType_repeat="yy";
                        if(!etime){
                            etime=new Date();
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            etime=angular.isDate(new Date(etime))?new Date(etime):NewDate(etime);
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        if(!stime){
                            stime=new Date();
                            stime.setFullYear(stime.getFullYear()-10);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            stime=angular.isDate(new Date(stime))?new Date(stime):NewDate(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        var promise=getDataListAsysc("no",now_user,now_tab,stime,etime,"","");
                        promise.then(function(data){
                            fullData(data);
                            var linshi=$ctrl.datalist,marry=[],nian=stime.getFullYear(),yue=stime.getMonth();
                            var interval=etime.getFullYear()-stime.getFullYear();
                            for(var i=0;i<=interval;i++){
                                var flag=0,arr={};
                                angular.forEach(linshi,function(val){
                                    var mm=angular.isDate(new Date(val.time))?new Date(val.time):NewDate(val.time);
                                    if(nian===mm.getFullYear()){
                                        arr.time=val.time;
                                        arr.insert=val.insert;
                                        arr.update=val.update;
                                        arr.del=val.del;
                                        arr.ddl=val.ddl;
                                        arr.total=val.total;
                                        flag=1;
                                    }
                                });
                                if(flag===0){
                                    arr.time=nian+"-"+yue;
                                    arr.insert=0;
                                    arr.update=0;
                                    arr.del=0;
                                    arr.ddl=0;
                                    arr.total=0;
                                }
                                marry.push(arr);
                                nian++;
                            }
                            //筛选数据
                            selectData(marry);
                            //更新饼图数据
                            updatePie($ctrl.pielist);
                            updateX(stime,interval);
                        },function(data) {
                            dipT.error($filter('translate')('Wlcw'));//网络错误
                        });
                    }
                    //月为间隔
                    if($ctrl.nowType==="mo"){
                        $ctrl.nowType_repeat="mo";
                        if(!etime){
                            etime=new Date();
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            etime=angular.isDate(new Date(etime))?new Date(etime):NewDate(etime);
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        if(!stime){
                            stime=new Date();
                            stime=getLastYearYestdy(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            stime=angular.isDate(new Date(stime))?new Date(stime):NewDate(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        var promise=getDataListAsysc("no",now_user,now_tab,stime,etime,"",""),g;
                        promise.then(function(data){
                            fullData(data);
                            var linshi=$ctrl.datalist;
                            var marry=[];
                            var nian=stime.getFullYear();
                            var yue=stime.getMonth();
                            var zhi=etime.getFullYear()-stime.getFullYear();
                            var interval=null;
                            if(zhi===0){
                                g=stime.getMonth();
                                interval=etime.getMonth()-g;
                            }else if(zhi===1){
                                g=12-stime.getMonth();
                                interval=g+etime.getMonth();
                            } else{
                                dipT.error($filter('translate')('Co_bcgln'));//月,日期最多不能超过两年！
                                interval=24;
                            }
                            for(var i=0;i<=interval;i++){
                                var flag=0;
                                var arr={};
                                if(yue>12){
                                    yue=1;
                                    nian++;
                                }
                                angular.forEach(linshi,function(val){
                                    var mm=angular.isDate(new Date(val.time))?new Date(val.time):NewDate(val.time);
                                    if(mm.getMonth()===yue && nian===mm.getFullYear()){
                                        arr.time=val.time;
                                        arr.insert=val.insert;
                                        arr.update=val.update;
                                        arr.del=val.del;
                                        arr.ddl=val.ddl;
                                        arr.total=val.total;
                                        flag=1;
                                    }
                                });
                                if(flag===0){
                                    arr.time=stime.getFullYear()+"-"+yue;
                                    arr.insert=0;
                                    arr.update=0;
                                    arr.del=0;
                                    arr.ddl=0;
                                    arr.total=0;
                                }
                                marry.push(arr);
                                yue++;
                            }
                            selectData(marry);
                            //更新饼图数据
                            updatePie($ctrl.pielist);
                            updateMonX(stime,interval);
                        },function(data) {
                            dipT.error($filter('translate')('Wlcw'));//网络错误
                        });
                    }
                    //天为间隔
                    if($ctrl.nowType==="dd"){
                        $ctrl.nowType_repeat="dd";
                        if(!etime){
                            etime=new Date();
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            etime=angular.isDate(new Date(etime))?new Date(etime):NewDate(etime);
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }

                        if(!stime){
                            stime=new Date();
                            stime=getLastMonthYestdy(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            stime=angular.isDate(new Date(stime))?new Date(stime):NewDate(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        var promise=getDataListAsysc("no",now_user,now_tab,stime,etime,"","");
                        promise.then(function(data){
                            fullData(data);
                            var linshi=$ctrl.datalist;
                            var marry= [];
                            var ss=stime.getMonth()+1;
                            var ma=new Date(stime.getFullYear(),ss,0).getDate();
                            var dat=stime.getDate();
                            var interval=null;
                            var jg=(etime.getTime()-stime.getTime())/86400000;
                            if(jg<=31){
                                interval=jg;
                            }else{
                                dipT.error($filter('translate')('Co_bcg31'));//天时间间隔不能超过31天！
                                interval=31;
                            }
                            for(var i=0;i<interval;i++){
                                var flag=0;
                                var arr={};
                                if(dat>ma){
                                    dat=ma;
                                }
                                arr.time=dat;
                                angular.forEach(linshi,function(val){
                                    var mm=angular.isDate(new Date(val.time))?new Date(val.time).getDate():NewDate(val.time).getDate();
                                    if(mm===dat){
                                        arr.time=val.time;
                                        arr.insert=val.insert;
                                        arr.update=val.update;
                                        arr.del=val.del;
                                        arr.ddl=val.ddl;
                                        arr.total=val.total;
                                        flag=1;
                                    }
                                });
                                if(flag===0){
                                    arr.insert=0;
                                    arr.update=0;
                                    arr.del=0;
                                    arr.ddl=0;
                                    arr.total=0;
                                }
                                marry.push(arr);
                                dat++;
                            }
                            selectData(marry);
                            //更新饼图数据
                            updatePie($ctrl.pielist);
                            updateDayX(stime,ma,interval);
                        },function() {
                            dipT.error($filter('translate')('Wlcw'));//网络错误
                        });
                    }
                    //小时为间隔
                    if($ctrl.nowType==="hh"){
                        $ctrl.nowType_repeat="hh";
                        if(!etime){
                            etime=new Date();
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            etime=angular.isDate(new Date(etime))? new Date(etime):NewDate(etime);
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }

                        if(!stime){
                            stime=new Date();
                            stime=angular.isDate(new Date(stime.getTime() - 24*60*60*1000))?new Date(stime.getTime() - 24*60*60*1000):NewDate(stime.getTime() - 24*60*60*1000);
                        }else{
                            stime=angular.isDate(new Date(stime))?new Date(stime):NewDate(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        var promise=getDataListAsysc("no",now_user,now_tab,stime,etime,"","");
                        promise.then(function(data){
                            fullData(data);
                            var linshi=$ctrl.datalist;
                            var marry= [];
                            var year=stime.getFullYear();
                            var day=stime.getDate();
                            var hour=stime.getHours();
                            var interval=null;
                            var jg=(etime.getTime()-stime.getTime())/3600000;
                            if(jg<=24){
                                interval=jg;
                            }else{
                                dipT.error($filter('translate')('Co_bcg24'));//小时时间间隔不能超过24小时！
                                interval=24;
                            }
                            for(var i=0;i<interval;i++){
                                var flag=0;
                                var arr={};
                                if(hour>23){
                                    hour=1;
                                    day=etime.getDate();
                                }
                                arr.time=hour;
                                angular.forEach(linshi,function(val){
                                    var mm=angular.isDate(new Date(val.time+":00:00"))?new Date(val.time+":00:00"):NewDate(val.time+":00:00");
                                    if(mm.getDate()===day && mm.getHours()===hour){
                                        arr.time=val.time;
                                        arr.insert=val.insert;
                                        arr.update=val.update;
                                        arr.del=val.del;
                                        arr.ddl=val.ddl;
                                        arr.total=val.total;
                                        flag=1;
                                    }
                                });
                                if(flag===0){
                                    arr.insert=0;
                                    arr.update=0;
                                    arr.del=0;
                                    arr.ddl=0;
                                    arr.total=0;
                                }
                                marry.push(arr);
                                hour++;
                            }
                            //更新去曲线图数据
                            selectData(marry);
                            //更新饼图数据
                            updatePie($ctrl.pielist);
                            //更新横坐标
                            updateHourX(stime,interval);
                        },function() {
                            dipT.error($filter('translate')('Wlcw'));//网络错误
                        });
                    }
                    //分为间隔
                    if($ctrl.nowType==="mm"){
                        $ctrl.nowType_repeat="mm";
                        if(!etime){
                            etime=new Date();
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            etime=angular.isDate(new Date(etime))?new Date(etime):NewDate(etime);
                            $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        if(!stime){
                            stime=new Date();
                            stime=angular.isDate(new Date(stime.getTime() - 1000*60*60))?new Date(stime.getTime() - 1000*60*60):NewDate(stime.getTime() - 1000*60*60);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }else{
                            stime=angular.isDate(new Date(stime))?new Date(stime):NewDate(stime);
                            $ctrl.tj.start_time=stime.Format("yyyy-MM-dd hh:mm:ss");
                        }
                        var promise=getDataListAsysc("no",now_user,now_tab,stime,etime,"","");
                        promise.then(function(data){
                            fullData(data);
                            var linshi=$ctrl.datalist;
                            var marry= [];
                            var year=stime.getFullYear();
                            var day=stime.getDate();
                            var hour=stime.getHours();
                            var sec=stime.getMinutes();
                            var interval=null;
                            var jg=(etime.getTime()-stime.getTime())/60000;
                            if(jg<=60){
                                interval=jg;
                            }else{
                                dipT.error($filter('translate')('Co_bcg60'));//分时间间隔不能超过60分钟！
                                interval=60;
                            }

                            for(var i=0;i<interval;i++){
                                var flag=0;
                                var arr={};
                                if(sec>59){
                                    sec=0;
                                    hour=etime.getHours();
                                }
                                arr.time=sec;
                                angular.forEach(linshi,function(val){
                                    var mm=angular.isDate(new Date(val.time+":00"))?new Date(val.time+":00"):NewDate(val.time+":00");
                                    if(mm.getHours()===hour && mm.getMinutes()===sec){
                                        arr.time=val.time;
                                        arr.insert=val.insert;
                                        arr.update=val.update;
                                        arr.del=val.del;
                                        arr.ddl=val.ddl;
                                        arr.total=val.total;
                                        flag=1;
                                    }
                                });
                                if(flag===0){
                                    arr.insert=0;
                                    arr.update=0;
                                    arr.del=0;
                                    arr.ddl=0;
                                    arr.total=0;
                                }
                                marry.push(arr);
                                sec++;
                            }
                            //更新去曲线图数据
                            selectData(marry);
                            //更新饼图数据
                            updatePie($ctrl.pielist);
                            //更新横坐标
                            updateMinuteX(stime,interval);
                        },function() {
                            dipT.error($filter('translate')('Wlcw'));//网络错误
                        });
                    }
                };

                $ctrl.selectAllData=function(){
                    isAll=true;
                    $ctrl.selectUserData();
                };
                //间隔类型
                $ctrl.setType=function(obj){
                    var etime=$ctrl.tj.end_time,year,month,days,hh,mm,endT;
                    if(obj==='yy'){
                        // if(!angular.isDate(etime)){
                        //     etime=new Date().Format("yyyy-MM-dd hh:mm:ss");
                        // }
                        etime=new Date();
                        var st = etime.getFullYear()-10;
                        $ctrl.tj.start_time=st+"-01-01 00:00:00";
                        $ctrl.tj.end_time=etime.Format("yyyy-MM-dd hh:mm:ss");
                    }else if(obj==='mo'){
                        // if(!angular.isDate(etime)){
                        //     etime=new Date().Format("yyyy-MM-dd hh:mm:ss");
                        // }
                        year =new Date().getFullYear();
                        $ctrl.tj.start_time=year+"-01-01 00:00:00";
                        $ctrl.tj.end_time=year+"-12-31 23:59:59";
                    }else if(obj==='dd'){
                        // if(!angular.isDate(etime)){
                        //     etime=new Date().Format("yyyy-MM-dd hh:mm:ss");
                        // }
                        endT=new Date();
                        year =endT.getFullYear();
                        month =endT.getMonth()+1;
                        var temp = new Date(year,month,0);
                        days =temp.getDate();
                        $ctrl.tj.start_time=year+"-"+month+"-01 00:00:00";
                        $ctrl.tj.end_time=year+"-"+month+"-"+days+" 23:59:59";
                    }else if(obj==='hh'){
                        // if(!angular.isDate(etime)){
                        //     etime=new Date().Format("yyyy-MM-dd hh:mm:ss");
                        // }
                        endT=new Date();
                        year = endT.getFullYear();
                        month =endT.getMonth() +1;
                        days =endT.getDate();
                        $ctrl.tj.start_time=year+"-"+month+"-"+days+" 00:00:00";
                        $ctrl.tj.end_time=year+"-"+month+"-"+days+" 23:59:59";
                    }else if(obj==='mm'){
                        // if(!angular.isDate(etime)){
                        //     etime=new Date().Format("yyyy-MM-dd hh:mm:ss");
                        // }
                        endT=new Date();
                        year = endT.getFullYear();
                        month =endT.getMonth() +1;
                        days =endT.getDate();
                        hh = endT.getHours()+1;
                        $ctrl.tj.start_time=year+"-"+month+"-"+days+" "+hh+":00:00";
                        $ctrl.tj.end_time=year+"-"+month+"-"+days+" "+hh+":59:00";
                    }
                    $ctrl.nowType=obj;
                    $ctrl.selectUserData();
                };
                $ctrl.showTab = function (num) {
                    $ctrl.cons.currentTab='tab'+num;
                    if(num===1){
                        csService.getQueueStatus(comInfo).then(function (result) {
                            if(result.res && result.data){
                                var info = result.data;
                                $ctrl.info =info.queue_info;
                                $ctrl.fileList=[];
                                if(info && info.queue_file_list){
                                    if(angular.isArray(info.queue_file_list.queue_file)){
                                        $ctrl.fileList =info.queue_file_list.queue_file;
                                    }else if(angular.isObject(info.queue_file_list.queue_file)){
                                        $ctrl.fileList.push(info.queue_file_list.queue_file);
                                    }
                                }
                            }
                        });
                        $ctrl.cons.currentTab= 'tab1';
                    }else if(num===2){
                        $ctrl.cons.currentTab= 'tab2';
                        csService.initQueueUserTree(comInfo).then(function (info) {
                            //生成树状结构
                            var setting = {
                                view: {
                                    selectedMulti: false
                                },
                                async: {
                                    enable: true,
                                    url: "/dipserver/query_etl_table",
                                    autoParam:['name=user'],
                                    otherParam:{group:comInfo.gn,db_type:comInfo.pt,db_component_name:comInfo.pn},
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
                                    onMouseUp: function (event,treeId,treeNode) {
                                        if(treeNode && !treeNode.isParent){
                                            var pNode=treeNode.getParentNode();
                                            now_user=pNode.name;
                                            now_tab=treeNode.name;
                                            isAll = false;
                                            $ctrl.selectUserData();
                                        }
                                    },
                                    beforeClick:function (treeId, treeNode) {
                                        if(treeNode && treeNode.isParent){
                                            //树形结构的父节点
                                            $ctrl.now_user=treeNode.name;
                                            $ctrl.now_tab="";
                                            isAll = false;
                                            //$ctrl.selectUserData();
                                            return (treeNode.id !== 1);
                                        }
                                    },
                                    beforeAsync:function (treeId, treeNode) {
                                        if(treeNode){
                                            cname =treeNode.name;
                                        }
                                        return (treeNode.id !== 1);
                                    }
                                }
                            };
                            if(!$ctrl.chart || $.isEmptyObject(options.option1) || $.isEmptyObject(options.option2)){
                                crateQueueTjCharts().then(function (res) {
                                    $ctrl.chart =res.chart;
                                    options.option1 = res.option1;
                                    options.option2 = res.option2;
                                    $.fn.zTree.init($("#queue_tj_tree"),setting,info.data);
                                    $ctrl.selectAllData();
                                });//生成图表
                                $timeout(function () {
                                    var startD = $('#dl-dark-start'),endD=$('#dl-dark-end');
                                    startD.datetimepicker({
                                        theme:'dark',
                                        format:"Y-m-d H:i:s",
                                        onShow:function(){
                                            this.setOptions({
                                                maxDate:endD.val()?endD.val():$filter('date')(new Date(),'yyyy-MM-dd HH:mm:ss')
                                            })
                                        }
                                    });
                                    endD.datetimepicker({
                                        theme:'dark',
                                        format:"Y-m-d H:i:s",
                                        minDate:new Date(),
                                        onShow:function(){
                                            this.setOptions({
                                                minDate:startD.val()?startD.val():false
                                            })
                                        }
                                    });
                                });
                            }
                        });
                    }else if(num===3){
                        csService.getQueueDisplayList(comInfo,0,'','','').then(function (result) {
                            if(result.res){
                                $ctrl.swList = result.list;
                                $ctrl.ptotal= result.total;
                            }
                        });
                        $timeout(function () {
                            var startD = $('#dl-dark-sh-start'),endD=$('#dl-dark-sh-end');
                            startD.datetimepicker({
                                theme:'dark',
                                format:"Y-m-d H:i:s",
                                onShow:function(){
                                    this.setOptions({
                                        maxDate:endD.val()?endD.val():$filter('date')(new Date(),'yyyy-MM-dd HH:mm:ss')
                                    })
                                }
                            });
                            endD.datetimepicker({
                                theme:'dark',
                                format:"Y-m-d H:i:s",
                                minDate:new Date(),
                                onShow:function(){
                                    this.setOptions({
                                        minDate:startD.val()?startD.val():false
                                    })
                                }
                            });
                        });
                        $ctrl.cons.currentTab= 'tab3';
                    }
                };
                //生成队列统计chart图表
                function crateQueueTjCharts() {
                    var title =$filter('translate')('Co_dltj');//队列统计
                    var option = {
                        title : {
                            text: title,
                            y:10
                        },
                        tooltip : {
                            trigger: 'axis'
                        },
                        legend: {
                            y:10,
                            data:['Insert','Delete','Update','DDL','Total']
                        },
                        toolbox: {
                            show : false,
                            feature : {
                                mark : {show: true},
                                dataView : {show: true, readOnly: false},
                                magicType : {show: true, type: ['line', 'bar']},
                                restore : {show: true},
                                saveAsImage : {show: true}
                            }
                        },
                        dataZoom : {
                            show : false,
                            start : 0,
                            end : 100
                        },
                        xAxis : [{
                            type : 'category',
                            boundaryGap : true,
                            axisLabel : {
                                show:true,
                                rotate: 45,
                                formatter: '{value}'
                            },
                            data : (function (){
                                var now = new Date();
                                var res = [];
                                var len = 10;
                                while (len--) {
                                    res.unshift(now.toLocaleTimeString().replace(/^\D*/,''));
                                    now = new Date(now - 2000);
                                }
                                return res;
                            })()
                        }],
                        yAxis : [
                            {
                                type : 'value',
                                scale: true,
                                name : $filter('translate')('Co_tj')//条数
                                // boundaryGap: [0.2, 0.2]
                            }
                        ],
                        series : [
                            {
                                name:'Insert',
                                type:'bar',
                                data:[]
                            },
                            {
                                name:'Delete',
                                type:'bar',
                                data:[]
                            },
                            {
                                name:'Update',
                                type:'bar',
                                data:[]
                            },
                            {
                                name:'DDL',
                                type:'bar',
                                data:[]
                            },
                            {
                                name:'Total',
                                type:'bar',
                                data:[]
                            }
                        ],
                        noDataLoadingOption: {
                            text: 'No Data!',//('+$filter('translate')('Co_qzdqkq')+')请在当前组件配置信息里查看队列统计选项是否开启
                            effect: 'bubble',
                            effectOption: {
                                backgroundColor:"#1A1A1D",
                                effect: {
                                    n: 0
                                }
                            },
                            textStyle: {
                                fontWeight: 'bold'
                            }
                        }
                    };
                    var option2 = {
                        title : {
                            text: $filter('translate')('Co_dltjbt'),//队列统计饼图
                            x:'center'
                        },
                        tooltip : {
                            trigger: 'item',
                            formatter: "{a} <br/>{b} : {c} ({d}%)"
                        },
                        legend: {
                            orient : 'vertical',
                            x : 'left',
                            data:['INSERT','DELETE','UPDATE','DDL']
                        },
                        toolbox: {
                            show : false,
                            feature : {
                                mark : {show: true},
                                dataView : {show: true, readOnly: false},
                                magicType : {
                                    show: true,
                                    type: ['pie', 'funnel'],
                                    option: {
                                        funnel: {
                                            x: '25%',
                                            width: '50%',
                                            funnelAlign: 'left',
                                            max: 1548
                                        }
                                    }
                                },
                                restore : {show: true},
                                saveAsImage : {show: true}
                            }
                        },
                        calculable : true,
                        series : [
                            {
                                name:$filter('translate')('Co_dltjsj'),//队列统计数据
                                type:'pie',
                                radius : '55%',
                                center: ['50%', '60%'],
                                data:[
                                    {value:0, name:'INSERT'},
                                    {value:0, name:'UPDATE'},
                                    {value:0, name:'DELETE'},
                                    {value:0, name:'DDL'}
                                ]
                            }
                        ],
                        noDataLoadingOption: {
                            text: 'No Data!',//('+$filter('translate')('Co_qzdqkq')+')请在当前组件配置信息里查看队列统计选项是否开启
                            effect: 'bubble',
                            effectOption: {
                                backgroundColor:"#1A1A1D",
                                effect: {
                                    n: 0
                                }
                            },
                            textStyle: {
                                fontWeight: 'bold'
                            }
                        }
                    };

                    require.config({
                        paths: {
                            echarts: './lib'
                        }
                    });
                    var deffer=$q.defer();
                    require(['echarts','echarts/chart/bar','echarts/chart/line','echarts/chart/pie','echarts/theme/dark','echarts/zrender/tool/color'],function (ec,a,b,p,c) {
                        var chart = ec.init(document.getElementById("queue_bj_chart"),c);
                        chart.setOption(option);
                        deffer.resolve({
                            chart:chart,
                            option1:option,
                            option2:option2
                        });
                    });
                    return deffer.promise;
                }
            }]
        })
        .component('loaderConsole',{
            templateUrl:'console_view/loaderCon.component.html',
            bindings:{
                trans:'<'
            },
            controller:['$scope','$rootScope','$stateParams','$state','tipsService','$interval','$filter','$q','csService','$timeout',function ($scope,$rootScope,$stateParams,$state,dipT,$interval,$filter,$q,csService,$timeout){
                var $ctrl=this;
                var comInfo = $stateParams;
                $ctrl.cons = {
                    cons:true,
                    currentTab:'tab3',
                    chart:null,
                    option:null,
                    statusRunning:false
                };
                $ctrl.data = {
                    start_scn:'',
                    complete_scn: 0,
                    complete_xid: 0,
                    servers:[],
                    offset:0,
                    errors:[],
                    logs:'',
                    isFresh:false,
                    freshWay:'1',
                    currentId:0
                };
                var offset =0,serverInfo=1,stopTime,thread,error_num=0,log_errs=0;
                var conEventRes;
                $ctrl.loader_err = {
                    active:0,//当前展示的标签页
                    loading:false,
                    his_err_list:[],
                    start_time:'',
                    end_time:'',
                    uname:'',
                    uobject:'',
                    handle:'',
                    has_read:false
                };
                $ctrl.ptotal= 1;//主页面页面总数
                $ctrl.pnum =1;//主页面的当前页
                $ctrl.fy={//跳转页码，非对象形式取不到值
                    snum:''
                };
                $ctrl.pd_info = false;//错误详情panel展示标记
                $ctrl.pd_ck_all = false;//历史错误全选按钮
                $ctrl.is_cur=false;//当前错误按钮是否触发
                $ctrl.is_cur_run=false;
                $ctrl.empty_err_tip='No Data!';
                $ctrl.err_detail='';
                $ctrl.loader_err_stat={//错误统计列表
                    list:[]
                };
                $ctrl.isShow=false;
                 $ctrl.$onInit=function () {
                     function loaderStart() {
                         //生成Chart图形
                         createCharts($q,$ctrl.trans.Co_ldzztj,$ctrl.trans.Co_tj).then(function (res) {
                             $ctrl.cons.chart = res.chart;
                             $ctrl.cons.option = res.option;
                             //获取Capture组件的状态信息
                             fetchLoaderStatus().then(function (dat) {
                                 if(!comInfo){
                                     return;
                                 }
                                 if(dat.status===3){
                                     thread=dat.data;
                                     $ctrl.data.currentId=thread.pid;
                                     fetchLogs(csService,$ctrl,comInfo,thread,dipT,log_errs);
                                     stopTime = $interval(function () {
                                         fetchLoaderStatus().then(function (da) {
                                             if(da.status===1){
                                                 error_num++;
                                                 if(error_num<2){
                                                     dipT.error(da.msg);
                                                 }
                                             }else if(da.status===3){
                                                 error_num=0;
                                                 fetchLogs(csService,$ctrl,comInfo,dat.data,dipT,log_errs);
                                             }
                                         });
                                     },5000);
                                 }else if(dat.status===1){
                                     dipT.error(dat.msg);
                                 }
                                 $scope.$on('$destroy', function() {
                                     if (angular.isDefined(stopTime)) {
                                         $interval.cancel(stopTime);
                                         stopTime = undefined;
                                     }
                                     if(conEventRes && angular.isFunction(conEventRes)){
                                         conEventRes();
                                     }
                                 });
                             });
                         });
                     }
                     if(comInfo.tab==='tab1'){
                         $ctrl.cons.currentTab='tab1';
                         loaderStart();
                         $ctrl.cons.statusRunning=true;
                     }else if(comInfo.tab==='tab2'){
                         $ctrl.cons.currentTab='tab2';
                         loaderStart();
                         $ctrl.cons.statusRunning=true;
                     }else if(comInfo.tab==='tab3'){
                         $ctrl.cons.currentTab='tab3';
                     }else{
                         $ctrl.cons.currentTab='tab1';
                         loaderStart();
                         $ctrl.cons.statusRunning=true;
                     }
                 };
                 $ctrl.$postLink=function () {
                     $timeout(function () {
                         var startD = $('#datetimepicker-dark-start'),endD=$('#datetimepicker-dark-end');
                         startD.datetimepicker({
                             theme:'dark',
                             onShow:function(){
                                 this.setOptions({
                                     maxDate:endD.val()?endD.val():$filter('date')(new Date(),'yyyy-MM-dd HH:mm:ss')
                                 })
                             }
                         });
                         endD.datetimepicker({
                             theme:'dark',
                             onShow:function(){
                                 this.setOptions({
                                     minDate:startD.val()?startD.val():false
                                 })
                             }
                         });
                     });
                 };
                var getList= function(pnum) {
                    var stime=$ctrl.loader_err.start_time;
                    var etime=$ctrl.loader_err.end_time;
                    var uname=$ctrl.loader_err.uname;
                    var uobj = $ctrl.loader_err.uobject;
                    var handle = $ctrl.loader_err.handle;
                    var has_read = $ctrl.loader_err.has_read?16:0;
                    $ctrl.loader_err.loading=true;
                    $ctrl.pd_ck_all=false;
                    csService.queryApplyFullErrors(comInfo,uname,uobj,handle,pnum,has_read,stime,etime).then(function (result) {
                        $ctrl.loader_err.loading=false;
                        if(result.res){
                            $ctrl.loader_err.his_err_list = result.list;
                            $ctrl.ptotal=result.total;
                            if($ctrl.pnum>=$ctrl.ptotal){
                                $ctrl.pnum=$ctrl.ptotal;
                            }
                        }
                    },function () {
                        $ctrl.loader_err.loading=false;
                    });
                };
                //搜索
                $ctrl.searchErrList = function () {
                    $ctrl.is_cur=false;
                    $ctrl.empty_err_tip='No Data!';
                    $ctrl.pnum=1;
                    var stime=$ctrl.loader_err.start_time;
                    var etime=$ctrl.loader_err.end_time;
                    if(stime && etime){
                       if(!angular.isDate(new Date(stime))){
                           dipT.error('开始时间格式错误！');
                           return;
                       }
                        if(!angular.isDate(new Date(etime))){
                            dipT.error('结束时间格式错误！');
                            return;
                        }
                       if(new Date(etime)<new Date(stime)){
                          dipT.error('开始时间不能大于结束时间！');
                          return;
                       }
                    }
                    getList(1);
                };
                //触发历史错误标签时展示
                $ctrl.showHistoryList = function () {
                    $ctrl.is_cur=false;
                    $ctrl.empty_err_tip='No Data!';
                    $ctrl.pnum=1;
                    getList(1);
                };
                //上一页
                $ctrl.pagePre=function(){
                    if($ctrl.ptotal===1){
                        $ctrl.pnum=1;
                    }else{
                        if($ctrl.pnum-1>0){
                            $ctrl.pnum=$ctrl.pnum-1;
                        }
                    }
                    getList($ctrl.pnum);
                };
                //下一页
                $ctrl.pageNext=function(){
                    if($ctrl.ptotal===1){
                        $ctrl.pnum= 1;
                    }if($ctrl.ptotal===$ctrl.pnum){
                        $ctrl.pnum=$ctrl.ptotal;
                    }else{
                        if($ctrl.pnum+1<=$ctrl.ptotal){
                            $ctrl.pnum=$ctrl.pnum+1;
                        }
                    }
                    getList($ctrl.pnum);
                };
                //跳转
                $ctrl.tiao=function(){
                    if($ctrl.fy.snum===''){
                        return;
                    }
                    $ctrl.pnum=parseInt($ctrl.fy.snum) || $ctrl.pnum;
                    $ctrl.fy.snum='';
                    getList($ctrl.pnum);
                };
                $ctrl.getNewLog = function () {
                    if(comInfo && thread){
                        fetchLogsAndErrors(csService,$ctrl,comInfo,thread)
                    }
                };

                $ctrl.getDetail = function (item) {
                    thread=item;
                    $ctrl.data.currentId=item.pid;
                };
                $ctrl.showTab = function (num) {
                    $ctrl.cons.currentTab='tab'+num;
                    if(!$ctrl.cons.statusRunning){
                        loaderStart();
                        $ctrl.cons.statusRunning=true;
                    }
                    if(num===4){
                        $ctrl.isShow=true;
                    }else{
                        $ctrl.isShow=false;
                    }
                };
                conEventRes=$rootScope.$on('consoleView',function (e, data) {
                    var cap_chart=$('#Capture_chart_id'),ms=cap_chart.width();
                    if(data){
                        cap_chart.width(ms-193);
                    }else{
                        cap_chart.width(ms+193);
                    }
                    $ctrl.cons.chart && $ctrl.cons.chart.resize();
                });
                $ctrl.closeDetailPanel= function () {
                    $ctrl.pd_info=false;
                    $ctrl.err_detail='';
                };
                $ctrl.showHisErrDetail= function (msg) {
                    $ctrl.pd_info=true;
                    if(angular.isString(msg) && msg.length>0){
                        $ctrl.err_detail=msg;
                    }
                };
                //导出Excel表格
                $ctrl.outputExcel =function () {
                    csService.exportExcelErrorFile(comInfo);
                };
                //标记为已读
                $ctrl.markReaded = function () {
                    var locations='',arr =$filter('filter')($ctrl.loader_err.his_err_list,{flag:true});
                    if(arr.length<=0){
                        dipT.error($filter('translate')('Co_tip1'));//您没有选中任何数据，请选择要标记的数据！
                        return;
                    }
                    angular.forEach(arr,function (val) {
                        locations += '<location><offset>' + val.offset + '</offset></location>';
                    });
                    csService.markedApplyError(comInfo,locations).then(function (res) {
                        if(res){
                            dipT.success($filter('translate')('Co_tip2'));//操作执行成功！
                            getList(1);
                        }
                    });
                };
                //是否全选
                $ctrl.ckAllChange = function () {
                    var ck = $ctrl.pd_ck_all;
                    angular.forEach($ctrl.loader_err.his_err_list,function (val) {
                        val.flag = ck;
                    });
                };
                //列表项复选框
                $ctrl.itemCkChange = function (item) {
                    var num =0;
                    if(!item.flag){
                        $ctrl.pd_ck_all=false;
                    }else{
                        angular.forEach($ctrl.loader_err.his_err_list,function (v) {
                            if(v.flag){
                                num++;
                            }
                        });
                        if($ctrl.loader_err.his_err_list.length===num){
                            $ctrl.pd_ck_all=true;
                        }
                    }
                };
                //清除错误日志
                $ctrl.clearErrLogs =function () {
                    csService.clearErrorLogs(comInfo).then(function (res) {
                        if(res){
                            $ctrl.loader_err.his_err_list=[];
                            $ctrl.ptotal= 1;
                            $ctrl.pnum = 1;
                        }
                    });
                };
                //展示错误统计列表
                $ctrl.showErrTj = function () {
                    $ctrl.getErrStatList();
                };
                //获取错误统计列表
                $ctrl.getErrStatList= function (){
                    csService.getErrorStatList(comInfo).then(function (result) {
                        if(result.res){
                            $ctrl.loader_err_stat.list =result.list;
                        }
                    });
                };
                //排除选中表
                $ctrl.exceptCkList = function () {
                    var records='',arr =$filter('filter')($ctrl.loader_err.list,{checked:true});
                    if(arr.length<=0){
                        dipT.error($filter('translate')('Co_tip3'));//您没有选中任何数据，请选择要同步的表！
                        return;
                    }
                    angular.forEach(arr,function (val) {
                        records += '<owner>' + val.owner + '</owner><table>' + val.table_name + '</table>';
                    });
                    csService.excludeSelectTable(comInfo,records).then(function (res) {
                        if(res){
                            dipT.success($filter('translate')('Co_zxcg'));//执行成功！
                        }
                    });
                };
                //重新同步选中表
                $ctrl.reSyncCkList = function () {
                    var records='',arr =$filter('filter')($ctrl.loader_err.list,{checked:true});
                    if(arr.length<=0){
                        dipT.error($filter('translate')('Co_tip3'));//您没有选中任何数据，请选择要同步的表！
                        return;
                    }
                    angular.forEach(arr,function (val) {
                        records += '<owner>' + val.owner + '</owner><table>' + val.table_name + '</table>';
                    });
                    csService.syncTablePart(comInfo,records).then(function (res) {
                        if(res){
                            getList(1);
                        }
                    });
                };
                //<<----------------当前错误操作
                var handelCurrentErr = function (urlStr,msg) {
                    var dialog = new BootstrapDialog({
                        title:'Full Sync Info',
                        type:'type-warning',
                        message: function(){
                            return '<h2 class="text-warning">'+msg+'</h2>';
                        },
                        closable: false
                    });
                    dialog.open();
                    csService.handleError(comInfo,urlStr).then(function (result) {
                        if(result.res){
                            dialog.setType('type-success');
                            dialog.getModalBody().html('<h2 class="text-success">'+$filter('translate')('Co_gxzxcg')+'<i class="green glyphicon glyphicon-ok"></i></h2>');//恭喜！操作执行成功！
                            $ctrl.showCurrentErr();
                        }else{
                            dialog.setType('type-danger');
                            dialog.getModalBody().html('<h2 class="text-error">'+result.msg+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                        }
                        dialog.setClosable(true);
                        setTimeout(function () {
                            dialog.close();
                        },500);
                    },function () {
                        dipT.error($filter('translate')('Wlcw'));//网络错误！
                        dialog.setClosable(true);
                        dialog.close();
                    });
                };
                //展示当前错误
                $ctrl.showCurrentErr = function () {
                    $ctrl.is_cur=true;
                    $ctrl.empty_err_tip='No Data!';
                    csService.getLoaderCurrentError(comInfo).then(function (result) {
                        if(result.res){
                            var res =result.data,item={};
                            if($.isEmptyObject(res)){
                                return;
                            }
                            if(res.status==='running'){
                                $ctrl.loader_err.his_err_list=[];
                                $ctrl.empty_err_tip=$filter('translate')('Co_tip4');//当前loader运行正常 没有错误!
                                $ctrl.is_cur_run=true;
                            }else{
                                $ctrl.is_cur_run=false;
                                $ctrl.loader_err.his_err_list=[];
                                $ctrl.ptotal= 1;
                                $ctrl.pnum = 1;
                                item.owner=res.owner;
                                item.time=res.time;
                                item.object=res.object;
                                item.operation=res.operation;
                                item.error_type=res.error_type;
                                item.action=res.action;
                                item.flag=false;
                                item.detailed_message=res.detailed_message;
                                $ctrl.loader_err.his_err_list.push(item);
                            }
                        }
                    });
                };
                //重置
                $ctrl.resetErrParams=function () {
                    $ctrl.loader_err.start_time='';
                    $ctrl.loader_err.end_time='';
                    $ctrl.loader_err.uname='';
                    $ctrl.loader_err.uobject='';
                    $ctrl.loader_err.handle='';
                    $ctrl.loader_err.has_read=false;
                    getList(1);
                };
                $ctrl.handleErr = function (str) {
                    var msg='';
                    if(str==='auto_fix_data'){
                        msg=$filter('translate')('Co_tip5');//正在修复数据......
                        handelCurrentErr(str,msg);
                    }else if(str==='skip_error'){
                        msg=$filter('translate')('Co_tip6');//正在跳过错误......
                        handelCurrentErr(str,msg);
                    }else if(str==='exclude_table'){
                        msg=$filter('translate')('Co_tip7');//正在排除错误......
                        handelCurrentErr(str,msg);
                    }else if(str==='force_updates'){
                        msg=$filter('translate')('Co_tip8');//正在强制修改当前表......
                        handelCurrentErr(str,msg);
                    }else if(str==='retry_error'){
                        msg=$filter('translate')('Co_tip9');//正在重试当前表......
                        handelCurrentErr(str,msg);
                    }else if(str==='refresh'){
                        this.showCurrentErr();
                    }
                };
                //获取loader组件状态
                function fetchLoaderStatus() {
                    var res_data={status:1,msg:'',data:null};
                    return csService.getLoaderStatus(comInfo).then(function (result) {
                        if(!result.res){
                            res_data.msg=result.msg;
                        }else{
                            var res = result.data;
                            if(!res){
                                res_data.status=2;
                            }else{
                                $ctrl.data.start_scn =res.breakpoint.start_scn;
                                $ctrl.data.complete_scn =res.breakpoint.complete_scn;
                                $ctrl.data.complete_xid =res.breakpoint.complete_xid;
                                $ctrl.data.servers=[];
                                var nowServer={};
                                if(res.server_info){
                                    if(angular.isArray(res.server_info.server)){
                                        $ctrl.data.servers=res.server_info.server;
                                    }else if(angular.isObject(res.server_info.server)){
                                        $ctrl.data.servers.push(res.server_info.server);
                                    }
                                }
                                if($ctrl.data.servers.length>0){
                                    angular.forEach($ctrl.data.servers,function (v) {
                                        if(!v.off_set){
                                            v.off_set=0;
                                        }else{
                                            thread && (v.off_set=thread.off_set);
                                        }
                                    });
                                    if(!thread){
                                        thread =$ctrl.data.servers[0];
                                    }
                                    res_data.status=3;
                                    res_data.data=thread;
                                    nowServer=$ctrl.data.servers[0];
                                }else{
                                    res_data.status=4;
                                }
                                // 动态数据接口 addData
                                if($ctrl.cons.chart && nowServer){
                                    var da =nowServer,toDate = res.timestamp.split(' ')[1];
                                    $ctrl.cons.chart.addData([
                                        [
                                            0,        // 系列索引
                                            da.op_insert, // 新增数据
                                            false,     // 新增数据是否从队列头部插入
                                            false,     // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                            toDate
                                        ],
                                        [
                                            1,        // 系列索引
                                            da.op_delete, // 新增数据
                                            false,    // 新增数据是否从队列头部插入
                                            false    // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                        ],
                                        [
                                            2,        // 系列索引
                                            da.op_update, // 新增数据
                                            false,    // 新增数据是否从队列头部插入
                                            false    // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                        ],
                                        [
                                            3,        // 系列索引
                                            da.op_ddl, // 新增数据
                                            false,    // 新增数据是否从队列头部插入
                                            false    // 是否增加队列长度，false则自定删除原有数据，队头插入删队尾，队尾插入删队头
                                        ]
                                    ]);
                                }

                            }
                        }
                        return res_data;
                    });
                }
            }]
        })
        .component('loaderErr', {
            templateUrl: 'console_view/loaderErrStatis.component.html',
            bindings: {
                errList: '<',
                onUpdate:'&'
            },
            controller: function() {
                var $ctrl = this;
                $ctrl.loader_err_stat={//错误统计列表
                    list:[],
                    ckAll:false,
                    loading:false
                };
                $ctrl.$onInit = function() {
                     angular.forEach($ctrl.errList,function (v) {
                         v.checked=false;
                     });
                };
                $ctrl.getErrStatList=function () {
                    $ctrl.loader_err_stat.ckAll=false;
                    $ctrl.onUpdate();
                };
                //错误统计列表的全选切换事件
                $ctrl.ckErrAllChange = function () {
                    var ck = $ctrl.loader_err_stat.ckAll;
                    angular.forEach($ctrl.errList,function (val) {
                        val.checked = ck;
                    });
                };
                //错误统计列表子项切换事件
                $ctrl.ckErrItemChange = function (item) {
                    var num=0;
                    if(!item.checked){
                        $ctrl.loader_err_stat.ckAll=false;
                    }else{
                        angular.forEach($ctrl.errList,function (v) {
                            if(v.checked){
                                num++;
                            }
                        });
                        if(num===$ctrl.errList.length){
                            $ctrl.loader_err_stat.ckAll=true;
                        }
                    }
                };
            }
        })
        .component('loaderPcb',{
            templateUrl: 'console_view/loaderPcb.component.html',
            bindings:{
                isShow: '<'
            },
            controller: ['$stateParams','csService','tipsService','$log',function($stateParams,csService,dipT,$log) {
                var $ctrl = this;
                $ctrl.ckAll=false;
                $ctrl.pcbList=[];
                $ctrl.loading=false;
                $ctrl.ptotal= 1;//主页面页面总数
                $ctrl.pnum =1;//主页面的当前页
                $ctrl.fy={//跳转页码，非对象形式取不到值
                    snum:''
                };
                var getList= function(pnum) {
                    $ctrl.loading=true;
                    csService.getLoaderPcbList($stateParams,pnum).then(function (data) {
                        $ctrl.pcbList=data.list;
                        $ctrl.ckAll=false;
                        $ctrl.ptotal=data.total;
                        if($ctrl.pnum>=$ctrl.ptotal){
                            $ctrl.pnum=$ctrl.ptotal;
                        }
                    }).finally(function () {
                        $ctrl.loading=false;
                    });
                };
                $ctrl.$onChanges=function (changes) {
                    if(changes.isShow.currentValue){
                        getList(1);
                    }
                };
                //上一页
                $ctrl.pagePre=function(){
                    if($ctrl.ptotal===1){
                        $ctrl.pnum=1;
                    }else{
                        if($ctrl.pnum-1>0){
                            $ctrl.pnum=$ctrl.pnum-1;
                        }
                    }
                    getList($ctrl.pnum);
                };
                //下一页
                $ctrl.pageNext=function(){
                    if($ctrl.ptotal===1){
                        $ctrl.pnum= 1;
                    }if($ctrl.ptotal===$ctrl.pnum){
                        $ctrl.pnum=$ctrl.ptotal;
                    }else{
                        if($ctrl.pnum+1<=$ctrl.ptotal){
                            $ctrl.pnum=$ctrl.pnum+1;
                        }
                    }
                    getList($ctrl.pnum);
                };
                //跳转
                $ctrl.tiao=function(){
                    if($ctrl.fy.snum===''){
                        return;
                    }
                    $ctrl.pnum=parseInt($ctrl.fy.snum) || $ctrl.pnum;
                    $ctrl.fy.snum='';
                    getList($ctrl.pnum);
                };
                $ctrl.ckAllChange = function () {
                    angular.forEach($ctrl.pcbList,function (val) {
                        val.checked = $ctrl.ckAll;
                    });
                };
                $ctrl.ckItemChange = function (item) {
                    var num=0;
                    if(!item.checked){
                        $ctrl.ckAll=false;
                    }else{
                        angular.forEach($ctrl.pcbList,function (v) {
                            if(v.checked){
                                num++;
                            }
                        });
                        if(num===$ctrl.pcbList.length){
                            $ctrl.ckAll=true;
                        }
                    }
                };
                $ctrl.deleteRecords=function () {
                    var list=[];
                    angular.forEach($ctrl.pcbList,function (v) {
                        if(v.checked){
                            list.push({owner:v.owner,table:v.table});
                        }
                    });
                    if(list.length===0){
                        dipT.warning('您未选中任何数据！');
                        return;
                    }
                    BootstrapDialog.confirm({
                        title: 'Dip 提示',//Dip 提示
                        message:'确认删除这些记录吗？',//确认删除这些记录吗？
                        type: BootstrapDialog.TYPE_WARNING,
                        btnCancelLabel: '取消',//取消
                        btnOKLabel: '确认',//确认
                        btnOKClass: 'btn-warning',
                        callback: function(result) {
                            if(result){
                                csService.deletePcbList($stateParams,list).then(function (data) {
                                    if(data){
                                        dipT.success('删除成功！');
                                        getList(1);
                                    }else{
                                        dipT.error('删除失败！');
                                    }
                                });
                            }
                        }
                    });
                };
            }]
        })
        .directive("page",function(){
            return {
                restrict:"EA",
                scope:{
                    pre:"&",
                    next:"&",
                    tiao:"&",
                    cnum:"=",
                    tt:"=",
                    snum:'='
                },
                template:'<button class="btn button" ng-click="pre()"><i class="fa fa-arrow-circle-o-left"></i></button><span>{{cnum+"/"+tt}}</span>'
                +'<button class="btn button" ng-click="next()"><i class="fa fa-arrow-circle-o-right"></i></button>'
                +'<input class="input" type="number" ng-model="snum" min="1" size="30">'
                 +'<button class="btn button" ng-click="tiao();snum=\'\';"><i class="fa fa-search"></i></button>',
                link:function(scope){
                    scope.$watch("snum",function(nVal,oVal){
                        if(nVal !== oVal){
                            if(nVal>scope.tt){
                                scope.snum=scope.tt;
                                return;
                            }
                            if(nVal < 1) {
                                scope.snum = '';
                                return;
                            }
                            scope.snum=(nVal && isFinite(nVal))?nVal:oVal;
                        }
                    });
                }
            }
        });
        //生成柱状图界面
        function createCharts($q,title,ts) {
            var option = {
                title : {
                    text: title,
                    y:10
                },
                tooltip : {
                    trigger: 'axis'
                },
                legend: {
                    y:10,
                    data:['Insert','Delete','Update','DDL']
                },
                toolbox: {
                    show : false,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        magicType : {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                dataZoom : {
                    show : false,
                    start : 0,
                    end : 100
                },
                xAxis : [
                    {
                        type : 'category',
                        boundaryGap : true,
                        data : (function (){
                            var now = new Date();
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.unshift(now.toLocaleTimeString().replace(/^\D*/,''));
                                now = new Date(now - 2000);
                            }
                            return res;
                        })()
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        scale: true,
                        name : ts//条数
                        // boundaryGap: true
                    }
                ],
                series : [
                    {
                        name:'Insert',
                        type:'bar',
                        data:(function (){
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.push(0);
                            }
                            return res;
                        })()
                    },
                    {
                        name:'Delete',
                        type:'bar',
                        data:(function (){
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.push(0);
                            }
                            return res;
                        })()
                    },
                    {
                        name:'Update',
                        type:'bar',
                        data:(function (){
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.push(0);
                            }
                            return res;
                        })()
                    },
                    {
                        name:'DDL',
                        type:'bar',
                        data:(function (){
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.push(0);
                            }
                            return res;
                        })()
                    }
                ]
            };
            var myChart1;
            require.config({
                paths: {
                    echarts: './lib'
                }
            });
            var deffer=$q.defer();
            require(['echarts','echarts/chart/bar','echarts/chart/line','echarts/theme/dark','echarts/zrender/tool/color'],function (ec,a,b,c) {
                var view = $('.main-console').find('div.tab-content');
                var h = view.height()===0?325:view.height()-58;
                $('#Capture_chart_id').css({'width':(view.width()-30)+'px','height':h+'px','margin':'0 auto'});
                myChart1 = ec.init(document.getElementById("Capture_chart_id"),c);
                myChart1.setOption(option);
                deffer.resolve({
                    chart:myChart1,
                    option:option
                });
            });
            return deffer.promise;
        }
        //查询错误日志
        function fetchLogs(csService,$ctrl,comInfo,serverInfo,dipT,log_errs) {
            if(!log_errs){log_errs=0;}
            if($ctrl.data.freshWay ==='1' && !$ctrl.data.isFresh){
                fetchLogsAndErrors(csService,$ctrl,comInfo,serverInfo).then(function (dd) {
                    if(dd.status===1){
                        log_errs++;
                        if(log_errs<2){
                            // dipT.error(dd.msg);
                        }
                    }else if(dd.status===3){
                        log_errs=0;
                    }
                });
            }
        }
        //查询实时日志及错误列表
        function fetchLogsAndErrors(csService,$ctrl,comInfo,serverInfo) {
            return csService.getConsoleErrorDetail(comInfo,serverInfo).then(function (result) {
                if(result.data){
                    $ctrl.data.errors=result.data.errors;
                    $ctrl.data.logs +=result.data.logs;
                    $ctrl.data.fileName =result.data.fileName;
                    serverInfo.off_set=result.data.off_set;
                }
                return result;
            });
        }
})();