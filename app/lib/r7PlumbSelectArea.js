'use strict';
(function (win) {
    Array.prototype.remove = function (item) {
        for (var i = 0; i < this.length; i++) {
            if (item === this[i])
                break;
        }
        if (i === this.length)
            return;
        for (var j = i; j < this.length - 1; j++) {
            this[j] = this[j + 1];
        }
        this.length--;
    };
    function posXY(event, sDivId) {
        var oDiv =  $('div.topo-map');
        var divX = oDiv.offset().left;
        var divY = oDiv.offset().top;
        var posX = event.pageX || (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
        var posY = event.pageY || (event.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
        return {x: posX - divX, y: posY - divY};
    }

//----------- 区域选择关键方法 -----------------------
    var _selectedRegions = [];

    function RegionSelect(selRegionProp) {
        //selProp = selRegionProp;
        this.regions = [];
        this.selProp = selRegionProp;
        this.InitRegions(selRegionProp);
        this.selectedClass = selRegionProp["selectedClass"];
        this.selectedRegion = [];
        this.selectDiv = null;
        this.startX = null;
        this.startY = null;
        this.parentId = selRegionProp["parentId"];
    }

    RegionSelect.prototype.InitRegions = function () {
        var _self = this;
        _self.regions = [];
        var _regions = $(_self.selProp["region"]);
        var bSelect = true;
        if (_regions && _regions.length > 0) {
            $.each(_regions,function (i, region) {
                $(region).mousedown(function (event) {
                    bSelect = false;
                    if (!event.shiftKey && !event.ctrlKey) {
                        if ($.inArray(region, _selectedRegions) === -1) {
                            _self.clearSelections(_regions);
                            $(region).addClass(_self.selectedClass);
                            _selectedRegions = [];
                            _selectedRegions.push(this);
                        }
                    } else {
                        if($(region).hasClass(_self.selectedClass)){
                            $(region).removeClass(_self.selectedClass);
                            _selectedRegions.remove(region);
                        }else{
                            $(region).addClass(_self.selectedClass);
                            _selectedRegions.push(region);
                        }
                    }
                });
                _self.regions.push(_regions[i]);
            });
        }

        if (bSelect) {
            // 清空所有select样式
            _self.clearSelections(_regions);
            // 清空selected数组，并加入当前select中的元素
            _selectedRegions = [];
        }
    };

    RegionSelect.prototype.select = function () {
        var _self = this;
        var sDivId = _self.parentId;
        var selId= '#'+sDivId;
        var intMousePosition = [0, 0];
        var intOriginalPosition = [0, 0];
        $(selId).mousedown(function (e) {
            var bw = e.which;
            if (e.target && e.target.id===sDivId) {
                if (bw === 1) {
                    _self.onBeforeSelect(e, selId);
                }else if (bw === 3) {
                    intMousePosition = [e.clientX, e.clientY];
                    var movX = $(selId).position().left;
                    var movY = $(selId).position().top;
                    intOriginalPosition = [movX, movY];
                    $(selId).css('cursor','move');
                }else {
                    _self.onBeforeSelect(e, selId);
                }
            }
        });

        $(selId).mousemove(function (e) {
            if (e.target && e.target.id===sDivId) {
                var bw = e.which;
                if (bw === 1) {
                    _self.onSelect(e, selId);
                }else if(bw === 3) {
                    // var newX = intOriginalPosition[0] + e.clientX - intMousePosition[0];
                    // var newY = intOriginalPosition[1] + e.clientY - intMousePosition[1];
                }else{
                    _self.onSelect(e, selId);
                }
            }
        });
        $(selId).mouseup(function (e) {
            $(selId).css('cursor','default');
            _self.onEnd();
        });
        // $(selId).click();
    };

    RegionSelect.prototype.onBeforeSelect = function (evt, selId) {
        // 创建模拟 选择框
        var _self = this;
        _self.InitRegions(_self.selProp);
        if ($('#selContainer').length<=0) {
            _self.selectDiv = document.createElement("div");
            $(_self.selectDiv).attr('id','selContainer');
            $(_self.selectDiv).css({position:'absolute',width:0,height:0,margin:0,padding:0,border:'1px dashed #0099FF',backgroundColor:'#C3D5ED',zIndex:998,filter:'alpha(opacity:60)',opacity:0.6,display:'none'});
            $(selId).append(_self.selectDiv);
        }else{
            _self.selectDiv=document.getElementById('selContainer');
        }
        _self.startX = posXY(evt, selId).x;
        _self.startY = posXY(evt, selId).y;
        _self.isSelect = true;
    };

    RegionSelect.prototype.onSelect = function (evt, sDivId) {
        var self = this;
        var $selDiv=$(self.selectDiv);
        if (self.isSelect) {
            if($selDiv.css('display')==='none'){
                $selDiv.css('display','block');
            }
            var posX = posXY(evt, sDivId).x;
            var poxY = posXY(evt, sDivId).y;
            var l=(Math.min(posX, this.startX)) + "px";
            var t=(Math.min(poxY, this.startY)) + "px";
            var w=Math.abs(posX - this.startX) + "px";
            var h=Math.abs(poxY - this.startY) + "px";
            $selDiv.css({left:l,top:t,width:w,height:h});
            $.each(self.regions,function (i, v) {
                if ($selDiv.parent().attr('id') !== $(v).parent().attr('id')){
                    return;
                }
                var sr=self.innerRegion(self.selectDiv, v);
                if(!sr && $(v).hasClass(self.selectedClass)){
                    $(v).removeClass(self.selectedClass);
                    _selectedRegions.remove(v);
                }
                if(sr && !$(v).hasClass(self.selectedClass)){
                    $(v).addClass(self.selectedClass);
                    _selectedRegions.push(v);
                }
            });
        }
    };

    RegionSelect.prototype.onEnd = function () {
        var self = this;
        if (self.selectDiv) {
            $(self.selectDiv).hide();
        }
        this.isSelect = false;
    };

    // 判断一个区域是否在选择区内
    RegionSelect.prototype.innerRegion = function (selDiv, region) {
        // var s_top = parseInt($(selDiv).css('top')) || 0;
        // var s_left = parseInt($(selDiv).css('left')) || 0;
        // var div_left = s_left + $(selDiv).width();
        // var div_bottom = s_top + $(selDiv).height();
        // var r_top = parseInt($(region).css('top')) || 0;
        // var r_left = parseInt($(region).css('top')) || 0;
        // var el_left = r_left + parseInt(region.offsetWidth);
        // var el_bottom = r_top + parseInt(region.offsetHeight);
        // return el_left > s_left && el_left < div_left && el_bottom < div_bottom && el_bottom > s_top;
        var s_top = parseInt(selDiv.style.top);
        var s_left = parseInt(selDiv.style.left);
        var s_right = s_left + parseInt(selDiv.offsetWidth);
        var s_bottom = s_top + parseInt(selDiv.offsetHeight);

        var r_top = parseInt(region.offsetTop);
        var r_left = parseInt(region.offsetLeft);
        var r_right = r_left + parseInt(region.offsetWidth);
        var r_bottom = r_top + parseInt(region.offsetHeight);

        var t = Math.max(s_top, r_top);
        var r = Math.min(s_right, r_right);
        var b = Math.min(s_bottom, r_bottom);
        var l = Math.max(s_left, r_left);

        return b > t + 5 && r > l + 5;
    };

    RegionSelect.prototype.clearSelections = function (regions) {
        var _self=this;
        $.each(regions,function (i, v) {
           if($(v).hasClass(_self.selectedClass)){
               $(v).removeClass(_self.selectedClass);
           }
        });
    };

    function getSelectedRegions() {
        return _selectedRegions;
    }

    /*-------------------------------------- 区域选择方法结束 --------------------------------------------*/


    function moveSelectDiv(ui,id) {
        var arr = getSelectedRegions();
        var iMoveLeft = ui.left;
        var iMoveTop = ui.top;
        for (var i = 0; i < arr.length; i++) {
            var iLeft = parseInt($(arr[i]).attr("bLeft"));
            var iTop = parseInt($(arr[i]).attr("bTop"));
            $(arr[i]).css("left", (iLeft + iMoveLeft) + "px");
            $(arr[i]).css("top", (iTop + iMoveTop) + "px");
        }
    }

    function startMove() {
        var arr = getSelectedRegions();
        for (var i = 0; i < arr.length; i++) {
            $(arr[i]).attr("bLeft", $(arr[i]).position().left);
            $(arr[i]).attr("bTop", $(arr[i]).position().top);
        }
    }

    //左对齐
    function SelectAlignLeft() {
        var arr = getSelectedRegions();
        var iLeft = 0;
        for (var i = 0; i < arr.length; i++) {
            if ($(arr[i]).position().left < iLeft || iLeft === 0) {
                iLeft = $(arr[i]).position().left;
            }
        }
        for (var j = 0; j < arr.length; j++) {
            $(arr[j]).css("left", iLeft + "px");
        }
        r7Plumb.repaintSelected(arr);
    }

    //居中对齐
    function SelectAlignCenter() {
        var arr = getSelectedRegions();
        var iLeft = 0;
        for (var i = 0; i < arr.length; i++) {
            if ($(arr[i]).position().left < iLeft || iLeft === 0) {
                iLeft = $(arr[i]).position().left + $(arr[i]).width()/2;
            }
        }
        for (var j = 0; j < arr.length; j++) {
            $(arr[j]).css("left", (iLeft - $(arr[j]).width()/2) + "px");
        }
        r7Plumb.repaintSelected(arr);
    }

    //右对齐
    function SelectAlignRight() {
        var arr = getSelectedRegions();
        var iLeft = 0;
        for (var i = 0; i < arr.length; i++) {
            if (($(arr[i]).position().left + $(arr[i]).width()) > iLeft || iLeft === 0) {
                iLeft = $(arr[i]).position().left + $(arr[i]).width();
            }
        }
        for (var j = 0; j < arr.length; j++) {
            $(arr[j]).css("left", (iLeft - $(arr[j]).width()) + "px");
        }
        r7Plumb.repaintSelected(arr);
    }

    //上对齐
    function SelectAlignTop() {
        var arr = getSelectedRegions();
        var iTop = 0;
        for (var i = 0; i < arr.length; i++) {
            if ($(arr[i]).position().top < iTop || iTop === 0) {
                iTop = $(arr[i]).position().top;
            }
        }
        for (var j = 0; j < arr.length; j++) {
            $(arr[j]).css("top", iTop + "px");
        }
        r7Plumb.repaintSelected(arr);
    }

    //垂直居中
    function SelectAlignMiddle() {
        var arr = getSelectedRegions();
        var iTop = 0;
        for (var i = 0; i < arr.length; i++) {
            if (($(arr[i]).position().top + $(arr[i]).height()/2) < iTop || iTop === 0) {
                iTop = $(arr[i]).position().top + $(arr[i]).height()/2;
            }
        }
        for (var j = 0; j < arr.length; j++) {
            $(arr[j]).css("top", (iTop - $(arr[j]).height()/2) + "px");
        }
        r7Plumb.repaintSelected(arr);
    }

    //下对齐
    function SelectAlignBottom() {
        var arr = getSelectedRegions();
        var iTop = 0;
        for (var i = 0; i < arr.length; i++) {
            if (($(arr[i]).position().top + $(arr[i]).height()) > iTop || iTop === 0) {
                iTop = $(arr[i]).position().top + $(arr[i]).height();
            }
        }
        for (var j = 0; j < arr.length; j++) {
            $(arr[j]).css("top", (iTop - $(arr[j]).height()) + "px");
        }
        r7Plumb.repaintSelected(arr);
    }

    //上下靠拢
    function SelectUpColse() {
        var arr = getSelectedRegions();
        var iTop = 0;
        var id = "";
        for (var i = 0; i < arr.length; i++) {
            if (id === "") id = arr[i].parentNode.id;
            if (id !== arr[i].parentNode.id) continue;
            if (iTop === 0) iTop = $(arr[i]).position().top;
            $(arr[i]).css("top", iTop + "px");
            iTop += $(arr[i]).height();
        }
        r7Plumb.repaintSelected(arr);
    }

    //左右靠拢
    function SelectLeftColse() {
        var arr = getSelectedRegions();
        var iLeft = 0;
        var id = "";
        for (var i = 0; i < arr.length; i++) {
            if (id === "") id = arr[i].parentNode.id;
            if (id !== arr[i].parentNode.id) continue;
            if (iLeft === 0) iLeft = $(arr[i]).position().left;
            $(arr[i]).css("left", iLeft + "px");
            iLeft += $(arr[i]).width();
        }
        r7Plumb.repaintSelected(arr);
    }

    //删除选中
    function DeleteSelect() {
        var arr = getSelectedRegions();
        for (var i = 0; i < arr.length; i++) {
            //jsPlumb.remove(arr[i], true);
            //var points = jsPlumb.getEndpoints(arr[i]);
            //for (var j = 0; j < points.length; j++) {
            //    jsPlumb.deleteEndpoint(points[j]);
            //}
            //arr[i].parentNode.removeChild(arr[i]);
            var node_id = $(arr[i]).attr("id");
            r7Plumb.deleteElement(node_id);
        }
        r7Plumb.repaintSelected(arr);
    }
    win.r7PlumbSelectArea = {
        deleteSelect: DeleteSelect,
        alignBottom: SelectAlignBottom,
        alignMiddle: SelectAlignMiddle,
        alignTop: SelectAlignTop,
        alignLeft: SelectAlignLeft,
        alignRight: SelectAlignRight,
        startMove: startMove,
        moveSelect: moveSelectDiv,
        regionSelect: RegionSelect,
        getSelected:getSelectedRegions
    };
})(window);