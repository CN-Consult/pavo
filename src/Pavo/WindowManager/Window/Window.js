/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const os = require("os");
const ObjectMerger = require(__dirname + "/../../../Util/ObjectMerger");
const Page = require(__dirname + "/PageList/Page");
const PageList = require(__dirname + "/PageList/PageList");
const PageDisplayer = require(__dirname + "/PageDisplayer/PageDisplayer");
const PageSwitchLoop = require(__dirname + "/PageSwitchLoop");
const windowLogger = require("log4js").getLogger("window");

/**
 * Creates and stores the pages and the configuration of a single window.
 *
 * @property {int} id The window id
 * @property {int} displayId The id that will be displayed in the logs and in the user interface
 * @property {Object} configuration The loaded window configuration
 * @property {ObjectMerger} objectMerger The object merger
 * @property {PageDisplayer} pageDisplayer The page displayer
 * @property {PageSwitchLoop} pageSwitchLoop The page switch loop
 */
class Window
{
    /**
     * Window constructor.
     *
     * @param {int} _id The id of this window
     */
    constructor(_id)
    {
        this.id = _id;
        this.displayId = _id + 1;
        this.objectMerger = new ObjectMerger();
        this.pageDisplayer = new PageDisplayer();
        this.pageSwitchLoop = new PageSwitchLoop(this.pageDisplayer);
    }


    // Getters and Setters

    /**
     * Returns the window id.
     *
     * @return {int} The window id
     */
    getId()
    {
        return this.id;
    }

    /**
     * Returns the display id of this window.
     *
     * @returns {int} The display id of this window
     */
    getDisplayId()
    {
        return this.displayId;
    }

    /**
     * Returns the page displayer.
     *
     * @return {PageDisplayer} The page displayer
     */
    getPageDisplayer()
    {
        return this.pageDisplayer;
    }

    /**
     * Returns the page switch loop
     *
     * @return {PageSwitchLoop} The page switch loop
     */
    getPageSwitchLoop()
    {
        return this.pageSwitchLoop;
    }


    // Public Methods

    /**
     * Initializes the pages for the currently loaded window configuration.
     *
     * @param {Object} _windowConfiguration The window configuration
     */
    initialize(_windowConfiguration)
    {
        windowLogger.debug("Initializing window #" + this.displayId + ".");

        this.configuration = _windowConfiguration;

        // Generate the browser window configuration
        let browserWindowConfiguration = this.getBrowserWindowConfiguration();

        // Initialize the pages
        let self = this;
        return new Promise(function(_resolve){
            self.initializePages(browserWindowConfiguration).then(function(_pageList){
                self.pageDisplayer.initialize(browserWindowConfiguration, _pageList).then(function(){
                    self.pageSwitchLoop.initialize(self.pageDisplayer);
                    windowLogger.debug("Window #" + self.displayId + " initialized.");
                    _resolve("Window initialized");
                });
            });
        });
    }

    /**
     * Reloads the pages that are configured to be reloaded after app initialization.
     *
     * @return {Promise} The promise that reloads the pages that are configured to be reloaded after app initialization
     */
    reloadPagesAfterAppInitialization()
    {
        let self = this;
        let reloadAfterAppInitPages = this.pageDisplayer.getPageList().getReloadAfterAppInitPages();
        let numberOfReloadAfterAppInitPages = reloadAfterAppInitPages.length;
        let numberOfReloadedPages = 0;

        return new Promise(function(_resolve){

            if (numberOfReloadAfterAppInitPages === 0) _resolve("No pages to reload after app initialization.");
            else
            {
                reloadAfterAppInitPages.forEach(function(_page){

                    self.pageDisplayer.reloadPage(_page).then(function(){
                        numberOfReloadedPages++;
                        if (numberOfReloadedPages === numberOfReloadAfterAppInitPages)
                        {
                            _resolve("Pages reloaded after app initialization.");
                        }
                    });
                });
            }
        });
    }

    /**
     * Starts the page switch loop.
     *
     * @returns {Promise} The promise that starts the page switch loop
     */
    startPageSwitchLoop()
    {
        return this.pageSwitchLoop.start();
    }


    // Private Methods

    /**
     * Initializes the pages based on the window configuration.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration for each page
     *
     * @returns {Promise} The promise that initializes the pages
     * @private
     */
    initializePages(_browserWindowConfiguration)
    {
        let numberOfPages = this.configuration.pages.length;
        let pageList = new PageList();

        let self = this;
        return new Promise(function(_resolve){
            self.configuration.pages.forEach(function(_pageSpecificConfiguration){
                let pageConfiguration = self.getPageConfiguration(_pageSpecificConfiguration);
                let page = new Page(self, pageConfiguration, pageList.getCurrentPageIndex() + 1);

                pageList.addPage(page);
                if (pageList.getCurrentPageIndex() === numberOfPages - 1) _resolve(pageList);
            });
        });
    }

    /**
     * Creates and returns the browser window configuration for this window based on the window configuration.
     *
     * @return {Object} The browser window configuration
     * @private
     */
    getBrowserWindowConfiguration()
    {
        if (! this.configuration.position.x) this.configuration.position.x = 0;

        let browserWindowConfiguration = {

            // Set the position

            // The x position of the browser window start coordinate must always be set to be able to choose a screen for full screen mode
            x: this.configuration.position.x,

            // Hide title-bar and menu-bar
            frame: false,

            // The window dimensions are set once on application start and are not intended to be changed during runtime
            resizable: false,

            // Set the background color
            backgroundColor: "#000",

            webPreferences: {

                // The browser windows don't need to be able to open the dev tools
                devTools: false,

                // Disable node integration for the browser windows because the pages don't need access to node APIs
                nodeIntegration: false,

                // Sandbox mode improves the performance of browser windows
                sandbox: true,

                // Setting the affinity will cause all BrowserWindow's to run in the same renderer process
                affinity: "pavo"
            }
        };

        // Set the position
        if (this.configuration.fullscreen)
        {
            if (os.platform() === "linux")
            {
                if (! this.configuration.position.y) this.configuration.position.y = 0;

                let { screen } = require("electron");

                // Find the display that contains the start coordinate
                let display = screen.getDisplayNearestPoint({
                    x: this.configuration.position.x,
                    y: this.configuration.position.y
                });

                // Set the browser window dimensions to the displays dimensions
                browserWindowConfiguration["x"] = display.bounds.x;
                browserWindowConfiguration["y"] = display.bounds.y;
                browserWindowConfiguration["width"] = display.bounds.width;
                browserWindowConfiguration["height"] = display.bounds.height;
            }
            else browserWindowConfiguration["fullscreen"] = true;
        }
        else
        {
            browserWindowConfiguration["y"] = this.configuration.position.y;
            browserWindowConfiguration["width"] = this.configuration.position.width;
            browserWindowConfiguration["height"] = this.configuration.position.height;
        }

        // Set the browser window type
        if (os.platform() === "linux")
        {
            /*
             * By setting the window type to "dock" the window ignores the task bar and top bar in the unity desktop environment.
             * The top browser window may not have focus because otherwise the bottom line and the shadow of the top bar are visible through the window.
             *
             * You could also set the focusable option to false to keep a window on top all time, however you can't change that option during runtime
             * in Linux and you can't move other windows to the top this way.
             */
            browserWindowConfiguration["type"] = "dock";
        }

        return browserWindowConfiguration;
    }

    /**
     * Creates and returns the page configuration.
     * This is done by merging the page specific and the default page configuration which is loaded from the window configuration.
     *
     * @param {Object} _pageSpecificConfiguration The page specific configuration
     *
     * @returns {Object} The page configuration
     * @private
     */
    getPageConfiguration(_pageSpecificConfiguration)
    {
        // Merge the page specific and default page configuration while overwriting the default values in case of duplicated keys
        return this.objectMerger.mergeObjects(this.configuration["pageDefaults"], _pageSpecificConfiguration, true);
    }
}


module.exports = Window;
