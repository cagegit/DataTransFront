/**
 * Created by cage on 2016/10/21.
 */
'use strict';
var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var router = express.Router();
var tcpClient = require('./tcpClient.js');
var fun = require('../business/main');

var loginInfo =null,tcp_err=null;
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        res.redirect(301, '/login');
    }
}
router.get('/',function (req, res) {
    res.redirect('/login');
});
router.get('/login',function (req, res) {
    res.render('login', { message: req.flash('loginMessage'),info:loginInfo});
});
router.get('/login1',function (req, res) {
    res.render('loginIn', { message: req.flash('loginMessage'),info:loginInfo});
});
passport.use('local',new LocalStrategy({
    usernameField: 'userName',
    passwordField: 'password',
    passReqToCallback: true
   },
    function(req,uname, upwd, done) {

        var promise = fun.usr.dip_manuser_check_user(req);
        /*
        loginInfo=req.body;
        var xml ='<dip_command>' +
            '<command>dip_manuser_check_user</command>' +
            '<command_data>' +
            '<user>' + uname + '</user>' +
            '<passwd>' + upwd + '</passwd>' +
            '<authority>' + loginInfo.auth + '</authority>' +
            '</command_data>' +
            '</dip_command>';
        var port = req.app.get('sys_cfg').manager_port;
        var promise =tcpClient.getJson(xml,port);
        */
        promise.then(function (data) {
             tcp_err=null;
             if(data.command_return==='SUCCESS'){
                 var user ={name:uname,auth:data.return_data,id:1};
                 return done(null, user);
             }else{
                 return done(null, false,req.flash('loginMessage', '100012'));
             }
        },function (e) {
            tcp_err='100013';
            return done(null, false);
        });
        
    }));
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, {cuser:user});
});
router.get('/failAuth',function (req, res) {
    var msg ={
        auth:false,
        err:''
    };
    if(tcp_err){
        msg.err=tcp_err;
    }
    res.json(msg);
});
router.get('/successAuth',function (req, res) {
    res.json({auth:true,url:'/index'});
});
router.post('/loginIn',passport.authenticate('local', {successRedirect:'/successAuth', failureRedirect:'/failAuth',failureFlash: true}),
    function(req, res) {
        res.redirect('/index');
    });
//主界面
router.get('/main',ensureAuthenticated, function(req, res){
    res.render('main');
});
//项目页
router.get('/index',ensureAuthenticated, function(req, res){
    res.render('index');
});
//系统设置页
router.get('/config',ensureAuthenticated, function(req, res){
    if(req.user && req.user.cuser){
        if(req.user.cuser.auth==='super'){
            res.redirect('/index');
        }else{
            res.render('config');
        }
    }else{
        res.render('config');
    }
});
//大屏页面
router.get('/view',ensureAuthenticated, function(req, res){
    res.render('dap');
});
//登出
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
});
//验证是否登出
router.get('/isAuth', function(req, res){
    var msg = {};
    msg.isAuth =req.isAuthenticated();
    if(req.user && req.user.cuser){
        msg.user=req.user.cuser;
    }else{
        msg.user =null;
    }
    res.status(200).json(msg);
});
module.exports = router;