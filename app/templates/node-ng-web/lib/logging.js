/**
 * Abstraction layer over log4js module. Use to get the default logger for the application or category specific logger.
 */

'use strict'

var log4js = require('log4js')

module.exports = {

	getAPILogger: function() {
		return this._getAppLogger('api')
	},

	getSystemLogger: function() {
		return this._getAppLogger('sys')
	},

	/**
	 * Use this method if a category specific logger is desired.
	 */
	getLoggerForCategory: function(categoryName) {
		return log4js.getLogger(categoryName)
	},

	/**
	 * Returns the configured logger for the application category. Pass-thru short-hand method "ide" is set on the default 
	 * logger for "isDebugEnabled".
	 */
	_getAppLogger: function(category) {

		var logger = this.getLoggerForCategory(category)
		this._createShortHandFunctions(logger)
		return logger;
	},

	_createShortHandFunctions: function(logger) {

		if (!logger.ide) logger.ide = logger.isDebugEnabled
	}
}
