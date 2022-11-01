/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

let url = require("url");
const autoLoginLogger = require("log4js").getLogger("autoLogin");

/**
 * Automatic login for pages.
 * This currently only works for pages where the complete login form is shown on one page and the page is automatically redirected to the target page.
 *
 * @property {String} loginUrl The URL to the login page
 * @property {String} form The form CSS selector
 * @property {String} nameField The name field CSS selector relative from the form
 * @property {String} passwordField The password field CSS selector relative from the form
 * @property {bool} redirectsToMainUrl Defines whether a successful login will redirect the page to the main URL of the parent page
 * @property {int} reloadTimeout The time to wait for a page reload in before assuming that the login failed in milliseconds
 * @property {Page} parentPage The parent page
 * @property {int} The current number of login attempts
 * @property {int} The maximum number of login attempts before returning that the login was not possible
 */
class AutomaticLogin
{
    /**
     * AutomaticLogin constructor.
     *
     * @param {Object} _autoLoginConfiguration The auto login configuration
     * @param {Page} _parentPage The parent page
     */
    constructor(_autoLoginConfiguration, _parentPage)
    {
        this.loginUrl = _autoLoginConfiguration.loginUrl;
        this.form = _autoLoginConfiguration.form;
        this.nameField = _autoLoginConfiguration.name;
        this.passwordField = _autoLoginConfiguration.password;
        this.redirectsToMainUrl = _autoLoginConfiguration.redirectsToMainUrl;

        if (_autoLoginConfiguration.reloadTimeout) this.reloadTimeout = _autoLoginConfiguration.reloadTimeout;
        else this.reloadTimeout = 3000;

        this.parentPage = _parentPage;

        this.numberOfTries = 0;
        this.maximumNumberOfTries = 3;
    }


    /**
     * Loads the login url and executes javascript that fills the "name" and "password" fields and submits the form.
     *
     * @param {Electron.WebContents} _webContents The web contents
     */
    login(_webContents)
    {
        this.numberOfTries++;
        let self = this;

        autoLoginLogger.debug("Attempting auto login (Attempt " + this.numberOfTries + ") ...");

        return new Promise(function(_resolve){
            _webContents.loadURL(self.loginUrl);
            _webContents.once("dom-ready", function(){

                // Execute the login javascript code
                _webContents.executeJavaScript(self.buildLoginJavascriptString());

                self.checkWebContentsNavigation(_webContents).then(function(_webContentsReloadStarted){
                    self.waitForReloadCompletion(_webContents, _webContentsReloadStarted === "true").then(function(){

                        let parsedUrl = url.parse(_webContents.getURL());
                        let currentBaseUrl = parsedUrl.protocol + "//" + parsedUrl.host + parsedUrl.pathname;

                        if (self.redirectsToMainUrl && self.parentPage.getBaseURL() !== currentBaseUrl)
                        { // Something went wrong

                            if (self.numberOfTries <= self.maximumNumberOfTries)
                            { // Retry after two seconds
                                let login = self.login.bind(self);

                                login(_webContents).then(function(_result){
                                  _resolve(_result);
                                });
                            }
                            else _resolve("Too many failed login attempts.");
                        }
                        else _resolve("Login completed");
                    });
                });
            });
        });
    }

    // Private Methods

    /**
     * Waits 3 seconds for the web contents to start navigating.
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @returns {Promise} The promise that waits 3 seconds for the web contents to start navigating
     */
    checkWebContentsNavigation(_webContents)
    {
        let self = this;

        autoLoginLogger.debug("Waiting up to " + self.reloadTimeout + " milliseconds for web contents navigation ...");
        return new Promise(function(_resolve){

            let promiseResolved = false;
            let waitTimeOut = null;

            let startLoadHandler = function(){
                promiseResolved = true;
                if (waitTimeOut) clearTimeout(waitTimeOut);

                _resolve("true");
            };

            // Wait 3 seconds for web contents reload, then decide to resolve with either false or true
            waitTimeOut = setTimeout(function(){

                autoLoginLogger.warn("Page did not start navigating.");
                if (! promiseResolved)
                {
                    _webContents.removeListener("did-start-loading", startLoadHandler);
                    _resolve("false");
                }
            }, self.reloadTimeout);

            _webContents.once("did-start-loading", startLoadHandler);
        });
    }

    /**
     * Waits for the reload completion of a web contents object.
     *
     * @param {Electron.WebContents} _webContents The web contents
     * @param _reloadStarted
     *
     * @returns {Promise}
     */
    waitForReloadCompletion(_webContents, _reloadStarted)
    {
        return new Promise(function(_resolve){

            if (_reloadStarted)
            {
                if (_webContents.isLoading())
                {
                    _webContents.once("did-stop-loading", function(){
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
        loginJavascriptString += AutomaticLogin.getElementFetchString(this.form.selector + " " + this.nameField.selector) + ".value = \"" + this.nameField.value + "\";";

        // Set the password
        loginJavascriptString += AutomaticLogin.getElementFetchString(this.form.selector + " " + this.passwordField.selector) + ".value = \"" + this.passwordField.value + "\";";

        // Submit the form
        loginJavascriptString += AutomaticLogin.getElementFetchString(this.form.selector) + ".submit()";

        return loginJavascriptString;
    }

    /**
     * Returns the javascript call to get a element by css selector.
     *
     * @param {string} _selector The css selector
     *
     * @return {string} The javascript call to get a element by css selector
     */
    static getElementFetchString(_selector)
    {
        return "document.querySelector(\"" + _selector + "\")";
    }
}


module.exports = AutomaticLogin;
