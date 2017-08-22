let pub = require('./public');
let db = require('./dbObject');
let write_log = require('./logger').log('log_date');
module.exports = {
    pub: pub,
    db: db,
    log: write_log
};