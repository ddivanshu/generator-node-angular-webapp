/**
 * Collection of utility functions.
 */

'use strict'

angular
.module('utilities', [
	'pascalprecht.translate'
])
.factory('$utils', Utils)


function Utils($rootScope, $translate) {

	return {
		/**
		 * @param  string translationId		id from locale file
		 * @param  string type 				type of the alert message (info|error|warn); default is 'info'
		 */
		showAlert: function(translationId, type) {

			$translate(translationId).then(function(errMsg) {
				$rootScope.$broadcast('SHOW_ALERT', errMsg, type ? type : 'info')
			})
		}
	}
}
Utils.$inject = ['$rootScope', '$translate']
