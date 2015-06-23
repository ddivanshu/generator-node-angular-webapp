/**
 * Abstraction layer over log4js module. Use to get the default logger or category specific logger.
 */

'use strict'

var log4j = require('log4js')

module.exports = {

	/**
	 * Returns the default logger for the services module.
	 */
	getLogger: function() {

		var logger = this.getLoggerForCategory('svc')
		this._createShortHandFunctions(logger)
		return logger
	},

	/**
	 * Use this method if a category specific logger is desired.
	 */
	getLoggerForCategory: function(categoryName) {
		return log4j.getLogger(categoryName)
	},

	/**
	 * Creates a short-hand for the 'isDebugEnabled' function name. Facilitates usage in the code.
	 */
	_createShortHandFunctions: function(logger) {

		if (!logger.ide) logger.ide = logger.isDebugEnabled
	}
}
