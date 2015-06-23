/**
 * MEAN service module.
 */

'use strict'

var db = require('./lib/db')

var sfwk = exports

sfwk.init = function(dbConfig, callback) {

	db.connect(dbConfig, callback)
}

sfwk.teardown = function(callback) {

	db.disconnect(callback)
}

sfwk.factory = function() {

	if (sfwk._factoryInst) {
		return sfwk._factoryInst
	}

	var fn = function getService (serviceName) {

		if (serviceName == sfwk.enums.Auth_Service) {
			return require('./services/auth-service')  // Note, require caches the object, so only one instance is returned
		}
		else if (serviceName == sfwk.enums.Account_Service) {
			return require('./services/account-service')
		}
		else {
			throw new Error('No service found for name, %s', serviceName)
		}
	}

	sfwk._factoryInst = {
		getService: fn
	}

	return sfwk._factoryInst
}

// ==========================

// Load library classes

sfwk.ServiceError = require('./lib/service-error').ServiceError
sfwk.enums = require('./lib/enums')

// Test related (used by E2E server start script)
sfwk.goldenTestDataSeeder = require('./test/seeder')
