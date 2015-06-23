/**
 * Provides an abstraction layer over the mongodb client.
 */

'use strict'

var MongoClient = require('mongodb').MongoClient,
	logger = require('./logging').getLogger()

module.exports = {

	/**
	 * @param dbConfig	{host, port, database, user, password}
	 * @param callback	function(err, db) {}	db is the mongo 'db' object
	 */
	connect: function(config, callback) {

		if (this._db) {
			callback(new Error('Already connected to database.'))
			return
		}

		var host = config.host || 'localhost'
		var port = config.port || 27017
		var database = config.database
		var user = config.user || undefined
		var password = config.password || undefined

		var url = []
		if (user) {
			url.push('mongodb://', user, ':', password, '@', host, ':', port, '/', database)
		}
		else {
			url.push('mongodb://', host, ':', port, '/', database)
		}
		url = url.join('')

		if (logger.ide()) {
			var displayUrl = 'mongodb://****:****@' + host + ':' + port + '/' + database
			logger.debug("Connecting to db using url: %s", displayUrl)
		}

		var self = this
		MongoClient.connect(url, function(err, db) {

			if (err) callback(err)
			else {
				self._db = db
				callback(null, db)
			}
		})
	},

	/**
	 * @param callback	function(err) {}
	 */
	disconnect: function(callback) {

		var self = this
		if (self._db) {
			self._db.close(function(err) {

				if (err) callback(err)
				else {
					self._db = null
					callback(null)
				}
			})
		}
	},

	/**
	 * Pass-through method to get collection from mongodb driver.
	 */
	collection: function(name, options, callback) {
		return this._db.collection(name, options, callback)
	},

	/**
	 * Test if journaled write concern must be enabled. Implementation returns true if this is a production environment.
	 */
	enableJournaling: function() {
		return process.env.environment == 'prod'
	},

	_db: null
}
