#!/usr/bin/env node

// Use to bootstrap a user in the Users collection.

var read = require('read'),
	async = require('async'),
	sfwk = require('../index')


async.waterfall([

    function(callback) {
    	read({prompt: 'Enter DB host (localhost): '}, function(err, dbHost) {
    		callback(err, !dbHost ? 'localhost' : dbHost)
    	})
    },
    function(dbHost, callback) {
    	read({prompt: 'Enter DB port (27017): '}, function(err, dbPort) {
    		callback(err, dbHost, !dbPort ? '27017' : dbPort)
    	})
    },
    function(dbHost, dbPort, callback) {
    	read({prompt: 'Enter DB name: '}, function(err, dbName) {

    		if (!err && !dbName) err = new Error("DB name must be provided.")
    		if (err) callback(err)
    		else {
    			callback(null, dbHost, dbPort, dbName)
    		}
    	})
    },
    function(dbHost, dbPort, dbName, callback) {
        read({prompt: 'Enter DB user: '}, function(err, dbUser) {

            callback(err, dbHost, dbPort, dbName, dbUser)
        })
    },
    function(dbHost, dbPort, dbName, dbUser, callback) {
        read({prompt: "Enter DB user's password: "}, function(err, dbPswd) {

            callback(err, dbHost, dbPort, dbName, dbUser, dbPswd)
        })
    },
    function(dbHost, dbPort, dbName, dbUser, dbPswd, callback) {
        read({prompt: 'Enter username: '}, function(err, username) {

            if (!err && !username) err = new Error("Username must be provided.")
            if (err) callback(err)
            else {
                callback(null, dbHost, dbPort, dbName, dbUser, dbPswd, username)
            }
        })
    },
    function(dbHost, dbPort, dbName, dbUser, dbPswd, username, callback) {
        read({prompt: 'Enter password: ', silent: true}, function(err, password) {

            if (!err && !password) err = new Error("Password must be provided.")
            if (err) callback(err)
            else {
                read({prompt: 'Confirm password: ', silent: true}, function(err, confirmedPasswd) {

                    if (!err && !confirmedPasswd) err = new Error("Password must be provided.")
                    if (!err && password != confirmedPasswd) err = new Error("Re-entered password does not match.")
                    if (err) callback(err)
                    else {
                        callback(null, dbHost, dbPort, dbName, dbUser, dbPswd, username, password)
                    }
                })
            }
        })
    },
    function(dbHost, dbPort, dbName, dbUser, dbPswd, username, password, callback) {
        read({prompt: 'Enter email address: '}, function(err, email) {

            if (!err && !email) err = new Error("Email address must be provided.")
            if (err) callback(err)
            else {
                callback(null, dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email)
            }
        })
    },
    function(dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, callback) {
        read({prompt: 'Enter role [Admin, Analyst]: '}, function(err, role) {

            if (!err && !role) err = new Error("Role must be provided.")
            if (err) callback(err)
            else {
                callback(null, dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, role)
            }
        })
    },
    function(dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, role, callback) {
        read({prompt: 'Enter first name (optional): '}, function(err, firstName) {

            callback(err, dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, role, firstName)
        })
    },
    function(dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, role, firstName, callback) {
        read({prompt: 'Enter last name (optional): '}, function(err, lastName) {

            console.log()
            callback(err, dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, role, firstName, lastName)
        })
    },

    function(dbHost, dbPort, dbName, dbUser, dbPswd, username, password, email, role, firstName, lastName, callback) {

    	console.log("Connecting to db ..")

    	var dbConfig = {
    		host: dbHost,
    		port: dbPort,
    		database: dbName,
            user: dbUser,
            password: dbPswd
    	}

    	sfwk.init(dbConfig, function(err) {

    		if (err) {
    			console.log("Error connecting to db.")
    			callback(err)
    		}
    		else {
    			console.log("Connected to db.")

    			_createUser(username, password, email, role, firstName, lastName, callback)
    		}
    	})
    }

], function(err) {

	if (err) {
		console.log("Error: %s", err.message)
	}

	if (!err || err.teardownFlag) {
		console.log("Closing db connection ..")

		sfwk.teardown(function(err) {
			console.log(err ? "Failed to close db connection" : "Closed db connection.")
			process.exit()
		})
	}
})

function _createUser(username, password, email, role, firstName, lastName, callback) {

	var dto = {
		username: username,
		password: password,
		email: email,
		role: role
	}
	if (firstName) dto.firstName = firstName
	if (lastName) dto.lastName = lastName

	var AccountService = sfwk.factory().getService(sfwk.enums.Account_Service)
	AccountService.createUser(dto, function(svcErr, userId) {

		if (svcErr) {
			svcErr.teardownFlag = true
			callback(svcErr)
		}
		else {
			console.log("Created user with ID, '%s'", userId)
			callback(null)
		}
	})
}
