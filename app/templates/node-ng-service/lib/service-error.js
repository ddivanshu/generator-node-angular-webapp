/**
 * Error class used by service module to package db errors or create use-case specific errors.
 */

'use strict'

var enums = require('./enums'),
	logger = require('./logging').getLogger()


// Constructor
function ServiceError(name, errOrMsg, moreInfo) {

	Error.call(this)
    Error.captureStackTrace(this, this.constructor)

    this.name = name
    if (errOrMsg) {
    	if (errOrMsg instanceof Error) {
	    	this.message = errOrMsg.message
	    	this.inner = errOrMsg
    	}
    	else if (typeof errOrMsg === 'string') {
    		this.message = errOrMsg
    	}
    	else {
    		this.moreInfo = errOrMsg
    	}
    }
    if (moreInfo) this.moreInfo = moreInfo
}

ServiceError.prototype = Object.create(Error.prototype)
ServiceError.prototype.constructor = ServiceError

module.exports.ServiceError = ServiceError

// ==================== Utility Methods ======================== //

module.exports.create = function(mongoError) {

	var retval
	if (mongoError.code === 11000 || mongoError.code === 11001) {

		if (logger.ide()) logger.debug("Duplicate error generated: '%s'.", mongoError.message)

		retval = new ServiceError(enums.Duplicate_Name_Error, mongoError)
	}
	else {
		retval = new ServiceError(enums.System_Error, mongoError)
	}

	return retval
}
