/**
 * Created by cagej on 2017/4/10.
 */
(function () {
    'use strict';
    angular.module('myApp.main_view',['myApp.main_view.service'])
        .directive('main',['tipsService','mainService','$log',function (dipT,mainService,$log) {
            function plumb(scope,$ctrl) {
                var r7Plumb,
                    lineColor = ["#000000","#48daff","#ffA500","#5e87b0"],
                    //连接线上的样式
                    connectorPaintStyle = {
                        strokeStyle: lineColor[1],
                        fillStyle: "transparent",
                        radius: 0,
                        lineWidth: 2
                    },
                    // 鼠标悬浮在连接线上的样式
                    connectorHoverStyle = {
                        lineWidth: 3,
                        strokeStyle: lineColor[3],
                        outlineWidth: 0,
                        outlineColor: "transparent"
                    },
                    //空心圆端点样式设置
                    hollowCircle = {
                        endpoint: ["Dot", {radius:1,cssClass:"rectClass",hoverClass:"rectHoverClass"}],
                        connectorStyle: connectorPaintStyle,//连接线的颜色，大小样式
                        connectorHoverStyle: connectorHoverStyle,
                        paintStyle: {
                            strokeStyle: lineColor[1],
                            fillStyle: "transparent",
                            radius: 1,
                            lineWidth: 1
                        },		//端点的颜色样式
                        endpointHoverStyle:{ strokeStyle:lineColor[3],lineWidth: 1,fillStyle: "none"},
                        connector: ["Flowchart", {stub: [0, 0], gap: 2, cornerRadius: 5, alwaysRespectStubs: true }],
                        maxConnections: -1,	// 设置连接点最多可以连接几条线
                        connectorOverlays: [["Arrow", { width: 10, length: 10, location: 1,foldback:0.8}]],
                        DragOptions : { zIndex:2000 }
                    },
                    instance = jsPlumb.getInstance({
                        endpoint: ["Dot", { radius: 1}],  //端点的形状
                        connectorStyle: connectorPaintStyle,//连接线的颜色，大小样式
                        connectorHoverStyle: connectorHoverStyle,
                        maxConnections: -1,	// 设置连接点最多可以连接几条线
                        connectorOverlays: [["Arrow", { width: 10, length: 10, location: 1,foldback:0.8 }]],
                        DragOptions : { zIndex:2000 },
                        Container:"flowbox"
                    }),
                    flowCanvas=$("#flowbox"),
                    toolBar = $("#kj-kj"),
                    canvasId="flowbox",
                    initNum=30,
                    componentIndex=initNum,
                    currentLineStyle='Flowchart';
                var oRegionSelect =new r7PlumbSelectArea.regionSelect({
                    region: '#flowbox div.component',
                    selectedClass: 'seled',
                    parentId: canvasId
                });
                oRegionSelect.select();
                //加载已经存在的图像，初始化Drag方法，保存，删除
                r7Plumb = function () {
                    var _r7Plumb ={};
                    //改变元素的对其方式
                    _r7Plumb.changePosition = function (num) {
                        var val = num;
                        if(val === "1"){
                            r7PlumbSelectArea.alignTop();
                        }else if(val === "2"){
                            r7PlumbSelectArea.alignBottom();
                        }else if(val === "3"){
                            r7PlumbSelectArea.alignLeft();
                        }else if(val === "4"){
                            r7PlumbSelectArea.alignRight();
                        }else if(val === "5"){
                            r7PlumbSelectArea.alignMiddle();
                        }
                    };
                    //更改连接线的类型直线、曲线、折线
                    _r7Plumb.changeLine = function (num) {
                        //连线样式下拉框的change事件
                        if(!parseInt(num)){
                            return;
                        }
                        //重置节点样式
                        var nodes = jsPlumb.getSelector(".component"),i;
                        if(nodes.length <=0){
                            return;
                        }
                        changeLineStyleByNum(num);
                        $.cookie("strlineStyle",num);
                        //重绘连接线的样式
                        var grapStr = this.graphicToStr();
                        instance.reset();
                        flowCanvas.empty();
                        renderComponents(grapStr.json_blocks,grapStr.json_lines);
                    };
                    //获取保存的链路
                    _r7Plumb.drawGraphic = function (data) {
                        var xmlDoc = data.response;
                        instance.reset();
                        flowCanvas.empty();
                        //1.1 添加内容连线到界面
                        if(!xmlDoc || !xmlDoc.graphic){
                            return;
                        }
                        if(!xmlDoc.graphic.line_object || !xmlDoc.graphic.graphic_content || !xmlDoc.graphic.global_index){
                            return;
                        }
                        var arrplant = xmlDoc.graphic.graphic_content;
                        var connects = xmlDoc.graphic.line_object;
                        var g_flag = xmlDoc.graphic.global_index;

                        componentIndex = (parseInt(g_flag) && parseInt(g_flag)>initNum)?parseInt(g_flag):initNum;
                        if(arrplant === "[]"){
                            return;
                        }
                        arrplant = JSON.parse(arrplant);
                        connects = JSON.parse(connects);
                        renderComponents(arrplant,connects);
                    };
                    //获取界面所有元素、连线，并生成Base64字符串
                    //获取必要的图像信息
                    _r7Plumb.graphicToStr = function () {
                        //1.取得所有的连线
                        var connects = [];
                        $.each(instance.getAllConnections(), function (idx, connection) {
                            connects.push({
                                ConnectionId: connection.id,
                                PageSourceId: connection.sourceId,
                                PageTargetId: connection.targetId,
                                RealSourceId:$(connection.source).attr('realid'),
                                RealTargetId:$(connection.target).attr('realid'),
                                Connector:connection.connector.type
                            });
                        });
                        //2.取得所有的节点
                        var blocks = [];
                        flowCanvas.find(".component").each(function (idx, elem) {
                            var $elem = $(elem);
                            $elem.removeClass('seled');
                            blocks.push({
                                BlockId: $elem.attr('id'),
                                BlockClass: $elem.find('.km-btn-full').attr('class'),
                                BlockTxt: $elem.find('.dragPoint').text(),
                                BlockX: $elem.css("left"),
                                BlockY: $elem.css("top"),
                                BlockWidth: $elem.css("width"),
                                BlockHeight: $elem.css("height"),
                                ParentId: $elem.attr("parentid"),
                                Rtype: $elem.attr("rtype"),
                                Type: $elem.attr("type"),
                                Name: $elem.attr("name"),
                                OriginalTitle: $elem.attr("original-title"),
                                Class : $elem.attr('class'),
                                RealId:$elem.attr('realid')
                            });
                        });
                        var lineString = Base64.encode(JSON.stringify(connects));
                        var gpContent = Base64.encode(JSON.stringify(blocks));
                        return {
                            lines:lineString,
                            contents:gpContent,
                            indexs:componentIndex,
                            json_lines:connects,
                            json_blocks:blocks
                        };
                    };
                    _r7Plumb.dragInit = function () {
                        toolBar.find(".tool").draggable({cursor: 'move', helper: 'clone',scope: "plant"});
                        flowCanvas.droppable({accept: ".tool", drop: function(e,ui){drawGp(ui,this);},scope: "plant"});
                        var clicks = 0,timeout=300,timer=null;
                        flowCanvas.on("click",'.km-btn-full',function (e) {
                            clicks++;
                            if (clicks === 1) {
                                timer = setTimeout(function(){
                                    var curTarget= $(e.target),comInfo;
                                    if(curTarget.hasClass('compic')){
                                        comInfo = curTarget.parent().parent();
                                    }else if(curTarget.hasClass('km-btn-full')){
                                        comInfo = curTarget.parent();
                                    }
                                    if(clicks === 1) {
                                        if(comInfo.attr("rtype")){
                                            scope.$apply(function () {
                                                $ctrl.showPzDialog({rtype:comInfo.attr("rtype"),name:comInfo.attr("name"),id:comInfo.attr("id"),cid:comInfo.attr("realid")});
                                            });
                                        }
                                    } else {
                                        if(comInfo.attr("rtype")){
                                            scope.$apply(function () {
                                                $ctrl.changeCurrentCom({rtype:comInfo.attr("rtype"),name:comInfo.attr("name"),id:comInfo.attr("id"),cid:comInfo.attr("realid")});
                                            });
                                        }
                                    }
                                    clicks = 0;
                                    clearTimeout(timer);
                                }, timeout);
                            }
                        }).on('dblclick','.km-btn-full',function (e) {
                            e.preventDefault();
                        });
                        function drawGp(ui,selector) {
                            scope.$apply(function () {
                                $ctrl.menu.comPanelShow = false;
                            });
                            var modelid = $(ui.draggable).attr("id");
                            componentIndex++;
                            var id = modelid+componentIndex;
                            var tleft = parseInt(flowCanvas.parent().scrollLeft());
                            var ttop = parseInt(flowCanvas.parent().scrollTop());
                            var nw = ui.helper.clone();
                            $(nw).attr('class', 'component ' + $(nw).attr('type'));
                            $(nw).attr("rtype", $(nw).attr('type'));
                            $(nw).removeAttr('type');
                            $(nw).attr('parentid',$(selector).attr("id"));
                            $(nw).attr('name',"unnamed");
                            $(nw).attr('id', id);
                            $(nw).attr('realid','');
                            var toolClass=$(nw).find(".km-btn-full").attr("class");
                            if( $(nw).attr("rtype")==='database'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-cir-add vertical-center compic'></div></div>");
                            }else if( $(nw).attr("rtype")==='capture'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-cp-add vertical-center compic'></div></div>");
                            }else if( $(nw).attr("rtype")==='queue'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-queue-add vertical-center compic'></div></div>");
                            }else if( $(nw).attr("rtype")==='apply'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-load-add vertical-center compic'></div></div>");
                            }else if( $(nw).attr("rtype")==='transfer'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-server-add vertical-center compic'></div></div>");
                            }else if( $(nw).attr("rtype")==='etl'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-etl-add vertical-center compic'></div></div>");
                            }else if( $(nw).attr("rtype")==='ftp'){
                                $(nw).append("<div class='"+toolClass+" drag-cir'><div class='drag-ftp-add vertical-center compic'></div></div>");
                            }else{
                                return;
                            }
                            $(nw).find("a").remove();
                            $(nw).append('<span class="dragPoint">unnamed</span>');
                            //sidebar宽度
                            var sideBarLeft = 0;
                            if($("#drag_box_id").hasClass("page-sidebar-closed")){
                                sideBarLeft=188;
                            }
                            var ll = parseInt($(nw[0]).css("left"))-97+sideBarLeft+tleft;
                            var hh = parseInt($(nw[0]).css("top")) -102 + ttop;
                            if(ll < 0){
                                ll = 10;
                            }
                            if(hh < 0){
                                hh = 10;
                            }
                            $(nw[0]).css("left", ll + "px");
                            $(nw[0]).css("top", hh + "px");
                            $(nw[0]).css("width","");
                            $(nw[0]).css("height","");
                            $(nw[0]).css("zIndex",100);
                            flowCanvas.append(nw);
                            if(!parseInt($.cookie("strlineStyle"))){
                                changeLineStyle(currentLineStyle);
                            }
                            renderNodes(id);
                            instance.revalidate(id);
                        }
                    };
                    //重绘指定区域
                    _r7Plumb.repaintSelected = repaintSelected;
                    //选中两个控件点击连接、或者切换连接方向
                    _r7Plumb.connectTwoComponents = connectTwo;

                    function connectTwo() {
                        var sourceId, targetId,i=0;
                        var arr =r7PlumbSelectArea.getSelected();
                        if(arr.length ===2){
                            for(i;i<2;i++){
                                if(i===0){
                                    sourceId=$(arr[0]).attr("id");
                                }else{
                                    targetId=$(arr[1]).attr("id");
                                }
                            }
                            var cons =instance.getConnections({source:sourceId,target:targetId});
                            if(cons.length>0){
                                dipT.warning("控件已连接！");
                            }else{
                                var conor = instance.connect({
                                    source: sourceId,
                                    target: targetId,
                                    anchor: "Continuous"
                                }, hollowCircle);
                                conor.bind('click',function(){
                                    var that = this;
                                    BootstrapDialog.confirm({
                                        title:'Dip 提示',//Dip 提示
                                        message: '确定要删除该连线吗？',//确定要删除该连线吗
                                        type: BootstrapDialog.TYPE_WARNING,
                                        btnCancelLabel: '取消',//取消
                                        btnOKLabel: '确认',//确认
                                        btnOKClass: 'btn-warning',
                                        callback: function(result) {
                                            if(result){
                                                instance.detach(that);
                                            }
                                        }
                                    });
                                });
                            }
                        }
                    }

                    function repaintSelected(els) {
                        var arr = $.isArray(els)?els: r7PlumbSelectArea.getSelected();
                        for(var i =0;i<arr.length;i++){
                            var id = $(arr[i]).attr("id");
                            instance.updateOffset({ elId: id, recalc: true});
                            instance.repaint(id);
                        }
                    }

                    function updateMiniview() {
                        //添加图标到缩略图窗口
                       // flowCanvas.parent().miniview(flowCanvas.find(".component"));
                    }

                    function changeLineStyle(c_style) {
                        if (c_style === "Flowchart") {
                            connectorPaintStyle.strokeStyle = lineColor[1];
                            hollowCircle.connector = ["Flowchart", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
                        } else if (c_style === "Straight") {
                            connectorPaintStyle.strokeStyle  = lineColor[0];
                            hollowCircle.connector = ["Straight", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
                        } else if (c_style === "Bezier") {
                            connectorPaintStyle.strokeStyle = lineColor[2];
                            hollowCircle.connector = ["Bezier", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
                        }
                    }

                    function changeLineStyleByNum(num) {
                        if (num === "1") {
                            connectorPaintStyle.strokeStyle = lineColor[1];
                            hollowCircle.connector = ["Flowchart", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
                        } else if (num === "2") {
                            connectorPaintStyle.strokeStyle  = lineColor[0];
                            hollowCircle.connector = ["Straight", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
                        } else if (num === "3") {
                            connectorPaintStyle.strokeStyle = lineColor[2];
                            hollowCircle.connector = ["Bezier", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
                        }
                    }

                    function renderComponents(arrplant,connects) {
                        var strHtm = "",i=0;
                        $.each(arrplant,function (idx, val) {
                            var htm='',ms = val.BlockClass.split(' '),cla='',dbType='';
                            if(ms.length>=2)cla=ms[0]+' '+ms[1]+' drag-cir';
                            if(val.Rtype==='database'){
                                htm="<div class='"+cla+"'><div class='drag-cir-add vertical-center compic'></div></div>";
                            }else if( val.Rtype==='capture'){
                                htm="<div class='"+cla+"'><div class='drag-cp-add vertical-center compic'></div></div>";
                            }else if( val.Rtype==='queue'){
                                htm="<div class='"+cla+"'><div class='drag-queue-add vertical-center compic'></div></div>";
                            }else if( val.Rtype==='apply'){
                                htm="<div class='"+cla+"'><div class='drag-load-add vertical-center compic'></div></div>";
                            }else if( val.Rtype==='transfer'){
                                htm="<div class='"+cla+"'><div class='drag-server-add vertical-center compic'></div></div>";
                            }else if( val.Rtype==='etl'){
                                htm="<div class='"+cla+"'><div class='drag-etl-add vertical-center compic'></div></div>";
                            }else if( val.Rtype==='ftp'){
                                htm="<div class='"+cla+"'><div class='drag-ftp-add vertical-center compic'></div></div>";
                            }
                            var realId=(val.RealId && val.RealId!=='undefined')?val.RealId:'',type=(val.Type && val.Type!=='undefined')?val.Type:'';
                            if(type && val.Rtype==='database'){
                                dbType=' title="'+type+'"';
                            }
                            strHtm += '<div class="'+val.Class+'" rtype="' + val.Rtype + '" parentid="' + val.ParentId +'" style="height:' + val.BlockHeight + ';width:' + val.BlockWidth + ';left:' + val.BlockX + ';top:' +
                                val.BlockY + ';position:absolute;" id="' + val.BlockId + '" type="'+type+'" name="'+val.Name+'" original-title="'+val.OriginalTitle+'" realid="'+realId+'"'+dbType+' >'+ htm+'<span class="dragPoint">'+val.BlockTxt+'</span></div>';
                        });

                        flowCanvas.html(strHtm);
                        //1.2 注册连点样式
                        instance.importDefaults({
                            Endpoints: [['Dot', { radius: 1 }], ['Dot', { radius: 1 }]],
                            EndpointStyles: [{ fillStyle: lineColor[0] }, { fillStyle: lineColor[0] }],//起点和终点的颜色
                            HoverPaintStyle:connectorHoverStyle,
                            PaintStyle:connectorPaintStyle,
                            ConnectionOverlays: [
                                ['Arrow', {width: 10, length: 10, location: 1 }]//设置箭头和终点的距离
                            ]
                        });
                        //初始化元素
                        var nodes = jsPlumb.getSelector("#flowbox .component");
                        renderNodes(nodes);
                        instance.bind("connection", function(info) {//更改label关系
                            if(info.connection){
                                if(info.connection.sourceId === info.connection.targetId){
                                    dipT.error("不能以自己作为目标元素！");
                                    instance.detach(info);
                                }else{
                                    var s_type = $("#"+info.connection.sourceId).attr("rtype");
                                    var t_type = $("#"+info.connection.targetId).attr("rtype");
                                    if(s_type === t_type){
                                        dipT.error("相同控件之间不能连接！");
                                        instance.detach(info);
                                    }
                                }
                            }
                        });
                        instance.bind("connectionDragStop", function(info) {//点击连接线、overlay、label提示删除连线 + 不能以自己作为目标元素
                            var mms =$("#"+info.targetId).find("#"+info.sourceId);
                            if(mms.length>0 || info.targetId === info.sourceId){
                                dipT.error("不能以自己作为目标元素！");
                                instance.detach(info);
                            }else{
                                info.unbind('click');
                                info.bind('click',function(){
                                    BootstrapDialog.confirm({
                                        title:'Dip 提示',//Dip 提示
                                        message: '确定要删除该连线吗？',//确定要删除该连线吗
                                        type: BootstrapDialog.TYPE_WARNING,
                                        btnCancelLabel: '取消',//取消
                                        btnOKLabel: '确认',//确认
                                        btnOKClass: 'btn-warning',
                                        callback: function(result) {
                                            if(result){
                                                instance.detach(info);
                                            }
                                        }
                                    });
                                });
                            }
                        });
                        var hasCh = parseInt($.cookie("strlineStyle"));
                        if(hasCh){
                            changeLineStyleByNum(hasCh);
                        }
                        //1.4 注册连线
                        for (i = 0; i < connects.length; i++) {
                            if(!hasCh){
                                var cont = connects[i].Connector || "Flowchart";
                                currentLineStyle = cont;
                                if(i===0){
                                    changeLineStyle(cont);
                                }
                            }
                            var conor = instance.connect({
                                source: connects[i].PageSourceId,
                                target: connects[i].PageTargetId,
                                anchor: "Continuous"
                            }, hollowCircle);
                            conor.unbind('click');
                            conor.bind('click',function(){
                                var that = this;
                                BootstrapDialog.confirm({
                                    title:'Dip 提示',//Dip 提示
                                    message: '确定要删除该连线吗？',//确定要删除该连线吗
                                    type: BootstrapDialog.TYPE_WARNING,
                                    btnCancelLabel: '取消',//取消
                                    btnOKLabel: '确认',//确认
                                    btnOKClass: 'btn-warning',
                                    callback: function(result) {
                                        if(result){
                                            instance.detach(that);
                                        }
                                    }
                                });
                            });

                        }
                    }
                    function renderNodes(nodes){
                        var i_move={left:0,top:0};
                        instance.draggable(nodes,{
                            start: function (ui) {
                                r7PlumbSelectArea.startMove();
                                i_move.left=$(ui.el).position().left;
                                i_move.top=$(ui.el).position().top;
                            },
                            drag: function (ui) {
                                var n_move ={left:0,top:0};
                                if(ui.pos){
                                    n_move.left=ui.pos[0]-i_move.left;
                                    n_move.top = ui.pos[1]-i_move.top;
                                }
                                r7PlumbSelectArea.moveSelect(n_move,$(ui.el).attr("id"));
                                repaintSelected();
                            },
                            stop: function (ui) {}
                        });
                        instance.unbind('beforeDrop').bind('beforeDrop', function(node) {
                           var arrCons = [], flag = true, nodeType = $('#'+ node.sourceId).attr('rtype');
                           if(nodeType === 'database' || nodeType === 'capture') {
                               arrCons = instance.getConnections({source: node.sourceId});
                               if(arrCons.length >= 1) {
                                   dipT.error("当前组件只能连接一个组件！");
                                   flag = false;
                               }
                           }
                           return flag;
                        });
                        if($.isArray(nodes)){
                            $.each(nodes,function (idx, node) {
                                if($(node).attr('rtype')==='database' || $(node).attr('rtype')==='queue' || $(node).attr('rtype')==='apply'){
                                    hollowCircle.maxConnections=-1;
                                }else{
                                    hollowCircle.maxConnections=1;
                                }
                                instance.doWhileSuspended(function(){
                                    instance.makeSource(node, {filter:".dragPoint",anchor:"Continuous"}, hollowCircle);
                                });
                                instance.makeTarget(node,{dropOptions:{hoverClass:"seled"}, anchor:"Continuous"},hollowCircle);
                            });
                        }else{
                            instance.doWhileSuspended(function(){
                                var options = {
                                    filter:".dragPoint",
                                    anchor:"Continuous",
                                    allowLoopback:false
                                };
                                instance.makeSource(nodes, options, hollowCircle);
                            });
                            instance.makeTarget(nodes,{dropOptions:{hoverClass:"seled"}, anchor:"Continuous", allowLoopback:false},hollowCircle);
                        }
                    }
                    //删除单个元素方法封装
                    _r7Plumb.deleteElement = function (node_id) {
                        instance.removeAllEndpoints(node_id);
                        instance.remove(node_id);
                    };
                    _r7Plumb.instance = instance;
                    return _r7Plumb;
                };
                window.r7Plumb = r7Plumb();
            }
            return {
                restrict: 'E',
                controller: ['$scope','comService','$state','currentGroupService','graphicService','$location','tipsService','$interval','$window','$filter','$translate','$rootScope',function ($scope,comSer,$state,cgSer,gSer,$location,dipT,$interval,$window,$filter,$translate,$rootScope) {
                    var $ctrl =this;
                    $ctrl.menu={
                        moshi:{
                            map:true,
                            list:false
                        },
                        dialog:false,
                        dq:{
                            left:true,
                            right:false,
                            center:false,
                            top:false,
                            bottom:false,
                            justify:false
                        },
                        cons:false,
                        sideBarClose:true,
                        currentGc:'',
                        comPanelShow:false
                    };
                    $translate('M_zjm').then(function (M_zjm) {
                        $ctrl.menu.currentGc=M_zjm;//当前组名、控件名，格式:组名或者组名.控件名 主界面
                    });
                    $ctrl.searchDis=false;
                    //控制启动、重启、停止按钮
                    $ctrl.com ={
                        operation:false,
                        start:false,
                        restart:false,
                        stop:false,
                        scn_start:false
                    };
                    $ctrl.user={
                        name:'admin',
                        auth:'super'
                    };
                    $ctrl.q= "";
                    //Tserver控制
                    $ctrl.tserver ={
                        num:0
                    };
                    $ctrl.isOpen=true;
                    $ctrl.proName ='';
                    $ctrl.groupList = [];
                    $ctrl.comsDragable=false;
                    $ctrl.modelList=[];//获取所有的后台数据库模板
                    var stopTimer; //定义定时器
                    //是否登录的校验
                    var authFail = function () {
                        BootstrapDialog.alert({
                            title: $filter('translate')('TIP'),//Dip 提示
                            message: $filter('translate')('TIMEOUT'),//此页面已过期，请重新登录!
                            type: BootstrapDialog.TYPE_WARNING,
                            closable: false,
                            buttonLabel: $filter('translate')('SURE'),//确定
                            callback: function(result) {
                                $window.location.href='/login';
                            }
                        });
                    };
                    // var pid = $.cookie('proId'),pname = $.cookie('proName');
                    var pid = window.localStorage.getItem('proId'), pname =  window.localStorage.getItem('proName');
                    //如果项目名或者项目ID不存在，跳转到index
                    if(!pid || !pname){
                        $window.location.href='/index';
                    }
                    mainService.checkCurrentUserAuth().then(function (result) {
                        if(result.res){
                            var nowUser= result.user;
                            $ctrl.user.name=nowUser.name;
                            $ctrl.user.auth=nowUser.auth;
                            // $.cookie('uname',nowUser.name);
                            // $.cookie('uauth',nowUser.auth);
                            window.localStorage.setItem('uname', nowUser.name);
                            window.localStorage.setItem('uauth', nowUser.auth);
                            $ctrl.proName=pname;
                            fetch_all_groups();
                            queryTserverStatus();//查询Tserver状态
                            getModelList();
                        }else{
                            authFail();
                        }
                    },function () {
                        authFail();
                    });
                    $ctrl.listView ={
                        mapList:[],
                        group:null,
                        curView:'map',
                        param:'all'
                    };
                    $ctrl.changeMs =function (ms) {
                        if(ms==='list'){
                            $ctrl.listView.curView='list';
                            $ctrl.listView.group=cgSer.curGroup;
                            $ctrl.listView.mapList = gSer.getMapList();
                            if(cgSer.curGroup.load==='yes'){
                                $ctrl.getCurGroupStatus();
                            }
                            $state.go('/');
                            $('#viewMapId').hide();
                            $('#viewListId').show();
                            $ctrl.menu.moshi.map = false;
                        }else{
                            $ctrl.listView.curView='map';
                            $ctrl.menu.moshi.map = true;
                            $('#viewListId').hide();
                            $('#viewMapId').show();
                            r7Plumb.instance.repaintEverything();
                        }
                    };
                    $ctrl.showDialog = function () {
                        $ctrl.menu.dialog = !$ctrl.menu.dialog;
                    };
                    $ctrl.changeDq = function (num) {
                        switch(num){
                            case 1:
                                $ctrl.menu.dq.left = true;
                                $ctrl.menu.dq.right =$ctrl.menu.dq.center =$ctrl.menu.dq.top =$ctrl.menu.dq.bottom =$ctrl.menu.dq.justify = false;
                                r7PlumbSelectArea.alignLeft();
                                break;
                            case 2:
                                $ctrl.menu.dq.right = true;
                                $ctrl.menu.dq.left =$ctrl.menu.dq.center =$ctrl.menu.dq.top =$ctrl.menu.dq.bottom =$ctrl.menu.dq.justify = false;
                                r7PlumbSelectArea.alignRight();
                                break;
                            case 3:
                                $ctrl.menu.dq.center = true;
                                $ctrl.menu.dq.left =$ctrl.menu.dq.right =$ctrl.menu.dq.top =$ctrl.menu.dq.bottom =$ctrl.menu.dq.justify = false;
                                r7PlumbSelectArea.alignMiddle();
                                break;
                            case 4:
                                $ctrl.menu.dq.justify = true;
                                $ctrl.menu.dq.left =$ctrl.menu.dq.center =$ctrl.menu.dq.top =$ctrl.menu.dq.bottom =$ctrl.menu.dq.right = false;
                                r7PlumbSelectArea.alignMiddle();
                                break;
                            case 5:
                                $ctrl.menu.dq.top = true;
                                $ctrl.menu.dq.left =$ctrl.menu.dq.center =$ctrl.menu.dq.right =$ctrl.menu.dq.bottom =$ctrl.menu.dq.justify = false;
                                r7PlumbSelectArea.alignTop();
                                break;
                            case 6:
                                $ctrl.menu.dq.bottom = true;
                                $ctrl.menu.dq.left =$ctrl.menu.dq.center =$ctrl.menu.dq.top =$ctrl.menu.dq.right =$ctrl.menu.dq.justify = false;
                                r7PlumbSelectArea.alignBottom();
                                break;
                        }
                    };

                    $ctrl.saveCanvas = function () {
                        if($ctrl.groupList.length<=0){
                            dipT.error($filter('translate')('M_wfbcst'));//您还没有创建任何组，无法保存视图！
                            return;
                        }
                        gSer.save_graphics_alert(cgSer.curGroupId);
                    };
                    //新建组功能
                    $ctrl.createNewGroup = function () {
                        $state.go('/.group_view.property',{group:'new'});
                    };
                    //删除组件
                    $ctrl.deleteComponent = function () {
                        if(!cgSer.comInfo){
                            dipT.error($filter('translate')('M_xssczj'));//请选择要删除的组件！
                            return;
                        }
                        var comInfo = cgSer.comInfo,id = comInfo.id;
                        var deleteCom = function () {
                            mainService.deleteComponents(comInfo).then(function (res) {
                                if(res){
                                    dipT.success($filter('translate')('Sccg'));//删除成功！
                                    r7Plumb.deleteElement(id);
                                    gSer.save_graphics_no_alert(comInfo.group_id);
                                    $ctrl.menu.currentGc=comInfo.groupName;
                                }
                            });
                        };
                        if(comInfo){
                            if (comInfo.cid && comInfo.cid !=='undefined') {
                                if(cgSer.curGroup.load === 'yes'){
                                    dipT.error($filter('translate')('M_zyxwfs'));//组正在运行中，无法删除组件！
                                }else{
                                    BootstrapDialog.confirm({
                                        title: $filter('translate')('TIP'),//Dip 提示
                                        message: $filter('translate')('M_qrsc',{cname:comInfo.name}),//确认删除 '+comInfo.name+' 组件吗？
                                        type: BootstrapDialog.TYPE_WARNING,
                                        btnCancelLabel: $filter('translate')('CANCEL'),//取消
                                        btnOKLabel: $filter('translate')('OK'),//确认
                                        btnOKClass: 'btn-warning',
                                        callback: function(result) {
                                            if(result){
                                                deleteCom();
                                            }
                                        }
                                    });
                                }
                            } else {
                                BootstrapDialog.confirm({
                                    title: $filter('translate')('TIP'),//Dip 提示
                                    message: $filter('translate')('M_qrsc',{cname:comInfo.name}),//确认删除 '+comInfo.name+' 组件吗？
                                    type: BootstrapDialog.TYPE_WARNING,
                                    btnCancelLabel: $filter('translate')('CANCEL'),//取消
                                    btnOKLabel: $filter('translate')('OK'),//确认
                                    btnOKClass: 'btn-warning',
                                    callback: function(result) {
                                        if(result){
                                            r7Plumb.deleteElement(comInfo.id);
                                            gSer.save_graphics_no_alert(comInfo.group_id);
                                            $ctrl.menu.currentGc=comInfo.groupName;
                                        }
                                    }
                                });
                            }
                        }
                    };
                    $ctrl.toggleSideBar = function () {
                        var body = $('.page-header-fixed');
                        var sidebar = $('.page-sidebar');
                        $(".sidebar-search", sidebar).removeClass("open");
                        if (body.hasClass("page-sidebar-closed")) {
                            body.removeClass("page-sidebar-closed");
                            if (body.hasClass('page-sidebar-fixed')) {
                                sidebar.css('width', '');
                            }
                            $ctrl.isOpen=true;
                        } else {
                            body.addClass("page-sidebar-closed");
                            $ctrl.isOpen=false;
                        }
                        $scope.$broadcast('consoleView', $ctrl.isOpen);
                    };

                    $ctrl.toggleConsole = function () {
                        if(!$ctrl.menu.moshi.map){
                            $ctrl.changeMs('map');
                        }
                        var comInfo = cgSer.comInfo;
                        var url ='';
                        if(comInfo === null ){
                            url= '/';
                        }else{
                            console.log('toggleConsole');
                            console.log(comInfo);
                            var type = comInfo.rtype;
                            if(type ==='capture'){
                                url = '/main/capture?gn='+comInfo.group_id+'&cn='+comInfo.cid+'&pt='+comInfo.p_dbType+'&id='+comInfo.id;
                            }else if(type === 'queue'){
                                url = '/main/queue?gn='+comInfo.group_id+'&cn='+comInfo.cid+'&pt='+comInfo.p_dbType+'&pn='+comInfo.p_dbId+'&id='+comInfo.id+'&tab=tab1';
                            }else if(type === 'apply'){
                                url = '/main/loader?gn='+comInfo.group_id+'&cn='+comInfo.cid+'&pt='+comInfo.p_dbType+'&id='+comInfo.id+'&tab=tab1';
                            }
                        }
                        $location.url(url);
                    };
                    //清屏
                    $ctrl.clearView = function (e) {
                        if(e.target.id === "flowbox"){
                            $ctrl.menu.dialog = false;
                            $ctrl.menu.cons = false;
                            $state.go('/');
                        }
                    };
                    //打开当前元素的控制台
                    $ctrl.showConsole = function (el) {
                        console.log('console app');
                    };
                    //打开当前组件的配置信息
                    $ctrl.showPzDialog = function (el) {
                        var obj =null;
                        var getOperation = function () {
                            var run= cgSer.curGroup && cgSer.curGroup.load;
                            if(run==='yes'){
                                $ctrl.com.operation = true;
                                $ctrl.getCurGroupStatus();
                            }else if(run==='no'){
                                $ctrl.com.operation = true;
                                if(cgSer.curGroup.load !=='yes'){
                                    $ctrl.com.start = true;
                                    $ctrl.com.restart = false;
                                    $ctrl.com.stop = false;
                                    $ctrl.com.scn_start = true;
                                }
                            }
                        };
                        if(el.rtype === "capture"){
                            getOperation();
                            obj = gSer.getParent(el.id);
                            if(obj && obj.name && obj.type){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                        }else if(el.rtype === "queue"){
                            $ctrl.getCurGroupStatus();
                            $ctrl.com.operation = false;
                            obj = gSer.getSource(el.id);
                            if(obj){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                        }else if(el.rtype === "apply"){
                            getOperation();
                            obj = gSer.getSource(el.id);
                            if(obj && obj.name && obj.type){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                        }else if(el.rtype === "transfer"){
                            getOperation();
                            obj = gSer.getParent(el.id);
                            if(obj && obj.name && obj.type){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                        }else if(el.rtype === "etl"){
                            getOperation();
                            $ctrl.com.scn_start = false;
                            obj = gSer.getParent(el.id);
                            if(obj && obj.name && obj.type){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                        }else if(el.rtype === "ftp"){
                            getOperation();
                            $ctrl.com.scn_start = false;
                            obj = gSer.getParent(el.id);
                            if(obj && obj.name && obj.type){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                        }else{
                            $ctrl.com.operation = false;
                        }
                        el.groupName = cgSer.curGroupName;
                        el.group_id = cgSer.curGroupId;
                        cgSer.comInfo = el;
                        cgSer.curId = el.id;
                        var comName = el.name?el.name:'';
                        $ctrl.menu.currentGc=cgSer.curGroupName+'.'+comName;
                    };
                    $ctrl.changeCurrentCom = function (el) {
                        var url ='',comName = '',obj;
                        if(el.rtype === "database"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            url='gn='+el.group_id+'&cn='+el.name+'&id='+el.id+'&cid='+el.cid;
                            if(el.name==="unnamed"){
                                url ='/main/db_view/property?'+url;
                            }else{
                                url ='/main/db_view/status?'+url;
                            }
                            $location.url(url);
                        }else if(el.rtype === "capture"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            obj = gSer.getParent(el.id);
                            if(!obj){
                                dipT.error($filter('translate')('M_qljzq'));//请连接要抓取的源端数据库！
                                return;
                            }else if(!obj.name || !obj.type){
                                dipT.error($filter('translate')('M_ydts'));//源端数据库尚未配置，请先配置源端数据库！
                                return;
                            }else{
                                el.p_dbId = obj.name;//此name现在表示ID
                                el.p_dbType = obj.type;
                            }
                            url='gn='+el.group_id+'&cn='+el.name+'&pn='+el.p_dbId+'&pt='+el.p_dbType+'&id='+el.id+'&cid='+el.cid;
                            if(el.name === 'unnamed'){
                                url ='/main/cp_view/property?'+url;
                            }else{
                                url ='/main/cp_view/status?'+url;
                            }
                            $location.url(url);
                        }else if(el.rtype === "queue"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            obj = gSer.getParent(el.id);
                            if(obj){
                                if(!obj.type || obj.type==='undefined'){
                                    dipT.error('请配置完善上一级组件！');//请配置完善上一级组件！
                                    return;
                                }
                            }else{
                                dipT.error('请配置完善上一级组件！');//请配置完善上一级组件！
                                return;
                            }
                            obj = gSer.getSource(el.id);
                            if(obj){
                                el.p_dbType = obj.type;
                                el.p_dbId = obj.name;
                            }
                            el.p_dbType = obj.type;
                            url='gn='+el.group_id+'&cn='+el.name+'&pt='+el.p_dbType+'&id='+el.id+'&cid='+el.cid;
                            if(el.name === 'unnamed'){
                                url ='/main/queue_view/property?'+url;
                            }else{
                                url ='/main/queue_view/status?'+url;
                            }
                            $location.url(url);
                        }else if(el.rtype === "apply"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            var db_id='';
                            obj = gSer.getSource(el.id);
                            if(obj===null || !obj.name || obj.name==='undefined'){
                                dipT.error($filter('translate')('M_pzldts'));//配置Loader组件之前，请先配置好与Loader关联的组件！
                                return;
                            }
                            db_id=obj.id;
                            var source_db = obj.type,source_id = obj.name;
                            obj = gSer.getChild(el.id);
                            if(obj===null || !obj.name || obj.name==='undefined'){
                                dipT.error($filter('translate')('M_pzlts1'));//配置Loader组件之前，请先配置要装载的目标端数据库组件！
                                return;
                            }
                            var target_db =obj.type;
                            obj=gSer.getChild(db_id);//获取CaptureId
                            if(!obj){
                                dipT.error($filter('translate')('M_cppzcw'));//Capture组件尚未配置或配置出错！
                                return;
                            }
                            var apply_type,cap_id='';
                            if(obj && obj.rtype==='capture'){
                                cap_id=obj.name;
                            }
                            if (target_db === "oracle" || target_db === "oracle_rac") {
                                if (target_db === "mqpublisher") {
                                    apply_type = "mqapply";
                                } else {
                                    apply_type = "oracle";
                                }
                            }else{
                                apply_type=target_db;
                            }
                            url='gn='+el.group_id+'&cn='+el.name+'&sn='+source_id+'&st='+source_db+'&tt='+apply_type+'&id='+el.id+'&cid='+el.cid+'&cpid='+cap_id;
                            if(el.name === 'unnamed'){
                                url ='/main/loader_view/property?'+url;
                            }else{
                                url ='/main/loader_view/status?'+url;
                            }
                            $location.url(url);
                        }else if(el.rtype === "transfer"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            url='gn='+el.group_id+'&cn='+el.name+'&id='+el.id+'&cid='+el.cid;
                            if(el.name === 'unnamed'){
                                url ='/main/tclient_view/property?'+url;
                            }else{
                                url ='/main/tclient_view/status?'+url;
                            }
                            $location.url(url);
                        }else if(el.rtype === "etl"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            obj = gSer.getSource(el.id);
                            if(obj===null || !obj.name || obj.name==='undefined'){
                                dipT.error('配置ETL组件之前，请先配置好与ETL关联的组件！');//配置ETL组件之前，请先配置好与ETL关联的组件！
                                return;
                            }
                            source_db = obj.type;
                            source_id = obj.name;
                            url='gn='+el.group_id+'&cn='+el.name+'&pn='+source_id+'&pt='+source_db+'&id='+el.id+'&cid='+el.cid;
                            if(el.name === 'unnamed'){
                                url ='/main/etl_view/property/config?'+url;
                            }else{
                                url ='/main/etl_view/status?'+url;
                            }
                            $location.url(url);
                        }else if(el.rtype === "ftp"){
                            el.group_id = cgSer.curGroupId;
                            cgSer.curId = el.id;
                            // obj = gSer.getParent(el.id);
                            // if(!obj || obj.rtype!=='queue' || !obj.id){
                            //     dipT.error('配置FTP组件之前，请先配置好与FTP关联的队列组件！');//配置FTP组件之前，请先配置好与FTP关联的队列组件！
                            //     return;
                            // }
                            var params={gn:el.group_id,cn:el.name,id:el.id,cid:el.cid};
                            if(el.name === 'unnamed'){
                                $state.go('/.ftp_view.property',params);
                            }else{
                                $state.go('/.ftp_view.status',params);
                            }
                        }
                        cgSer.comInfo = el;
                        cgSer.curId = el.id;
                        comName = el.name?el.name:'';
                        $ctrl.menu.currentGc=cgSer.curGroupName+'.'+comName;
                    };
                    //Start Server
                    $ctrl.startEngine= function () {
                        startServer();
                    };
                    //Stop Server
                    $ctrl.stopEngine = function () {
                        stopServer();
                    };
                    //Restart Server
                    $ctrl.restartEngine = function () {
                        restartServer();
                    };
                    //start scn server
                    $ctrl.startScnEngine =function () {
                        start_server_with_scn();
                    };
                    //新建组之后
                    var createGroupListener = $rootScope.$on("createGroup", function (event, pro) {
                        if(!$ctrl.isOpen){
                            $ctrl.toggleSideBar();
                        }
                        var el = {
                            title:pro.groupName,
                            active:true,
                            desc:pro.desc,
                            log_del_duration:pro.logTime,
                            load:"no",
                            group_id:pro.group_id
                        };
                        angular.forEach($ctrl.groupList,function (obj, idx) {
                            if(obj.active){
                                obj.active = false;
                            }
                        });
                        $ctrl.groupList.push(el);
                        cgSer.curGroupName=el.title;
                        cgSer.curGroupId=el.group_id;
                        cgSer.curGroup =el;
                        $ctrl.menu.currentGc=cgSer.curGroupName;
                        if($ctrl.comsDragable){
                            dragAble(false);
                            $ctrl.comsDragable=false;
                        }
                        $ctrl.clearInterval();
                        //加载视图
                        mainService.getGraphicByGroupId(cgSer.curGroupId).then(function (data) {
                            if(data){
                                $ctrl.getCurGroupStatus();//第一次查询
                                stopTimer =$interval(function () {
                                    $ctrl.getCurGroupStatus();
                                },5000);//获取组件状态，每隔5秒钟查询一次
                            }
                        });
                    });
                    //修改组之后
                    var modifyGroupListener = $rootScope.$on("modifyGroup", function (event, pro) {
                        angular.forEach($ctrl.groupList,function (obj) {
                            if(obj.group_id===pro.group_id){
                                obj.desc = pro.desc;
                                obj.log_del_duration=pro.logTime;
                                obj.title= pro.groupName;
                                if(cgSer.curGroupId===obj.group_id){
                                    cgSer.curGroupName=pro.groupName;
                                    cgSer.curGroup =obj;
                                    $ctrl.menu.currentGc=pro.groupName;
                                }
                            }
                        });
                    });
                    var tserverStartedListener = $rootScope.$on('tserverStarted',function (e, p) {
                        $ctrl.tserver.num=1;
                    });
                    var createModelListener = $rootScope.$on('createModel',function (e, pro) {
                        $ctrl.modelList.push(pro);
                    });
                    var deleteModelListener = $rootScope.$on('deleteModel',function (e, pro) {
                        getModelList();
                    });
                    //页面销毁时清除事件绑定
                    $scope.$on('$destroy', function() {
                        $ctrl.clearInterval();
                        createGroupListener();
                        modifyGroupListener();
                        tserverStartedListener();
                        createModelListener();
                        deleteModelListener();
                    });
                    //获取当前组的组件状态
                    $ctrl.getCurGroupStatus = function () {
                        if(!cgSer.curGroupName || cgSer.curGroup.load !=='yes'){
                            return;
                        }
                        mainService.getGroupStatus(cgSer.curGroupId).then(function (data) {
                            if (data.command_return === "ERROR") {
                                var err = data.return_data.error_message || data.return_data.error_msg;
                                cgSer.curGroup.load ='no';
                                BootstrapDialog.closeAll();
                                BootstrapDialog.confirm({
                                    title:$filter('translate')('TIP'),//Dip 提示
                                    message:$filter('translate')('M_xtjcts'),//系统检测到当前组状态发生变化Loader未加载！
                                    type: BootstrapDialog.TYPE_WARNING,
                                    closable: false,
                                    btnCancelLabel:$filter('translate')('SURE'),//确定
                                    btnOKLabel:$filter('translate')('RECON'),//重新连接
                                    btnOKClass: 'btn-warning',
                                    callback: function(result) {
                                        if(result) {
                                            cgSer.curGroup.load ='yes';
                                        }else {
                                            $ctrl.clearInterval();
                                        }
                                    }
                                });
                            } else {
                                var res = data.return_data,arr=[];
                                if(angular.isArray(res.server)){
                                    arr = res.server;
                                }else{
                                    arr.push(res.server);
                                }
                                var coms = $("#flowbox").find(".component"),comInfo = cgSer.comInfo,newArr=[],fg=0,isIn=false;
                                angular.forEach(arr,function (val) {
                                    if(comInfo && comInfo.rtype===val.type && comInfo.cid===val.name){
                                        isIn = true;
                                    }
                                    angular.forEach(coms,function (v,idx) {
                                        var cname = $(v).attr('realid'),nm=$(v).attr('name'),cid = $(v).attr('id'),ctype = $(v).attr('rtype');
                                        var obj = {id:cid,name:nm,type:ctype,status:'-',st:'-',temp:'-',scn:'-',insert:'-',update:'-',delete:'-',ddl:'-'};
                                        if(cname === val.name && ctype === val.type){
                                            if(fg===0){
                                                obj.status=val.status;
                                                obj.st=val.start_time;
                                                obj.temp=val.work_scn_time;
                                                obj.scn=val.work_scn;
                                                obj.insert=val.op_insert;
                                                obj.update=val.op_update;
                                                obj.delete=val.op_delete;
                                                obj.ddl=val.op_ddl;
                                                newArr.push(obj);
                                            }else{
                                                var ob =newArr[idx];
                                                ob.status=val.status;
                                                ob.st=val.start_time;
                                                ob.temp=val.work_scn_time;
                                                ob.scn=val.work_scn;
                                                ob.insert=val.op_insert;
                                                ob.update=val.op_update;
                                                ob.delete=val.op_delete;
                                                ob.ddl=val.op_ddl;
                                            }

                                            if(val.status === 'running'){
                                                if(comInfo && comInfo.id ===cid){
                                                    $ctrl.com.start=false;
                                                    $ctrl.com.restart=true;
                                                    $ctrl.com.stop=true;
                                                    $ctrl.com.scn_start = false;
                                                }
                                                $('#'+cid).find('.km-btn-full').addClass('drag-success').removeClass('drag-cir').removeClass('drag-err').removeClass('drag-waring');
                                            }else if(val.status === 'not started' || val.status === 'terminated' || val.status === 'errorexit'){
                                                if(comInfo && comInfo.id ===cid){
                                                    $ctrl.com.start=true;
                                                    $ctrl.com.restart=false;
                                                    $ctrl.com.stop=false;
                                                    $ctrl.com.scn_start = true;
                                                }
                                                $('#'+cid).find('.km-btn-full').addClass('drag-err').removeClass('drag-cir').removeClass('drag-waring').removeClass('drag-success');
                                            }else{
                                                if(comInfo && comInfo.id ===cid){
                                                    $ctrl.com.start=false;
                                                    $ctrl.com.restart=true;
                                                    $ctrl.com.stop=true;
                                                    $ctrl.com.scn_start = false;
                                                }
                                                $('#'+cid).find('.km-btn-full').addClass('drag-waring').removeClass('drag-cir').removeClass('drag-err').removeClass('drag-success');
                                            }
                                        }else{
                                            if(fg===0){
                                                newArr.push(obj);
                                            }
                                        }
                                    });
                                    fg++;
                                });
                                if(!isIn){
                                    $ctrl.com.start=true;
                                    $ctrl.com.restart=false;
                                    $ctrl.com.stop=false;
                                    $ctrl.com.scn_start = true;
                                }
                                if (comInfo && comInfo.rtype === 'ftp') {
                                    $ctrl.com.scn_start = false;
                                }
                                $ctrl.listView.mapList=filterDisplay($ctrl.listView.param,newArr);
                            }
                        },function () {
                            // var status =cgSer.curGroup.load;
                            cgSer.curGroup.load ='no';
                            BootstrapDialog.closeAll();
                            BootstrapDialog.confirm({
                                title:$filter('translate')('TIP'),//Dip 提示
                                message: $filter('translate')('M_sbcw'),//Dip获取当前组状态失败，网络错误！
                                type: BootstrapDialog.TYPE_WARNING,
                                closable: false,
                                btnCancelLabel: $filter('translate')('SURE'),//确定
                                btnOKLabel: $filter('translate')('RECON'),//重新连接
                                btnOKClass: 'btn-warning',
                                callback: function(result) {
                                    if(result) {
                                        cgSer.curGroup.load ='yes';
                                    }else {
                                        $ctrl.clearInterval();
                                    }
                                }
                            });
                        });
                    };
                    $ctrl.clearInterval = function () {
                        if (angular.isDefined(stopTimer)) {
                            $interval.cancel(stopTimer);
                            stopTimer = undefined;
                        }
                    };
                    //全同步
                    $ctrl.full_syc_data = function () {
                        var loaders =gSer.getLoaders();
                        if(loaders.length===0){
                            dipT.error($filter('translate')('M_qtbpz'));//全同步之前，需要首先配置Loader组件！
                            return;
                        }
                        var el=loaders[0];
                        // var url='gn='+cgSer.curGroupId+'&cn='+el.name+'&st='+el.st+'&sn='+el.sn+'&name='+el.cname+'&cid='+el.cid;
                        // url ='/main/full_syc_view/loader?'+url;
                        // $location.url(url);
                        $state.go('/.full_syc_view.loader',{gn:cgSer.curGroupId,cn:el.name,st:el.st,sn:el.sn,name:el.cname,cid:el.cid});
                    };
                    //切换组
                    $ctrl.changeGroup = function (group) {
                        if(group.title===cgSer.curGroupName){
                            return;
                        }
                        // $.cookie('group', group.group_id);
                        window.localStorage.setItem('group', group.group_id);
                        var i=0;
                        angular.forEach($ctrl.groupList,function (val,idx) {
                            if(val.title===group.title){
                                i++;
                                if(i>=2){
                                    return;
                                }
                                $ctrl.groupList[idx].active=true;
                                cgSer.curGroup = val;
                                cgSer.curGroupName = val.title;
                                cgSer.curGroupId = val.group_id;
                                $ctrl.menu.currentGc=val.title;
                                cgSer.comInfo = null;//清空初始值
                                cgSer.curId = '';//清空初始值
                                $ctrl.clearInterval();
                                mainService.getGraphicByGroupId(val.group_id).then(function (data) {
                                    if(data){
                                        $ctrl.getCurGroupStatus();//第一次查询
                                        stopTimer =$interval(function () {
                                            $ctrl.getCurGroupStatus();
                                        },5000);//获取组件状态，每隔5秒钟查询一次
                                        // $scope.$on('$destroy', function() {
                                        //     $ctrl.clearInterval();
                                        // });
                                    }
                                    $ctrl.listView.mapList=[];
                                    if($ctrl.listView.curView==='list'){
                                        $ctrl.listView.group=cgSer.curGroup;
                                        $ctrl.listView.mapList = gSer.getMapList();
                                    }
                                    $ctrl.curGn=cgSer.curGroupName;
                                });
                            }else{
                                $ctrl.groupList[idx].active=false;
                            }
                        });
                        $ctrl.com.operation = false;
                        $state.go('/');//清屏
                    };
                    $ctrl.getCurGraphic = function () {
                        if(cgSer.curGroupId){
                            mainService.getGraphicByGroupId(cgSer.curGroupId);
                        }
                    };
                    //右键菜单
                    $translate(['START','STOP','RESTART','RESET','DELETE','PROPERTY']).then(function (menu) {
                        $ctrl.menuOptions = [
                            [menu.START, function ($itemScope) {
                                var group =$itemScope.group;
                                group.rtype='group';
                                console.log('group:');
                                console.log(group);
                                startServer(group);
                            }],
                            null,
                            [menu.STOP, function ($itemScope) {
                                var group =$itemScope.group;
                                group.rtype='group';
                                stopServer(group);
                            }],
                            null,
                            [menu.RESTART, function ($itemScope) {
                                var group =$itemScope.group;
                                group.rtype='group';
                                restartServer(group);
                            }],
                            null,
                            [menu.RESET, function ($itemScope) {
                                var group =$itemScope.group;
                                resetGroup(group);
                            }],
                            null,
                            [menu.DELETE,function ($itemScope) {
                                var group =$itemScope.group;
                                deleteGroup(group);
                            }],
                            null,
                            [menu.PROPERTY, function ($itemScope) {
                                var group =$itemScope.group;
                                $state.go('/.group_view.status',{group:group});
                            }]
                        ];
                    });
                    $ctrl.stopTerver= function () {
                        stopTserver();
                    };
                    $ctrl.showTserverInfo = function () {
                        mainService.getTserverConfig().then(function (name) {
                            if(name){
                                $location.url('/main/tserver_view/status?cn='+name);
                            }else{
                                $location.url('/main/tserver_view/property?cn=no-ne');
                            }
                        });
                    };
                    //导出配置信息
                    $ctrl.outputPz = function () {
                        mainService.exportConfigFile();
                    };
                    $ctrl.inputPz = function () {
                        $('#file').click();
                    };
                    //触发上传动作之后
                    $ctrl.changeFiles = function () {
                        var fileObj = null;
                        var docObj = document.getElementById("file");
                        if (docObj.files && docObj.files[0]) {
                            fileObj = docObj.files[0].name;
                        } else {
                            return;
                        }
                        var modelStr ='<label>'+$filter('translate')('M_wjmc')+'</label><div class="text-info">'+fileObj+'</div>';//文件名称：
                        var dialog = new BootstrapDialog({
                            title:$filter('translate')('M_drpzwj'),//导入配置文件
                            message: $(modelStr),
                            type:'type-warning',
                            buttons: [{
                                label: $filter('translate')('CANCEL'),//取消
                                cssClass: 'btn-default',
                                action: function(dialogRef){
                                    dialogRef.close();
                                }
                            },{
                                id: 'button-c',
                                label: $filter('translate')('M_kssc'),//开始上传
                                cssClass: 'btn-primary',
                                hotkey: 13, // Enter.
                                action: function(dialogRef) {
                                    dialog.enableButtons(false);
                                    dialog.setClosable(false);
                                    dialog.setType('type-warning');
                                    dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_wjscz')+'</h2>');//文件上传中请稍后
                                    fileObj = docObj.files[0];
                                    var FileController = "/dipserver/upload_config";
                                    var form = new FormData();
                                    form.append("file", fileObj);
                                    var xhr = new XMLHttpRequest();
                                    xhr.open("post", FileController, true);
                                    xhr.setRequestHeader('X-XSRF-TOKEN', $.cookie('XSRF-TOKEN'));
                                    xhr.onload = function () {
                                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                                            var xml = null;
                                            var res = JSON.parse(xhr.responseText);
                                            if(res.command_return==='SUCCESS'){
                                                dialog.setType('type-success');
                                                dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_tip1')+'</h2>');//文件上传成功！正在为您更新系统配置......
                                                mainService.importConfigFile(res.fileName).then(function (result) {
                                                    if(result.res){
                                                        dialog.setType('type-success');
                                                        dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_tip2')+'</h2>');//系统配置更新成功！
                                                        setTimeout(function () {
                                                            dialog.close();
                                                            $window.location.href='/index'
                                                        },500);
                                                    }else {
                                                        dialog.setType('type-danger');
                                                        if(result.errorCode){
                                                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')(result.errorCode)+'</h2>');//系统配置更新失败！
                                                        }else{
                                                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_tip3')+'</h2>');//系统配置更新失败！
                                                        }
                                                    }
                                                    dialog.setClosable(true);
                                                },function (err) {
                                                    dialog.setType('type-danger');
                                                    dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_tip4')+'</h2>');//网络错误，系统配置更新失败！
                                                    dialog.setClosable(true);
                                                });
                                            }else{
                                                dialog.setType('type-danger');
                                                dialog.getModalBody().html('<h2 class="text-error">'+res.error_message+'</h2>');
                                                dialog.setClosable(true);
                                            }
                                        } else {
                                            dialog.setType('type-danger');
                                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_tip5')+'</h2>');//抱歉！网络错误，文件上传失败!
                                            dialog.setClosable(true);
                                        }
                                    };
                                    xhr.send(form);
                                }
                            }],
                            closable: false
                        });
                        dialog.open();
                    };
                    //组件栏目的编辑操作
                    $ctrl.editGroup = function () {
                        if($ctrl.groupList.length<=0){
                            return;
                        }
                        if(!$.isEmptyObject(cgSer.curGroup)){
                            $state.go('/.group_view.status',{group:cgSer.curGroup});
                        }
                    };
                    //导出错误文件
                    $ctrl.outputErrFiles = function () {
                        mainService.exportErrFile();
                    };
                    //模板点击事件
                    $ctrl.checkCurModel = function (e, item) {
                        $(e.target).parent().addClass('active').siblings().removeClass('active');
                        $state.go('/.db_model_view',{model:item});
                    };
                    //获取后台标准模板信息
                    $ctrl.getComTemplate = function () {
                        if($ctrl.groupList.length<=0){
                            dipT.error($filter('translate')('M_tip6'));//您还没有创建任何组，请在创建组之后执行该操作！
                            return;
                        }
                        var coms =$("#flowbox").find('div.component');
                        if(coms.length<=0){
                            mainService.getCommonTemplate().then(function (result) {
                                if(result.res){
                                    r7Plumb.drawGraphic(result.data);
                                    gSer.save_graphics_no_alert(cgSer.curGroupId);
                                }
                            });
                        }else{
                            dipT.error($filter('translate')('M_stbcz'));//视图已经包含内容，不能执行该操作！
                        }
                    };
                    //展示大屏
                    $ctrl.showBigPage = function () {
                        $window.open('/view');
                    };
                    //动态静态组件切换
                    $ctrl.changAc = function (type) {
                        $ctrl.listView.param=type;
                        $ctrl.getCurGroupStatus();
                    };
                    //组件拖动不能拖动设置
                    function dragAble(able) {
                        $("#kj-kj").find('.tool').draggable({disabled:able});
                        $("#flowbox").droppable("option","disabled",able);
                    }
                    //筛选列表态组件列表
                    function filterDisplay(param,arrList) {
                        var arr;
                        if(param==='all'){
                            arr =arrList;
                        }else if(param==='dt'){
                            arr =[];
                            angular.forEach(arrList,function (v) {
                                if(v.type==='capture' || v.type==='apply' || v.type==='transfer' || v.type==='etl'){
                                    arr.push(v);
                                }
                            });
                        }else if(param==='jt'){
                            arr =[];
                            angular.forEach(arrList,function (v) {
                                if(v.type==='database' || v.type==='queue'){
                                    arr.push(v);
                                }
                            });
                        }
                        return arr;
                    }
                    //后台查询获得group组的信息
                    function fetch_all_groups() {
                        // var g_name =$.cookie('uname'),g_juese =$.cookie('uauth');
                        var g_name = window.localStorage.getItem('uname'), g_juese = window.localStorage.getItem('uauth');
                        mainService.getAllGroups(pid,g_name,g_juese).then(function (result) {
                            if(result.status){
                                $ctrl.groupList=[];//清空groupList
                                var groupList = result.list;
                                // var cookieGroup = $.cookie("group"),flag=-1;
                                var cookieGroup = window.localStorage.getItem("group"), flag = -1;
                                if(groupList.length>0){
                                    angular.forEach(groupList,function (obj, idx) {
                                        if(obj.group_id === cookieGroup){
                                            flag=idx;
                                        }
                                        var item = {
                                            title:obj.name,
                                            active:false,
                                            desc:obj.description,
                                            log_del_duration:obj.log_save_hour,
                                            load:obj.loaded?obj.loaded:'no',
                                            group_id:obj.group_id
                                        };
                                        $ctrl.groupList.push(item);
                                    });
                                    if(flag===-1){
                                        $ctrl.groupList[0].active=true;
                                        cgSer.curGroup = $ctrl.groupList[0];
                                        cgSer.curGroupName = $ctrl.groupList[0].title;
                                        cgSer.curGroupId = $ctrl.groupList[0].group_id;
                                        cgSer.groupList = $ctrl.groupList;
                                    }else{
                                        $ctrl.groupList[flag].active=true;
                                        cgSer.curGroupName = $ctrl.groupList[flag].title;
                                        cgSer.curGroupId = $ctrl.groupList[flag].group_id;
                                        cgSer.curGroup = $ctrl.groupList[flag];
                                        cgSer.groupList = $ctrl.groupList;
                                    }
                                    $ctrl.menu.currentGc=cgSer.curGroupName;
                                    //加载视图
                                    mainService.getGraphicByGroupId(cgSer.curGroupId).then(function (data) {
                                        if(data){
                                            $ctrl.getCurGroupStatus();//第一次查询
                                            //获取组件状态，每隔5秒钟查询一次
                                            stopTimer =$interval(function () {
                                                $ctrl.getCurGroupStatus();
                                            },5000);
                                            // $scope.$on('$destroy', function() {
                                            //     $ctrl.clearInterval();
                                            // });
                                        }
                                    });
                                }else{
                                    $ctrl.comsDragable=true;
                                    dragAble(true);
                                }
                            }else{
                                $ctrl.comsDragable=true;
                                dragAble(true);
                            }
                        });
                    }
                    //启动Server
                    function startServer(group) {
                        var comInfo = group?group:cgSer.comInfo,comName,msg='',args='',relations,que,flag=true,dataInfo={};
                        if(!comInfo){
                            dipT.error($filter('translate')('M_qxzzj'));//请选择要启动的组件！
                            return;
                        }
                        if(comInfo.rtype==='capture'){
                            comName ='Capture';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip7')+'</h2>';//Capture 组件启动中.....
                            relations = gSer.fetch_relations();
                            if(relations && !$.isEmptyObject(relations)){
                                que =relations.capture;
                                angular.forEach(que.siblings,function (v) {
                                    if(v.type==='queue'){
                                        flag=false;
                                    }
                                });
                                if(!que || que.length===0 || !flag){
                                    dipT.error($filter('translate')('M_qxpzzj'));//请先配置跟Capture组件相关联的Queue组件！
                                    return;
                                }
                            }
                        }else if(comInfo.rtype==='apply'){
                            comName ='Loader';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip8')+'</h2>';//Loader 组件启动中.....
                        }else if(comInfo.rtype==='group'){
                            relations = gSer.fetch_relations();
                            if(angular.isObject(relations) && !$.isEmptyObject(relations)){
                                que =relations.capture;
                                if(!que){
                                    dipT.error($filter('translate')('M_zjswpz'));//组件尚未配置完整，请配置完整后启动组！
                                    return;
                                }
                                angular.forEach(que.siblings,function (v) {
                                    if(v.type==='queue'){
                                        flag=false;
                                    }
                                });
                                if(que.length===0 || !flag){
                                    dipT.error($filter('translate')('M_qxpzzj'));//请先配置跟Capture组件相关联的Queue组件！
                                    return;
                                }
                            }
                            comName ='Group';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip9',{gname:comInfo.title})+'</h2>';//组 '+comInfo.title+' 启动中.....
                        }else if(comInfo.rtype==='transfer'){
                            comName ='Tclient';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip10')+'</h2>';//Tclient 组件启动中..........
                        }else if(comInfo.rtype==='etl'){
                            comName ='Etl';
                            msg='<h2 class="text-warning">Etl 组件启动中..........</h2>';//Etl 组件启动中..........
                        }else if(comInfo.rtype==='ftp'){
                            comName ='Ftp';
                            msg='<h2 class="text-warning">Ftp 组件启动中..........</h2>';//Ftp 组件启动中..........
                        }else{
                            return;
                        }
                        var errT='',successT='',curStatus=cgSer.curGroup.load,server_type='';
                        if(comName==='Group'){
                            dataInfo={group_id:comInfo.group_id,rtype:comInfo.rtype,cn:comInfo.group_id};
                            errT=$filter('translate')('M_tip11',{gname:comInfo.title});//抱歉！组 '+comInfo.title +' 启动失败！
                            successT=$filter('translate')('M_tip12',{gname:comInfo.title});//恭喜！组 '+comInfo.title +' 已经启动！
                        }else{
                            if(comInfo.rtype==='etl'){
                                server_type='etlapply';
                            }else if(comInfo.rtype==='ftp'){
                                server_type='transftp';
                            }else{
                                server_type=comInfo.rtype;
                            }
                            dataInfo={group_id:comInfo.group_id,rtype:server_type,cn:comInfo.cid};
                            errT=$filter('translate')('M_tip13',{cname:comName});//抱歉！'+comName+' 组件启动失败！
                            successT=$filter('translate')('M_tip14',{cname:comName});//恭喜！'+comName+' 组件已经启动！
                        }
                        var start_ser = function () {
                            var dialog = new BootstrapDialog({
                                title:comName+' Info',
                                type:'type-warning',
                                message: function(){
                                    return msg;
                                },
                                closable: false
                            });
                            dialog.open();
                            cgSer.curGroup.load='no';
                            mainService.startServer(dataInfo).then(function (result) {
                                if(result.res){
                                    dialog.setType('type-success');
                                    dialog.getModalBody().html('<h2 class="text-success">'+successT+'<i class="green glyphicon glyphicon-ok"></i></h2>');
                                    dialog.setClosable(true);
                                    cgSer.curGroup.load ='yes';
                                    $ctrl.getCurGroupStatus();
                                    if(!stopTimer){
                                        stopTimer =$interval(function () {
                                            $ctrl.getCurGroupStatus();
                                        },5000);
                                        // $scope.$on('$destroy', function() {
                                        //     $ctrl.clearInterval();
                                        // });
                                    }
                                    setTimeout(function () {
                                        dialog.close();
                                    },500);
                                }else{
                                    dialog.setType('type-danger');
                                    var err = result.msg || errT;
                                    dialog.getModalBody().html('<h2 class="text-error">'+err+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                                    dialog.setClosable(true);
                                    cgSer.curGroup.load=curStatus;
                                }
                            },function () {
                                dialog.setType('type-danger');
                                dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                                dialog.setClosable(true);
                                cgSer.curGroup.load=curStatus;
                            });
                        };
                        if(comName==='Loader'){
                            //查询源端数据库名称、目标数据端名称
                            var node_id = comInfo.id,info ={},obj=null;
                            obj = gSer.getSource(node_id);
                            if(obj===null){
                                dipT.error($filter('translate')('M_dqyd'));//当前组件的源端数据库尚未配置，无法指定SCN启动！
                                return;
                            }
                            info.sn = obj.name;
                            obj = gSer.getChild(node_id);
                            if(obj===null){
                                dipT.error($filter('translate')('M_dqmb'));//当前组件的目标端数据库尚未配置，无法指定SCN启动！
                                return;
                            }
                            info.tn = obj.name;
                            info.gn = comInfo.group_id;
                            mainService.isSourceDatabaseSame(info).then(function (isSame) {
                                if(isSame===true){
                                    BootstrapDialog.confirm({
                                        title: $filter('translate')('TIP'),//Dip 提示
                                        message: $filter('translate')('M_ymyzjs'),//系统检测到源端数据库与目标端数据一致，是否继续？
                                        type: BootstrapDialog.TYPE_WARNING,
                                        closable: false,
                                        btnCancelLabel: $filter('translate')('CANCEL'),//取消
                                        btnOKLabel: $filter('translate')('OK'),//确认
                                        btnOKClass: 'btn-warning',
                                        callback: function(result) {
                                            if(result) {
                                                start_ser();
                                            }
                                        }
                                    });
                                }else{
                                    if(isSame===false){
                                        start_ser();
                                    }
                                }
                            });
                        }else{
                            start_ser();
                        }
                    }
                    //重启Server
                    function restartServer(group) {
                        var comInfo = group?group:cgSer.comInfo,comName,msg='',dataInfo={};
                        if(!comInfo){
                            dipT.error($filter('translate')('M_tip15'));//请选择要重启的组件！
                            return;
                        }
                        if(comInfo.rtype==='capture'){
                            comName ='Capture';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip16')+'</h2>';//Capture 组件重启中.....
                        }else if(comInfo.rtype==='apply'){
                            comName ='Loader';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip17')+'</h2>';//Loader 组件重启中.....
                        }else if(comInfo.rtype==='group'){
                            comName ='Group';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip18',{gname:comInfo.title})+'</h2>';//组 '+comInfo.title+' 重启中.....
                        }else if(comInfo.rtype==='transfer'){
                            comName ='Tclient';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip19')+'</h2>';//Tclient 组件重启中..........
                        }else if(comInfo.rtype==='etl'){
                            comName ='Etl';
                            msg='<h2 class="text-warning">Etl 组件重启中..........</h2>';//Etl 组件重启中..........
                        }else if(comInfo.rtype==='ftp'){
                            comName ='Ftp';
                            msg='<h2 class="text-warning">Ftp 组件重启中..........</h2>';//Ftp 组件重启中..........
                        }else{
                            return;
                        }
                        var errT='',successT='',curStatus=cgSer.curGroup.load,server_type='';
                        var restartSer = function () {
                            cgSer.curGroup.load='no';
                            var dialog = new BootstrapDialog({
                                title:comName+' Info',
                                type:'type-warning',
                                message: function(dialogRef){
                                    return msg;
                                },
                                closable: false
                            });
                            dialog.open();
                            mainService.restartServer(dataInfo).then(function (result) {
                                if(result.res){
                                    dialog.setType('type-success');
                                    dialog.getModalBody().html('<h2 class="text-success">'+successT+'<i class="green glyphicon glyphicon-ok"></i></h2>');
                                    dialog.setClosable(true);
                                    cgSer.curGroup.load ='yes';
                                    $ctrl.getCurGroupStatus();
                                    if(!stopTimer){
                                        stopTimer =$interval(function () {
                                            $ctrl.getCurGroupStatus();
                                        },5000);
                                        // $scope.$on('$destroy', function() {
                                        //     $ctrl.clearInterval();
                                        // });
                                    }
                                    setTimeout(function () {
                                        dialog.close();
                                    },500);
                                }else{
                                    dialog.setType('type-danger');
                                    var err = result.msg || errT;
                                    dialog.getModalBody().html('<h2 class="text-error">'+err+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                                    dialog.setClosable(true);
                                    cgSer.curGroup.load=curStatus;
                                }
                            },function () {
                                dialog.setType('type-danger');
                                dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                                dialog.setClosable(true);
                                cgSer.curGroup.load=curStatus;
                            });
                        };
                        if(comName==='Group'){
                            dataInfo={group_id:comInfo.group_id,rtype:comInfo.rtype,cn:comInfo.group_id};
                            errT=$filter('translate')('M_tip20',{gname:comInfo.title});//抱歉！组 '+comInfo.title +' 重启失败！
                            successT=$filter('translate')('M_tip21',{gname:comInfo.title});//恭喜！组 '+comInfo.title +' 重启成功！
                            BootstrapDialog.confirm({
                                title: $filter('translate')('TIP'),//Dip 提示
                                message: $filter('translate')('M_tip22'),//确认要重启整个组吗？
                                type: BootstrapDialog.TYPE_WARNING,
                                closable: false,
                                btnCancelLabel: $filter('translate')('CANCEL'),//取消
                                btnOKLabel: $filter('translate')('OK'),//确认
                                btnOKClass: 'btn-warning',
                                callback: function(result) {
                                    if(result) {
                                        restartSer();
                                    }
                                }
                            });
                        }else{
                            if(comInfo.rtype==='etl'){
                                server_type='etlapply';
                            }else if(comInfo.rtype==='ftp'){
                                server_type='transftp';
                            }else{
                                server_type=comInfo.rtype;
                            }
                            dataInfo={group_id:comInfo.group_id,rtype:server_type,cn:comInfo.cid};
                            errT=$filter('translate')('M_tip23',{cname:comName});//抱歉！'+comName+' 组件重启失败！
                            successT=$filter('translate')('M_tip24',{cname:comName});//恭喜！'+comName+' 组件重启成功！
                            restartSer();
                        }
                    }
                    //停止Server
                    function stopServer(group) {
                        var comInfo = group?group:cgSer.comInfo,comName,msg='',dataInfo={};
                        if(!comInfo){
                            dipT.error($filter('translate')('M_tip25'));//请选择要停止的组件！
                            return;
                        }
                        if(comInfo.rtype==='capture'){
                            comName ='Capture';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip26')+'</h2>';//Capture 组件停止中.....
                        }else if(comInfo.rtype==='apply'){
                            comName ='Loader';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip27')+'</h2>';//Loader 组件停止中.....
                        }else if(comInfo.rtype==='group'){
                            comName ='Group';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip28',{gname:comInfo.title})+'</h2>';//组 '+comInfo.title+' 停止中.....
                        }else if(comInfo.rtype==='transfer'){
                            comName ='Tclient';
                            msg='<h2 class="text-warning">'+$filter('translate')('M_tip29')+'</h2>';//Tclient 组件停止中..........
                        }else if(comInfo.rtype==='etl'){
                            comName ='Etl';
                            msg='<h2 class="text-warning">Etl 组件停止中..........</h2>';//Etl 组件停止中..........
                        }else if(comInfo.rtype==='ftp'){
                            comName ='Ftp';
                            msg='<h2 class="text-warning">Ftp 组件停止中..........</h2>';//Ftp 组件停止中..........
                        }else{
                            return;
                        }
                        var errT='',successT='',curStatus=cgSer.curGroup.load,server_type='';
                        var stopSer = function (nowCom) {
                            cgSer.curGroup.load='no';
                            var dialog = new BootstrapDialog({
                                title:comName+' Info',
                                type:'type-warning',
                                message: function(){
                                    return msg;
                                },
                                closable: false
                            });
                            dialog.open();
                            mainService.stopServer(dataInfo).then(function (result) {
                                dialog.setClosable(true);
                                if(result.res){
                                    dialog.setType('type-success');
                                    dialog.getModalBody().html('<h2 class="text-success">'+successT+'<i class="green glyphicon glyphicon-ok"></i></h2>');
                                    cgSer.curGroup.load =curStatus;
                                    var coms = $('#flowbox').find('div.component');
                                    if(nowCom==='group'){
                                        cgSer.curGroup.load ='no';
                                        $ctrl.clearInterval();
                                        angular.forEach(coms,function (v) {
                                            var cid = $(v).attr('id');
                                            $('#'+cid).find('.km-btn-full').removeClass('drag-err').removeClass('drag-waring').removeClass('drag-success').addClass('drag-cir');
                                        });
                                        $ctrl.listView.mapList = gSer.getMapList();
                                    }else{
                                        $('#'+nowCom).find('.km-btn-full').removeClass('drag-err').removeClass('drag-waring').removeClass('drag-success').addClass('drag-cir');
                                    }
                                    $ctrl.com.start=true;
                                    $ctrl.com.restart=false;
                                    $ctrl.com.stop=false;
                                    $ctrl.com.scn_start = true;
                                    setTimeout(function () {
                                        dialog.close();
                                    },500);
                                }else{
                                    dialog.setType('type-danger');
                                    var err = result.msg || errT;
                                    dialog.getModalBody().html('<h2 class="text-error">'+err+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                                    cgSer.curGroup.load=curStatus;
                                }
                            },function () {
                                cgSer.curGroup.load =curStatus;
                                dialog.setType('type-danger');
                                dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                                dialog.setClosable(true);
                            });
                        };
                        if(comName==='Group'){
                            dataInfo={group_id:comInfo.group_id,rtype:comInfo.rtype,cn:comInfo.group_id};
                            errT=$filter('translate')('M_tip30',{gname:comInfo.title});//抱歉！组 '+comInfo.title +' 停止失败！
                            successT=$filter('translate')('M_tip31',{gname:comInfo.title});//恭喜！组 '+comInfo.title +' 停止成功！
                            BootstrapDialog.confirm({
                                title: $filter('translate')('TIP'),//Dip 提示
                                message: $filter('translate')('M_tip32'),//确认要停止整个组吗？
                                type: BootstrapDialog.TYPE_WARNING,
                                closable: false,
                                btnCancelLabel: $filter('translate')('CANCEL'),//取消
                                btnOKLabel: $filter('translate')('OK'),//确认
                                btnOKClass: 'btn-warning',
                                callback: function(result) {
                                    if(result) {
                                        stopSer('group');//传递组类型
                                    }
                                }
                            });
                        }else{
                            if(comInfo.rtype==='etl'){
                                server_type='etlapply';
                            }else if(comInfo.rtype==='ftp'){
                                server_type='transftp';
                            }else{
                                server_type=comInfo.rtype;
                            }
                            dataInfo={group_id:comInfo.group_id,rtype:server_type,cn:comInfo.cid};
                            errT=$filter('translate')('M_tip33',{cname:comName});//抱歉！'+comName+' 组件停止失败！
                            successT=$filter('translate')('M_tip34',{cname:comName});//恭喜！'+comName+' 组件停止成功！
                            stopSer(comInfo.id);//传递组件ID
                        }
                    }
                    //scn 启动Server
                    function start_server_with_scn(){
                        var comInfo = cgSer.comInfo,comName,modelStr='',obj,relations;
                        if(!comInfo){
                            dipT.error($filter('translate')('M_tip35'));//请选择要启动的组件！
                            return;
                        }
                        var startScn = function () {
                            var dialog = new BootstrapDialog({
                                title: $filter('translate')('M_tip36'),//指定SCN启动
                                message: $(modelStr),
                                type:'type-warning',
                                buttons: [{
                                    label: $filter('translate')('CANCEL'),//取消
                                    cssClass: 'btn-default',
                                    action: function(dialogRef){
                                        dialogRef.close();
                                    }
                                },{
                                    id: 'button-c',
                                    label: $filter('translate')('START'),//启动
                                    cssClass: 'btn-primary',
                                    hotkey: 13, // Enter.
                                    action: function(dialogRef) {
                                        var mainDiv = dialogRef.getModalBody();
                                        var scn=dialogRef.getModalBody().find('#scnId');
                                        var lowScn =dialogRef.getModalBody().find('#lowScnId');
                                        var pattern = /.{0,29}/;
                                        var scn_num='',low_scn='';
                                        mainDiv.find('span').remove();
                                        if(!pattern.test(scn.val())){
                                            mainDiv.addClass('input-err').append('<span class="help-block">'+$filter('translate')('M_tip37')+'</span>');//开始SCN的值长度不超过30位！
                                            scn.addClass('ia').focus();
                                            return;
                                        }else{
                                            mainDiv.removeClass('input-err');
                                            scn.removeClass('ia');
                                            scn_num=scn.val();
                                        }
                                        if(comName==='Capture'){
                                            if(!pattern.test(lowScn.val())){
                                                mainDiv.addClass('input-err').append('<span class="help-block">'+$filter('translate')('M_tip39')+'</span>');//开始Low SCN的值长度不超过30位！
                                                lowScn.addClass('ib').focus();
                                                return;
                                            }else{
                                                mainDiv.removeClass('input-err');
                                                scn.removeClass('ib');
                                                low_scn=lowScn.val();
                                            }
                                        }
                                        if ((comInfo.rtype === "apply") || (comInfo.rtype === "etl") || (comInfo.rtype === "file_load")|| (comInfo.rtype=== "transfer")) {
                                            low_scn=scn_num;
                                        }
                                        dialog.enableButtons(false);
                                        dialog.setClosable(false);
                                        mainDiv.html('<h2 class="text-warning">'+comName+$filter('translate')('M_tip40')+'</h2>');//组件启动中.....
                                        var server_type='';
                                        if(comInfo.rtype==='etl'){
                                            server_type=comInfo.rtype+'apply';
                                        }else{
                                            server_type=comInfo.rtype;
                                        }
                                        var curStatus = cgSer.curGroup.load;
                                        cgSer.curGroup.load='no';
                                        mainService.startServerByScn(comInfo,server_type,scn_num,low_scn).then(function (result) {
                                            if(result.res){
                                                dialog.setType('type-success');
                                                dialog.getModalBody().html('<h2 class="text-success">'+ $filter('translate')('M_tip42',{cname:comName})+'<i class="green glyphicon glyphicon-ok"></i></h2>');//恭喜！'+comName+' 组件已经启动！
                                                dialog.setClosable(true);
                                                cgSer.curGroup.load ='yes';
                                                $ctrl.getCurGroupStatus();
                                                if(!stopTimer){
                                                    stopTimer =$interval(function () {
                                                        $ctrl.getCurGroupStatus();
                                                    },5000);
                                                    // $scope.$on('$destroy', function() {
                                                    //     $ctrl.clearInterval();
                                                    // });
                                                }
                                                setTimeout(function () {
                                                    dialog.close();
                                                },500);
                                            }else{
                                                dialog.setType('type-danger');
                                                var err = result.msg || $filter('translate')('M_tip41',{cname:comName});//抱歉！'+comName+' 组件启动失败！
                                                dialog.getModalBody().html('<h2 class="text-error">'+err+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                                                dialog.setClosable(true);
                                                cgSer.curGroup.load=curStatus;
                                            }
                                        },function () {
                                            cgSer.curGroup.load=curStatus;
                                            dialog.setType('type-danger');
                                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                                            dialog.setClosable(true);
                                        });
                                    }
                                }],
                                closable: true
                            });
                            dialog.open();
                        };
                        var scn_txt=$filter('translate')('M_tip43'),scn__p=$filter('translate')('M_tip44'),low_scn_txt=$filter('translate')('M_tip45'),low_scn_p=$filter('translate')('M_tip46');
                        if(comInfo.rtype==='capture'){
                            relations = gSer.fetch_relations();
                            if(angular.isObject(relations) && !$.isEmptyObject(relations)){
                                var que =relations.capture,flag=true;
                                angular.forEach(que.siblings,function (v) {
                                    if(v.type==='queue'){
                                        flag=false;
                                    }
                                });
                                if(!que || que.length===0 || !flag){
                                    dipT.error($filter('translate')('M_qxpzzj'));//请先配置跟Capture组件相关联的Queue组件！
                                    return;
                                }
                            }
                            comName ='Capture';
                            modelStr ='<div id="mainId"><label>'+scn_txt+'</label><input class="form-control" type="text" id="scnId" placeholder="'+scn__p+'"/><br>' +//开始SCN号：请输入SCN号
                                '<label>'+low_scn_txt+'</label><input id="lowScnId" type="text" class="form-control" placeholder="'+low_scn_p+'"/></div>';//开始Low SCN号：请输入start_SCN
                            startScn();
                        } else if(comInfo.rtype==='transfer'){
                            comName ='Tclient';
                            modelStr ='<div id="mainId"><label>'+scn_txt+'</label><input class="form-control" type="text" id="scnId" placeholder="'+scn__p+'"/></div>';
                        }else if(comInfo.rtype==='etl'){
                            comName ='Etl';
                            modelStr ='<div id="mainId"><label>'+scn_txt+'</label><input class="form-control" type="text" id="scnId" placeholder="'+scn__p+'"/></div>';
                            startScn();
                        } else if(comInfo.rtype==='apply'){
                            comName ='Loader';
                            modelStr ='<div id="mainId"><label>'+scn_txt+'</label><input class="form-control" type="text" id="scnId" placeholder="'+scn__p+'"/></div>';
                            //查询源端数据库名称、目标数据端名称
                            var node_id = comInfo.id,info ={};
                            obj = gSer.getSource(node_id);
                            if(obj===null){
                                dipT.error($filter('translate')('M_dqyd'));//当前组件的源端数据库尚未配置，无法指定SCN启动！
                                return;
                            }
                            info.sn = obj.name;
                            obj = gSer.getChild(node_id);
                            if(obj===null){
                                dipT.error($filter('translate')('M_dqmb'));//当前组件的目标端数据库尚未配置，无法指定SCN启动！
                                return;
                            }
                            info.tn = obj.name;
                            info.gn = comInfo.group_id;
                            mainService.isSourceDatabaseSame(info).then(function (isSame) {
                                if(isSame===true){
                                    BootstrapDialog.confirm({
                                        title: $filter('translate')('TIP'),//Dip 提示
                                        message: $filter('translate')('M_ymyzjs'),//系统检测到源端数据库与目标端数据一致，是否继续？
                                        type: BootstrapDialog.TYPE_WARNING,
                                        closable: false,
                                        btnCancelLabel: $filter('translate')('CANCEL'),//取消
                                        btnOKLabel: $filter('translate')('OK'),//确认
                                        btnOKClass: 'btn-warning',
                                        callback: function(result) {
                                            if(result) {
                                                startScn();
                                            }
                                        }
                                    });
                                }else{
                                    if(isSame===false){
                                        startScn();
                                    }
                                }
                            });
                        }
                    }
                    //重置组
                    function resetGroup(group) {
                        var resetG = function () {
                            var modelStr='<div id="mainId"><input type="radio" name="rgroup" checked value="yes" id="dd_all"/><label for="dd_all">'+$filter('translate')('M_tip48')+'</label><br>' +// 清除断点，队列和日志数据
                                '<input type="radio" name="rgroup" value="no" id="dd_none"/><label for="dd_none">'+$filter('translate')('M_tip49')+'</label></div>';// 清除断点，保留队列和日志数据
                            var comName=group.title;
                            var dialog = new BootstrapDialog({
                                title: $filter('translate')('M_tip50',{gname:comName}),//重置'+comName+'组
                                message: $(modelStr),
                                type:'type-warning',
                                buttons: [{
                                    label: $filter('translate')('CANCEL'),//取消
                                    cssClass: 'btn-default',
                                    action: function(dialogRef){
                                        dialogRef.close();
                                    }
                                },{
                                    id: 'button-c',
                                    label: $filter('translate')('RESET'),//重置
                                    cssClass: 'btn-primary',
                                    hotkey: 13, // Enter.
                                    action: function(dialogRef) {
                                        var type=dialogRef.getModalBody().find('input:checked').val();
                                        dialog.enableButtons(false);
                                        dialog.setClosable(false);
                                        dialogRef.getModalBody().html('<h2 class="text-warning">'+comName+$filter('translate')('M_tip51')+'</h2>');//组重置中.....
                                        var curStatus = cgSer.curGroup.load;
                                        cgSer.curGroup.load='no';
                                        mainService.resetGroup(group.group_id,type).then(function (result) {
                                            if(result.res){
                                                dialog.setType('type-success');
                                                dialog.getModalBody().html('<h2 class="text-success">'+$filter('translate')('M_tip52',{gname:comName})+'<i class="green glyphicon glyphicon-ok"></i></h2>');//恭喜！'+comName+' 组重置成功！
                                                dialog.setClosable(true);
                                                $ctrl.getCurGroupStatus();
                                                cgSer.curGroup.load ='no';
                                                $ctrl.clearInterval();//停止后台请求，暂时性代码
                                                setTimeout(function () {
                                                    dialog.close();
                                                },500);
                                            }else{
                                                dialog.setType('type-danger');
                                                var err = result.msg || $filter('translate')('M_tip53',{cname:comName});//抱歉！'+comName+' 组重置失败！
                                                dialog.getModalBody().html('<h2 class="text-error">'+err+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                                                dialog.setClosable(true);
                                                cgSer.curGroup.load=curStatus;
                                            }
                                        },function () {
                                            dialog.setType('type-danger');
                                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                                            dialog.setClosable(true);
                                            cgSer.curGroup.load=curStatus;
                                        });
                                    }
                                }],
                                closable: true
                            });
                            dialog.open();
                        };
                        if(cgSer.curGroup.load==='yes'){
                            BootstrapDialog.alert({
                                title: $filter('translate')('TIP'),//Dip 提示
                                message: group.title+$filter('translate')('M_tip54'),//组正在运行中，请先停止当前组，再执行重置操作？
                                type: BootstrapDialog.TYPE_DANGER,
                                closable: true,
                                buttonLabel: $filter('translate')('SURE'),//确定
                                btnOKClass: 'btn-warning'
                            });
                            return;
                        }
                        resetG();
                    }
                    //删除组
                    function deleteGroup(group) {
                        var deleteSer = function () {
                            var msg='<h2 class="text-warning">'+$filter('translate')('M_tip55',{gname:group.title})+'</h2>';//正在删除 '+group.title+' 组.....
                            var dialog = new BootstrapDialog({
                                title:$filter('translate')('M_tip56'),//删除组
                                type:'type-warning',
                                message: function(){
                                    return msg;
                                },
                                closable: false
                            });
                            dialog.open();
                            mainService.deleteGroup(group.group_id).then(function (result) {
                                if(result.res){
                                    dialog.setType('type-success');
                                    dialog.getModalBody().html('<h2 class="text-success">'+group.title+$filter('translate')('M_tip57')+'<i class="green glyphicon glyphicon-ok"></i></h2>');//组删除成功!M_tip57
                                    dialog.setClosable(true);
                                    $ctrl.clearInterval();//停止后台请求
                                    var arr = $ctrl.groupList.slice(0),flag=0;
                                    angular.forEach(arr,function (val,idx) {
                                        if(val.title===group.title){
                                            $ctrl.groupList.splice(idx,1);
                                            flag = idx-1;
                                        }
                                    });
                                    if(flag>=0 && $ctrl.groupList.length>0){
                                        $ctrl.groupList[flag].active=true;
                                        cgSer.curGroupName = $ctrl.groupList[flag].title;
                                        cgSer.curGroupId = $ctrl.groupList[flag].group_id;
                                        cgSer.curGroup = $ctrl.groupList[flag];
                                        cgSer.groupList = $ctrl.groupList;
                                        // $.cookie('group', cgSer.curGroupId);
                                        window.localStorage.setItem('group', cgSer.curGroupId);
                                        $ctrl.menu.currentGc=cgSer.curGroupName;
                                        //加载视图
                                        mainService.getGraphicByGroupId(cgSer.curGroupId).then(function (data) {
                                            if(data){
                                                $ctrl.getCurGroupStatus();//第一次查询
                                                //获取组件状态，每隔5秒钟查询一次
                                                stopTimer =$interval(function () {
                                                    $ctrl.getCurGroupStatus();
                                                },5000);
                                                // $scope.$on('$destroy', function() {
                                                //     $ctrl.clearInterval();
                                                // });
                                            }
                                        });
                                    }else{
                                        if($ctrl.groupList.length===0){
                                            $('#flowbox').empty();
                                            // $.cookie('group', null);
                                            window.localStorage.removeItem('group');
                                            $ctrl.comsDragable=true;
                                            dragAble(true);
                                            $ctrl.clearInterval();
                                        }
                                    }
                                    setTimeout(function () {
                                        dialog.close();
                                    },500);
                                }else{
                                    dialog.setType('type-danger');
                                    var err = result.msg || group.title+$filter('translate')('M_tip58');//组删除失败！
                                    dialog.getModalBody().html('<h2 class="text-error">'+err+'<i class="red glyphicon glyphicon-remove"></i></h2>');
                                    dialog.setClosable(true);
                                }
                            },function () {
                                dialog.setType('type-danger');
                                dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                                dialog.setClosable(true);
                            });
                        };
                        if(cgSer.curGroup.load==='yes'){
                            BootstrapDialog.alert({
                                title: $filter('translate')('TIP'),//Dip 提示
                                message: $filter('translate')('M_tip59'),//当前组正在运行中无法删除，请先停止当前组！
                                type: BootstrapDialog.TYPE_DANGER,
                                closable: false,
                                buttonLabel: $filter('translate')('SURE')//确定
                            });
                            return;
                        }
                        BootstrapDialog.confirm({
                            title: $filter('translate')('TIP'),//Dip 提示
                            message: $filter('translate')('M_tip60',{gname:group.title}),//删除操作不可恢复，确认要删除'+group.title+'组吗？
                            type: BootstrapDialog.TYPE_WARNING,
                            closable: false,
                            btnCancelLabel: $filter('translate')('CANCEL'),//取消
                            btnOKLabel: $filter('translate')('OK'),//确认
                            btnOKClass: 'btn-warning',
                            callback: function(result) {
                                if(result) {
                                    deleteSer();
                                }
                            }
                        });
                    }
                    //停止Tserver的命令
                    function stopTserver() {
                        var dialog = new BootstrapDialog({
                            title:'Tserver Info',
                            type:'type-warning',
                            message: function(){
                                return '<h2 class="text-warning">'+$filter('translate')('M_tip61')+'</h2>';//Tserver 程序停止中.....
                            },
                            closable: false
                        });
                        dialog.open();
                        mainService.stopTServer().then(function (res) {
                            if(res){
                                dialog.setType('type-success');
                                dialog.getModalBody().html('<h2 class="text-success">'+$filter('translate')('M_tip63')+'<i class="green glyphicon glyphicon-ok"></i></h2>');//Tserver 程序停止成功！
                                dialog.setClosable(true);
                                $ctrl.tserver.num=0;
                                setTimeout(function () {
                                    dialog.close();
                                },300);
                            }else{
                                dialog.setType('type-danger');
                                dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('M_tip62')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//抱歉！Tserver 程序停止失败！
                                dialog.setClosable(true);
                            }
                        },function () {
                            dialog.setClosable(true);
                            dialog.setType('type-danger');
                            dialog.getModalBody().html('<h2 class="text-error">'+$filter('translate')('Wlcw')+'<i class="red glyphicon glyphicon-remove"></i></h2>');//网络错误！
                        });
                    }
                    //获取Tserver状态
                    function queryTserverStatus() {
                        mainService.getTserverStatus().then(function (num) {
                            $ctrl.tserver.num=num;
                        });
                    }
                    //获取Modellis列表
                    function getModelList() {
                        mainService.getDbModelList().then(function (list) {
                            $ctrl.modelList=list;
                        });
                    }
                }],
                controllerAs: '$ctrl',
                bindToController: true,
                link: function(scope, element, attrs, controllers) {
                    var $ctrl= controllers || {};
                    plumb(scope,$ctrl,$log);
                    //右键事件
                    $(document).contextmenu({
                        delegate: ".component",
                        autoFocus: true,
                        preventContextMenuForPopup: true,
                        preventSelect: true,
                        menu:[{}],
                        beforeOpen: function() {
                            return false;
                        }
                    });
                    r7Plumb.dragInit();
                    var flowBox = $("#flowbox");
                    flowBox.on("click","div.component",function () {
                        scope.$apply(function () {
                            $ctrl.menu.dialog = !$ctrl.menu.dialog;
                        });
                    });
                    $('#file').on('change',function () {
                        scope.$apply(function () {
                            $ctrl.changeFiles();
                        });
                    });
                },
                templateUrl: 'main_view/main_view.html'
            };
        }])
        .directive('repeatFinish',function(){
            return {
                link: function(scope){
                    if(scope.$last){
                        $("#flexbox").find(".flex-viewport").jCarouselLite({
                            btnPrev: "#flexbox .flex-prev",
                            btnNext: "#flexbox .flex-next",
                            circular: false,
                            start: 0,
                            scroll: 1,
                            speed: 500,
                            visible:9,
                            mouseWheel:true
                        });
                    }
                }
            }
        });
})();