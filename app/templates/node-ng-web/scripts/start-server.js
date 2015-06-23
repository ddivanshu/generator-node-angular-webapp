#!/usr/bin/env node

/**
 * Launches the web server.
 */

'use strict'

var logger = require('../lib/logging').getSystemLogger()

var e2eTestingMode = false
if (process.argv.length > 2 && process.argv[2] == 'e2e') {
	e2eTestingMode = true
}

// ============ Load application and start server ============== //

var http = require('http'),
	agent = require('webkit-devtools-agent')


logger.info("Starting server ..")

var dbConfig
if ( !e2eTestingMode ) {

	dbConfig = _createDbConfig(process.env.db_host, process.env.db_port, process.env.db_name)
}
else {
	dbConfig = _createDbConfig(process.env.test_db_host, process.env.test_db_port, process.env.test_e2e_db_name)
}


logger.info("Loading application ..")

var app = require('../app')

app().init(dbConfig, function(err, expressApp) {

	if (err) {
		logger.error(err.stack)
		logger.error("Error connecting to db; ending Node process.")

		exit()
	}
	else {

		if (e2eTestingMode) {
			 // First seed test data before launching server
			require('node-ng-service').goldenTestDataSeeder.seed(function(err) {

				if (err) {
					logger.error("Failed to seed golden test data.")
					logger.error(err.stack)

					exit()
				}
				else {
					// Launch server
					_launchServer(expressApp)					
				}
			})
		}
		else {

			// Launch server
			_launchServer(expressApp)
		}
	}
})

// Used in fatal-error-handler.js
global.Node_Server = null

function _launchServer(expressApp) {

	global.Node_Server = http.createServer(expressApp)
	global.Node_Server.listen(expressApp.get('port'), function() {
	    logger.info('Server up at http://localhost:' + expressApp.get('port'))
	})
}

function _createDbConfig(db_host, db_port, db_name) {

	var dbConfig = {
		database: db_name,
	}
	if (db_host) dbConfig.host = db_host
	if (db_port) dbConfig.port = db_port

	return dbConfig
}

function exit() {

	// Allow log events to be processed before exiting process
	setTimeout(function() {
		process.exit()
	}, 100)
}

//============= Graceful shutdown on Ctrl-C ================ //

//Ctrl-C
process.on('SIGINT', function() {
	_shutdown()
})

function _shutdown() {

	logger.info("Bringing down server ..")

	// Allow the event loop to be cleared (possibly because of other pending requests) before dying
	setTimeout(function() {

		logger.info("Bye-bye!")
		process.exit()

	}, 2000)

    // Stop taking new requests.
	if (global.Node_Server) global.Node_Server.close()

	logger.info("Closing db connection ..")

	require('node-ng-service').teardown(function(err) {

		if (err) {
			logger.error(err.stack)
			logger.error("Failed to close db connection.")
		}
		else {
			logger.info("Closed db connection.")
		}
	})
}

//=========== Means to activate devtools agent for profiling ============ //
//To start agent, first find process id of node process (pgrep -l node), then issue, kill -SIGUSR2 <process id>
//Open web interface at http://c4milo.github.io/node-webkit-agent/26.0.1410.65/inspector.html?host=localhost:9999&page=0 (for node 0.10)

process.on('SIGUSR2', function () {
	if (agent.server) {
		logger.info("Stopping devtools agent..")
		agent.stop()
	}
	else {
		logger.info("Starting devtools agent..")

		agent.start({
			port: 9999,
			bind_to: '0.0.0.0',
			ipc_port: 3333,
			verbose: true
		})
	}
})
