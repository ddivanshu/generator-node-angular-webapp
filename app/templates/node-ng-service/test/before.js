/**
 * Global "before" pre-hook to create db connection, initialize service framework and seed golden test data.
 */

'use strict'

var logger = require('../lib/logging').getLogger()

before(function(done) {

	logger.info("Initializing service framework ..")

	var dbConfig = {
		host: process.env.test_db_host,
		port: process.env.test_db_port,
		database: process.env.test_ut_db_name,
		user: process.env.test_db_user,
		password: process.env.test_db_pswd
	}

	var sfwk = require('../index')
	sfwk.init(dbConfig, function(err) {

		if (err) {
			logger.error("Error connecting to db.")
			logger.error(err.stack)

			done(err)
		}
		else {
			logger.info("Connected to db.")

			// Seed golden test data
			var seeder = require('./seeder')
			seeder.seed(done)
		}
	})
})
