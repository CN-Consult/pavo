/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const EventEmitter = require("events");

/**
 * Handles a tab switch loop for a window.
 */
class TabSwitchLoop extends EventEmitter
{
    /**
     * TabSwitchLoop constructor.
     */
    constructor()
    {
        super();

        this.isActive = false;

        // Must use a interval for a timeout because timeouts are not clearable
        this.nextTabTimeout = null;
        this.nextTabTimeoutStart = 0;
        this.remainingDisplayTime = 0;
    }


    // Getters and Setters

    /**
     * Returns whether this tab switch loop is currently active.
     *
     * @return {boolean} True if this tab switch loop is currently active, false otherwise
     */
    getIsActive()
    {
        return this.isActive;
    }

    /**
     * Returns the tab displayer.
     *
     * @returns {TabDisplayer} The tab displayer
     */
    getTabDisplayer()
    {
        return this.tabDisplayer;
    }

    /**
     * Returns the remaining display time of the current tab.
     *
     * @return {int} The remaining display time of the current tab
     */
    getRemainingDisplayTime()
    {
        if (this.isActive)
        {
            return this.remainingDisplayTime - (Date.now() - this.nextTabTimeoutStart);
        }
        else return this.remainingDisplayTime;
    }


    // Public Methods

    /**
     * Initializes the tab switch loop.
     *
     * @param {TabDisplayer} _tabDisplayer The tab displayer
     */
    initialize(_tabDisplayer)
    {
        this.tabDisplayer = _tabDisplayer;
    }

    /**
     * Starts the tab switch loop if it is not already running.
     *
     * @return {Promise} The promise that starts the tab switch loop
     */
    start()
    {
        let self = this;
        return new Promise(function(_resolve){
            if (! self.isActive)
            {
                self.continue().then(function(){
                    _resolve("Tab switch loop started");
                });
            }
            else _resolve("Tab switch loop already running");
        });
    }

    /**
     * Pauses the tab switch loop if it is currently running.
     */
    halt()
    {
        if (this.isActive)
        {
            if (this.nextTabTimeout) clearInterval(this.nextTabTimeout);

            this.remainingDisplayTime -= (Date.now() - this.nextTabTimeoutStart);

            if (this.tabDisplayer.currentTabType === "reload") this.tabDisplayer.getTabReloadLoop().halt();

            this.isActive = false;
            this.emit("halt", { tab: this.tabDisplayer.getCurrentTab(), remainingDisplayTime: this.remainingDisplayTime });
        }
    }

    /**
     * Continues the tab switch loop if it is currently not running.
     *
     * @returns {Promise}
     */
    continue()
    {
        let self = this;
        return new Promise(function(_resolve){

            if (self.isActive) _resolve("No continue necessary, tab switch loop already running");
            else
            {
                self.emit("continue", { tab: self.tabDisplayer.getCurrentTab(), remainingDisplayTime: self.remainingDisplayTime });
                self.isActive = true;
                if (self.tabDisplayer.getIsCustomPageDisplayed()) self.tabDisplayer.restoreOriginalPage();

                if (self.tabDisplayer.currentTabType === "reload") self.tabDisplayer.getTabReloadLoop().continue();

                self.showNextTab().then(function(){
                    _resolve("Tab switch loop continued");
                });
            }
        });
    }


    // Private Methods

    /**
     * Shows the next tab of the currently loaded tabs.
     * Also starts an infinite loop which calls this method again after a page specific wait time.
     *
     * @return {Promise} The promise that shows the next tab
     */
    showNextTab()
    {
        // Clear the interval of the previous tab switch
        clearInterval(this.nextTabTimeout);

        let self = this;
        return new Promise(function(_resolve){

            self.nextTabTimeoutStart = Date.now();
            self.nextTabTimeout = setInterval(function(){

                clearInterval(self.nextTabTimeout);
                let nextTab = self.tabDisplayer.getTabList().getNextTab();
                self.tabDisplayer.showTab(nextTab).then(function(){

                    let currentTab = self.tabDisplayer.getCurrentTab();

                    let millisecondsPassed = Date.now() - self.nextTabTimeoutStart - self.remainingDisplayTime;
                    self.remainingDisplayTime = currentTab.getDisplayTime() - millisecondsPassed;

                    // Call this method again after <displayTime>
                    if (self.isActive)
                    {
                        self.emit("show", { tab: currentTab, remainingDisplayTime: self.remainingDisplayTime });

                        self.nextTabTimeoutStart = Date.now();
                        self.nextTabTimeout = setInterval(function(){
                            self.remainingDisplayTime = 0;
                            self.showNextTab();
                        }, self.remainingDisplayTime);
                    }
                });
            }, self.remainingDisplayTime);

            _resolve("Next tab shown.");
        });
    }
}


/**
 * Defines whether this tab switch loop is currently active
 *
 * @type {boolean} isActive
 */
TabSwitchLoop.isActive = false;

/**
 * Stores the timeout that will show the next tab
 * This is a interval because timeouts can not be cleared properly
 *
 * @type {Object} nextTabTimeout
 */
TabSwitchLoop.nextTabTimeout = null;

/**
 * Stores when the next tab timeout was initialized.
 * This value is the return value of Date.now().
 * This is necessary to calculate the remaining tab display time after a loop halt.
 *
 * @type {int} nextTabTimeoutStart
 */
TabSwitchLoop.nextTabTimeoutStart = 0;

/**
 * Stores the remaining tab display time in milliseconds
 * This is used when the loop is continued after a loop halt
 *
 * @type {int} remainingTabShowTime
 */
TabSwitchLoop.remainingTabShowTime = 0;

/**
 * The tab displayer
 *
 * @type {TabDisplayer} tabDisplayer
 */
TabSwitchLoop.tabDisplayer = null;


module.exports = TabSwitchLoop;
