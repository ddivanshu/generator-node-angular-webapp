/**
 * Helper module for E2E tests. Good use-case is to require this module in the test suites and invoke the 'loginAsXXX'
 * and 'logout' methods in the 'beforeAll' and 'afterAll' specs.
 */

exports.loginAsAdmin = function() {
	_login('admin', 'admin')
}

exports.logout = function() {
	element(by.id('logout-link')).click()
}

function _login(username, password) {

	browser.get('')
	element(by.model('login.username')).sendKeys(username)
	element(by.model('login.password')).sendKeys(password)
	element(by.id('login-btn')).click()
}
