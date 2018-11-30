/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Handles reloading of tabs.
 */
class TabReloadLoop
{
    /**
     * TabReloadLoop constructor.
     *
     * @param {ReloadBrowserWindowManager} _reloadBrowserWindowManager The reload browser window manager
     */
    constructor(_reloadBrowserWindowManager)
    {
        this.reloadBrowserWindowManager = _reloadBrowserWindowManager;

        this.reloadTab = null;
        this.reloadInterval = null;
        this.isActive = false;
    }


    // Getters and Setters

    /**
     * Returns whether this tab reload loop is currently active.
     *
     * @return {boolean} True if this tab reload loop is currently active, false otherwise
     */
    getIsActive()
    {
        return this.isActive;
    }

    /**
     * Returns the current reload tab.
     *
     * @returns {Tab} The current reload tab
     */
    getReloadTab()
    {
        return this.reloadTab;
    }


    // Public Methods

    /**
     * Initializes the reload loop for a specific tab.
     *
     * @param {Tab} _tab The tab
     *
     * @return {Promise} The promise that starts the reload loop
     */
    start(_tab)
    {
        let self = this;
        let waitForPreviousLoopStop = new Promise(function(_resolve){
            if (self.isActive)
            {
                let stop = self.stop.bind(self);
                stop().then(function(){
                    _resolve("Previous loop stopped.");
                });
            }
            else _resolve("No previous loop running.");
        });

        let reload = this.reload.bind(this);

        return new Promise(function(_resolve){
            waitForPreviousLoopStop.then(function(){

                // Update the reload tab
                self.reloadTab = _tab;

                // Initialize the reload loop
                self.isActive = true;

                // Initialize the reload interval
                self.reloadInterval = setInterval(reload, _tab.getReloadTime());

                // Perform the initial reload.
                // This is necessary because the reload loop doesn't start until <reloadTime> milliseconds passed.
                reload().then(function(){
                    _resolve("Tab reload loop started.");
                });
            });
        });
    }

    /**
     * Halts the tab reload loop.
     */
    halt()
    {
        clearInterval(this.reloadInterval);
    }

    /**
     * Continues the tab reload loop.
     *
     * @return {Promise} The promise that continues the tab reload loop
     */
    continue()
    {
        return this.start(this.reloadTab);
    }

    /**
     * Stops the reload loop for the currently reloaded tab.
     *
     * @return {Promise} The promise that stops the reload loop
     */
    stop()
    {
        this.halt();

        let self = this;
        return new Promise(function(_resolve){
            self.reloadBrowserWindowManager.unloadTab(self.reloadTab).then(function(){
                self.isActive = false;
                _resolve("Tab reload loop stopped");
            });
        });
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
            self.reloadBrowserWindowManager.reloadTabInBackgroundBrowserWindow(self.reloadTab).then(function(){
                self.reloadBrowserWindowManager.showTab(self.reloadTab).then(function(){
                    _resolve("Tab reloaded");
                });
            });
        });
    }
}


/**
 * The browser window manager for reloads
 *
 * @type {ReloadBrowserWindowManager} reloadBrowserWindowManager
 */
TabReloadLoop.reloadBrowserWindowManager = null;

/**
 * The tab that is currently being displayed and reloaded
 *
 * @type {Tab} reloadTab
 */
TabReloadLoop.reloadTab = null;

/**
 * The timeout for the tab reload interval
 * This is saved in order to be able to clear the interval on reload loop stop
 *
 * @type {Object} reloadInterval
 */
TabReloadLoop.reloadInterval = null;

/**
 * Indicates whether the reload loop is currently active
 *
 * @type {Boolean} isActive
 */
TabReloadLoop.isActive = false;


module.exports = TabReloadLoop;
