/**
 * Tests for AccountService methods.
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


describe("test-account-service", function() {

	var USERNAME, PASSWORD

	before(function() {

		USERNAME = 'testuser'
		PASSWORD = 'test123'
	})


	it("should create a user and retrieve it", function(done) {

		var dto = {
			username: USERNAME,
			password: PASSWORD,
			email: 'me@my.com',
			role: sfwk.enums.Admin_Role,
			firstName: 'First',
			lastName: 'Last'
		}
		var _ID

		async.waterfall([

		    function(callback) {
		    	account_service.createUser(dto, function(err, insertedId) {

		    		if (err) callback(err) // stop
		    		else {
			    		_ID = insertedId
			    		callback() // next
		    		}
		    	})
		    },
		    function(callback) {
		    	// Find by ID
		    	account_service.findUserById(_ID, function(err, user) {

		    		if (err) callback(err)
		    		else {
			    		expect(user).to.exist.and.have.property('_id')
		    			expect(user.username).to.equal(dto.username)
		    			expect(user).to.not.have.property('password')
		    			callback()
		    		}
		    	})
		    },
		    function(callback) {
		    	// Lean test
	    		account_service.findUser(dto.username, function(err, user) {

	    			if (err) callback(err)
	    			else {
		    			expect(user).to.exist.and.have.property('_id')
		    			expect(user.username).to.equal(dto.username)
		    			expect(user.role).to.equal(dto.role)
		    			expect(user).to.not.have.property('firstName')
		    			expect(user).to.not.have.property('lastName')
		    			expect(user).to.not.have.property('password')
		    			expect(user).to.not.have.property('email')

		    			callback()
	    			}
	    		})
		    },
		    function(callback) {
		    	// Fat test
	    		account_service.findUser(dto.username, {fat: true}, function(err, user) {

	    			if (err) callback(err)
	    			else {
		    			expect(user.username).to.equal(dto.username)
		    			expect(user).to.not.have.property('password') // Never return password
		    			expect(user.email).to.equal('me@my.com')
		    			expect(user.firstName).to.equal(dto.firstName)
		    			expect(user.lastName).to.equal(dto.lastName)

		    			callback()
	    			}
	    		})
		    },
		    function(callback) {
		    	// Cleanup
		    	var collection = db.collection(user_schema.collection)
		    	collection.deleteOne({_id: _ID}, function(err) {
		    		callback(err)
		    	})
		    }

		], function(err) {
			done(err)
		})
	})

	it("should create a user with only primary properties", function(done) {

		var props = {
			username: USERNAME,
			password: PASSWORD,
			email: 'me@my.com',
			role: sfwk.enums.Admin_Role
		}

    	account_service.createUser(props, function(err, insertedId) {

    		if (err) {
    			done(err)
    			return
    		}

    		var collection = db.collection(user_schema.collection)
    		collection.findOne({_id: insertedId}, function(err, user) {

    			if (err) done(err)
    			expect(user).to.exist.and.have.property('_id')
    			expect(user.username).to.equal(props.username)
    			expect(user.role).to.equal(props.role)
    			expect(user.firstName).to.not.exist
    			expect(user.lastName).to.not.exist

    			// Cleanup
		    	collection.deleteOne({_id: user._id}, function(err) {
		    		done(err)
		    	})
    		})
    	})
	})

	it("should not create user with non-existent role or duplicate username", function(done) {

		var props = {
			username: USERNAME,
			password: PASSWORD,
			email: 'me@my.com',
			role: 'iDoNotExist'
		}
		var _ID

		async.waterfall([

             // Non-existent role
		    function(callback) {
				account_service.createUser(props, function(err) {

					expect(err).to.exist
					expect(err.name).to.equal(sfwk.enums.Validation_Error)
		    		callback()
		    	})
		    },
		    function(callback) {
		    	// Add a simple user to test duplicate username in next test
	    		var collection = db.collection(user_schema.collection)
	    		collection.insertOne({username: props.username}, function(err, result) {

	    			if (err) callback(err)
	    			else {
		    			_ID = result.insertedId
		    			callback()
	    			}
	    		})
		    },
		    // Duplicate username
		    function(callback) {
		    	props.role = sfwk.enums.Admin_Role
				account_service.createUser(props, function(err) {

					expect(err).to.exist
					expect(err.name).to.equal(sfwk.enums.Duplicate_Name_Error)
					callback()
				})
		    },
		    // Cleanup
		    function(callback) {
		    	var collection = db.collection(user_schema.collection)
		    	collection.deleteOne({_id: _ID}, function(err) {
		    		callback(err)
		    	})
		    }

		], function(err) {
			done(err)
		})
	})

	it("should not retrieve a non-existent user", function(done) {

		account_service.findUser('iDoNotExist', function(err, user) {

			expect(err).to.exist
			expect(err.name).to.equal(sfwk.enums.Not_Found_Error)

			done()
		})
	})

	it("should change user's password only if valid old password is provided", function(done) {

		var props = {
			username: USERNAME,
			password: PASSWORD,
			email: 'me@my.com',
			role: sfwk.enums.Admin_Role
		}
		var _ID

		async.waterfall([

		    function(callback) {
		    	account_service.createUser(props, function(err, insertedId) {
	    			if (err) callback(err)
	    			else {
		    			_ID = insertedId
		    			callback()
	    			}
		    	})
		    },
		    function(callback) {
				// Incorrect old password
				var NEW_PASSWORD = 'newtest'
				account_service.changePassword(USERNAME, NEW_PASSWORD, 'iAmIncorrectOldPasswd', function(err) {

					expect(err).to.exist
					expect(err.name).to.equal(sfwk.enums.Unauthorized_Error)
					callback()
				})
		    },
		    function(callback) {
				// Correct old password
				var NEW_PASSWORD = 'newtest'
				account_service.changePassword(USERNAME, NEW_PASSWORD, PASSWORD, function(err) {
					callback(err)
				})
		    },
		    function(callback) {
				// Should fail to authenticate with old password and succeed with new password
				auth_service.authenticate(USERNAME, PASSWORD, function(err) {

					expect(err).to.exist
					expect(err.name).to.equal(sfwk.enums.Unauthorized_Error)
					callback()
				})
		    },
		    function(callback) {
				// Should authenticate with new password
				var NEW_PASSWORD = 'newtest'
				auth_service.authenticate(USERNAME, NEW_PASSWORD, function(err) {
					callback(err)
				})
		    },
		    // Cleanup
		    function(callback) {
	    		var collection = db.collection(user_schema.collection)
		    	collection.deleteOne({_id: _ID}, function(err) {
		    		callback(err)
		    	})
		    }

		], function(err) {
			done(err)
		})
	})

	it("should update user's email address", function(done) {

		var props = {
			username: USERNAME,
			password: PASSWORD,
			email: 'me@my.com',
			role: sfwk.enums.Admin_Role
		}
		var _ID

		async.waterfall([

		    function(callback) {
		    	account_service.createUser(props, function(err, insertedId) {
	    			if (err) callback(err)
	    			else {
		    			_ID = insertedId
		    			callback()
	    			}
		    	})
		    },
		    function(callback) {
				account_service.updateEmailAddress(USERNAME, 'you@your.com', PASSWORD, function(err) {
					callback(err)
				})
		    },
		    function(callback) {
				// Retreive and verify new email address
				account_service.findUser(USERNAME, {fat: true}, function(err, user) {

					if (err) callback(err)
					else {
						expect(user).to.exist
						expect(user.email).to.equal('you@your.com')
						callback()
					}
				})
		    },
		    // Cleanup
		    function(callback) {
	    		var collection = db.collection(user_schema.collection)
		    	collection.deleteOne({_id: _ID}, function(err) {
		    		callback(err)
		    	})
		    }

		], function(err) {
			done(err)
		})
	})
})

require('./after')
