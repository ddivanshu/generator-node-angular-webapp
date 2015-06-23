/**
 * Service methods to do authentication.
 */

'use strict'

var async = require('async'),
	bcrypt = require('bcryptjs'),
	jwt = require('jsonwebtoken'),
	ObjectId = require('mongodb').ObjectId

var logger = require('../lib/logging').getLogger(),
	db = require('../lib/db'),
	service_error = require('../lib/service-error'),
	enums = require('../lib/enums')

var user_schema = require('../schemas/user.json'),
	tokens_log_entry_schema = require('../schemas/tokens-log-entry.json')

module.exports = {

	/**
	 * @param	callback	function(err, user<_id, username, role>) {}
	 */
	authenticate: authenticate,

	/**
	 * @param	callback	function(err, token) {}
	 */
	generateToken: generateToken,

	/**
	 * @param	callback	function(err, user<_id, username, role)) {}
	 */
	checkToken: checkToken,

	/**
	 * @param	callback	function(err, expiredCount) {}
	 */
	expireToken: expireToken
}

// =================================================================================================

function authenticate(username, password, callback) {

	if (!username || !password) {
		throw new Error("Username and/or password not provided.")
	}

	var conditions = {
		username: username,
		status: enums.Active
	}

	if (logger.ide()) logger.debug("Going to authenticate user '%s'.", username)

	// Cannot use 'findUser' service method because password must be present in the returned user object
	var collection = db.collection(user_schema.collection)
	collection.findOne(
		conditions,
		{fields: {password: 1, role: 1}},
		function authService_findUserCB(err, doc) {

			if (err) {
				callback(service_error.create(err))
				return
			}
			if (!doc) {
				callback(new service_error.ServiceError(enums.Unauthorized_Error, "Username or password incorrect."))
				return
			}

			// Verify password
			var match = bcrypt.compareSync(password, doc.password)

			if (!match) {
				callback(new service_error.ServiceError(enums.Unauthorized_Error, "Username or password incorrect."))
				return
			}

			if (logger.ide()) logger.debug("User '%s' authenticated.", username)

			var user = {
				_id: doc._id,
				username: username,
				role: doc.role
			}
			callback(null, user)
		}
	)
}

// =================================================================================================

function generateToken(user, callback) {

	if (!user._id) throw new Error("ID property not found on input.")

	if (logger.ide()) logger.debug("Creating tokens-log entry for user '%s'.", user._id)

	// First, update or insert token doc for this user with current timestamp
	var collection = db.collection(tokens_log_entry_schema.collection)
	collection.updateOne(
		{user: user._id},
		{$set: {lastUse: new Date()}},
		{j: db.enableJournaling(), upsert: true},
		function createTokensLogEntryCB(err, result) {

			if (err) {
				callback(service_error.create(err))
				return
			}

			if (logger.ide()) logger.debug("Created tokens-log entry.")

			// Next, create a signed JWT token to return.
			var token = jwt.sign({id: user._id}, process.env.jwt_secret, {noTimestamp: true})

			if (logger.ide()) logger.debug("Created token.")

			callback(null, token)
		}
	)
}

// =================================================================================================

function checkToken(token, callback) {

	async.waterfall([

		// Bind to inject 'token' into arguments list
		_verifyToken.bind(this, token),

		_touchTokensLogEntry,

		_populateAndReturnUser

	], function(svcErr, user) {
		callback(svcErr, user)
	})
}

function _verifyToken(token, callback) {

	// Verify and decode token
	jwt.verify(token, process.env.jwt_secret, function verifyTokenCB(err, decoded) {

		if (err) {
			if (err.name == 'JsonWebTokenError') {
				logger.warn("Access attempt with illegal token '%s' generated error: %s", token, err.message)

				callback(new service_error.ServiceError(enums.Invalid_Token_Error, "Token has invalid form."))
			}
			else {
				callback(service_error.create(err))
			}
			return
		}

		callback(null, decoded.id) // userId
	})
}

function _touchTokensLogEntry(userId, callback) {

	// Attempt to extend token expiry by updating entry in TokensLog collection. If entry has already expired
	// and removed, then nothing is returned and we know that token has expired (we throw token_expired error).
	var collection = db.collection(tokens_log_entry_schema.collection)
	collection.findOneAndUpdate(
		{user: new ObjectId(userId)},
		{$set: {lastUse: new Date()}},
		{j: db.enableJournaling()},
		function updateTokensLogEntryCB(err, result) {

			if (err) {
				callback(service_error.create(err))
				return
			}
			if (result.value == null) {
				callback(new service_error.ServiceError(enums.Token_Expired_Error, "Token has expired."))
				return
			}

			callback(null, userId)
		}
	)
}

function _populateAndReturnUser(userId, callback) {

	var account_service = require('./account-service') // Requiring here vs. top, to break cyclical dependency
	account_service.findUserById(userId, function authService_findUserByIdCB(svcErr, user) {

		callback(svcErr, user)
	})
}

// =================================================================================================

function expireToken(token, callback) {

	async.waterfall([

		_verifyToken.bind(this, token),

		_deleteTokensLogEntry

	], function(svcErr, user) {
		callback(svcErr, user)
	})
}

function _deleteTokensLogEntry(userId, callback) {

	// Remove token entry from TokensLog collection, if it hasn't auto-expired
	var collection = db.collection(tokens_log_entry_schema.collection)
	collection.deleteOne(
		{user: new ObjectId(userId)},
		{j: db.enableJournaling()},
		function deleteTokensLogEntryCB(err, result) {

			if (err) {
				callback(service_error.create(err))
				return
			}

			if (logger.ide()) {
				if (result.deletedCount === 0) {
					logger.debug("Either a tokens-log entry was not found for user '%s' or entry not removed.", userId)
				}
				else {
					logger.debug("Deleted tokens-log entry for user '%s'.", userId)
				}
			}

			callback(null, result.deletedCount)
		}
	)
}
