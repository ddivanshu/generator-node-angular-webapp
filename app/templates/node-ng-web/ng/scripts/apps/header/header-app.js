/**
 * App/controller for the header section.
 */

'use strict'

angular
.module('header_app', [
	'utilities',
	'token_service'
])
.controller('Header_Controller', Header_Controller)


function Header_Controller($scope, $rootScope, $http, $location, $interval, $utils, $tokenService) {

	// Alerts ------------------------------------------
	$scope.alerts = {
		message: ''
	}

	var alertsListener = $scope.$on('SHOW_ALERT', function(event, msg, type) {

		$scope.alerts.message = msg
		$scope.alerts.type = (type ? type : 'info')

		// Time-bound the alert (using $interval instead of $timeout to prevent Protractor from waiting)
		if ($scope.alerts.clearPromise) {
			var success = $interval.cancel($scope.alerts.clearPromise)
		}
		$scope.alerts.clearPromise = $interval(function() {

			$scope.alerts.message = ''
		}, 5000, 1)
	})

	$scope.$on('$destroy', alertsListener)

	// Logout ------------------------------------------
	$scope.logout = {

		logout: function() {

			var accessToken = localStorage.getItem('accessToken')
			if (!accessToken) return // shouldn't happen, but..

			$tokenService.expire({
				token: accessToken
			},
			function expireTokenSuccessCB(data) {

				if (data.success === false) { // Shouldn't happen, but ..
					$utils.showAlert('unable_to_logout_msg', 'error')
					return
				}

				$scope.logout._postLogoutCleanup();

				// Redirect to login view
				$location.url('/login')
			})
		},

		_postLogoutCleanup: function() {

			localStorage.removeItem('accessToken')
			$rootScope.userLoggedIn = false

			if ($rootScope.isAdmin) delete $rootScope.isAdmin
			else if ($rootScope.isCSR) delete $rootScope.isCSR
		}
	}
}
Header_Controller.$inject = ['$scope', '$rootScope', '$http', '$location', '$interval', '$utils', '$tokenService']

