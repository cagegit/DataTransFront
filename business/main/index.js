var err = require('./error');
var grp = require('./group');
var que = require('./queue');
var usr = require('./user');
var sys = require('./syscfg');
var bak = require('./bakup');
var sync = require('./sync');

var project = require('./project');
var graphic = require('./graphic');
var database = require('./database');
var capture = require('./capture');
var queue = require('./queue');
var apply = require('./apply');
var transfer = require('./transfer');
var component = require('./component');
var etl = require('./etl');

module.exports = {
    err: err,
    grp: grp,
    que: que,
    usr: usr,
    sys: sys,
    bak: bak,
    sync:sync,
    project:project,
    graphic:graphic,
    database:database,
    capture:capture,
    queue:queue,
    apply:apply,
    transfer:transfer,
    component:component,
    etl:etl
};
