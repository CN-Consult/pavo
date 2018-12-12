/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");
const BrowserWindowManager = require(__dirname + "/BrowserWindowManager");
const TabReloadLoop = require(__dirname + "/TabReloadLoop");
const tabDisplayerLogger = require("log4js").getLogger("tabDisplayer");

/**
 * Manages showing and hiding of tabs for a window.
 * This class can only show tabs from the tab list that it was initialized with.
 */
class TabDisplayer extends EventEmitter
{
    /**
     * TabDisplayer constructor.
     */
    constructor()
    {
        super();

        this.currentTab = null;
        this.customPageTab = null;
    }


    // Getters and Setters

    /**
     * Returns the currently displayed tab.
     *
     * @returns {Tab} The currently displayed tab
     */
    getCurrentTab()
    {
        return this.currentTab;
    }

    /**
     * Returns the tab list.
     *
     * @returns {TabList} The tab list
     */
    getTabList()
    {
        return this.tabList;
    }

    /**
     * Returns the tab reload loop.
     *
     * @return {TabReloadLoop} The tab reload loop
     */
    getTabReloadLoop()
    {
        return this.tabReloadLoop;
    }

    /**
     * Returns whether the tab displayer displays a custom page at the moment.
     *
     * @return {null|Tab} The tab whose browser window displays a custom url or null
     */
    getCustomPageTab()
    {
        return this.customPageTab;
    }


    // Public Methods

    /**
     * Initializes the TabDisplayer.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     * @param {TabList} _tabList The tab list
     *
     * @return {Promise} The promise that initializes the TabDisplayer
     */
    initialize(_browserWindowConfiguration, _tabList)
    {
        this.tabList = _tabList;

        // Initialize the browser window managers (if needed)
        let self = this;
        return new Promise(function(_resolve){
            self.initializeBrowserWindowManager(_browserWindowConfiguration, _tabList).then(function(){
                if (_tabList.containsReloadTabs()) self.tabReloadLoop = new TabReloadLoop(self.browserWindowManager);
                _resolve("TabSwitcher initialized");
            });
        });
    }

    /**
     * Moves a specific tab to the top of the stack of browser windows.
     *
     * @param {Tab} _tab The tab
     * @param {Boolean} _startReloadLoopForReloadTabs If true the reload loop will be started if the tab is a reload tab
     *
     * @returns {Promise} The promise that moves the tab to the top of the stack of browser windows
     */
    showTab(_tab, _startReloadLoopForReloadTabs)
    {
        if (! _tab)
        {
            return new Promise(function(_resolve, _reject){
                _reject("Tab not set");
            });
        }
        else if (_tab === this.currentTab)
        {
            return new Promise(function(_resolve){
                _resolve("No tab switch necessary");
            });
        }


        tabDisplayerLogger.debug("Showing tab #" + _tab.getDisplayId());

        let self = this;
        let startTabReloadLoopIfNecessary = new Promise(function(_resolve){

            if (_tab.getReloadTime() === 0) _resolve("No tab reload loop start necessary");
            else
            {
                self.tabReloadLoop.initialize(_tab);

                if (_startReloadLoopForReloadTabs)
                {
                    self.tabReloadLoop.start().then(function(){
                        _resolve("Tab reload loop started");
                    });
                }
                else _resolve("No tab reload loop start wanted");
            }
        });

        return new Promise(function(_resolve){
            self.hideCurrentTab();
            self.browserWindowManager.showTab(_tab);
            startTabReloadLoopIfNecessary.then(function(){
                self.currentTab = _tab;
                _resolve("Switched to next tab");
            });
        });

    }

    /**
     * Reloads a tab if it is a static tab.
     *
     * @param {Tab} _tab The tab
     *
     * @returns {Promise} The promise that reloads the tab if its static
     */
    reloadTab(_tab)
    {
        let self  =this;
        return new Promise(function(_resolve){
            tabDisplayerLogger.debug("Reloading tab #" + _tab.getDisplayId());

            self.browserWindowManager.reloadTabBrowserWindow(_tab).then(function() {
                _resolve("Tab reloaded.");
            });
        });
    }

    /**
     * Displays a custom url in the current top browser window.
     *
     * @param {String} _url The url to display in the current top browser window
     *
     * @return {Promise} The promise that displays a custom url in the current top browser window
     */
    displayCustomURL(_url)
    {
        tabDisplayerLogger.debug("Displaying custom url \"" + _url + "\" in tab #" + this.currentTab.getDisplayId());
        this.customPageTab = this.currentTab;
        let currentTopBrowserWindow = this.getCurrentTopBrowserWindow();

        let self = this;
        return new Promise(function(_resolve, _reject){
            if (! currentTopBrowserWindow) _reject("ERROR: Window has no top browser window");
            else
            {
                currentTopBrowserWindow.loadURL(_url);
                currentTopBrowserWindow.webContents.once("did-navigate", function(){
                    self.emit("customUrlLoad", { tab: self.currentTab, url: currentTopBrowserWindow.webContents.getURL() });
                    _resolve("URL loaded into browser window");
                });
            }
        });
    }

    /**
     * Restores the original page of the current tab.
     */
    restoreOriginalPage()
    {
        if (this.customPageTab !== null)
        {
            let browserWindow = this.browserWindowManager.getBrowserWindowForTab(this.customPageTab);
            if (browserWindow)
            {
                // TODO: Only if url is different
                browserWindow.loadURL(this.customPageTab.getURL());
                this.customPageTab = null;
            }
        }
    }

    /**
     * Reloads the current page.
     */
    reloadCurrentPage()
    {
        let topBrowserWindow = this.getCurrentTopBrowserWindow();
        topBrowserWindow.webContents.reload();
        // TODO: Return promise that resolves on reload done
    }


    // Private Methods

    /**
     * Initializes the static browser window manager if necessary.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     * @param {TabList} _tabList The tab list
     *
     * @return {Promise} The promise that initializes the static browser window manager if necessary
     */
    initializeBrowserWindowManager(_browserWindowConfiguration, _tabList)
    {
        this.browserWindowManager = new BrowserWindowManager(_browserWindowConfiguration);

        // Add all tabs to the browser window manager
        let numberOfTabs = _tabList.getTabs().length;

        let self = this;
        return new Promise(function(_resolve){
            _tabList.getTabs().forEach(function(_tab){
                // TODO: Initialize tabs one by one instead of asynchronous (to lower CPU stress)
                self.browserWindowManager.addTab(_tab).then(function(_numberOfTabBrowserWindows){
                    if (_numberOfTabBrowserWindows === numberOfTabs)
                    {
                        _resolve("All static tabs initialized.");
                    }
                });
            });
        });

    }

    /**
     * Hides the currently displayed tab.
     */
    hideCurrentTab()
    {
        if (this.currentTab !== null)
        {
            tabDisplayerLogger.debug("Hiding tab #" + this.currentTab.getDisplayId());

            if (this.tabReloadLoop && this.tabReloadLoop.getIsActive()) this.tabReloadLoop.stop();
            this.browserWindowManager.hideCurrentBrowserWindow();
        }
    }

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @returns {BrowserWindow|null} The browser window or null if no browser window is on top
     */
    getCurrentTopBrowserWindow()
    {
        return this.browserWindowManager.getCurrentBrowserWindow();
    }
}


/**
 * The tab that is currently displayed
 *
 * @type {Tab} currentTab
 */
TabDisplayer.currentTab = null;

/**
 * The tab list
 *
 * @type {TabList} tabList
 */
TabDisplayer.tabList = null;

/**
 * The tab reload loop which is used to display reload tabs
 *
 * @type {TabReloadLoop} tabReloadLoop
 */
TabDisplayer.tabReloadLoop = null;

/**
 * The browser window manager
 *
 * @type {BrowserWindowManager} browserWindowManager
 */
TabDisplayer.browserWindowManager = null;


module.exports = TabDisplayer;
