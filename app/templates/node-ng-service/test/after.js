/**
 * Global "after" post-hook to close db connection and tear-down service framework.
 */

'use strict'

var logger = require('../lib/logging').getLogger()

after(function(done) {

	logger.info("Closing db connection ..")

	var sfwk = require('../index')
	sfwk.teardown(function(err) {

		if (err) {
			logger.error("Failed to close db connection.")
			logger.error(err.stack)

			done(err)
		}
		else {
			logger.info("Closed db connection.")
			logger.info("Done.")

			done()
		}
	})
})