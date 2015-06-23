'use strict'

exports.config = {
  
  allScriptsTimeout: 10000, // default is 11 secs
 
  // Test directly against Chrome and Firefox without using a Selenium Server
  directConnect: true,

  // Use to connect to a running instance of a standalone Selenium Server
  //seleniumAddress: 'http://localhost:4444/wd/hub',
 
  // The location of the standalone Selenium Server .jar file with which to launch the server.
  //seleniumServerJar: '../node_modules/protractor/selenium/selenium-server-standalone-2.45.0.jar',
  
  // The port to use to start the standalone Selenium Server. If not specified, defaults to 4444.
  //seleniumPort: 4444,
  
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
 
  baseUrl: 'http://localhost:8080/',
 
  framework: 'jasmine2',
 
  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['*.js'],
 
  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 15000, // default is 30 secs
    isVerbose : true,
    includeStackTrace : true
  }
}