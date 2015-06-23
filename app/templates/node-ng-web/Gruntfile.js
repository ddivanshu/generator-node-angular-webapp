'use strict'

module.exports = function(grunt) {

	grunt.initConfig({
		exec: {
			start: './scripts/start-server.js',
			start_e2e: './scripts/start-server.js e2e',

			install_chromedriver: './node_modules/protractor/bin/webdriver-manager update',
			run_e2e: './node_modules/protractor/bin/protractor e2e/conf.js'
		}
	})

	grunt.loadNpmTasks('grunt-exec')

	grunt.registerTask('start', ['exec:start'])
	grunt.registerTask('start_e2e', ['exec:start_e2e'])
	grunt.registerTask('install_chromedriver', ['exec:install_chromedriver'])
	grunt.registerTask('run_e2e', ['exec:run_e2e'])
}