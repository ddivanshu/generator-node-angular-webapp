#!/bin/bash

# Use one-time to initialize Mongo collections and create indexes.

read -p "Enter DB host (localhost): " dbHost
if [[ "$dbHost" == "" ]]; then
	dbHost="localhost"
fi

read -p "Enter DB port (27017): " dbPort
if [[ "$dbPort" == "" ]]; then
	dbPort=27017
fi

read -p "Enter DB name: " dbName
if [[ "$dbName" == "" ]]; then
	echo "DB name must be provided."
	exit 1
fi

read -p "Enter DB user: " dbUser
if [[ "$dbUser" != "" ]]; 
then

	read -p "Enter DB user's password: " -s dbUserPwd
	if [[ "$dbUserPwd" == "" ]]; then
		echo "DB user's password must be provided."
		exit 1
	fi
	echo ""

	read -p "Re-enter DB user's password: " -s dbUserPwd_re
	if [[ "$dbUserPwd_re" != "$dbUserPwd" ]]; then
		echo "Re-entered password does not match."
		exit 1
	fi
	echo ""

	mongo --host $dbHost --port $dbPort -u $dbUser -p $dbUserPwd $dbName mongo/init-collections.js
	mongo --host $dbHost --port $dbPort -u $dbUser -p $dbUserPwd $dbName mongo/recreate-indexes.js

else

	mongo --host $dbHost --port $dbPort $dbName mongo/init-collections.js
	mongo --host $dbHost --port $dbPort $dbName mongo/recreate-indexes.js

fi
