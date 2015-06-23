/**
 * Modular form of our Express based application.
 */

'use strict'

var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
	unless = require('express-unless')

var apiRoutes = require('./api/routes'),
    fatalErrorHandler = require('./api/handlers/fatal-error-handler')

var sfwk = require('node-ng-service'),
	logger = require('./lib/logging').getSystemLogger()


/*
 * @options		{
 * 				  handleFatalErrors: true <default> (in test-mode, we set this to false, to prevent shutting down server if assert error is raised by a test)
 * 				}
 * @callback	function(err, expressApp) {..}
 */
module.exports = function(options) {

	var app = express()
	_configure(app)
	_loadMiddleware(app, options)

	return {
		init: function(dbConfig, callback) {

			logger.info("Connecting to db ..")

			sfwk.init(dbConfig, function(err) {

				if (err) {
					logger.error("Error connecting to db.")

					callback(err, app)
				}
				else {
					logger.info("Connected to db.")

					callback(undefined, app)
				}
			})
		}
	}
}

function _configure(app) {

	app.set('port', process.env.port)
}

function _loadMiddleware(app, options) {

	logger.info("Loading middleware ..")

	app.use(express.static('./ng'))

	app.use(bodyParser.json()) // parse 'application/json'
	app.use(bodyParser.urlencoded({extended: true})) // parse 'x-www-form-urlencoded'; use 'qs' querystring parser
	app.use(methodOverride()) // simulate DELETE and PUT in POST request using _method param

	var cpMiddleware = cookieParser()
	cpMiddleware.unless = unless
	app.use(cpMiddleware.unless({path: '/api'})) // we use tokens for /api calls, not cookies

	// Add domain to handle uncaught exceptions
	var handleFatalErrors = true
	if (options && 'boolean' == typeof options.handleFatalErrors) {
		handleFatalErrors = options.handleFatalErrors
	}
	if (handleFatalErrors) {
		app.use(fatalErrorHandler())
	}

	// initialize application routes
	apiRoutes.init(app)
}
