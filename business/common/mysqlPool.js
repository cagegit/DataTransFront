
const mysql = require('mysql');
const sysCfg= require('../../routes/sys_config');
const pool = mysql.createPool({
    connectionLimit : 1,
    host     : 'localhost',
    user     : 'r7',
    password : 'r7',
    database: 'dip',
    port: sysCfg.mysql_port || 3306,
    debug: false
});
pool.on('release', function (connection) {
  // console.debug(connection);
  console.log('Connection %d released', connection.threadId);
});
console.debug('---------------------------------------------------------------------');
console.debug('create pool!');
module.exports = pool;
