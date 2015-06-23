/**
 * Domain to handle any uncaught errors thrown when a request is executed. Handles both asynchronous errors (as expected)
 * and synchronous errors (achieved by commenting out try/catch block in node_modules/express/lib/router/layer.js, in
 * function Layer.prototype.handle_request. We shutdown our server as Node is a single thread process and an uncaught
 * exception may have left it in an inconsistent state.
 */

'use strict'

var domain = require('domain'),
	logger = require('../../lib/logging').getSystemLogger(),
	sfwk = require('node-ng-service')

module.exports = function () {

	return function(req, res, next) {

		var d = domain.create()
		d.add(req)
		d.add(res)

		res.on('finish', function () {
			//d.dispose(); // deprecated; do not use, causes unexpected bad things!
			d.remove(req)
			d.remove(res)
		})

		d.on('error', function (err) {

			logger.error(err.stack)
			logger.error("Caught fatal exception; bringing down server ..")

			// Allow the event loop to be cleared (possibly because of other pending requests) before dying
			var killtimer = setTimeout(function() {

				logger.info("Bye-bye!")
				process.exit(1)

			}, 2000)

	        // Stop taking new requests.
			if (global.Node_Server) global.Node_Server.close()

	        // Send an error to the request that triggered the problem
			//_sendErrorResponse(req, res); Commenting out; causing weird error

			logger.info("Closing db connection..")

			sfwk.teardown(function(err) {

				if (err) {
					logger.error(err.stack)
					logger.error("Failed to close db connection.")
				}
				else {
					logger.info("Closed db connection.")
				}
			})
		})

		// Note, this is short for d.enter(); next(); d.exit(); [d.enter() makes d current domain. d.exit() deactivates it]
		d.run(next)
	}

	function _sendErrorResponse(req, res) {

		var bundle = require('../resource-bundle')

        if (req.headers.accept && req.headers.accept.indexOf('html') > -1) {

        	res.setHeader('content-type', 'text/plain')
        	res.status(500).send(bundle.common.system_error_msg)
        }
        else {
        	res.setHeader('content-type', 'application/json')
			var payload = {
				error: {
					type: sfwk.enums.System_Error
					,message: bundle.common.system_error_msg
				}
			}

			res.status(500).json(payload)
        }
	}
}
