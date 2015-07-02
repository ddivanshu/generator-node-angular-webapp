# generator-node-angular-webapp

Scaffold out a tiered Node/Angular web application with REST API support

### Installation

To install generator-node-angular-webapp from npm, run:

```
$ npm install -g generator-node-angular-webapp
```

Finally, initiate the generator:

```
$ yo node-angular-webapp
```

### Setup

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
# App DB
export db_host=localhost
export db_port=27017
export db_name=MyDB
export db_user=mydb_user
export db_pswd=mydb_user
# Test DB
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
        “api": "DEBUG"
    }
}
```

More setup steps comming soon ..