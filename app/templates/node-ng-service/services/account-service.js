/**
 * Service methods to perform account management.
 */

'use strict'

var async = require('async'),
	bcrypt = require('bcryptjs'),
	crypto = require('crypto'),
	_ = require('underscore'),
	ObjectId = require('mongodb').ObjectId

var logger = require('../lib/logging').getLogger(),
	db = require('../lib/db'),
	service_error = require('../lib/service-error'),
	enums = require('../lib/enums')

var user_schema = require('../schemas/user.json'),
	auth_service = require('./auth-service')

module.exports = {

	/**
	 * @param	options		{
	 *							fat: true|false (if not provided, false is assumed)
	 * 						}
	 * @param	callback	function(err, user) {}	lean object contains _id, username and role
	 */
	findUser: findUser,
	findUserById: findUserById,

	/**
	 * @param dto		{username, password, email, role, firstName(optional), lastName(optional)}
	 * @param callback	function(err, userId<ObjectId>) {}
	 */
	createUser: createUser,

	/**
	 * @param callback	function(err, modifiedCount) {}
	 */
	changePassword: changePassword,

	/**
	 * @param callback	function(err, modifiedCount) {}
	 */
	updateEmailAddress: updateEmailAddress
}

// =================================================================================================

function findUser(username, options, callback) {

	_findUser({username: username}, options, callback)
}

function findUserById(id, options, callback) {

	_findUser({_id: 'string' == typeof id ? new ObjectId(id) : id}, options, callback)
}

/**
 * @param query	{username | _id}
 */
function _findUser(query, options, callback) {

	if ('function' == typeof options) {
		callback = options
		options = null
	}

	query.status = enums.Active

	if (logger.ide()) logger.debug("Finding user using query: %s", JSON.stringify(query))

	// By default, we return lean user object (most common use-case)
	var projection = {
		username: 1, 
		role: 1
	}
	if (options && options.fat && options.fat === true) {
		projection = {
			password: 0 // exclude password
		}
	}

	var collection = db.collection(user_schema.collection)
	collection.findOne(
		query,
		{fields: projection},
		function findUserCB(err, doc) {

			if (err) {
				callback(service_error.create(err))
				return
			}
			if (!doc) {
				callback(new service_error.ServiceError(enums.Not_Found_Error, "User not found."))
				return
			}

			if (logger.ide()) logger.debug("Found user '%s'.", doc.username)

			if (doc.email) {
				// Decipher the email address
				var algo = 'aes-256-cbc'
				var secret = process.env.crypto_secret
				var decipher = crypto.createDecipher(algo, secret)
				var decryptedEmail = decipher.update(doc.email,'hex','utf8') // push text into buffer
				decryptedEmail += decipher.final('utf8') // do deciphering
				doc.email = decryptedEmail
			}

			callback(null, doc)
		}
	)
}

// =================================================================================================

function createUser(dto, callback) {

	if (!dto || !dto.username || !dto.password || !dto.email || !dto.role) {
		throw new Error("One or more required arguments not found.")
	}

	var err = _validateRole(dto, callback)
	if (err) {
		callback(err)
		return
	}

	_hashPassword(dto)

	_hashEmailAddress(dto)

	var doc = _prepareUserDocument(dto)

	_insertUserDocument(doc, callback)
}

function _validateRole(dto) {

	var enumVals = user_schema.fields.role.enum
	if (!_.contains(enumVals, dto.role)) {

		return new service_error.ServiceError(enums.Validation_Error, "Role value not supported; acceptable values are " 
														+ enumVals.toString())
	}
}

function _hashPassword(dto, callback) {

	//One-way hash the password
	var salt = bcrypt.genSaltSync(10)
	var cryptedPasswd = bcrypt.hashSync(dto.password, salt)

	dto.cryptPasswd = cryptedPasswd
}

function _hashEmailAddress(dto, callback) {

	// Symmetrically hash the email address
	var algo = 'aes-256-cbc'
	var secret = process.env.crypto_secret
	var cipher = crypto.createCipher(algo, secret)
	var cryptedEmail = cipher.update(dto.email,'utf8','hex')  // push text into buffer
	cryptedEmail += cipher.final('hex')  // do ciphering

	dto.cryptEmail = cryptedEmail
}

function _prepareUserDocument(dto, callback) {

	var currentDate = new Date()
	var doc = {
		username: dto.username,
		password: dto.cryptPasswd,
		email: dto.cryptEmail,
		role: dto.role,
		status: enums.Active,
		created: currentDate,
		modified: currentDate
	}
	if (dto.firstName) doc.firstName = dto.firstName
	if (dto.lastName) doc.lastName = dto.lastName

	return doc
}

function _insertUserDocument(doc, callback) {

	if (logger.ide()) logger.debug("Going to create user with username '%s'.", doc.username)

	var collection = db.collection(user_schema.collection)
	collection.insertOne(
		doc,
		{j: db.enableJournaling()},
		function createUserCB(err, result) {

			if (err) {
				callback(service_error.create(err))
				return
			}

			if (logger.ide()) logger.debug("Created user.")

			callback(null, result.insertedId)
		}
	)
}

// =================================================================================================

function changePassword(username, newPassword, oldPassword, callback) {

	async.waterfall([
		
		// Bind to inject 'username' and 'oldPassword' into argument list
		_authenticate.bind(this, username, oldPassword),

		_updatePassword.bind(this, {
			username: username,
			password: newPassword
		})

	], function(svcErr, modifiedCount) {
		callback(svcErr, modifiedCount)
	})
}

function _authenticate(username, password, callback) {

	auth_service.authenticate(username, password, function(svcErr) {

		if (svcErr) {
			callback(svcErr)
			return
		}

		callback(null)
	})
}

function _updatePassword(dto, callback) {

	_hashPassword(dto)

	if (logger.ide()) logger.debug("Going to update password for user '%s'.", dto.username)

	var collection = db.collection(user_schema.collection)
	var updateOps = {
		$set: {
			password: dto.cryptPasswd,
			modified: new Date()
		}
	}

	collection.updateOne(
		{username: dto.username},
		updateOps,
		{j: db.enableJournaling()},
		function updatePasswordCB(err, result) {

			if (err) {
				callback(service_error.create(err))
				return
			}

			if (logger.ide()) logger.debug("Updated password.")

			callback(null, result.modifiedCount)
		}
	)
}

// =================================================================================================

function updateEmailAddress(username, newEmail, password, callback) {

	async.waterfall([

		_authenticate.bind(this, username, password),

		_updateEmailAddress.bind(this, {
			username: username,
			email: newEmail
		})

	], function(svcErr, modifiedCount) {
		callback(svcErr, modifiedCount)
	})
}

function _updateEmailAddress(dto, callback) {

	_hashEmailAddress(dto)
	
	if (logger.ide()) logger.debug("Going to update email address for user '%s'.", dto.username)

	var collection = db.collection(user_schema.collection)
	var updateOps = {
		$set: {
			email: dto.cryptEmail,
			modified: new Date()
		}
	}

	collection.updateOne(
		{username: dto.username},
		updateOps,
		{j: db.enableJournaling()},
		function updateEmailAddressCB(err, result) {

			if (err) {
				callback(service_error.create(err))
				return
			}

			if (logger.ide()) logger.debug("Updated email address.")

			callback(null, result.modifiedCount)
		}
	)
}
