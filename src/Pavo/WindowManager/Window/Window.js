/**
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
 * @property {WindowManager} parentWindowManager The parent window manager
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
     * @param {WindowManager} _parentWindowManager The parent window manager
     * @param {int} _id The id of this window
     */
    constructor(_parentWindowManager, _id)
    {
        this.parentWindowManager = _parentWindowManager;
        this.id = _id;
        this.displayId = _id + 1;
        this.objectMerger = new ObjectMerger();
        this.pageDisplayer = new PageDisplayer(this);
        this.pageSwitchLoop = new PageSwitchLoop(this.pageDisplayer);
    }

    /**
     * Destroys this Window.
     *
     * @return {Promise} The promise that destroys this Window
     */
    destroy()
    {
        this.pageSwitchLoop.halt();
        return this.pageDisplayer.destroy();
    }


    // Getters and Setters

    /**
     * Returns the parent window manager.
     *
     * @return {WindowManager} The parent window manager
     */
    getParentWindowManager()
    {
        return this.parentWindowManager;
    }

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
     * @return {int} The display id of this window
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
                self.pageDisplayer.initialize(browserWindowConfiguration, _windowConfiguration.pageDefaults, _pageList).then(function(){
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

            alwaysOnTop: true,

            webPreferences: {

                // The browser windows don't need to be able to open the dev tools
                devTools: false,

                // Disable node integration for the browser windows because the pages don't need access to node APIs
                nodeIntegration: false,

                // The "remote" module is not necessary in the BrowserWindow's
                enableRemoteModule: false,

                textAreasAreResizable: false,

                // Sandbox mode improves the performance of browser windows
                sandbox: true,

                // Setting the affinity will cause all BrowserWindow's to run in the same renderer process
                affinity: "pavo"
            }
        };

        // Set the position
        if (this.configuration.fullscreen)
        {
            if (! this.configuration.position.y) this.configuration.position.y = 0;

            let { screen } = require("electron");

            // Find the display that contains the start coordinate
            let display = screen.getDisplayNearestPoint({
                x: this.configuration.position.x,
                y: this.configuration.position.y
            });

            // Set the browser window dimensions to the displays dimensions
            browserWindowConfiguration.x = display.bounds.x;
            browserWindowConfiguration.y = display.bounds.y;
            browserWindowConfiguration.width = display.bounds.width;
            browserWindowConfiguration.height = display.bounds.height;

            if (os.platform() !== "linux" && os.platform() !== "darwin")
            {
                /*
                 * In Linux there is no difference between using fullscreen windows or a window that covers the whole screen
                 *
                 * In macOS Mojave there is a bug when restarting pavo when using fullscreen.
                 * When pavo is restarted macOS jumps from the virtual fullscreen desktop to the real desktop and
                 * renders the fullscreen window there (behind the dock and the menu bar)
                 */
                browserWindowConfiguration.fullscreen = true;
            }
        }
        else
        {
            browserWindowConfiguration.y = this.configuration.position.y;
            browserWindowConfiguration.width = this.configuration.position.width;
            browserWindowConfiguration.height = this.configuration.position.height;
        }

        // Set the browser window type
        if (os.platform() === "linux")
        {
            /*
             * By setting the focusable option to false the window will ignore the window manager in Linux and will stay
             * on top of everything else.
             *
             * An alternative way to achieve this would be to set the window type to "dock". However this does only work
             * in Ubuntu 16 with the Unity desktop environment and doesn't work in Ubuntu 18 with the GNOME3 desktop environment.
             */
            browserWindowConfiguration.focusable = false;
        }

        if (os.platform() === "darwin" && browserWindowConfiguration.fullscreen !== true)
        {
            /*
             * By setting the titleBarStyle to "customButtonsOnHover" three issues with non fullscreen pavo windows are fixed:
             *
             * 1) In macOS Mojave the white line at the top of the window is removed
             * 2) The window corners are cornered instead of rounded
             * 3) The windows can overlay the top bar
             */
            browserWindowConfiguration.titleBarStyle = "customButtonsOnHover";
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
        return this.objectMerger.mergeObjects(this.configuration.pageDefaults, _pageSpecificConfiguration, true);
    }
}


module.exports = Window;
