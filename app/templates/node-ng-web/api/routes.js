/**
 * Mapping of API endpoints to handlers.
 */

'use strict'

var apiErrorHandler = require('./handlers/error-handler'),
	tokensHandler = require('./handlers/tokens-handler'),
	tokenValidator = require('./handlers/token-validator')

module.exports = {

	init: function(app) {

		tokenValidator.unless = require('express-unless')
		app.use('/api', tokenValidator.unless({path: /^\/api\/tokens/})) // We post to this path to create a token

		app.use('/api/tokens', tokensHandler)

		// Logs and processes errors raised in the system and creates error json response for client
		apiErrorHandler.register(app)
	}
}
