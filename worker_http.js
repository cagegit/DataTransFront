'use strict';
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const favicon = require('serve-favicon');
const LocalStrategy = require('passport-local').Strategy;
const ejs =require('ejs');
const MySQLStore = require('express-mysql-session')(session);
let HTTP_PORT=7008;
//配置信息文件
let config = require('./config/config');
let sys_cfg = require('./routes/sys_config');
HTTP_PORT = sys_cfg.http_port;
//加载路由
let login = require('./routes/login');
let manager = require('./routes/manager_xml');

// Init App
let app = express();
/*
 app.use(timeout(6000));
 app.use(haltOnTimedout);
 */
//设置配置文件信息
app.set('sys_cfg',sys_cfg);
// 静态文件目录
app.use(express.static(__dirname+'/app'));
app.use(favicon(__dirname + '/app/favicon.ico'));
app.use(router);
//模板渲染引擎
app.set('views', __dirname + '/server/views');
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

// BodyParser 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cookie.secret));

let options = {
    host: 'localhost',
    port: sys_cfg.mysql_port,
    user: 'r7',
    password: 'r7',
    database: 'dip',
    schema: {
        tableName: 'T_AUTH_SESSIONS',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

// Express Session
app.use(session({
    cookie: { maxAge: config.session.maxAge,httpOnly:true},
    secret: config.session.secret,
    saveUninitialized: true,
    resave: true,
    rolling:true,
    store:new MySQLStore(options)
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));

// // Connect Flash
app.use(flash());

app.use('/', login);
app.use('/dipserver', manager);
app.get('*', function (req, res) {
    res.redirect('/login');
});
app.use(function(req, res, next) {
    res.status(404).render('404',{
        title:'404 Page Not Found!'
    });
});
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
app.listen(HTTP_PORT);
console.log('Express started on 127.0.0.1:'+HTTP_PORT);
module.exports=app;
