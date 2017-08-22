module.exports = function (config) {
    var browser = process.env.KARMA_BROWSER || 'Chrome';

    config.set({
        basePath: '../',
        frameworks: ['jasmine'],
        files: [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'src/**/*.js',
            'test/unit/**/*.coffee'
        ],

        preprocessors: {
            // 'src/**/*.js': 'coverage',
            'test/unit/**/*.coffee': ['coffee']
            //'src/**/*.html': ['ng-html2js']
        },
        /*coverageReporter: {
            type: 'html',
            dir: 'test/unit/coverage/'
        },
        ngHtml2JsPreprocessor: {
            // create only a single module that contains templates, to them all with module('templates')
            moduleName: 'templatesKarma'
        },*/
        exclude: [],
        //reporters: ['spec', 'coverage'],
        port: 9997,
        runnerPort: 9100,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: [browser],
        captureTimeout: 10000,
        singleRun: true,
        plugins: [
/*            'karma-mocha',
            'karma-chai',
            'karma-sinon-chai',
            'karma-spec-reporter',
            'karma-coverage',
*/
            'karma-jasmine',
            'karma-coffee-preprocessor',
            'karma-chrome-launcher'
/*
            'karma-phantomjs-launcher',
            'karma-firefox-launcher',
            'karma-ng-html2js-preprocessor'*/
        ]
    });
};
