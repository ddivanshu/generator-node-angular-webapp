/**
 * Seeds golden test data into test database.
 */

'use strict'

var async = require('async')

var logger = require('../lib/logging').getLogger(),
	enums = require('../lib/enums'),
	db = require('../lib/db')

var user_schema = require('../schemas/user.json'),
	AccountService = require('../services/account-service')


exports.seed = function(done) {

	logger.info("Creating golden test data ..")

	// Ideally, golden data creation should not have dependency on service module. But being lazy here ..

	async.waterfall([

	    // Users
	    function(callback) {
	    	var collection = db.collection(user_schema.collection)
			collection.deleteMany({}, function(err) {
				callback(err)
			})
	    },
	    function(callback) {
	    	global.ADMIN_USER = 'admin'
			var primaryInfo = {
				username: global.ADMIN_USER,
				password: 'admin',
				email: 'admin@admin.com',
				role: enums.Admin_Role
			}
	    	AccountService.createUser(primaryInfo, function(err, userId) {
	    		if (err) callback(err)
	    		global.ADMIN_ID = userId
	    		callback()
	    	})
	    }

	], function(err) {
		if (err) done(err)
		else {
			logger.info("Created golden test data.")

			done()
		}
	})
}
