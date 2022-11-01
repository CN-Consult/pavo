/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const Loop = require(__dirname + "/../../../../Util/Loop");
const pageReloadLoopLogger = require("log4js").getLogger("pageReloadLoop");

/**
 * Handles reloading of pages.
 *
 * @property {BrowserWindowManager} browserWindowManager The browser window manager
 * @property {Page} reloadPage The page that is currently being displayed and reloaded
 */
class PageReloadLoop extends Loop
{
    /**
     * PageReloadLoop constructor.
     *
     * @param {BrowserWindowManager} _browserWindowManager The browser window manager
     */
    constructor(_browserWindowManager)
    {
        super();

        this.browserWindowManager = _browserWindowManager;
        this.reloadPage = null;
    }

    // Public Methods

    /**
     * Initializes the reload loop for a specific page.
     *
     * @param {Page} _page The page
     */
    initialize(_page)
    {
        pageReloadLoopLogger.debug("Initializing page reload loop for page #" + _page.getDisplayId());

        this.init(_page.getReloadTime());
        this.reloadPage = _page;
    }


    // Hooks

    /**
     * Method that is called on each cycle.
     *
     * @return {Promise} The promise that executes page reload loop specific code
     * @protected
     */
    onCycle()
    {
        return this.reload();
    }

    /**
     * Method that is called on loop halt.
     * @protected
     */
    onLoopHalt()
    {
        pageReloadLoopLogger.debug("Halting page reload loop for page #" + this.reloadPage.getDisplayId());
    }

    /**
     * Method that is called on loop continue.
     *
     * @return {Promise} The promise that executes page reload loop specific code
     * @protected
     */
    onLoopContinue()
    {
        pageReloadLoopLogger.debug("Continuing page reload loop for page #" + this.reloadPage.getDisplayId());

        return new Promise(function(_resolve){
            _resolve(null);
        });
    }

    /**
     * Method that is called on loop stop.
     * @protected
     */
    onLoopStop()
    {
        pageReloadLoopLogger.debug("Stopping page reload loop for page #" + this.reloadPage.getDisplayId());
    }


    // Private Methods

    /**
     * Reloads the page in the background and shows it once it is completely loaded.
     *
     * @emits The "reload" event on method call
     * @emits The "reload-finish" event when the reload is finished
     *
     * @return {Promise} The promise that reloads the page
     * @private
     */
    reload()
    {
        let self = this;
        return new Promise(function(_resolve){
            pageReloadLoopLogger.debug("Reloading page #" + self.reloadPage.getDisplayId());
            self.browserWindowManager.reloadPageBrowserView(self.reloadPage).then(function(){
                _resolve("Page reloaded");
            });
        });
    }
}


module.exports = PageReloadLoop;
