/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { BrowserWindow } = require("electron");

/**
 * Abstract class that defines which methods must be provided by a browser window manager.
 *
 * Note: This is not a real abstract class, child classes may ignore the base methods.
 */
class BaseBrowserWindowManager
{
    /**
     * BaseBrowserWindowManager constructor.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     */
    constructor(_browserWindowConfiguration)
    {
        this.browserWindowConfiguration = _browserWindowConfiguration;
        this.currentTab = null;
    }


    // Public Methods

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
        return new Promise(function(_resolve){
            self.getBrowserWindowForTab(_tab).then(function(_nextTopBrowserWindow){
                _nextTopBrowserWindow.setAlwaysOnTop(true);

                self.hideCurrentBrowserWindow().then(function(){

                    // Remove focus from the top browser window to avoid the top bar in unity "shining through" the window
                    _nextTopBrowserWindow.blur();

                    self.currentTab = _tab;
                    _resolve("Tab shown");
                });
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
        let self = this;
        return new Promise(function(_resolve, _reject){
            if (self.currentTab)
            {
                self.getCurrentBrowserWindow().then(function(_currentTopBrowserWindow){

                    if (_currentTopBrowserWindow)
                    {
                        _currentTopBrowserWindow.setAlwaysOnTop(false);
                        _resolve("Current browser window hidden.");
                    }
                    else _reject("No browser window for current tab found.");
                });
            }
            else _resolve("No current browser window to hide.");
        });
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
        let self = this;
        return new Promise(function(_resolve){
            self.getBrowserWindowForTab(_tab).then(function(_tabBrowserWindow){

                if (_tabBrowserWindow.webContents.getURL() === _tab.url)
                {
                    /*
                     * The browser window must be reloaded with loadURL instead of BrowserWindow.webContents.reload()
                     * because the options in the url will be passed to the web server again this way
                     *
                     * @todo: Use webContents.reload if url doesn't contain options
                     * @todo: Also check if webContents.reload() really doesn't resend the options ....
                     */
                    _tabBrowserWindow.reload();
                }
                else _tabBrowserWindow.loadURL(_tab.url);

                _tab.once("css files injected", function (){

                    if (_tabBrowserWindow.webContents.isLoadingMainFrame())
                    {
                        _tabBrowserWindow.webContents.on("did-finish-load", function(){
                            _resolve("Tab reload complete");
                        });
                    }
                    else _resolve("Tab reload already complete");
                });
            });
        });
    }

    /**
     * Returns the browser window for a specific tab.
     *
     * @param {Tab} _tab The tab
     *
     * @return {Promise} The promise that returns either the browser window or null if there is no browser window for that tab
     */
    getBrowserWindowForTab(_tab)
    {
    }

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @return {Promise} The promise that returns the browser window
     */
    getCurrentBrowserWindow()
    {
    }
}


/**
 * The browser window configuration
 *
 * @type {Object} browserWindowConfiguration
 */
BaseBrowserWindowManager.browserWindowConfiguration = null;

/**
 * The currently shown tab
 *
 * @type {Tab} currentTab
 */
BaseBrowserWindowManager.currentTab = null;


module.exports = BaseBrowserWindowManager;
