/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

let url = require("url");
const autoLoginLogger = require("log4js").getLogger("autoLogin");

/**
 * Automatic login for tabs.
 * This currently only works for pages where the complete login form is shown on one page and the page is automatically redirected to the target page.
 *
 * TODO: Abstract class for AutomaticLogins and sub classes for "single page", "wait for password field", "reload for password field"
 */
class AutomaticLogin
{
    /**
     * AutomaticLogin constructor.
     *
     * @param {Object} _autoLoginConfiguration The auto login configuration
     * @param {Tab} _parentTab The parent tab
     */
    constructor(_autoLoginConfiguration, _parentTab)
    {
        this.loginUrl = _autoLoginConfiguration.loginUrl;
        this.form = _autoLoginConfiguration.form;
        this.nameField = _autoLoginConfiguration.name;
        this.passwordField = _autoLoginConfiguration.password;
        this.redirectsToMainUrl = _autoLoginConfiguration.redirectsToMainUrl;

        if (_autoLoginConfiguration.reloadTimeout) this.reloadTimeout = _autoLoginConfiguration.reloadTimeout;
        else this.reloadTimeout = 3000;

        this.parentTab = _parentTab;

        this.numberOfTries = 0;
        this.maximumNumberOfTries = 3;
    }


    /**
     * Loads the login url and executes javascript that fills the "name" and "password" fields and submits the form.
     *
     * @param {Electron.BrowserWindow} _browserWindow The browser window
     */
    login(_browserWindow)
    {
        this.numberOfTries++;
        let self = this;

        autoLoginLogger.debug("Attempting auto login (Attempt " + this.numberOfTries + ") ...");

        return new Promise(function(_resolve){
            _browserWindow.loadURL(self.loginUrl);
            _browserWindow.webContents.once("dom-ready", function(){

                // Execute the login javascript code
                _browserWindow.webContents.executeJavaScript(self.buildLoginJavascriptString());

                self.checkBrowserWindowNavigation(_browserWindow).then(function(_browserWindowReloadStarted){
                    self.waitForReloadCompletion(_browserWindow, _browserWindowReloadStarted === "true").then(function(){

                        let parsedUrl = url.parse(_browserWindow.webContents.getURL());
                        let currentBaseUrl = parsedUrl.protocol + "//" + parsedUrl.host + parsedUrl.pathname;

                        if (self.redirectsToMainUrl && self.parentTab.realBaseUrl !== currentBaseUrl)
                        { // Something went wrong

                            if (self.numberOfTries <= self.maximumNumberOfTries)
                            { // Retry after two seconds
                                let login = self.login.bind(self);

                                login(_browserWindow).then(function(_result){
                                  _resolve(_result);
                                });
                            }
                            else _resolve("Too many failed login attempts.");
                        }
                        else _resolve("Login completed");
                    });
                });
            })
        });
    }

    // Private Methods

    /**
     * Waits 3 seconds for the browser window to start navigating.
     *
     * @param {Electron.BrowserWindow} _browserWindow The browser window
     *
     * @returns {Promise} The promise that waits 3 seconds for the browser window to start navigating
     */
    checkBrowserWindowNavigation(_browserWindow)
    {
        let self = this;

        autoLoginLogger.debug("Waiting up to " + self.reloadTimeout + " milliseconds for browser window navigation ...");
        return new Promise(function(_resolve){

            let promiseResolved = false;
            let waitTimeOut = null;

            let startLoadHandler = function(){
                promiseResolved = true;
                if (waitTimeOut) clearTimeout(waitTimeOut);

                _resolve("true");
            };

            // Wait 3 seconds for browser reload, then decide to resolve with either false or true
            waitTimeOut = setTimeout(function(){

                autoLoginLogger.warn("Page did not start navigating.");
                if (! promiseResolved)
                {
                    _browserWindow.webContents.removeListener("did-start-loading", startLoadHandler);
                    _resolve("false");
                }
            }, self.reloadTimeout);

            _browserWindow.webContents.once("did-start-loading", startLoadHandler);
        });
    }

    /**
     * Waits for the reload completion of the browser window.
     *
     * @param _browserWindow
     * @param _reloadStarted
     *
     * @returns {Promise}
     */
    waitForReloadCompletion(_browserWindow, _reloadStarted)
    {
        return new Promise(function(_resolve){

            if (_reloadStarted)
            {
                if (_browserWindow.webContents.isLoading())
                {
                    _browserWindow.webContents.once("did-stop-loading", function(){
                        _resolve("Reload finished.");
                    });
                }
                else _resolve("Page reload already complete.");
            }
            else
            {
                _resolve("No reload done.");
            }
        });
    }

    /**
     * Builds the javascript string that fills the "name" and "password" fields and submits the form.
     *
     * @return {string} The javascript string that fills the "name" and "password" fields and submits the form
     */
    buildLoginJavascriptString()
    {
        let loginJavascriptString = "";

        // Set the name
        loginJavascriptString += this.getElementFetchString(this.form.selector + " " + this.nameField.selector) + ".value = \"" + this.nameField.value + "\";";

        // Set the password
        loginJavascriptString += this.getElementFetchString(this.form.selector + " " + this.passwordField.selector) + ".value = \"" + this.passwordField.value + "\";";

        // Submit the form
        loginJavascriptString += this.getElementFetchString(this.form.selector) + ".submit()";

        return loginJavascriptString;
    }

    /**
     * Returns the javascript call to get a element by css selector.
     *
     * @param {string} _selector The css selector
     *
     * @return {string} The javascript call to get a element by css selector
     */
    getElementFetchString(_selector)
    {
        return "document.querySelector(\"" + _selector + "\")";
    }
}


module.exports = AutomaticLogin;
