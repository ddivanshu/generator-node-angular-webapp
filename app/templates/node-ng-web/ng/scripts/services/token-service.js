/**
 * Service to manage API access tokens.
 */

'use strict'

angular
.module('token_service', [
	'ngResource'
])
.factory('$tokenService', Token_Service)


function Token_Service($resource) {

	return $resource('/api/tokens', {}, {
		generate: {method: 'POST'},
		validate: {url: '/api/tokens/validate', method: 'POST'},
		expire: {url: '/api/tokens/expire', method: 'POST'}
	})
}
Token_Service.$inject = ['$resource']
