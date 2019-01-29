/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { BrowserWindow } = require("electron");

/**
 * Manages the browser windows for the pages.
 *
 * @property {Object} browserWindowConfiguration The browser window configuration
 * @property {Page} currentPage The currently shown page
 * @property {Electron.BrowserWindow[]} pageBrowserWindows The list of page browser windows (Each page gets its own browser window)
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
        this.currentPage = null;
        this.pageBrowserWindows = [];
    }


    // Public Methods

    /**
     * Adds a page to this browser window manager.
     *
     * @param {Page} _page The page
     *
     * @return {Promise} The promise that adds the page to this browser window manager
     */
    addPage(_page)
    {
        let browserWindow = this.createBrowserWindow();

        let self = this;
        return new Promise(function(_resolve){
            _page.attachToWebContents(browserWindow.webContents).then(function(){
                self.pageBrowserWindows[_page.getId()] = browserWindow;

                // Resolve with the number of page browser windows
                _resolve(Object.keys(self.pageBrowserWindows).length);
            });
        });
    }

    /**
     * Shows a page inside a browser window and moves that browser window to the top.
     * Must be called after the previous browser window was hidden with hideCurrentBrowserWindow().
     *
     * @param {Page} _page The page to show
     */
    showPage(_page)
    {
        let nextTopBrowserWindow = this.getBrowserWindowForPage(_page);
        nextTopBrowserWindow.setAlwaysOnTop(true);

        // Remove focus from the top browser window to avoid the top bar in unity "shining through" the window
        nextTopBrowserWindow.blur();

        this.currentPage = _page;
    }

    /**
     * Hides the currently shown page.
     */
    hideCurrentBrowserWindow()
    {
        let currentBrowserWindow = this.getCurrentBrowserWindow();
        if (currentBrowserWindow)
        {
            currentBrowserWindow.setAlwaysOnTop(false);
            this.currentPage = null;
        }
    }

    /**
     * Reloads the browser window for a specific page.
     *
     * @param {Page} _page The page
     *
     * @return {Promise} The promise that reloads the browser window for the page
     */
    reloadPageBrowserWindow(_page)
    {
        let pageBrowserWindow = this.getBrowserWindowForPage(_page);

        return new Promise(function(_resolve){

            if (pageBrowserWindow.webContents.getURL() === _page.url)
            {
                /*
                 * The browser window must be reloaded with loadURL instead of BrowserWindow.webContents.reload()
                 * because the options in the url will be passed to the web server again this way
                 *
                 * @todo: Use webContents.reload if url doesn't contain options
                 * @todo: Also check if webContents.reload() really doesn't resend the options ....
                 */
                pageBrowserWindow.reload();
            }
            else pageBrowserWindow.loadURL(_page.url);

            _page.once("css files injected", function (){

                if (pageBrowserWindow.webContents.isLoadingMainFrame())
                {
                    pageBrowserWindow.webContents.on("did-finish-load", function(){
                        _resolve("Page reload complete");
                    });
                }
                else _resolve("Page reload already complete");
            });
        });
    }

    /**
     * Returns the browser window for a specific page.
     *
     * @param {Page} _page The page
     *
     * @return {Electron.BrowserWindow|null} The browser window of the page or null
     */
    getBrowserWindowForPage(_page)
    {
        if (_page) return this.pageBrowserWindows[_page.getId()];
        else return null;
    }

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @return {Electron.BrowserWindow|null} The current browser window or null
     */
    getCurrentBrowserWindow()
    {
        return this.getBrowserWindowForPage(this.currentPage);
    }


    // Private Methods

    /**
     * Creates and returns a browser window with the browser window configuration of this browser window manager.
     *
     * @return {Electron.BrowserWindow} The browser window
     * @private
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
}


module.exports = BrowserWindowManager;
