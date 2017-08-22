exports.config = {
    baseUrl: 'http://localhost:8002/examples',
    seleniumServerJar: '../node_modules/protractor/selenium/selenium-server-standalone-2.44.0.jar',
    specs: ['**/*.coffee'],
    framework: 'jasmine',
    capabilities: {
        'browserName': 'chrome'
    },
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};