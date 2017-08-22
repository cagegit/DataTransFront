let algor = require('./add');
let except = require('chai').expect;

describe('加法测试', function(){
  it('1+1 should equal 2', function(){
    except(algor.add(1,2)).to.be.a('number');
    except(algor.add(1,2)).to.be.equal(3);
  });

it('2*2 should equal 4', function(){
    except(algor.mul(2,2)).to.be.a('number');
    except(algor.mul(2,2)).to.be.equal(4);
  });
});
