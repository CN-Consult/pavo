/**
 * @version 0.1
 * @copyright 2018-2020 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");
const url = require("url");
const AutomaticLogin = require(__dirname + "/../../../AutomaticLogin/AutomaticLogin");
const WebContentsDataInjector = require(__dirname + "/../WebContentsDataInjector");
const pageLogger = require("log4js").getLogger("page");

/**
 * Stores information about a single page and provides methods to attach/detach the page to a web contents object.
 *
 * @property {int} id The id of the page
 * @property {Window} parentWindow The parent window
 * @property {string} displayId The display id of the page that is used in log messages and in the user interface
 * @property {string} baseUrl The base url of the page that is used to determine whether the page was redirected after an automatic login
 * @property {string} url The url of the website
 * @property {string} name The name of this page that is used to display the page in the overview of the web interface
 * @property {int} displayTime The time for which this page is displayed before the next page is shown in milliseconds
 * @property {int} reloadTime The time interval in which this page is reloaded in milliseconds
 * @property {boolean} reloadAfterAppInit Defines whether this page must be reloaded after the app was initialized
 * @property {boolean} isLoginDone Defines whether the automatic login for this page was successfully performed in one web contents object
 * @property {AutomaticLogin} automaticLogin The automatic login which is used to perform a auto login if one is defined in the config file
 * @property {function} domReadyHandler The dom ready handler which is called when a attached web contents object emits "dom-ready" (necessary to detach the event listener)
 */
class Page extends EventEmitter
{
    /**
     * Page constructor.
     *
     * @param {Window} _parentWindow The parent window
     * @param {Object} _pageConfiguration The page configuration
     * @param {int} _id The page id
     */
    constructor(_parentWindow, _pageConfiguration, _id)
    {
        super();

        this.id = _id;
        this.displayId = _parentWindow.getDisplayId() + "." + (_id + 1);
        this.parentWindow = _parentWindow;

        // Parse page configuration

        // Times
        if (_pageConfiguration.displayTime) this.displayTime = _pageConfiguration.displayTime * 1000;
        else this.displayTime = 60000;

        if (_pageConfiguration.reloadTime) this.reloadTime = _pageConfiguration.reloadTime * 1000;
        else this.reloadTime = 0;

        if (_pageConfiguration.maximumSecondsToWaitForLoad) this.maximumSecondsToWaitForLoad = _pageConfiguration.maximumSecondsToWaitForLoad;
        else this.maximumSecondsToWaitForLoad = 30;


        // Url
        this.url = _pageConfiguration.url;

        if (_pageConfiguration.name) this.name = _pageConfiguration.name;
        else this.name = this.url;

        let parsedUrl = url.parse(this.url);
        this.baseUrl = parsedUrl.protocol + "//" + parsedUrl.host + parsedUrl.pathname;

        // Auto login
        this.isLoginDone = false;
        if (_pageConfiguration.autoLogin) this.automaticLogin = new AutomaticLogin(_pageConfiguration.autoLogin, this);

        // Other
        if (_pageConfiguration.reloadAfterAppInit) this.reloadAfterAppInit = _pageConfiguration.reloadAfterAppInit;
        else this.reloadAfterAppInit = false;

        this.webContentsDataInjector = new WebContentsDataInjector(
            this.parentWindow.getParentWindowManager().getParentPavo().getConfigDirectoryPath(),
            _pageConfiguration.cssFiles,
            _pageConfiguration.jsFiles,
            _pageConfiguration.zoomFactor
        );

        this.domReadyHandler = this.domReadyHandlerFunction.bind(this);
    }


    // Getters and Setters

    /**
     * Returns the id of this page.
     *
     * @returns {int} The id of this page
     */
    getId()
    {
        return this.id;
    }

    /**
     * Returns the display id of this page.
     *
     * @returns {String} The display id of this page
     */
    getDisplayId()
    {
        return this.displayId;
    }

    /**
     * Returns the parent window.
     *
     * @return {Window} The parent window
     */
    getParentWindow()
    {
        return this.parentWindow;
    }

    /**
     * Returns the url of this page.
     *
     * @return {String} The url of this page
     */
    getURL()
    {
        return this.url;
    }

    /**
     * Returns the base URL of this page.
     *
     * @return {string} The base URL of this page
     */
    getBaseURL()
    {
        return this.baseUrl;
    }

    /**
     * Returns the name of this page.
     *
     * @return {String} The name of this page
     */
    getName()
    {
        return this.name;
    }

    /**
     * Returns the display time.
     *
     * @returns {int} The display time
     */
    getDisplayTime()
    {
        return this.displayTime;
    }

    /**
     * Returns the reload time.
     *
     * @returns {int} The reload time
     */
    getReloadTime()
    {
        return this.reloadTime;
    }

    /**
     * Returns whether this page must be reloaded after the app was initialized.
     *
     * @returns {boolean} True if this page must be reloaded after the app was initialized, false otherwise
     */
    getReloadAfterAppInit()
    {
        return this.reloadAfterAppInit;
    }


    // Event Handlers

    /**
     * Event handler that is called when a attached web contents object emits "dom-ready".
     *
     * @param {Electron.Event} _event The event
     */
    domReadyHandlerFunction(_event)
    {
        let webContents = _event.sender;
        pageLogger.debug("WebContents for Page #" + this.displayId + " loaded the url " + webContents.getURL() + ".");
    }


    // Public Methods

    /**
     * Loads the url and attaches the dom ready handler of this page to a web contents object.
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @return {Promise} The promise that loads the url and attaches the dom ready handler of this page to a web contents object
     */
    attachToWebContents(_webContents)
    {
        let self = this;

        this.webContentsDataInjector.attachToWebContents(_webContents);
        this.webContentsDataInjector.on("data-injected", function(){
            pageLogger.debug("Page #" + self.displayId + " css and js files injected.");
            self.emit("data-injected");
        });

        return new Promise(function(_resolve){
            self.autoLogin(_webContents).then(function(_result){
                self.loadUrl(_webContents, _result).then(function(){
                    _resolve("Page #" + self.displayId + " attached to WebContents");
                });
            });
        });
    }

    /**
     * Detaches the dom ready handler of this page from a web contents object.
     *
     * @param {Electron.WebContents} _webContents The web contents
     */
    detachFromWebContents(_webContents)
    {
        this.webContentsDataInjector.detachFromWebContents(_webContents);
        pageLogger.debug("Detaching page #" + this.displayId + " from a WebContents object");
    }


    // Private Methods

    /**
     * Automatically logs in a configured user for a web contents object (if the auto login is defined).
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @return {Promise} The auto login promise
     * @private
     */
    autoLogin(_webContents)
    {
        let self = this;
        return new Promise(function(_resolve){
            if (self.automaticLogin)
            {
                if (self.isLoginDone === false)
                {
                    self.automaticLogin.login(_webContents).then(function(_result){

                        if (_result === "Too many failed login attempts.")
                        {
                            pageLogger.warn("Too many failed login attempts for page #" + self.displayId);
                        }
                        else pageLogger.debug("Page #" + self.displayId + " auto login complete.");

                        self.isLoginDone = true;
                        _resolve("Automatic login finished");
                    });
                }
                else _resolve("Automatic login already done");
            }
            else _resolve("No automatic login defined.");
        });
    }

    /**
     * Loads the url after an optional automatic login was done.
     *
     * @param {Electron.WebContents} _webContents The web contents
     * @param {string} _autoLoginResult The result value of the autoLogin() method
     *
     * @returns {Promise}
     * @private
     */
    loadUrl(_webContents, _autoLoginResult)
    {
        let self = this;
        return new Promise(function(_resolve){

            pageLogger.debug("Waiting up to " + self.maximumSecondsToWaitForLoad + " seconds for initial page load of Page #" + self.displayId + " ...");
            let pageLoadWaitTimeout = setTimeout(function(){
                pageLogger.warn("Page #" + self.displayId + " failed to load in " + self.maximumSecondsToWaitForLoad +  " seconds");
                _resolve("Maximum wait time reached");
            }, self.maximumSecondsToWaitForLoad * 1000);

            if (self.automaticLogin && self.automaticLogin.redirectsToMainUrl === true && _autoLoginResult === "Automatic login finished")
            { // The main url is automatically loaded after a successful login

                clearTimeout(pageLoadWaitTimeout);
                pageLogger.debug("No url reload necessary for Page #" + self.displayId + ".");
                _resolve("No url reload necessary.");
            }
            else
            {
                self.webContentsDataInjector.once("data-injected", function(){
                    clearTimeout(pageLoadWaitTimeout);
                    pageLogger.debug("Page #" + self.displayId + " loaded");
                    _resolve("Url loaded.");
                });

                _webContents.loadURL(self.url);
            }
        });
    }
}


module.exports = Page;
