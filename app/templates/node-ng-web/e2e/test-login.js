'use strict'

describe('test login', function() {

	it('should redirect to login page if user is not logged in', function() {

		browser.get('')
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)
		expect(element(by.id('logout-link')).isDisplayed()).toBe(false) // Log out button should not be displayed

		browser.get('#/management')
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)

		browser.get('#/workspace')
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)
	})

	it('should validate login form when login button is clicked', function() {

		element(by.model('login.username')).sendKeys('blah')
		element(by.id('login-btn')).click()

		expect(element(by.id('alert-box')).getText()).toBeTruthy()
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)
	})

	it('should prevent login with incorrect credentials', function() {

		// Reloading to clear out alert message (not cleared on its own because of Protractor and $interval)
		browser.get('')

		element(by.model('login.username')).sendKeys('blah')
		element(by.model('login.password')).sendKeys('blah')
		element(by.id('login-btn')).click()

		expect(element(by.id('alert-box')).getText()).toBeTruthy()
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)
	})

	it('should login with valid credentials', function() {

		browser.get('')
		element(by.model('login.username')).sendKeys('admin')
		element(by.model('login.password')).sendKeys('admin')
		element(by.id('login-btn')).click()

		expect(browser.getLocationAbsUrl()).toMatch(/\/management/)
		expect(element(by.id('logout-link')).isDisplayed()).toBe(true) // Log out button should be displayed

		// Reloading page should not redirect to /login
		browser.get('#/management')
		expect(browser.getLocationAbsUrl()).toMatch(/\/management/)
	})

	it("should log out", function() {

		element(by.id('logout-link')).click()
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)
		expect(element(by.id('logout-link')).isDisplayed()).toBe(false)

		// Attempt to reload a "logged in" url should redirect back to login page
		browser.get('#/management')
		expect(browser.getLocationAbsUrl()).toMatch(/\/login/)
	})
})