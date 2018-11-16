/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BrowserWindowManager = require(__dirname + "/BaseBrowserWindowManager");

/**
 * Manages the browser window usage for static tabs (tabs with a reload time of 0 seconds).
 */
class StaticBrowserWindowManager extends BrowserWindowManager
{
    /**
     * StaticBrowserWindowManager constructor.
     *
     * @param {object} _browserWindowConfiguration The browser window configuration
     */
    constructor(_browserWindowConfiguration)
    {
        super(_browserWindowConfiguration);

        this.tabBrowserWindows = [];
    }


    // Public Methods

    /**
     * Adds a tab to this browser window manager.
     *
     * @param {Tab} _tab The tab
     *
     * @return {Promise} The promise that adds the tab to this browser window manager
     */
    addTab(_tab)
    {
        let browserWindow = this.createBrowserWindow();

        let self = this;

        return new Promise(function(_resolve){
            _tab.attachToBrowserWindow(browserWindow).then(function(){
                self.tabBrowserWindows[_tab.displayId] = browserWindow;

                // Resolve with the number of tab browser windows
                _resolve(Object.keys(self.tabBrowserWindows).length);
            });
        });
    }

    /**
     * Hides the currently shown tab.
     *
     * @return {Promise} The promise that hides the currently shown tab
     */
    hideCurrentBrowserWindow()
    {
        let hideCurrentBrowserWindow = super.hideCurrentBrowserWindow.bind(this);

        let self = this;
        return new Promise(function(_resolve){
            hideCurrentBrowserWindow().then(function(){
                self.currentTab = null;
                _resolve("Current browser window hidden");
            })
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
        return new Promise(function(_resolve, _reject){

            if (_tab)
            {
                let tabBrowserWindow = self.tabBrowserWindows[_tab.displayId];

                if (tabBrowserWindow) _resolve(tabBrowserWindow);
                else _reject("No browser window available for tab #" + _tab.displayId);
            }
            else _reject("No browser window provided.");
        });
    }

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @return {Promise} The promise that returns the browser window
     */
    getCurrentBrowserWindow()
    {
        return this.getBrowserWindowForTab(this.currentTab);
    }
}


/**
 * The list of tab browser windows.
 * Each tab gets its own browser window.
 *
 * @type {BrowserWindow[]} tabBrowserWindows
 */
StaticBrowserWindowManager.tabBrowserWindows = null;


module.exports = StaticBrowserWindowManager;
