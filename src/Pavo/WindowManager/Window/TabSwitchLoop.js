/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Handles a tab switch loop for a window.
 */
class TabSwitchLoop
{
    /**
     * TabSwitchLoop constructor.
     */
    constructor()
    {
        this.isActive = false;

        // Must use a interval for a timeout because timeouts are not clearable
        this.nextTabTimeout = null;
        this.nextTabTimeoutStart = 0;
        this.remainingTabShowTime = 0;
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
            else _resolve("Tab switch loop already started");
        });
    }

    /**
     * Pauses the tab switch loop if it is currently running.
     */
    halt()
    {
        if (this.isActive)
        {
            if (this.nextTabTimeout)
            {
                clearInterval(this.nextTabTimeout);
                this.remainingTabShowTime = this.nextTabTimeoutStart + this.tabDisplayer.currentTab.getDisplayTime() - Date.now();
            }

            this.isActive = false;
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
                self.isActive = true;
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

        let nextTab = this.tabDisplayer.getTabList().getNextTab();
        let showNextTabStartTime = Date.now();

        let self = this;
        return new Promise(function(_resolve){

            // TODO: Change this setTimeout to setInterval
            self.nextTabTimeout = setTimeout(function(){
                self.tabDisplayer.showTab(nextTab).then(function(){

                    let millisecondsPassed = Date.now() - showNextTabStartTime;

                    let currentTab = self.tabDisplayer.getCurrentTab();
                    let remainingDisplayTime = currentTab.getDisplayTime() - millisecondsPassed;

                    // Call this method again after <displayTime>
                    if (self.isActive)
                    {
                        self.nextTabTimeout = setInterval(self.showNextTab.bind(self), remainingDisplayTime);
                        self.nextTabTimeoutStart = Date.now();
                    }
                });
            }, self.remainingTabShowTime);

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
