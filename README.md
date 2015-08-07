# generator-node-angular-webapp

Scaffold out a tiered Mongo / Express / Angular / Node (MEAN) web application with REST API support

### Installation

To install *generator-node-angular-webapp* from npm, run:

```
$ npm install -g generator-node-angular-webapp
```

Note that *generator-node-angular-webapp* is a Yeoman generator. In case you are not familiar with Yeoman, it is a scaffolding framework for web applications. If you haven't already, install Yeoman using npm:

```sh
$ npm install -g yo
```

Now, initiate the generator:

```
$ yo node-angular-webapp
```

### Setup Guide

The generator will install two directories:

- **node-ng-service**: This is the service tier of the web application and contains all of the CRUD logic.
- **node-ng-web**: This is the web tier and contains the Express REST route handlers and angular code.

Follow the steps below to setup the scaffold and reference application:

- Install node and bower modules.
```
$ cd node-ng-service
$ npm install
$ cd ../node-ng-web
$ npm install
$ bower install
$ cd ..
```

- 'node-ng-service' is packaged as a Node module and is "required" in "node-ng-web". Create a symlink in *./node-ng-web/node_modules* to *./node-ng-service*, so you don't have to reinstall the module every time you make a change in 'node-ng-service'.
```
$ cd node-ng-service
$ npm link
$ cd ../node-ng-web
$ npm link node-ng-service
```

- Add the following environment variables in your bash config file (replace values as appropriate):
```
# Installation
export environment=dev
export base_dir=~/my_dir/node-ng-web
export port=8080
# Logging
export LOG4JS_CONFIG=~/my_dir/log4js.json
# Application DB
export db_host=localhost
export db_port=27017
export db_name=MyDB
export db_user=mydb_user
export db_pswd=mydb_user
# Test DBs (for unit and E2E tests)
export test_db_host=localhost
export test_db_port=27017
export test_db_user=test_user
export test_db_pswd=test_user
export test_ut_db_name=Test_UT
export test_e2e_db_name=Test_E2E
# Authentication (used by reference application)
export jwt_secret=iamahiddensecret
export crypto_secret=iamahiddensecret
```
Make sure to source your bash config file in the current terminal session before proceeding further.

- Create the log4js.json configuration file (note that 'sys', 'svc' and ‘api' logger categories are used by system, service layer and web layer loggers, respectively):
```json
{
    "appenders": [{
        "category": "sys",
        "type": "console",
        "layout": {
            "type": "pattern",
            "pattern": "[%-5p][%c] %m"
        }
    }, {
        "category": "svc",
        "type": "console",
        "layout": {
            "type": "pattern",
            "pattern": "[%-5p][%c] %m"
        }
    }, {
        "category": "api",
        "type": "console",
        "layout": {
            "type": "pattern",
            "pattern": "[%-5p][%c] %m"
        }
    }],
    "levels": {
        "sys": "INFO",
        "svc": "DEBUG",
        "api": "DEBUG"
    }
}
```

- Modify Express source to enable graceful server shutdown if a synchronous error arises during request/response operation (look at *node-ng-web/api/handlers/fatal-error-handler.js* for how this is done). You may chooose not to follow this approach, in which case, skip to the next step. As of version 4.11.1, open file *node-ng-web/node_modules/express/lib/router/layer.js*, and comment out the try/catch code in function *Layer.prototype.handle_request*:

```
Layer.prototype.handle_request = function handle(req, res, next) {
  var fn = this.handle;

  if (fn.length > 3) {
    // not a standard request handler
    return next();
  }

//  try {
    fn(req, res, next);
//  } catch (err) {
//    next(err);
//  }
};
```

- Setup MongoDB users. Install and run MongoDB, if you haven't already, and execute the following commands or adapt them to your setup:

```sh
$ mongo
> use admin
> db.createUser({user: 'admin', pwd: 'admin', roles: [{role: 'userAdminAnyDatabase', db: 'admin'}]})
> exit
$ mongo --host localhost --port 27017 -u admin -p admin --authenticationDatabase admin
> use MyDB
> db.createUser({'user':'mydb_user', 'pwd':'mydb_user', roles:[{role:'readWrite', db:'MyDB'}]})
> use Test_UT
> db.createUser({'user':'test_user', 'pwd':'test_user', roles:[{role:'readWrite', db:'Test_UT'}]})
> use Test_E2E
> db.createUser({'user':'test_user', 'pwd':'test_user', roles:[{role:'readWrite', db:'Test_E2E'}]})
> exit
```

Users are saved in the *systerm.users* collection in *admin* database. You should now be able to connect to a database (e.g. application database) as follows:

```sh
mongo --host localhost --port 27017 -u mydb_user -p mydb_user MyDB
```

- Initialize MongoDB collections and create indexes for MyDB, Test_UT and Test_E2E (or whatever database names you chose). Execute the following script and follow the prompts:

```sh
$ cd node-ng-service/scripts
$ ./setup_db.sh
Enter DB host (localhost):
Enter DB port (27017):
Enter DB name: MyDB
Enter DB user: mydb_user
Enter DB user password: *
Re-enter DB user password: *
Enter authentication DB name (admin):
```

- Bootstrap users for the reference application. The application requires users to be created with one of two roles, "Admin" and "CSR" (customer service representative). Create two users, one for each role:

```sh
$ cd node-ng-service/scripts
$ ./bootstrap_user.js
Enter DB host (localhost):
Enter DB port (27017):
Enter DB name: MyDB
Enter DB user: mydb_user
Enter DB user password: *
Enter username: admin
Enter password: *
Confirm password: *
Enter email address: admin@admin
Enter role [Admin, CSR]: Admin
Enter first name (optional):
Enter last name (optional):
```

- Run service layer unit tests using Test_UT database (some might consider these functional tests). The tests use Chai as the assertion framework. Mocha is a good choice for a test runner. To use Mocha, install it first if you haven't already:

```sh
$ npm install -g mocha
```

Now run the tests. Note that prior to every run of the tests, a seeder script is executed that seeds fresh golden test data.

```sh
$ cd node-ng-service
$ mocha
```

- Run browser-based Protractor E2E tests. In order to run the E2E tests, we must first run our node server application in E2E mode.

```sh
$ cd node-ng-web
$ grunt start_e2e
```

Download Selenium jar and chrome driver into 'protractor' node module. Then run the E2E tests. Note that Jasmine is used as the test runner and assertion framework. This and other properties, such as E2E server url and port, can be updated in *node-ng-web/e2e/conf.js*.

```sh
(In a separate shell terminal)
$ cd node-ng-web
$ grunt install_chromedriver
$ grunt run_e2e
```

- We are now ready to launch the reference web application. The application provides bearer token based authentication and loads different views based on the user's role.

```sh
$ cd node-ng-web
$ grunt start
```

Now load the url 'http://localhost:8080' in your browser. The login view should be loaded. Login as Admin user or CSR user and note the different views being loaded based on the role.
