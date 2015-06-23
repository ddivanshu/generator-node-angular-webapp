/**
 * App/controller for the management view.
 */

'use strict'

angular
.module('management_app', [
	'token_service'
])

.config(['$routeProvider', 
	function($routeProvider) {

		$routeProvider
			.when('/management', {
				templateUrl: 'views/management-layout.html',
				resolve: {
					okToLoadMgmtView: okToLoadMgmtView
				}
			})
	}])

.controller('Management_Controller', Management_Controller)


function Management_Controller($scope) {

	$scope.template = {
		header: 'views/header.html'
	}
}
Management_Controller.$inject = ['$scope']


// Resolve function for /management route
var okToLoadMgmtView = function($rootScope, $q, $http, $location, $tokenService) {

	// Initialize a new promise
	var deferred = $q.defer()

	if ($rootScope.userLoggedIn && $rootScope.isAdmin) {
		// Resolve right-away
		deferred.resolve();
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
					deferred.resolve();

					if (data.user.role == 'Admin') {
						$rootScope.isAdmin = true
					}
					else {
						$rootScope.isCSR = true
						$location.url('/workspace')
					}
				}
				else {
					deferred.reject()
					$location.url('/login')
				}
			})
		}
		else {
			deferred.reject()
			$location.url('/login')
		}
	}

	return deferred.promise
}
okToLoadMgmtView.$inject = ['$rootScope', '$q', '$http', '$location', '$tokenService']
