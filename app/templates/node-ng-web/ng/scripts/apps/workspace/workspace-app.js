/**
 * App/controller for the workspace view.
 */

'use strict'

angular
.module('workspace_app', [
	'token_service'
])

.config(['$routeProvider', 
	function($routeProvider) {

		$routeProvider
			.when('/workspace', {
				templateUrl: 'views/workspace-layout.html',
				resolve: {
					okToLoadWrkspcView: okToLoadWrkspcView
				}
			})
	}])

.controller('Workspace_Controller', Workspace_Controller)


function Workspace_Controller($scope) {

	$scope.template = {
		header: 'views/header.html'
	}
}
Workspace_Controller.$inject = ['$scope']


// Resolve function for /workspace route
var okToLoadWrkspcView = function($rootScope, $q, $http, $location, $tokenService) {

	// Initialize a new promise
	var deferred = $q.defer()

	if ($rootScope.userLoggedIn && $rootScope.isCSR) {
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

					if (data.user.role == 'CSR') {
						$rootScope.isCSR= true
					}
					else {
						$rootScope.isAdmin = true
						$location.url('/management')
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
okToLoadWrkspcView.$inject = ['$rootScope', '$q', '$http', '$location', '$tokenService']
