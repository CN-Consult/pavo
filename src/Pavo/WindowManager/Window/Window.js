/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const electron = require("electron");
const os = require("os");
const ObjectMerger = require(__dirname + "/../../../Util/ObjectMerger");
const Tab = require(__dirname + "/TabList/Tab");
const TabList = require(__dirname + "/TabList/TabList");
const TabDisplayer = require(__dirname + "/TabDisplayer/TabDisplayer");
const TabSwitchLoop = require(__dirname + "/TabSwitchLoop");
const windowLogger = require("log4js").getLogger("window");

/**
 * Creates and stores the tabs and the configuration of a single window.
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
        this.tabDisplayer = new TabDisplayer();
        this.tabSwitchLoop = new TabSwitchLoop(this.tabDisplayer);
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
     * Returns the tab manager.
     *
     * @return {TabDisplayer} The tab displayer
     */
    getTabDisplayer()
    {
        return this.tabDisplayer;
    }

    /**
     * Returns the tab switch loop
     *
     * @return {TabSwitchLoop} The tab switch loop
     */
    getTabSwitchLoop()
    {
        return this.tabSwitchLoop;
    }


    // Public Methods

    /**
     * Initializes the tabs for the currently loaded window configuration.
     *
     * @param {Object} _windowConfiguration The window configuration
     */
    initialize(_windowConfiguration)
    {
        windowLogger.debug("Initializing window #" + this.displayId + ".");

        this.configuration = _windowConfiguration;

        // Generate the browser window configuration
        let browserWindowConfiguration = this.getBrowserWindowConfiguration();

        // Initialize the tabs
        let self = this;
        return new Promise(function(_resolve){
            self.initializeTabs(browserWindowConfiguration).then(function(_tabList){

                self.tabDisplayer.initialize(browserWindowConfiguration, _tabList).then(function(){
                    self.tabSwitchLoop.initialize(self.tabDisplayer);
                    windowLogger.debug("Window #" + self.displayId + " initialized.");
                    _resolve("Window initialized");
                });
            });
        });
    }

    /**
     * Reloads the tabs that need a login that was already done in another tab.
     *
     * @return {Promise} The promise that reloads the tabs that need a login that was already done in another tab
     */
    reloadSecondaryLoginTabs()
    {
        let self = this;
        let reloadAfterAppInitTabs = this.tabDisplayer.getTabList().getReloadAfterAppInitTabs();
        let numberOfReloadAfterAppInitTabs = reloadAfterAppInitTabs.length;
        let numberOfReloadedTabs = 0;

        return new Promise(function(_resolve){

            if (numberOfReloadAfterAppInitTabs === 0) _resolve("No secondary tabs to reload.");
            else
            {
                reloadAfterAppInitTabs.forEach(function(_tab){

                    self.tabDisplayer.reloadStaticTab(_tab).then(function(){
                        numberOfReloadedTabs++;
                        if (numberOfReloadedTabs === numberOfReloadAfterAppInitTabs)
                        {
                            _resolve("Secondary tabs reloaded.");
                        }
                    });
                });
            }
        });
    }

    /**
     * Starts the tab switch loop.
     *
     * @returns {Promise} The promise that starts the tab switch loop
     */
    startTabSwitchLoop()
    {
        return this.tabSwitchLoop.start();
    }


    // Private Methods

    /**
     * Initializes the tabs based on the window configuration.
     *
     * @param {Object} _browserWindowConfiguration The browser window configuration for each tab
     *
     * @returns {Promise} The promise that initializes the tabs
     */
    initializeTabs(_browserWindowConfiguration)
    {
        let numberOfTabs = this.configuration.pages.length;
        let tabListIndex = 0;
        let tabList = new TabList();

        let self = this;
        return new Promise(function(_resolve){

            self.configuration.pages.forEach(function(_pageSpecificConfiguration){

                let pageConfiguration = self.getPageConfiguration(_pageSpecificConfiguration);
                let tab = new Tab(self, pageConfiguration, tabListIndex);

                tabList.addTab(tab);

                if (tabListIndex === numberOfTabs - 1) _resolve(tabList);
                else tabListIndex++;
            });
        });
    }

    /**
     * Creates and returns the browser window configuration for this window.
     * This is done based on the configuration attributes content.
     *
     * @return {Object} The browser window configuration
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
            //TODO: remove this?
            backgroundColor: "#000",

            webPreferences: {

                // The browser windows don't need to be able to open the dev tools
                devTools: false,

                // Disable node integration for the browser windows because the tabs don't need access to node APIs
                nodeIntegration: false,

                // Sandbox mode improves the performance of browser windows
                sandbox: true
            }
        };

        // Set the position
        if (this.configuration.fullscreen)
        {
            if (os.platform() === "linux")
            {
                if (! this.configuration.position.y) this.configuration.position.y = 0;

                // Find the display that contains the start coordinate
                let display = electron.screen.getDisplayNearestPoint({
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
     * This is done by merging the page specific and the default page configuration which is loaded from the configuration attributes content.
     *
     * @param {Object} _pageSpecificConfiguration The page specific configuration
     *
     * @returns {Object} The page configuration
     */
    getPageConfiguration(_pageSpecificConfiguration)
    {
        // Merge the page specific and default page configuration while overwriting the default values in case of duplicated keys
        return this.objectMerger.mergeObjects(this.configuration["pageDefaults"], _pageSpecificConfiguration, true);
    }
}

/**
 * The window id
 *
 * @type {int} id
 */
Window.id = -1;

/**
 * The id that will be displayed in the logs and in the user interface
 *
 * @type {int} displayId
 */
Window.displayId = 0;

/**
 * The loaded window configuration
 *
 * @type {Object} configuration
 */
Window.configuration = null;

/**
 * The object merger
 *
 * @type {ObjectMerger} objectMerger
 */
Window.objectMerger = null;

/**
 * The tab displayer
 *
 * @type {TabDisplayer} tabDisplayer
 */
Window.tabDisplayer = null;

/**
 * The tab switch loop
 *
 * @type {TabSwitchLoop} tabSwitchLoop
 */
Window.tabSwitchLoop = null;


module.exports = Window;
