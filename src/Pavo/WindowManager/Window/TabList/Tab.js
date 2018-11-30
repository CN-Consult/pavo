/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const EventEmitter = require("events");
const fs = require("fs");
const url = require("url");
const AutomaticLogin = require(__dirname + "/../../../AutomaticLogin/AutomaticLogin");
const tabLogger = require("log4js").getLogger("tab");

/**
 * Stores information about a single tab and provides methods to attach/detach the tab to a browser window.
 */
class Tab extends EventEmitter
{
    /**
     * Tab constructor.
     *
     * @param {Window} _parentWindow The parent window
     * @param {Object} _tabConfiguration The tab configuration
     * @param {String} _id The tab id
     */
    constructor(_parentWindow, _tabConfiguration, _id)
    {
        super();

        this.id = _id;
        this.displayId = _parentWindow.getDisplayId() + "." + (_id + 1);
        this.parentWindow = _parentWindow;

        // Parse tab configuration

        // Inject files
        if (_tabConfiguration.cssFiles) this.cssFiles = _tabConfiguration.cssFiles;
        else this.cssFiles = [];

        if (_tabConfiguration.jsFiles) this.jsFiles = _tabConfiguration.jsFiles;
        else this.jsFiles = [];

        // Times
        if (_tabConfiguration.displayTime) this.displayTime = _tabConfiguration.displayTime * 1000;
        else this.displayTime = 60000;

        if (_tabConfiguration.reloadTime) this.reloadTime = _tabConfiguration.reloadTime * 1000;
        else this.reloadTime = 0;

        // Url
        this.url = _tabConfiguration.url;

        let parsedUrl = url.parse(this.url);
        // TODO: Rename to baseUrl
        this.realBaseUrl = parsedUrl.protocol + "//" + parsedUrl.host + parsedUrl.pathname;

        // Auto login
        if (_tabConfiguration.reloadAfterAppInit) this.reloadAfterAppInit = _tabConfiguration.reloadAfterAppInit;
        else this.reloadAfterAppInit = false;

        this.isLoginDone = false;
        if (_tabConfiguration.autoLogin) this.automaticLogin = new AutomaticLogin(_tabConfiguration.autoLogin, this);

        this.domReadyHandler = this.domReadyHandlerFunction.bind(this);
    }


    // Getters and Setters

    /**
     * Returns the id of this tab.
     *
     * @returns {String} The id of this tab
     */
    getId()
    {
        return this.id;
    }

    /**
     * Returns the display id of this tab.
     *
     * @returns {string} The display id of this tab
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
     * Returns the url of this tab.
     *
     * @return {String} The url of this tab
     */
    getURL()
    {
        return this.url;
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


    // Event Handlers

    /**
     * Event handler that is called when a attached browser window emits "dom-ready".
     *
     * @param {Electron.Event} _event The event
     */
    domReadyHandlerFunction(_event)
    {
        let webContents = _event.sender;

        tabLogger.debug("BrowserWindow for Tab #" + this.displayId + " loaded the url " + webContents.getURL() + ".");

        let self = this;
        this.injectCustomJavaScript(webContents).then(function(){
            self.injectCustomCss(webContents).then(function(){
                self.emit("css files injected");
            });
        });
    }


    // Public Methods

    /**
     * Loads the url and attaches the custom css injection for this tab to a browser window.
     *
     * @param {Electron.BrowserWindow} _browserWindow The browser window
     *
     * @return {Promise} The initialize browser window promise
     */
    attachToBrowserWindow(_browserWindow)
    {
        tabLogger.debug("Attaching tab #" + this.displayId + " to a BrowserWindow.");

        // Attach the dom ready handler to the BrowserWindow
        _browserWindow.webContents.on("dom-ready", this.domReadyHandler);

        let self = this;
        return new Promise(function(_resolve){

            self.autoLogin(_browserWindow).then(function(_result){
                self.loadUrl(_browserWindow, _result).then(function(){
                    _resolve("Tab #" + self.displayId + " attached to BrowserWindow");
                });
            });
        });
    }

    /**
     * Detaches the custom css injection for this tab from a browser window.
     *
     * @param {Electron.BrowserWindow} _browserWindow The browser window
     */
    detachFromBrowserWindow(_browserWindow)
    {
        tabLogger.debug("Detaching tab #" + this.displayId + " from a BrowserWindow");
        _browserWindow.webContents.removeListener("dom-ready", this.domReadyHandler);
    }


    // Private Methods

    /**
     * Automatically logs in a configured user for a browser window (if the autologin is defined).
     *
     * @param {Electron.BrowserWindow} _browserWindow The browser window
     *
     * @return {Promise} The auto login promise
     */
    autoLogin(_browserWindow)
    {
        let self = this;

        return new Promise(function(_resolve){
            if (self.automaticLogin)
            {
                if (self.isLoginDone === false)
                {
                    self.automaticLogin.login(_browserWindow).then(function(_result){

                        if (_result === "Too many failed login attempts.")
                        {
                            tabLogger.warn("Too many failed login attempts for tab #" + self.displayId);
                        }

                        self.isLoginDone = true;

                        tabLogger.debug("Tab #" + self.displayId + " autologin complete.");
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
     * @param {Electron.BrowserWindow} _browserWindow The browser window
     * @param {string} _autoLoginResult The result value of the autoLogin() method
     *
     * @returns {Promise}
     */
    loadUrl(_browserWindow, _autoLoginResult)
    {
        let self = this;

        return new Promise(function(_resolve){

            if (self.automaticLogin && self.automaticLogin.redirectsToMainUrl === true && _autoLoginResult === "Automatic login finished")
            { // The main url is automatically loaded after a successful login

                tabLogger.debug("No url reload necessary for Tab #" + self.displayId + ".");
                _resolve("No url reload necessary.");
            }
            else
            {
                _browserWindow.loadURL(self.url);

                self.once("css files injected", function(){
                    _resolve("Url loaded.");
                });
            }
        });
    }

    /**
     * Injects the list of custom css files into a web contents instance of a browser window.
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @return {Promise} The promise that injects the list of custom css files into the web contents
     */
    injectCustomCss(_webContents)
    {
        let numberOfCssFiles = this.cssFiles.length;
        let numberOfInsertedCssFiles = 0;

        let self = this;
        return new Promise(function(_resolve){

            if (numberOfCssFiles > 0)
            {
                self.cssFiles.forEach(function(_cssFilePath){

                    /*
                     * Using javascript to add the css as inline tag because "webContents.insertCss" doesn't work as expected.
                     * Some elements are not styled as expected and some elements "jump" around when they are reloaded in some pages.
                     */
                    _webContents.executeJavaScript(self.buildCssInjectionJavaScript(_cssFilePath)).then(function(){
                        numberOfInsertedCssFiles++;
                        if (numberOfInsertedCssFiles === numberOfCssFiles)
                        {
                            tabLogger.debug("Tab #" + self.displayId + " css files injected.");
                            _resolve("CSS files injected");
                        }
                    });
                });
            }
            else _resolve("No CSS files to inject.");
        });
    }

    /**
     * Builds the java script string that inserts an inline css tag into a pages header.
     *
     * @param {String} _cssFilePath The path to the css file
     *
     * @return {String} The javascript string that inserts an inline css tag into a pages header
     */
    buildCssInjectionJavaScript(_cssFilePath)
    {
        // TODO: This should not be the home folder, instead some sort of config folder
        // TODO: Maybe let tab fetch the path from the pavo app
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

    /**
     * Injects the list of custom javascript files into a web contents instance of a browser window.
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @return {Promise} The promise that injects the list of custom javascript files into the web contents
     */
    injectCustomJavaScript(_webContents)
    {
        // TODO: Make list of java scripts (combined css javascripts + js files scripts)
        let numberOfJavascriptFiles = this.jsFiles.length;
        let numberOfInsertedJavascriptFiles = 0;

        let self = this;
        return new Promise(function(_resolve){

            if (numberOfJavascriptFiles > 0)
            {
                self.jsFiles.forEach(function(_jsFilePath){

                    // TODO: This should not be the home folder, instead some sort of config folder
                    // TODO: Maybe let tab fetch the path from the pavo app
                    let javaScriptString = String(fs.readFileSync(app.getPath("home") + "/" + _jsFilePath));
                    _webContents.executeJavaScript(javaScriptString).then(function(){

                        numberOfInsertedJavascriptFiles++;
                        if (numberOfInsertedJavascriptFiles === numberOfJavascriptFiles)
                        {
                            tabLogger.debug("Tab #" + self.displayId + " javascript files injected.");
                            _resolve("Javascript files injected.");
                        }
                    });
                });
            }
            else _resolve("No javascript files to inject.");
        });
    }
}

/**
 * The id of the tab
 *
 * @type {int} id
 */
Tab.id = -1;

/**
 * The parent window
 *
 * @type {Window} parentWindow
 */
Tab.parentWindow = null;

/**
 * The display id of the tab
 * This is used in log messages and in the user interface
 *
 * @type {string} displayId
 */
Tab.displayId = "";

/**
 * The custom css files for this tab
 *
 * @var {String[]} cssFiles
 */
Tab.cssFiles = null;

/**
 * The custom javascript files for this tab
 *
 * @type {String[]} jsFiles
 */
Tab.jsFiles = null;

/**
 * The base url of the tab
 * This is used to determine whether the page was redirected after an automatic login
 *
 * @type {string} realBaseUrl
 */
Tab.realBaseUrl = "";

/**
 * The url whose content is displayed in this tab
 *
 * @var {string} url
 */
Tab.url = "";

/**
 * The time for which this tab is displayed before the next tab is shown in milliseconds
 *
 * @type {int} displayTime
 */
Tab.displayTime = 0;

/**
 * The time interval in which this tab is reloaded in milliseconds
 *
 * @type {int} reloadTime
 */
Tab.reloadTime = 0;

/**
 * Defines whether this tab must be reloaded after the app was initialized
 *
 * @type {boolean} reloadAfterAppInit
 */
Tab.reloadAfterAppInit = false;

/**
 * Defines whether the automatic login for this tab was successfully performed in one browser window
 *
 * @type {boolean} isLoginDone
 */
Tab.isLoginDone = false;

/**
 * The automatic login which is used to perform a auto login if one is defined in the config file
 *
 * @type {AutomaticLogin} automaticLogin
 */
Tab.automaticLogin = null;

/**
 * The dom ready handler which is called when a attached browser window emits "dom-ready"
 * This is saved in a attribute in order to be able to detach the event listener from the browser window
 */
Tab.domReadyHandler = null;


module.exports = Tab;
