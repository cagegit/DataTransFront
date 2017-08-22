/**
 * Created by cagej on 2017/7/31.
 */
const graphic = require('../main/graphic');
const md5 = require('md5');
const expect = require('chai').expect;
/*
 * graphic接口里面全部方法的测试
 * */
describe('graphic 接口 的测试', function() {
    "use strict";
    const res = {
        json: function (data) {
            return data;
        }
    };

    it('add_graphic 保存视图，操作成功应该返回SUCCESS', function() {
        let request = {"group":"group_314","relation_shape":{"capture":[{"name":"cp","rid":"capture_276","siblings":[{"name":"src","io_status":"input","rid":"database_275","type":"database"},{"name":"que","io_status":"output","rid":"queue_277","type":"queue"}]}],"apply":[{"name":"ld","rid":"apply_279","siblings":[{"name":"que","io_status":"input","rid":"queue_277","type":"queue"},{"name":"dest","io_status":"output","rid":"database_278","type":"database"}]}]},"graphic":{"global_index":30,"line_object":[{"ConnectionId":"con_5","PageSourceId":"database20","PageTargetId":"capture21","RealSourceId":"database_275","RealTargetId":"capture_276","Connector":"Flowchart"},{"ConnectionId":"con_10","PageSourceId":"capture21","PageTargetId":"queue22","RealSourceId":"capture_276","RealTargetId":"queue_277","Connector":"Flowchart"},{"ConnectionId":"con_15","PageSourceId":"queue22","PageTargetId":"loader23","RealSourceId":"queue_277","RealTargetId":"apply_279","Connector":"Flowchart"},{"ConnectionId":"con_20","PageSourceId":"loader23","PageTargetId":"database24","RealSourceId":"apply_279","RealTargetId":"database_278","Connector":"Flowchart"}],"graphic_content":[{"BlockId":"database20","BlockClass":"km-btn-full database-bg drag-cir","BlockTxt":"src","BlockX":"138px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"94px","ParentId":"flowbox","Rtype":"database","Type":"oracle","Name":"src","OriginalTitle":"undefined","Class":"component database jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor","RealId":"database_275"},{"BlockId":"capture21","BlockClass":"km-btn-full capture-bg drag-cir","BlockTxt":"cp","BlockX":"343px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"95px","ParentId":"flowbox","Rtype":"capture","Type":"oracle","Name":"cp","OriginalTitle":"undefined","Class":"component capture jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor","RealId":"capture_276"},{"BlockId":"queue22","BlockClass":"km-btn-full queue-bg drag-cir","BlockTxt":"que","BlockX":"532px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"95px","ParentId":"flowbox","Rtype":"queue","Type":"oracle","Name":"que","OriginalTitle":"undefined","Class":"component queue jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor","RealId":"queue_277"},{"BlockId":"loader23","BlockClass":"km-btn-full loader-bg drag-cir","BlockTxt":"ld","BlockX":"736px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"95px","ParentId":"flowbox","Rtype":"apply","Type":"oracle","Name":"ld","OriginalTitle":"undefined","Class":"component apply jsplumb-draggable jsplumb-droppable _jsPlumb_connected _jsPlumb_endpoint_anchor","RealId":"apply_279"},{"BlockId":"database24","BlockClass":"km-btn-full database-bg drag-cir","BlockTxt":"dest","BlockX":"920px","BlockY":"131px","BlockWidth":"92px","BlockHeight":"94px","ParentId":"flowbox","Rtype":"database","Type":"oracle","Name":"dest","OriginalTitle":"undefined","Class":"component database jsplumb-draggable jsplumb-droppable _jsPlumb_endpoint_anchor _jsPlumb_connected","RealId":"database_278"}]}};
        let body ={ "md5":md5(JSON.stringify(request)), "request": request};
        return graphic.add_graphic(body, res).then(function (result) {
            console.debug('mocha add_graphic resolve----1');
            console.debug(result);
            if (result.status) {
                expect(result.response).to.equal('SUCCESS');
            } else {
                expect(result.response.error_msg).to.exist;
            }
        });
    });

    it('require_graphic 查询视图，应该返回跟保存视图一致的JSON字符串', function () {
           let request = {group: "group_314"};
           let body = {md5: md5(JSON.stringify(request)), request: request};
           return graphic.require_graphic(body, res).then(function (result) {
               console.debug('mocha require_graphic resolve----2');
               console.debug(result);
               if (result.status) {
                  if (typeof result.response.graphic === 'string') {
                      expect(result.response.graphic).to.equal('');
                  } else {
                      expect(result.response.graphic).to.have.own.property('line_object');
                      expect(result.response.graphic).to.have.own.property('graphic_content');
                  }
               }
           });
    });
});