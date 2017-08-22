/**
 * Created by cage on 2016/8/4.
 */
'use strict';
$(function () {
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
        maxConnections: 1,	// 设置连接点最多可以连接几条线
        connectorOverlays: [["Arrow", { width: 10, length: 10, location: 1,foldback:0.8}]],
        DragOptions : { zIndex:2000 }
    },
    instance = jsPlumb.getInstance({
        endpoint: ["Dot", { radius: 1}],  //端点的形状
        connectorStyle: connectorPaintStyle,//连接线的颜色，大小样式
        connectorHoverStyle: connectorHoverStyle,
        maxConnections: 1,	// 设置连接点最多可以连接几条线
        connectorOverlays: [["Arrow", { width: 10, length: 10, location: 1,foldback:0.8 }]],
        DragOptions : { zIndex:2000 },
        Container:"flowbox"
    }),
    flowCanvas=$("#flowbox"),
    toolBar = $("#kj-kj"),
    canvasId="flowbox",
    componentIndex=1,
    currentLineStyle='Flowchart',
    dragComponentsSort=['database','capture','queue','loader','database'],//控件顺序，
    mainScope= function () {
        var appElement = document.querySelector('[ng-controller=mainController]');
        return angular.element(appElement).scope();
    };
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
             if(val == "1"){
                 r7PlumbSelectArea.alignTop();
             }else if(val == "2"){
                 r7PlumbSelectArea.alignBottom();
             }else if(val == "3"){
                 r7PlumbSelectArea.alignLeft();
             }else if(val == "4"){
                 r7PlumbSelectArea.alignRight();
             }else if(val == "5"){
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

                  componentIndex = parseInt(g_flag) || 1;
                  if(arrplant === "[]"){
                      return;
                  }
                  arrplant = JSON.parse(arrplant);
                  connects = JSON.parse(connects);
                  renderComponents(arrplant,connects);
                  //updateMiniview();
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
                 var self = this;
                 clicks++;
                 if (clicks === 1) {
                     timer = setTimeout(function(){
                         var curTarget= $(e.target),comInfo;
                         if(curTarget.hasClass('compic')){
                             comInfo = curTarget.parent().parent();
                         }else if(curTarget.hasClass('km-btn-full')){
                             comInfo = curTarget.parent();
                         }
                         var appElement = document.querySelector('[ng-controller=mainController]');
                         var scope = angular.element(appElement).scope();
                         if(clicks === 1) {
                             if(comInfo.attr("rtype")){
                                 scope.showPzDialog({rtype:comInfo.attr("rtype"),name:comInfo.attr("name"),id:comInfo.attr("id"),cid:comInfo.attr("realid")});
                                 scope.$apply();
                             }
                         } else {
                             if(comInfo.attr("rtype")){
                                 scope.changeCurrentCom({rtype:comInfo.attr("rtype"),name:comInfo.attr("name"),id:comInfo.attr("id"),cid:comInfo.attr("realid")});
                                 scope.$apply();
                             }
                         }
                         clicks = 0;
                         clearTimeout(timer);
                     }, timeout);
                 }
             }).on('dblclick','.km-btn-full',function (e) {
                 e.preventDefault();
             });
             //右键事件
             $(document).contextmenu({
                 delegate: ".component",
                 autoFocus: true,
                 preventContextMenuForPopup: true,
                 preventSelect: true,
                 menu:[{}],
                 beforeOpen: function(event, ui) {
                     return false;
                 }
             });
             $('#page-slidebar').contextmenu({
                 target: '.group-list-one',
                 onItem: function (context, e) {
                     console.log($(e.target).text());
                 }
             });
             function drawGp(ui,selector) {
                 var appElement = document.querySelector('[ng-controller=mainController]');
                 var scope = angular.element(appElement).scope();
                 scope.menu.comPanelShow=false;
                 scope.$apply();
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
                 $(nw[0]).css("left", ll + "px");
                 var hh = parseInt($(nw[0]).css("top")) -102 + ttop;
                 $(nw[0]).css("top", hh + "px");
                 $(nw[0]).css("width","");
                 $(nw[0]).css("height","");
                 $(nw[0]).css("zIndex",100);
                 var zjType = $(nw).attr("rtype");
                 flowCanvas.append(nw);
                 if(zjType=="queue" || zjType=="database" || zjType=="apply"){
                     hollowCircle.maxConnections= -1;
                 }
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
                     mainScope().anToastr.warning("控件已连接！");
                 }else{
                     var conor = instance.connect({
                         source: sourceId,
                         target: targetId,
                         anchor: "Continuous"
                     }, hollowCircle);
                         conor.bind('click',function(){
                             var that = this;
                             BootstrapDialog.confirm('确定要删除该连线吗', function(result){
                                 if(result) {
                                     instance.detach(that);
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
             flowCanvas.parent().miniview(flowCanvas.find(".component"));
         }

         function changeLineStyle(c_style) {
             if (c_style == "Flowchart") {
                 connectorPaintStyle.strokeStyle = lineColor[1];
                 hollowCircle.connector = ["Flowchart", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
             } else if (c_style == "Straight") {
                 connectorPaintStyle.strokeStyle  = lineColor[0];
                 hollowCircle.connector = ["Straight", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
             } else if (c_style == "Bezier") {
                 connectorPaintStyle.strokeStyle = lineColor[2];
                 hollowCircle.connector = ["Bezier", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
             }
         }

         function changeLineStyleByNum(num) {
             if (num == "1") {
                 connectorPaintStyle.strokeStyle = lineColor[1];
                 hollowCircle.connector = ["Flowchart", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
             } else if (num == "2") {
                 connectorPaintStyle.strokeStyle  = lineColor[0];
                 hollowCircle.connector = ["Straight", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
             } else if (num == "3") {
                 connectorPaintStyle.strokeStyle = lineColor[2];
                 hollowCircle.connector = ["Bezier", { stub: [0, 0], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }];
             }
         }

         function renderComponents(arrplant,connects) {
             var strHtm = "",i=0;
             $.each(arrplant,function (idx, val) {
                 var htm='',ms = val.BlockClass.split(' '),cla='';
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
                 }
                 strHtm += '<div class="'+val.Class+'" rtype="' + val.Rtype + '" parentid="' + val.ParentId +'" style="height:' + val.BlockHeight + ';width:' + val.BlockWidth + ';left:' + val.BlockX + ';top:' +
                     val.BlockY + ';position: absolute;"  id="' + val.BlockId + '" type="'+val.Type+'" name="'+val.Name+'" original-title="'+val.OriginalTitle+'" realid="'+val.RealId+'" >'+
                     htm+'<span class="dragPoint">'+val.BlockTxt+'</span></div>';
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
                         mainScope().anToastr.error("不能以自己作为目标元素！");
                         instance.detach(info);
                     }else{
                         var s_type = $("#"+info.connection.sourceId).attr("rtype");
                         var t_type = $("#"+info.connection.targetId).attr("rtype");
                         if(s_type === t_type){
                             mainScope().anToastr.error("相同控件之间不能连接！");
                             instance.detach(info);
                         }
                     }
                 }
             });
             instance.bind("connectionDragStop", function(info) {//点击连接线、overlay、label提示删除连线 + 不能以自己作为目标元素
                 var mms =$("#"+info.targetId).find("#"+info.sourceId);
                 if(mms.length>0 || info.targetId === info.sourceId){
                     mainScope().anToastr.error("不能以自己作为目标元素！");
                     instance.detach(info);
                 }else{
                     //if(cfg_page == 2){
                         info.unbind('click');
                         info.bind('click',function(){
                             BootstrapDialog.confirm('确定要删除该连线吗', function(result){
                                 if(result) {
                                     instance.detach(info);
                                 }
                             });
                         });
                     //}
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
                 conor.bind('click',function(){
                     var that = this;
                     BootstrapDialog.confirm('确定要删除该连线吗', function(result){
                         if(result) {
                             instance.detach(that);
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
                 stop: function (ui) {
                 }
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
                     instance.makeSource(nodes, {filter:".dragPoint",anchor:"Continuous"}, hollowCircle);
                 });
                 instance.makeTarget(nodes,{dropOptions:{hoverClass:"seled"}, anchor:"Continuous"},hollowCircle);
             }
         }

         //删除单个元素方法封装
         _r7Plumb.deleteElement = function (node_id) {
             instance.removeAllEndpoints(node_id);
             instance.remove(node_id);
             //updateMiniview();
         };

         _r7Plumb.instance = instance;

         return _r7Plumb;
     };
     window.r7Plumb = r7Plumb();
});