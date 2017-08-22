/**
 * Created by cage on 2016/11/8.
 */
'use strict';
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minify = require('gulp-minify'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    htmlReplace = require('gulp-html-replace'),
    htmlMin = require('gulp-htmlmin'),
    ngHtml2js = require('gulp-ng-html2js'),
    cleanCss = require('gulp-clean-css'),
    stripDebug = require('gulp-strip-debug');
var jsFiles = {
    jqueryLib:[
        'app/bower_components/jquery/dist/jquery.min.js',
        'app/lib/jquery-ui-1.11.2.min.js',
        'app/lib/jquery.ui-contextmenu.js',
        'app/lib/jquery.ztree.core.min.js',
        'app/lib/jquery.ztree.excheck.min.js',
        'app/bower_components/jquery.cookie/jquery.cookie.js',
        'app/bower_components/js-base64/base64.min.js',
        'app/lib/jsPlumb-1.7.10-min.js',
        'app/lib/new_date/jquery.datetimepicker.full.min.js',
        'app/bower_components/moment/min/moment.min.js',
        'app/lib/r7PlumbSelectArea.js'
    ],
    mainApp:[
        'app/app.js',
        'app/service/dipHttpService.js',
        'app/database_view/db_view.js',
        'app/console_view/console_view.js',
        'app/group_view/group_view.js',
        'app/capture_view/cp_view.js',
        'app/queue_view/queue_view.js',
        'app/loader_view/loader_view.js',
        'app/full_syc_view/full_syc_view.js',
        'app/tclient_view/tclient_view.js',
        'app/tserver_view/tserver_view.js',
        'app/database_view/source_db_view.js'
    ]
};
var tplFiles = ['app/*_view/*.html'];

var angularLibs = [
    'app/bower_components/angular-animate/angular-animate.min.js',
    'app/bower_components/angular-toastr/dist/angular-toastr.tpls.min.js',
    'app/bower_components/angular-ui-router/release/angular-ui-router.min.js',
    'app/bower_components/ui-bootstrap/dist/ui-bootstrap-tpls-2.1.3.min.js',
    'app/bower_components/angular-scroll-glue/src/scrollglue.js',
    'app/bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
    'app/bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.templates.js',
    'app/bower_components/angular-bootstrap-switch/dist/angular-bootstrap-switch.min.js',
    'app/context_menu/context_menu_directive.js'
];

var cssFiles ={
    config:[
        'app/bower_components/html5-boilerplate/dist/css/normalize.css',
        'app/bower_components/html5-boilerplate/dist/css/main.css',
        'app/bower_components/bootstrap/dist/css/bootstrap.min.css',
        'app/bower_components/font-awesome/css/font-awesome.min.css',
        'app/bower_components/bootstrap/dip/main2.css',
        'app/bower_components/bootstrap/dip/new_main.css',
        'app/bower_components/angular-toastr/dist/angular-toastr.min.css',
        'app/bower_components/bootstrap3-dialog/dist/css/bootstrap-dialog.min.css'
    ],
    index:[
        'app/bower_components/html5-boilerplate/dist/css/normalize.css',
        'app/bower_components/html5-boilerplate/dist/css/main.css',
        'app/bower_components/bootstrap/dist/css/bootstrap.min.css',
        'app/bower_components/font-awesome/css/font-awesome.min.css',
        'app/bower_components/bootstrap/dip/main2.css',
        'app/bower_components/angular-toastr/dist/angular-toastr.min.css',
        'app/bower_components/bootstrap3-dialog/dist/css/bootstrap-dialog.min.css'
    ],
    login:[
        'app/bower_components/html5-boilerplate/dist/css/normalize.css',
        'app/bower_components/html5-boilerplate/dist/css/main.css',
        'app/bower_components/bootstrap/dist/css/bootstrap.min.css',
        'app/css/login.css'
    ],
    all:[
        'app/bower_components/html5-boilerplate/dist/css/normalize.css',
        'app/bower_components/html5-boilerplate/dist/css/main.css',
        'app/bower_components/bootstrap/dist/css/bootstrap.min.css',
        'app/bower_components/font-awesome/css/font-awesome.min.css',
        'app/bower_components/bootstrap/dip/main2.css',
        'app/bower_components/angular-toastr/dist/angular-toastr.min.css',
        'app/css/zTreeStyle/zTreeStyle.css',
        'app/bower_components/bootstrap3-dialog/dist/css/bootstrap-dialog.min.css',
        'app/bower_components/angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
        'app/bower_components/bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.min.css',
        'app/lib/new_date/jquery.datetimepicker.min.css'
    ]
};

//angular 主业务逻辑
gulp.task('app-main', function () {
    console.log('./app/app.min.js');
    return gulp.src(jsFiles.mainApp)
        .pipe(ngAnnotate({single_quotes: true}))
        .pipe(concat('app.min.js'))
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(gulp.dest('app'));
});
//压缩jquery 插件压缩
gulp.task('minify-jq', function () {
    return gulp.src(jsFiles.jqueryLib)
        .pipe(concat('jq.all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/build'));
});

//angular 辅助插件
gulp.task('app-lib', function () {
    return gulp.src(angularLibs)
        .pipe(ngAnnotate({single_quotes: true}))
        .pipe(concat('app.lib.js'))
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(gulp.dest('app'));
});

//压缩config 所有css样式文件
gulp.task('minify-config', function () {
    return gulp.src(cssFiles.config)
        .pipe(cleanCss({
            rebase:true,
            relativeTo:'app/img',
            target:'app/build'
        }))
        .pipe(concat('config.min.css'))
        .pipe(gulp.dest('app/build'));
});
gulp.task('minify-index', function () {
    return gulp.src(cssFiles.index)
        .pipe(cleanCss({
            rebase:true,
            relativeTo:'app/img',
            target:'app/build'
        }))
        .pipe(concat('index.min.css'))
        .pipe(gulp.dest('app/build'));
});
gulp.task('minify-login', function () {
    return gulp.src(cssFiles.login)
        .pipe(cleanCss({
            rebase:true,
            relativeTo:'app/img',
            target:'app/build'
        }))
        .pipe(concat('login.min.css'))
        .pipe(gulp.dest('app/build'));
});
gulp.task('minify-css',['minify-config','minify-index','minify-login'], function () {
    return gulp.src(cssFiles.all)
        .pipe(cleanCss({
            rebase:true,
            relativeTo:'app/img',
            target:'app/build'
        }))
        .pipe(concat('all.min.css'))
        .pipe(gulp.dest('app/build'));
});
//缓存html的模板页面
gulp.task('build-template-html',function () {
    var options = {
        removeComments: true,  //清除HTML注释
        collapseWhitespace: true  //压缩HTML
    };
    console.log('./app/template.tpl.js');
    return gulp.src(tplFiles)
        .pipe(htmlMin(options))
        .pipe(ngHtml2js({
            moduleName: 'myApp'
        }))
        .pipe(concat('template.tpl.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app'));
});

//压缩html主要页面
gulp.task('build-all-html',function () {
    var options = {
        removeComments: true,  //清除HTML注释
        collapseWhitespace: true  //压缩HTML
    };
    return gulp.src(['server/view/*.html'])
        .pipe(htmlMin(options))
        .pipe(gulp.dest('server/views'));
});