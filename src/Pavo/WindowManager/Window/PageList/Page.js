/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const EventEmitter = require("events");
const fs = require("fs");
const url = require("url");
const AutomaticLogin = require(__dirname + "/../../../AutomaticLogin/AutomaticLogin");
const pageLogger = require("log4js").getLogger("page");

/**
 * Stores information about a single page and provides methods to attach/detach the page to a web contents object.
 *
 * @property {int} id The id of the page
 * @property {Window} parentWindow The parent window
 * @property {string} displayId The display id of the page that is used in log messages and in the user interface
 * @property {String[]} cssFiles The custom css files for this page
 * @property {String[]} jsFiles The custom javascript files for this page
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

        // Inject files
        if (_pageConfiguration.cssFiles) this.cssFiles = _pageConfiguration.cssFiles;
        else this.cssFiles = [];

        if (_pageConfiguration.jsFiles) this.jsFiles = _pageConfiguration.jsFiles;
        else this.jsFiles = [];

        // Times
        if (_pageConfiguration.displayTime) this.displayTime = _pageConfiguration.displayTime * 1000;
        else this.displayTime = 60000;

        if (_pageConfiguration.reloadTime) this.reloadTime = _pageConfiguration.reloadTime * 1000;
        else this.reloadTime = 0;

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
     *
     * @emits The "css files injected" event after injecting all custom javascript and css files
     */
    domReadyHandlerFunction(_event)
    {
        let webContents = _event.sender;

        pageLogger.debug("WebContents for Page #" + this.displayId + " loaded the url " + webContents.getURL() + ".");

        let self = this;
        this.injectCustomScripts(webContents).then(function(){
            self.emit("css files injected");
        });
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
        pageLogger.debug("Attaching page #" + this.displayId + " to a WebContents object.");

        // Attach the dom ready handler to the WebContents
        _webContents.on("dom-ready", this.domReadyHandler);

        let self = this;
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
        pageLogger.debug("Detaching page #" + this.displayId + " from a WebContents object");
        _webContents.removeListener("dom-ready", this.domReadyHandler);
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

            if (self.automaticLogin && self.automaticLogin.redirectsToMainUrl === true && _autoLoginResult === "Automatic login finished")
            { // The main url is automatically loaded after a successful login

                pageLogger.debug("No url reload necessary for Page #" + self.displayId + ".");
                _resolve("No url reload necessary.");
            }
            else
            {
                _webContents.loadURL(self.url);
                self.once("css files injected", function(){
                    _resolve("Url loaded.");
                });
            }
        });
    }

    /**
     * Injects the list of custom css and javascript files into a web contents object.
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @return {Promise} The promise that injects the list of custom css and javascript files into the web contents
     * @private
     */
    injectCustomScripts(_webContents)
    {
        let scripts = [];
        let self = this;

        // TODO: Need base folder in constructor from which css and js files are loaded
        // TODO: Default base folder = home/config

        // Add the css files to the list
        this.cssFiles.forEach(function(_cssFilePath){
            scripts.push(Page.buildCssInjectionJavaScript(_cssFilePath));
        });

        // Add the javascript files to the list
        this.jsFiles.forEach(function(_jsFilePath) {
            scripts.push(String(fs.readFileSync(app.getPath("home") + "/" + _jsFilePath)));
        });

        let numberOfScripts = scripts.length;
        let numberOfInjectedScripts = 0;

        return new Promise(function(_resolve){
            if (numberOfScripts === 0) _resolve("No scripts to inject");
            else
            {
                scripts.forEach(function(_script){
                    _webContents.executeJavaScript(_script).then(function(){
                        numberOfInjectedScripts++;
                        if (numberOfInjectedScripts === numberOfScripts)
                        {
                            pageLogger.debug("Page #" + self.displayId + " css and js files injected.");
                            _resolve("CSS files injected");
                        }
                    });
                });
            }
        });
    }

    /**
     * Builds the java script string that inserts an inline css tag into a pages header.
     * Using javascript to add the css as inline tag because "webContents.insertCss" method doesn't
     * style the elements as expected.
     *
     * @param {String} _cssFilePath The path to the css file
     *
     * @return {String} The javascript string that inserts an inline css tag into a pages header
     * @private
     */
    static buildCssInjectionJavaScript(_cssFilePath)
    {
        let cssContent = String(fs.readFileSync(app.getPath("home") + "/" + _cssFilePath));
        let oneLineCssContent = cssContent.replace(/\r?\n|\r/gm, "");

        /*
         * Creates a <style> element and fills it with the css file content.
         * Then it adds the <style> element to the <head> tag
         */
        return "var styleElement=document.createElement(\"style\");" +
               "styleElement.type=\"text/css\";" +
               "styleElement.appendChild(document.createTextNode(\"" + oneLineCssContent + "\"));" +
               "document.getElementsByTagName(\"head\")[0].appendChild(styleElement);";
    }
}


module.exports = Page;
