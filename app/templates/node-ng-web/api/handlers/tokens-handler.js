/**
 * Router for generating, validating and expiring access tokens on the '/api/tokens' endpoint.
 */

'use strict'

var router = require('express').Router(),
	logger = require('../../lib/logging').getAPILogger(),
	sfwk = require('node-ng-service'),
	AuthService = sfwk.factory().getService(sfwk.enums.Auth_Service),
	APIError = require('../lib/api-error')

module.exports = router


// =============================================================================================

router.post('/', validatePostBody, authenticate, generateToken, sendToken)

function validatePostBody(req, res, next) {

	if (!req.body.username || !req.body.password) {
		next(new APIError(sfwk.enums.Validation_Error, {'cause': 'Missing credentials'}))
		return
	}

	next()
}

function authenticate(req, res, next) {

	if (logger.ide()) logger.debug("Authenticating user '%s'..", req.body.username)

	AuthService.authenticate(req.body.username, req.body.password, function authenticateCB(svcErr, user) {

		if (svcErr) {

			if (logger.ide() && svcErr.name == sfwk.enums.Unauthorized_Error) {
				logger.debug("User '%s' was not authenticated.", req.body.username)
			}

			next(svcErr)
			return
		}

		if (logger.ide()) logger.debug("User authenticated.")

		req.user = user
		next()
	})
}

function generateToken(req, res, next) {

	if (logger.ide()) logger.debug("Generating token..")

	AuthService.generateToken(req.user, function generateTokenCB(svcErr, token) {

		if (svcErr) {
			next(svcErr)
			return
		}

		if (logger.ide()) logger.debug("Generated token.")

		req.token = token
		next()
	})
}

function sendToken(req, res) {

	if (logger.ide()) logger.debug("Sending token in response..")

	var payload = {
		token: req.token
	}
	res.status(200).json(payload)
}

//=============================================================================================

router.post('/validate', function validateToken(req, res, next) {

	if (req.body.token && typeof req.body.token == 'string') {

		if (logger.ide()) logger.debug("Going to invoke AuthService#checkToken method ..")

		AuthService.checkToken(req.body.token, function checkTokenCB(svcErr, user) {

			if (svcErr) {

				if (svcErr.name == sfwk.enums.Token_Expired_Error) {

					if (logger.ide()) logger.debug("Token has expired.")

					res.status(200).json({success: false})					
				}
				else {
					if (logger.ide()) logger.debug("AuthService#checkToken returned error, '%s'.", svcErr.name)

					next(svcErr)
				}

				return
			}

			if (logger.ide()) logger.debug("Token validated.")

			var payload = {
				success: true,
				user: user
			}

			res.status(200).json(payload)
		})
	}
	else {
		logger.warn("Attempt to validate illegal token: %s", req.body.token)

		next(new APIError(sfwk.enums.Validation_Error, "Token is invalid."))
	}
})

//=============================================================================================

router.post('/expire', function expireToken(req, res, next) {

	if (req.body.token && typeof req.body.token == 'string') {

		if (logger.ide()) logger.debug("Going to invoke AuthService#expireToken method ..")

		// Expire token
		AuthService.expireToken(req.body.token, function expireTokenCB(svcErr) {

			if (svcErr) {

				if (logger.ide()) logger.debug("AuthService#expireToken returned error, '%s'.", svcErr.name)

				next(svcErr)
				return
			}

			if (logger.ide()) logger.debug("Token expired.")

			res.status(200).json({success: true})
		})
	}
	else {
		logger.warn("Attempt to expire illegal token: %s", req.body.token)

		next(new APIError(sfwk.enums.Validation_Error, "Token is invalid."))
	}
})
