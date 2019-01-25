/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { BrowserWindow } = require("electron");

/**
 * Manages the browser windows for the tabs.
 *
 * @property {Object} browserWindowConfiguration The browser window configuration
 * @property {Tab} currentTab The currently shown tab
 * @property {BrowserWindow[]} tabBrowserWindows The list of tab browser windows (Each tab gets its own browser window)
 */
class BrowserWindowManager
{
    /**
     * BrowserWindowManager constructor.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     */
    constructor(_browserWindowConfiguration)
    {
        this.browserWindowConfiguration = _browserWindowConfiguration;
        this.currentTab = null;
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
     * Shows a tab inside a browser window and moves that browser window to the top.
     * Must be called after the previous browser window was hidden with hideCurrentBrowserWindow().
     *
     * @param {Tab} _tab The tab to show
     */
    showTab(_tab)
    {
        let nextTopBrowserWindow = this.getBrowserWindowForTab(_tab);
        nextTopBrowserWindow.setAlwaysOnTop(true);

        // Remove focus from the top browser window to avoid the top bar in unity "shining through" the window
        nextTopBrowserWindow.blur();

        this.currentTab = _tab;
    }

    /**
     * Hides the currently shown tab.
     */
    hideCurrentBrowserWindow()
    {
        let currentBrowserWindow = this.getCurrentBrowserWindow();
        if (currentBrowserWindow)
        {
            currentBrowserWindow.setAlwaysOnTop(false);
            this.currentTab = null;
        }
    }


    // Protected Methods

    /**
     * Creates and returns a browser window with the browser window configuration of this browser window manager.
     *
     * @return {Electron.BrowserWindow} The browser window
     */
    createBrowserWindow()
    {
        let browserWindow = new BrowserWindow(this.browserWindowConfiguration);

        // Clear the browser windows cache on application close
        browserWindow.on("close", function(){
            browserWindow.webContents.session.clearStorageData();
        });

        if (! this.browserWindowConfiguration.fullscreen)
        {
            /*
             * When the browser window is created it replaces the width and height if these values are bigger than the displays "workarea".
             * The displays workarea subtracts the size of the bars from the real screen size in the Unity desktop environment.
             * By setting the bounds manually you can bypass the workarea limitations and use up to the real screen sizes height and width.
             */
            browserWindow.setBounds({
                x: this.browserWindowConfiguration.x,
                y: this.browserWindowConfiguration.y,
                height: this.browserWindowConfiguration.height,
                width: this.browserWindowConfiguration.width
            });
        }

        return browserWindow;
    }

    /**
     * Reloads the browser window for a specific tab.
     *
     * @param {Tab} _tab The tab
     *
     * @returns {Promise} The promise that reloads the browser window for the tab
     */
    reloadTabBrowserWindow(_tab)
    {
        let tabBrowserWindow = this.getBrowserWindowForTab(_tab);

        return new Promise(function(_resolve){

            if (tabBrowserWindow.webContents.getURL() === _tab.url)
            {
                /*
                 * The browser window must be reloaded with loadURL instead of BrowserWindow.webContents.reload()
                 * because the options in the url will be passed to the web server again this way
                 *
                 * @todo: Use webContents.reload if url doesn't contain options
                 * @todo: Also check if webContents.reload() really doesn't resend the options ....
                 */
                tabBrowserWindow.reload();
            }
            else tabBrowserWindow.loadURL(_tab.url);

            _tab.once("css files injected", function (){

                if (tabBrowserWindow.webContents.isLoadingMainFrame())
                {
                    tabBrowserWindow.webContents.on("did-finish-load", function(){
                        _resolve("Tab reload complete");
                    });
                }
                else _resolve("Tab reload already complete");
            });
        });
    }

    /**
     * Returns the browser window for a specific tab.
     *
     * @param {Tab} _tab The tab
     *
     * @return {BrowserWindow|null} The browser window of the tab or null
     */
    getBrowserWindowForTab(_tab)
    {
        if (_tab) return this.tabBrowserWindows[_tab.displayId];
        else return null;
    }

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @return {BrowserWindow|null} The current browser window or null
     */
    getCurrentBrowserWindow()
    {
        return this.getBrowserWindowForTab(this.currentTab);
    }
}


module.exports = BrowserWindowManager;
