/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseBrowserWindowManager = require(__dirname + "/BaseBrowserWindowManager");

/**
 * Manages the reload browser windows for a tab reload loop.
 *
 * There are two browser windows:
 * 1. top: This is used to display the current tab on top of the other browser window
 * 2. reload: This is used to reload the current tab and it will switch positions with the current tab browser window after each showBackGroundBrowserWindow call
 */
class ReloadBrowserWindowManager extends BaseBrowserWindowManager
{
    // Public Methods

    /**
     * Initializes the reload browser windows.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     */
    constructor(_browserWindowConfiguration)
    {
        super(_browserWindowConfiguration);

        this.browserWindows = {
            "top": this.createBrowserWindow(),
            "reload": this.createBrowserWindow()
        };
        this.isBrowserWindowInitialized = {
            "top": false,
            "reload": false
        };

        this.topBrowserWindowId = "top";

        /** @type {Tab} currentTab */
        this.currentTab = null;
    }


    /**
     * Checks whether the browser windows are free to use for a new tab.
     * If the browser windows are occupied by another tab then
     *
     * @return {Promise} The promise that checks whether the browser windows are free to use for a new tab
     */
    areBrowserWindowsOccupiedCheck()
    {
        let self = this;

        return new Promise(function(_resolve, _reject){

            if (self.isBrowserWindowInitialized.top || self.isBrowserWindowInitialized.reload)
            {
                _reject("Can not load tab: Browser windows are already in use.");
            }
            else
            {
                _resolve("Tab loaded into the browser window manager");
            }
        });
    }

    /**
     * Reloads the current tab.
     *
     * @returns {Promise} The reload tab promise
     */
    reloadTabInBackgroundBrowserWindow(_tab)
    {
        this.currentTab = _tab;

        let reloadBrowserWindowId = this.getReloadBrowserWindowId();
        let reloadBrowserWindow = this.getReloadBrowserWindow();

        let self = this;
        return new Promise(function(_resolve) {

            if (self.isBrowserWindowInitialized[reloadBrowserWindowId])
            { // The browser window is already initialized, just reload the url

                self.reloadTabBrowserWindow(self.currentTab).then(function(){
                    _resolve("Tab reloaded");
                });
            }
            else
            { // The browser window must be initialized

                self.currentTab.attachToBrowserWindow(reloadBrowserWindow).then(function(){
                    self.isBrowserWindowInitialized[reloadBrowserWindowId] = true;
                    _resolve("Tab loaded in background.");
                });
            }
        });
    }

    /**
     * Shows a tab inside a browser window and moves that browser window to the top.
     *
     * @param {Tab} _tab The tab to show
     *
     * @return {Promise} The promise that shows the tab
     */
    showTab(_tab)
    {
        let self = this;
        let showTab = super.showTab.bind(this);
        return new Promise(function(_resolve){
            showTab(_tab).then(function(){
                self.topBrowserWindowId = self.getReloadBrowserWindowId();
                _resolve("Tab shown.");
            })
        });
    }

    /**
     * Detaches the tab from all browser windows.
     */
    unloadTab()
    {
        let self = this;
        let numberOfBrowserWindows = Object.keys(this.browserWindows).length;
        let numberOfDetachedBrowserWindows = 0;

        return new Promise(function(_resolve){
            for (let browserWindowId in self.browserWindows)
            {
                if (self.browserWindows.hasOwnProperty(browserWindowId))
                {
                    self.currentTab.detachFromBrowserWindow(self.browserWindows[browserWindowId]);
                    self.isBrowserWindowInitialized[browserWindowId] = false;

                    numberOfDetachedBrowserWindows++;

                    if (numberOfDetachedBrowserWindows === numberOfBrowserWindows)
                    {
                        _resolve("Detached the tab from all browser windows.");
                    }
                }
            }
        });
    }


    // Protected Methods

    /**
     * Returns the browser window for a specific tab.
     *
     * @param {Tab} _tab The tab
     *
     * @return {Promise} The promise that returns either the browser window or null if there is no browser window for that tab
     */
    getBrowserWindowForTab(_tab)
    {
        let self = this;
        return new Promise(function(_resolve){
            if (_tab === self.currentTab) _resolve(self.getReloadBrowserWindow());
            else
            {
                self.areBrowserWindowsOccupiedCheck().then(function(){
                    _resolve(self.getReloadBrowserWindow());
                });
            }
        });
    }

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @return {Promise} The promise that returns the browser window
     */
    getCurrentBrowserWindow()
    {
        let self = this;
        return new Promise(function(_resolve){
            _resolve(self.getTopBrowserWindow());
        });
    }


    // Private Methods

    /**
     * Returns the current top browser window.
     *
     * @returns {Electron.BrowserWindow} The top browser window
     */
    getTopBrowserWindow()
    {
        return this.browserWindows[this.topBrowserWindowId];
    }

    /**
     * Returns the current reload browser window.
     *
     * @returns {Electron.BrowserWindow} The reload browser window
     */
    getReloadBrowserWindow()
    {
        return this.browserWindows[this.getReloadBrowserWindowId()];
    }

    /**
     * Returns the browser window id of the current reload browser window.
     *
     * @return {string} The browser window id of the current reload browser window
     */
    getReloadBrowserWindowId()
    {
        if (this.topBrowserWindowId === "reload") return "top";
        else return "reload";
    }
}

// TODO: Add missing fields here and update documentation of stuff below
/**
 * The browser windows that can be used to load and reload tabs
 *
 * @type {Object} browserWindow
 */
ReloadBrowserWindowManager.browserWindows = null;

/**
 * The id of the browser window that is currently on top of the stack of browser windows
 * This value will be "top" if the main browser window is shown or "reload" if the reload browser window is shown
 *
 * @type {String} topBrowserWindowId
 */
ReloadBrowserWindowManager.topBrowserWindowId = null;


module.exports = ReloadBrowserWindowManager;
