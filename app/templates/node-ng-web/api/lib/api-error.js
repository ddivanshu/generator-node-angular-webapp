/**
 * Error wrapper for API specific error use-cases. Inherits from ServiceError; while there is no need for such an inheritance,
 * doing so simplifies the error handling logic.
 */

'use strict'

var sfwk = require('node-ng-service')

function APIError(name, err, moreInfo) {

	sfwk.ServiceError.call(this, name, err, moreInfo)
}

APIError.prototype = Object.create(sfwk.ServiceError.prototype)
APIError.prototype.constructor = APIError

module.exports = APIError
