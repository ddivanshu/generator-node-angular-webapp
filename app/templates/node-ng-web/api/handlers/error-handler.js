/**
 * Handler for logging, packaging and sending (error) JSONs for errors (typically ServiceErrors) raised by API calls.
 */

'use strict'

var logger = require('../../lib/logging').getAPILogger(),
	sfwk = require('node-ng-service'),
    ServiceError = sfwk.ServiceError

module.exports = {

	register: function(app) {

		// Log system errors
		app.use(function(err, req, res, next) {

			if ( !(err instanceof ServiceError) ) {
				logger.error(err.stack)
			}
			else if (err instanceof ServiceError && err.name == sfwk.enums.System_Error) {
				if (err.inner) {
					logger.error(err.inner.stack)
				}
			}

			next(err)
		})

		// Return error JSON response to client
		app.use(function(err, req, res, next) {

			var httpCode, errorType, moreInfo

			if (err instanceof ServiceError) {

				switch (err.name) {

					case sfwk.enums.Validation_Error:
						httpCode = 400 // bad request
						break
					case sfwk.enums.Unauthorized_Error:
					case sfwk.enums.Invalid_Token_Error:
					case sfwk.enums.Token_Expired_Error:
						httpCode = 401 // unauthorized
						break
					case sfwk.enums.Not_Found_Error:
						httpCode = 404 // not found
						break
					case sfwk.enums.Duplicate_Name_Error:
						httpCode = 409 // conflict
						break
					case sfwk.enums.Service_Unavailable_Error:
						httpCode = 503 //service unavailable
						break
					default:
						httpCode = 500 // internal server error
						break
				}
				errorType = err.name
				if (err.moreInfo) moreInfo = err.moreInfo

			}
			else {
				httpCode = 500
				errorType = sfwk.enums.System_Error
			}

			var payload = {
				error: {
					type: errorType,
					message: err.message
				}
			}
			if (moreInfo) payload.error.moreInfo = moreInfo

			res.status(httpCode).json(payload)
		})
	}
}
