/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const Loop = require(__dirname + "/../../../../Util/Loop");
const tabReloadLoopLogger = require("log4js").getLogger("tabReloadLoop");

/**
 * Handles reloading of tabs.
 *
 * @property {BrowserWindowManager} browserWindowManager The browser window manager
 * @property {Tab} reloadTab The tab that is currently being displayed and reloaded
 */
class TabReloadLoop extends Loop
{
    /**
     * TabReloadLoop constructor.
     *
     * @param {BrowserWindowManager} _browserWindowManager The browser window manager
     */
    constructor(_browserWindowManager)
    {
        super();

        this.browserWindowManager = _browserWindowManager;
        this.reloadTab = null;
    }

    // Public Methods

    /**
     * Initializes the reload loop for a specific tab.
     *
     * @param {Tab} _tab The tab
     */
    initialize(_tab)
    {
        tabReloadLoopLogger.debug("Initializing tab reload loop for tab #" + _tab.getDisplayId());

        this.init(_tab.getReloadTime());
        this.reloadTab = _tab;
    }


    // Hooks

    /**
     * Method that is called on each cycle.
     *
     * @returns {Promise} The promise that executes tab reload loop specific code
     */
    onCycle()
    {
        return this.reload();
    }

    /**
     * Method that is called on loop halt.
     */
    onLoopHalt()
    {
        tabReloadLoopLogger.debug("Halting tab reload loop for tab #" + this.reloadTab.getDisplayId());
    }

    /**
     * Method that is called on loop continue.
     *
     * @returns {Promise} The promise that executes tab reload loop specific code
     */
    onLoopContinue()
    {
        tabReloadLoopLogger.debug("Continuing tab reload loop for tab #" + this.reloadTab.getDisplayId());

        return new Promise(function(_resolve){
            _resolve(null);
        });
    }

    /**
     * Method that is called on loop stop.
     */
    onLoopStop()
    {
        tabReloadLoopLogger.debug("Stopping tab reload loop for tab #" + this.reloadTab.getDisplayId());
    }


    // Private Methods

    /**
     * Reloads the tab in the background and shows it once it is completely loaded.
     *
     * @emits The "reload" event on method call
     * @emits The "reload-finish" event when the reload is finished
     *
     * @return {Promise} The promise that reloads the tab
     */
    reload()
    {
        let self = this;
        return new Promise(function(_resolve){
            tabReloadLoopLogger.debug("Reloading tab #" + self.reloadTab.getDisplayId());
            self.browserWindowManager.reloadTabBrowserWindow(self.reloadTab).then(function(){
                _resolve("Tab reloaded");
            });
        });
    }
}


module.exports = TabReloadLoop;
