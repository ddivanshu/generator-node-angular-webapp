/**
 * The main app module.
 */

'use strict'

angular
.module('App', [
	'ngRoute',
	'pascalprecht.translate',

	'utilities',
	'token_service',

	'header_app',
	'login_app',
	'management_app',
	'workspace_app'
])

// Router for '/login' and '/' endpoints, as well as a catch-all for other url patterns
.config(['$routeProvider',
	function($routeProvider) {

		$routeProvider
			.when('/', {
				resolve: {
					redirectToPartial: redirectToPartial
				}
			})

			.when('/login', {
				templateUrl: 'views/login.html',
			})

			.otherwise({
				redirectTo: '/login'
			})
	}])

// Interceptor for inserting access token header into requests and handling API error responses
.config(['$httpProvider',
	function($httpProvider) {

		$httpProvider.interceptors.push(['$q', '$rootScope', '$location', '$utils',
			function($q, $rootScope, $location, $utils) {

				return {

					request: function(request) {

						// Add auth token header for requests that hit API endpoints which validate tokens
						if (request.url.match(/^\/api/) && !request.url.match(/^\/api\/tokens/)) {

							var accessToken = localStorage.getItem('accessToken')
							if (accessToken) {
								request.headers['authorization'] = 'Bearer ' + accessToken
							}
						}

						return request
					},

					responseError: function(response) {

						if (response.data) {
							if (response.data.error) { // API error
								$rootScope.$broadcast('SHOW_ALERT', response.status + ' - ' + response.data.error.type + 
																			': ' + response.data.error.message, 'error')
							}
							else {
								$rootScope.$broadcast('SHOW_ALERT', response.status + ' - ' + response.statusText, 'error')
							}
						}
						else {
							$utils.showAlert('no_response_from_server_msg', 'error')
						}

						return $q.reject(response)
					}
				}
			}])
	}])

// Translation support
.config(['$translateProvider', '$translatePartialLoaderProvider',
	function($translateProvider, $translatePartialLoaderProvider) {

		$translateProvider.useLoader('$translatePartialLoader', {
			urlTemplate: '/locale/{lang}/{part}.json'
		})

		$translateProvider.preferredLanguage('en')
	}])

// Load 'common' translation file
.run(['$translatePartialLoader', '$translate',
	function($translatePartialLoader, $translate) {

		// Load the translation file asynchronously
		$translatePartialLoader.addPart('common')
		$translate.refresh();
	}])


var redirectToPartial = function($rootScope, $q, $http, $location, $tokenService) {

	// Initialize a new promise
	var deferred = $q.defer()

	if ($rootScope.userLoggedIn) {

		if ($rootScope.isAdmin) {
			$location.url('/management')
		}
		else if ($rootScope.isCSR) {
			$location.url('/workspace')
		}
		else {
			$location('/login')
		}
	}
	else {
		// If we hold a token, validate it and get user role
		var token = localStorage.getItem('accessToken')
		if (token) {
			$tokenService.validate({
				token: token
			},
			function validateTokenSuccessCB(data) {

				if (data.success === true) {

					$rootScope.userLoggedIn = true

					if (data.user.role == 'Admin') {
						$rootScope.isAdmin = true
						$location.url('/management')
					}
					else {
						$rootScope.isCSR = true
						$location.url('/workspace')
					}
				}
				else {
					$location.url('/login')
				}
			})
		}
		else {
			$location.url('/login')
		}
	}

	deferred.reject()

	return deferred.promise
}
redirectToPartial.$inject = ['$rootScope', '$q', '$http', '$location', '$tokenService']
