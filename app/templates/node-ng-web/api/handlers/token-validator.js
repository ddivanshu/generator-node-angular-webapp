/**
 * Middleware to validate a token prior to allowing access to API endpoint resource.
 */

'use strict'

var logger = require('../../lib/logging').getAPILogger(),
	sfwk = require('node-ng-service'),
	AuthService = sfwk.factory().getService(sfwk.enums.Auth_Service),
	APIError = require('../lib/api-error')


module.exports = function(req, res, next) {

	if (logger.ide()) logger.debug("Going to validate token ..")

	if (req.headers && req.headers.authorization) {

		var parts = req.headers.authorization.split(' ') // Authorization: Bearer q387469812374691
		if (parts.length === 2) {

			AuthService.checkToken(parts[1], function(svcErr, user) {

				if (svcErr) {
					if (logger.ide()) logger.debug("Token not validated.")
					next(svcErr)
				}
				else {
						if (logger.ide()) logger.debug("Token validated for user '%s'", user.username)

					req.user = user
					next()
				}
			})
		}
		else {
			next(new APIError(sfwk.enums.Validation_Error, 'Token not found in request header.'))
		}
	}
	else {
		next(new APIError(sfwk.enums.Validation_Error, 'Token not found in request header.'))
	}
}