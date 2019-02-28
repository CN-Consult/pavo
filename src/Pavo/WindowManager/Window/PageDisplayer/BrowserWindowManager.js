/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { BrowserWindow, BrowserView } = require("electron");
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
        browserView.setBounds({
            x: 0,
            y: 0,
            width: this.browserWindowConfiguration.width,
            height: this.browserWindowConfiguration.height
        });

        if (_page.id === 0) this.browserWindow.setBrowserView(browserView);

        let self = this;
        return new Promise(function(_resolve){
            _page.attachToWebContents(browserView.webContents).then(function(){
                self.pageBrowserViews[_page.getId()] = browserView;

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
     *
     * @return {Promise} The promise that loads the custom URL into the browser window and unsets the browser view
     */
    loadCustomURL(_url)
    {
        this.currentPage = null;
        this.browserWindow.setBrowserView(null);
        this.browserWindow.webContents.loadURL(_url);

        let self = this;
        return new Promise(function(_resolve){
            self.browserWindow.webContents.once("did-navigate", function(){
                _resolve(self.browserWindow.webContents.getURL());
            });
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
