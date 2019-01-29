/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");
const BrowserWindowManager = require(__dirname + "/BrowserWindowManager");
const PageReloadLoop = require(__dirname + "/PageReloadLoop");
const pageDisplayerLogger = require("log4js").getLogger("pageDisplayer");

/**
 * Manages showing and hiding of pages for a window.
 * This class can only show pages from the page list that it was initialized with.
 *
 * @property {Page} currentPage The page that is currently displayed
 * @property {Page} customUrlPage The page that is currently used to display a custom URL
 * @property {PageList} pageList The page list
 * @property {PageReloadLoop} pageReloadLoop The page reload loop which is used to display reload pages
 * @property {BrowserWindowManager} browserWindowManager The browser window manager
 */
class PageDisplayer extends EventEmitter
{
    /**
     * PageDisplayer constructor.
     */
    constructor()
    {
        super();

        this.currentPage = null;
        this.customUrlPage = null;
    }


    // Getters and Setters

    /**
     * Returns the currently displayed page.
     *
     * @return {Page} The currently displayed page
     */
    getCurrentPage()
    {
        return this.currentPage;
    }

    /**
     * Returns the page list.
     *
     * @return {PageList} The page list
     */
    getPageList()
    {
        return this.pageList;
    }

    /**
     * Returns the page reload loop.
     *
     * @return {PageReloadLoop} The page reload loop
     */
    getPageReloadLoop()
    {
        return this.pageReloadLoop;
    }

    /**
     * Returns the page that is currently used to display a custom URL.
     *
     * @return {null|Page} The page that is currently used to display a custom URL or null if no custom URL is displayed at the moment
     */
    getCustomUrlPage()
    {
        return this.customUrlPage;
    }


    // Public Methods

    /**
     * Initializes the PageDisplayer.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     * @param {PageList} _pageList The page list
     *
     * @return {Promise} The promise that initializes the PageDisplayer
     */
    initialize(_browserWindowConfiguration, _pageList)
    {
        this.pageList = _pageList;
        this.browserWindowManager = new BrowserWindowManager(_browserWindowConfiguration);

        // Initialize the browser window managers (if needed)
        let self = this;
        return new Promise(function(_resolve){
            self.initializePages(_pageList).then(function(){
                if (_pageList.containsReloadPages()) self.pageReloadLoop = new PageReloadLoop(self.browserWindowManager);
                _resolve("PageDisplayer initialized");
            });
        });
    }

    /**
     * Moves a specific page to the top of the stack of browser windows.
     *
     * @param {Page} _page The page
     * @param {Boolean} _startReloadLoopForReloadPages If true the reload loop will be started if the page is a reload page
     *
     * @return {Promise} The promise that moves the page to the top of the stack of browser windows
     */
    showPage(_page, _startReloadLoopForReloadPages)
    {
        if (! _page)
        {
            return new Promise(function(_resolve, _reject){
                _reject("Page not set");
            });
        }
        else if (_page === this.currentPage)
        {
            return new Promise(function(_resolve){
                _resolve("No page switch necessary");
            });
        }


        pageDisplayerLogger.debug("Showing page #" + _page.getDisplayId());

        let self = this;
        return new Promise(function(_resolve){
            self.hideCurrentPage();
            self.browserWindowManager.showPage(_page);
            self.startPageReloadLoop(_page, _startReloadLoopForReloadPages).then(function(){
                self.currentPage = _page;
                _resolve("Switched to next page");
            });
        });
    }

    /**
     * Reloads a page if it is a static page.
     *
     * @param {Page} _page The page
     *
     * @return {Promise} The promise that reloads the page if its static
     */
    reloadPage(_page)
    {
        let self  =this;
        return new Promise(function(_resolve){
            pageDisplayerLogger.debug("Reloading page #" + _page.getDisplayId());
            self.browserWindowManager.reloadPageBrowserWindow(_page).then(function() {
                _resolve("Page reloaded.");
            });
        });
    }

    /**
     * Displays a custom url in the current top browser window.
     *
     * @param {String} _url The url to display in the current top browser window
     *
     * @return {Promise} The promise that displays a custom url in the current top browser window
     *
     * @emits The "customUrlLoad" event on web contents navigation
     */
    displayCustomURL(_url)
    {
        pageDisplayerLogger.debug("Displaying custom url \"" + _url + "\" in page #" + this.currentPage.getDisplayId());
        this.customUrlPage = this.currentPage;
        let currentTopBrowserWindow = this.getCurrentTopBrowserWindow();

        let self = this;
        return new Promise(function(_resolve, _reject){
            if (! currentTopBrowserWindow) _reject("ERROR: Window has no top browser window");
            else
            {
                currentTopBrowserWindow.loadURL(_url);
                currentTopBrowserWindow.webContents.once("did-navigate", function(){
                    self.emit("customUrlLoad", { page: self.currentPage, url: currentTopBrowserWindow.webContents.getURL() });
                    _resolve("URL loaded into browser window");
                });
            }
        });
    }

    /**
     * Restores the original page of the current page.
     */
    restoreOriginalPage()
    {
        if (this.customUrlPage !== null)
        {
            let browserWindow = this.browserWindowManager.getBrowserWindowForPage(this.customUrlPage);
            if (browserWindow)
            {
                if (browserWindow.getURL() !== this.customUrlPage.getURL())
                {
                    browserWindow.loadURL(this.customUrlPage.getURL());
                }
                this.customUrlPage = null;
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

    /**
     * Returns the browser window that is currently on top of the stack of browser windows.
     *
     * @return {Electron.BrowserWindow|null} The browser window or null if no browser window is on top
     */
    getCurrentTopBrowserWindow()
    {
        return this.browserWindowManager.getCurrentBrowserWindow();
    }


    // Private Methods

    /**
     * Adds all pages to the browser window manager
     * The pages are initialized one by one in order to lower the CPU stress.
     * A nice side effect is that automatic login's are automatically applied to all pages that are initialized after the initial login page.
     *
     * @param {PageList} _pageList The page list
     * @param {int} _currentPageIndex The current page index (default: 0)
     *
     * @return {Promise} The promise that initializes the pages
     * @private
     */
    initializePages(_pageList, _currentPageIndex = 0)
    {
        let pages = _pageList.getPages();
        let currentPage = pages[_currentPageIndex];

        let self = this;
        return new Promise(function(_resolve){

            self.browserWindowManager.addPage(currentPage).then(function(){
                if (_currentPageIndex === pages.length - 1) _resolve("Page initialization finished");
                else
                {
                    self.initializePages(_pageList, ++_currentPageIndex).then(function(_message){
                        _resolve(_message);
                    });
                }
            });
        });
    }

    /**
     * Starts the page reload loop for a page if necessary.
     *
     * @param {Page} _page The page
     * @param {Boolean} _reloadLoopStartIsAllowed If true the reload loop will be started if necessary
     *
     * @return {Promise} The promise that starts the reload loop if necessary
     * @private
     */
    startPageReloadLoop(_page, _reloadLoopStartIsAllowed)
    {
        let self = this;
        return new Promise(function(_resolve){

            if (_page.getReloadTime() === 0) _resolve("No page reload loop start necessary");
            else
            {
                self.pageReloadLoop.initialize(_page);

                if (_reloadLoopStartIsAllowed)
                {
                    self.pageReloadLoop.start().then(function(){
                        _resolve("Page reload loop started");
                    });
                }
                else _resolve("Page reload loop start not allowed");
            }
        });
    }

    /**
     * Hides the currently displayed page.
     * @private
     */
    hideCurrentPage()
    {
        if (this.currentPage !== null)
        {
            pageDisplayerLogger.debug("Hiding page #" + this.currentPage.getDisplayId());

            if (this.pageReloadLoop && this.pageReloadLoop.getIsActive()) this.pageReloadLoop.stop();
            this.browserWindowManager.hideCurrentBrowserWindow();
        }
    }
}


module.exports = PageDisplayer;
