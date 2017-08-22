const log4js = require("log4js");
const path = require('path');
let dipHome=process.env['DIP_HOME'] || '/dip';
let dipLog=dipHome+'/log/';
let logPath=path.resolve(dipLog, './dip_node_all_');
log4js.configure({
    "appenders": [{
            "type": "console",
            "category": "console"
        },
        {
            "category": "log_file",
            "type": "console",
            "filename": logPath,
            "maxLogSize": 104800,
            "backups": 100
        },
        {
            "category": "log_date0",
            "type": "dateFile",
            "filename": logPath,
            "alwaysIncludePattern": true,
            "pattern": "yyyy-MM-dd.log"
        },
        {
            "category": "log_date",
            "type": "dateFile",
            "filename": logPath,
            "alwaysIncludePattern": true,
            "pattern": "yyyy-MM-dd.log"
        }
    ],
    "replaceConsole": true,
    "levels": {
        "log_file": "OFF",
        "console": "ALL",
        "log_date": "ALL"
    }
});
exports.log = function(file) {
    return log4js.getLogger(file);
};
