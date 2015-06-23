/**
 * App/controller for the login view.
 */

'use strict'

angular
.module('login_app', [
	'pascalprecht.translate',

	'utilities',
	'token_service'
])

.controller('Login_Controller', Login_Controller)


function Login_Controller($scope, $http, $rootScope, $location, $translatePartialLoader, $translate, $utils, $tokenService) {

	$scope.template = {
		header: 'views/header.html'
	}

	// Load the translation file asynchronously
	$translatePartialLoader.addPart('login')
	$translate.refresh();

	$scope.login = {

		postCredentials: function() {

			// Validation
			if (!$scope.login.username || !$scope.login.password) {

				$utils.showAlert('must_provide_creds_msg', 'error')
				return
			}

			// Post credentials
			$tokenService.generate({
				username: $scope.login.username,
				password: $scope.login.password
			},
			function generateTokenSuccessCB(data) {

				$scope.login._postLoginSetup(data.token)
			})
		},

		_postLoginSetup: function(token) {

			localStorage.setItem('accessToken', token)
			$rootScope.userLoggedIn = true

			// Get role from server, so we can decide which view to show
			$tokenService.validate({
				token: token
			},
			function validateTokenSuccessCB(data) {

				if (data.success === true) {
					if (data.user.role == 'Admin') {
						$rootScope.isAdmin = true
						$location.url('/management')
					}
					else {
						$rootScope.isCSR = true
						$location.url('/workspace')
					}
				}
				else { // Shouldn't happen
					$utils.showAlert('valid_token_not_generated_msg', 'error')
				}
			})
		}
	}
}
Login_Controller.$inject = ['$scope', '$http', '$rootScope', '$location', '$translatePartialLoader', '$translate', '$utils', '$tokenService']
