/**
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
 * @property {Window} parentWindow The parent window
 * @property {Page} currentPage The page that is currently displayed
 * @property {string} customURL The custom URL that is displayed (null if no custom URL is displayed at the moment)
 * @property {PageList} pageList The page list
 * @property {PageReloadLoop} pageReloadLoop The page reload loop which is used to display reload pages
 * @property {BrowserWindowManager} browserWindowManager The browser window manager
 */
class PageDisplayer extends EventEmitter
{
    /**
     * PageDisplayer constructor.
     */
    constructor(_parentWindow)
    {
        super();
        this.parentWindow = _parentWindow;
    }

    /**
     * Destroys this PageDisplayer.
     *
     * @return {Promise} The promise that destroys this PageDisplayer
     */
    destroy()
    {
        return this.browserWindowManager.destroy();
    }


    // Getters and Setters

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
     * Returns the custom URL that is displayed.
     *
     * @return {string|null} The custom URL that is displayed or null if no custom URL is displayed at the moment
     */
    getCustomURL()
    {
        return this.customURL;
    }


    // Public Methods

    /**
     * Initializes the PageDisplayer.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration
     * @param {Object} _defaultPageSettings The list of default page settings
     * @param {PageList} _pageList The page list
     *
     * @return {Promise} The promise that initializes the PageDisplayer
     */
    initialize(_browserWindowConfiguration, _defaultPageSettings, _pageList)
    {
        this.pageList = _pageList;
        this.browserWindowManager = new BrowserWindowManager(this, _browserWindowConfiguration, _defaultPageSettings.cssFiles, _defaultPageSettings.jsFiles);

        // Initialize the browser window managers (if needed)
        let self = this;
        return new Promise(function(_resolve){
            self.initializePages(_pageList).then(function(){
                self.showPage(_pageList.getPage(0), false).then(function(){
                    if (_pageList.containsReloadPages()) self.pageReloadLoop = new PageReloadLoop(self.browserWindowManager);
                    _resolve("PageDisplayer initialized");
                });
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
        else if (_page === this.browserWindowManager.getCurrentPage())
        {
            if (_page !== this.currentPage) this.currentPage = _page;

            return new Promise(function(_resolve){
                _resolve("No page switch necessary");
            });
        }


        pageDisplayerLogger.debug("Showing page #" + _page.getDisplayId());

        let self = this;
        return new Promise(function(_resolve){
            self.stopPageReloadLoop();
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
            self.browserWindowManager.reloadPageBrowserView(_page).then(function() {
                _resolve("Page reloaded.");
            });
        });
    }

    /**
     * Displays a custom url in the browser window.
     *
     * @param {String} _url The url to display in the current top browser window
     *
     * @return {Promise} The promise that displays a custom url in the browser window
     *
     * @emits The "customUrlLoad" event on web contents navigation
     */
    displayCustomURL(_url)
    {
        pageDisplayerLogger.debug("Displaying custom url \"" + _url + "\" in window #" + this.parentWindow.getId());

        let self = this;
        return new Promise(function(_resolve){
            self.browserWindowManager.loadCustomURL(_url).then(function(_realURL){
                delete self.displayedText;
                self.customURL = _realURL;
                self.emit("customUrlLoad", { url: _realURL });
                _resolve("URL loaded into browser window");
            });
        });
    }

    /**
     * Returns whether this PageDisplayer is currently displaying a custom URL.
     *
     * @return {Boolean} True if this PageDisplayer is currently displaying a custom URL, false otherwise
     */
    isDisplayingCustomURL()
    {
        return (this.customURL && ! this.browserWindowManager.getCurrentPage());
    }

    /**
     * Displays custom text in the browser window.
     *
     * @param {String} _text The text to show
     *
     * @return {Promise} The promise that shows the text inside the browser window
     *
     * @emits The "displayText" event on web contents navigation
     */
    displayText(_text)
    {
        pageDisplayerLogger.debug("Displaying text \"" + _text + "\" in window #" + this.parentWindow.getId());

        let textUrl = "http://127.0.0.1:8080/show-text?text=" + _text;

        let self = this;
        return new Promise(function(_resolve){
            self.browserWindowManager.loadCustomURL(textUrl).then(function(){
                delete self.customURL;
                self.displayedText = _text;
                self.emit("displayText", { text: _text });
                _resolve("Text shown in browser window");
            });
        });
    }

    /**
     * Returns whether this PageDisplayer is currently displaying custom text.
     *
     * @return {Boolean} True if this PageDisplayer is currently displaying custom text, false otherwise
     */
    isDisplayingText()
    {
        return (this.displayedText && ! this.browserWindowManager.getCurrentPage());
    }


    /**
     * Restores the original page of the current page.
     */
    restoreOriginalPage()
    {
        if (this.customURL || this.displayedText)
        {
            this.browserWindowManager.showPage(this.currentPage);
            delete this.customURL;
            delete this.displayedText;

            this.browserWindowManager.unloadCustomURL();
        }
    }

    /**
     * Reloads the current page.
     *
     * @return {Promise} The promise that reloads the current page
     */
    reloadCurrentPage()
    {
        if (this.isDisplayingCustomURL()) return this.browserWindowManager.reloadBrowserWindow();
        else return this.browserWindowManager.reloadPageBrowserView(this.currentPage);
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
     * Stops the page reload loop if one is running at the moment.
     * @private
     */
    stopPageReloadLoop()
    {
        if (this.currentPage !== null)
        {
            if (this.pageReloadLoop && this.pageReloadLoop.getIsActive()) this.pageReloadLoop.stop();
        }
    }
}


module.exports = PageDisplayer;
