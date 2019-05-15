/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { BrowserWindow, BrowserView } = require("electron");
const os = require("os");
const WebContentsDataInjector = require(__dirname + "/../WebContentsDataInjector");

/**
 * Manages the browser windows for the pavo windows.
 * Each pavo window equals one Electron.BrowserWindow and each Page equals one Electron.BrowserView.
 *
 * @property {PageDisplayer} parentPageDisplayer The parent page displayer
 * @property {Object} browserWindowConfiguration The browser window configuration
 * @property {Page} currentPage The currently shown page
 * @property {Electron.BrowserView[]} pageBrowserViews The list of page browser views (Each page gets its own browser view)
 */
class BrowserWindowManager
{
    /**
     * BrowserWindowManager constructor.
     *
     * @param {PageDisplayer} _parentPageDisplayer The parent page displayer
     * @param {Object} _browserWindowConfiguration The browser window configuration
     * @param {String[]} _defaultCssFilePaths The list of default css files
     * @param {String[]} _defaultJsFilePaths The list of default javascript file paths
     */
    constructor(_parentPageDisplayer, _browserWindowConfiguration, _defaultCssFilePaths, _defaultJsFilePaths)
    {
        this.parentPageDisplayer = _parentPageDisplayer;
        this.browserWindowConfiguration = _browserWindowConfiguration;
        this.pageBrowserViews = [];

        this.browserWindow = this.createBrowserWindow();
        this.webContentsDataInjector = new WebContentsDataInjector(
            this.parentPageDisplayer.getParentWindow().getParentWindowManager().getParentPavo().getConfigDirectoryPath(),
            _defaultCssFilePaths,
            _defaultJsFilePaths
        );

        this.webContentsDataInjector.attachToWebContents(this.browserWindow.webContents);
    }

    /**
     * Destroys the page browser views and the browser window of this BrowserWindowManager.
     *
     * @return {Promise} The promise that destroys this BrowserWindowManager
     */
    destroy()
    {
        // Destroy the browser views
        this.pageBrowserViews.forEach(function(_pageBrowserView){
            _pageBrowserView.destroy();
        });

        // Destroy the browser window
        let self = this;
        return new Promise(function(_resolve){

            self.browserWindow.on("closed", function(){
                _resolve("BrowserWindowManager destroyed");
            });
            self.browserWindow.destroy();
        });
    }


    // Getters and Setters

    /**
     * Returns the page that is currently displayed.
     *
     * @return {Page|null} The currently displayed page or null if a custom URL is displayed at the moment
     */
    getCurrentPage()
    {
        return this.currentPage;
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
        let browserView = new BrowserView({
            webPreferences: this.browserWindowConfiguration.webPreferences
        });

        this.pageBrowserViews[_page.getId()] = browserView;

        /*
         * Show all pages once on initialization to avoid first time rendering of the BrowserView's during the first
         * cycle of the page switch loop.
         */
        this.showPage(_page);

        let self = this;
        return new Promise(function(_resolve){
            _page.attachToWebContents(browserView.webContents).then(function(){
                // Resolve with the number of page browser windows
                _resolve(Object.keys(self.pageBrowserViews).length);
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
        let nextBrowserView = this.getBrowserViewForPage(_page);
        this.browserWindow.setBrowserView(nextBrowserView);
        nextBrowserView.setBounds({
            x: 0,
            y: 0,
            width: this.browserWindowConfiguration.width,
            height: this.browserWindowConfiguration.height
        });
        this.currentPage = _page;
    }

    /**
     * Reloads the browser window of this BrowserWindowManager.
     *
     * @return {Promise} The promise that reloads the browser window
     */
    reloadBrowserWindow()
    {
        let self = this;
        return new Promise(function(_resolve){

            self.browserWindow.webContents.reload();
            self.webContentsDataInjector.once("data-injected", function(){
                _resolve("BrowserWindow reloaded");
            });
        });
    }

    /**
     * Reloads the browser window for a specific page.
     *
     * @param {Page} _page The page
     *
     * @return {Promise} The promise that reloads the browser window for the page
     */
    reloadPageBrowserView(_page)
    {
        let pageWebContents = this.getBrowserViewForPage(_page).webContents;

        return new Promise(function(_resolve){

            pageWebContents.reload();
            _page.once("data-injected", function (){

                if (pageWebContents.isLoadingMainFrame())
                {
                    pageWebContents.on("did-finish-load", function(){
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
     * @return {Electron.BrowserView|null} The browser window of the page or null
     */
    getBrowserViewForPage(_page)
    {
        if (_page) return this.pageBrowserViews[_page.getId()];
        else return null;
    }

    /**
     * Loads a custom URL into the browser window and unsets the browser view.
     *
     * @param {String} _url The custom URL
     * @param {String} _fallbackUrl The URL that will be loaded if the custom URL fails to load
     *
     * @return {Promise} The promise that loads the custom URL into the browser window and unsets the browser view
     */
    loadCustomURL(_url, _fallbackUrl)
    {
        let navigateEventHandler, loadFailedEventHandler;

        let self = this;
        return new Promise(function(_resolve, _reject){

            navigateEventHandler = function(){
                self.browserWindow.webContents.removeListener("did-fail-load", loadFailedEventHandler);
                self.currentPage = null;
                self.browserWindow.setBrowserView(null);
                _resolve(self.browserWindow.webContents.getURL());
            };
            self.browserWindow.webContents.once("did-navigate", navigateEventHandler);

            loadFailedEventHandler = function(_event, _errorCode, _errorDescription){
                self.browserWindow.webContents.removeListener("did-navigate", navigateEventHandler);

                // Load the fallback URL
                if (_fallbackUrl) self.browserWindow.webContents.loadURL(_fallbackUrl);

                _reject(_errorDescription);
            };
            self.browserWindow.webContents.once("did-fail-load", loadFailedEventHandler);

            self.browserWindow.webContents.loadURL(_url);
        });
    }

    /**
     * Loads a empty page into the browser window.
     */
    unloadCustomURL()
    {
        this.browserWindow.webContents.loadURL("about:blank");
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

        if (os.platform() === "darwin")
        {
            /*
             * With these settings the BrowserWindow can overlay the dock at the bottom of the screen.
             * However the menu bar at the top must be hidden via the system settings in order for the BrowserWindow
             * to use the full screen height.
             */
            browserWindow.setAlwaysOnTop(true, "screen-saver", -1);

            this.browserWindowConfiguration.height = this.browserWindowConfiguration.realHeight;
            delete this.browserWindowConfiguration.realHeight;
        }

        browserWindow.setBounds({
            x: this.browserWindowConfiguration.x,
            y: this.browserWindowConfiguration.y,
            width: this.browserWindowConfiguration.width,
            height: this.browserWindowConfiguration.height
        });

        return browserWindow;
    }
}


module.exports = BrowserWindowManager;
