/**
 * Tests for AuthService methods. Note, no test for auto-expiry of token.
 */

'use strict'

require('./before')

var expect = require('chai').expect,
	async = require('async')

var db = require('../lib/db'),
	sfwk = require('../index'),
	account_service = sfwk.factory().getService(sfwk.enums.Account_Service),
	auth_service = sfwk.factory().getService(sfwk.enums.Auth_Service),
	user_schema = require('../schemas/user.json')


describe("test-auth-service", function() {

	var USERNAME, PASSWORD
	var _ID

	before(function(done) {

		USERNAME = 'testuser',
		PASSWORD = 'test123'

		var props = {
			username: USERNAME,
			password: PASSWORD,
			email: 'me@my.com',
			role: sfwk.enums.Admin_Role
		};

		account_service.createUser(props, function(err, insertedId) {
			if (err) done(err)
			else {
				_ID = insertedId
				done()
			}
		})
	})

	it("should authenticate with correct username/password", function(done) {

		auth_service.authenticate(USERNAME, PASSWORD, function(err, user) {
			if (err) {
				done(err)
				return
			}
			expect(user).to.exist
			expect(user._id).to.exist
			expect(user.username).to.equal(USERNAME)
			expect(user.role).to.equal(sfwk.enums.Admin_Role)
			expect(user.password).to.not.exist
			expect(user.firstName).to.not.exist

			done()
		})
	})

	it("should not authenticate with incorrect username/password", function(done) {

		auth_service.authenticate(USERNAME, 'iAmIncorrectPasswd', function(err, user) {

			expect(err).to.exist
			expect(err.name).to.equal(sfwk.enums.Unauthorized_Error)
			expect(user).to.not.exist

			done()
		})
	})

	it("should not validate fake token", function(done) {

		auth_service.checkToken('iAmFakeToken', function(err, user) {

			expect(err).to.exist
			expect(err.name).to.equal(sfwk.enums.Invalid_Token_Error)
			expect(user).to.not.exist

			done()
		})
	})

	var TOKEN, USER

	it("should manage token lifecycle", function(done) {

		async.waterfall([

 		    function(callback) {
 				auth_service.authenticate(USERNAME, PASSWORD, function(err, user) {

 					if (err) callback(err)
 					else {
	 					expect(user).to.exist
	 					USER = user
	 					callback()
 					}
 				})
 		    },
 		    function(callback) {
				// Generate token
				auth_service.generateToken(USER, function(err, token) {

					if (err) callback(err)
					else {
						expect(token).to.exist
						expect(token.length).to.be.gt(100) // a really long string

						TOKEN = token
						callback()
					}
				})
 		    },
 		    function(callback) {
				// Validate
				auth_service.checkToken(TOKEN, function(err, user) {

					if (err) callback(err)
					else {
						expect(user).to.exist
						expect(user._id).to.exist
						expect(user.username).to.equal(USERNAME)
						expect(user.role).to.equal(sfwk.enums.Admin_Role)
						expect(user.password).to.not.exist

						callback()
					}
				})
 		    },
 		    function(callback) {
 				// Expire
 				auth_service.expireToken(TOKEN, function(err, expiredCount) {

 					if (err) callback(err)
 					else {
	 					expect(expiredCount).to.equal(1)
	 					callback()
 					}
 				})
 		    },
 		    function(callback) {
				// Expire again (nothing should happen: auto-expire use-case)
				auth_service.expireToken(TOKEN, function(err, expiredCount) {

					if (err) callback(err)
					else {
						expect(expiredCount).to.equal(0)
						callback()
					}
				})
 		    },
 		    function(callback) {
				// Attempt to validate expired token
				auth_service.checkToken(TOKEN, function(err, user) {

					expect(err).to.exist
					expect(err.name).to.equal(sfwk.enums.Token_Expired_Error)

					callback()
				})
 		    }

 		], function(err) {
 			done(err)
 		})
	})

	after(function(done) {
    	// Cleanup
    	var collection = db.collection(user_schema.collection)
    	collection.deleteOne({_id: _ID}, function(err) {
    		done(err)
    	})
	})
})

require('./after')