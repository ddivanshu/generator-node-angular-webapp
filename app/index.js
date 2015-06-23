'use strict'

var yeoman = require('yeoman-generator')
var chalk = require('chalk')
var yosay = require('yosay')

module.exports = yeoman.generators.Base.extend({

    promptUser: function () {

//        var done = this.async()

        // Have Yeoman greet the user.
        this.log(yosay(
//          'Welcome to the generator for ' + chalk.red('node-ng-webapp') + '!'
            chalk.red('node-ng-webapp')
        ))

//        var prompts = [{
//            type: 'checkbox',
//            name: 'database',
//            message: 'Do you plan to use Mongodb or MySQL as the database?',
//            choices: ['Mongodb', 'MySQL'],
//            default: 'Mongodb'
//        }]

//        this.prompt(prompts, function (answers) {
//            this.props = answers
            // To access props later use this.props.someOption;

//            done()
//        }.bind(this))
    },

    generateScaffold: function() {

        this.directory(
            this.templatePath('node-ng-service'),
            this.destinationPath('node-ng-service')
        )

        this.directory(
            this.templatePath('node-ng-web'),
            this.destinationPath('node-ng-web')
        )
    },

//    install: function () {
//        this.installDependencies();
//    }
})
