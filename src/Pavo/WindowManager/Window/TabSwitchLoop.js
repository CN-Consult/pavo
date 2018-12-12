/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const Loop = require(__dirname + "/../../../Util/Loop");

/**
 * Handles a tab switch loop for a window.
 */
class TabSwitchLoop extends Loop
{
    /**
     * TabSwitchLoop constructor.
     */
    constructor()
    {
        super();
    }


    // Getters and Setters

    /**
     * Returns the tab displayer.
     *
     * @returns {TabDisplayer} The tab displayer
     */
    getTabDisplayer()
    {
        return this.tabDisplayer;
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
        this.init(this.tabDisplayer.getTabList().getCurrentTab().getDisplayTime());
    }


    // Hooks

    /**
     * Method that is called on loop halt.
     *
     * @emits The "halt" event
     */
    onLoopHalt()
    {
        let tabReloadLoop = this.tabDisplayer.getTabReloadLoop();
        if (tabReloadLoop && tabReloadLoop.getIsActive()) tabReloadLoop.halt();

        this.emit("halt", { tab: this.tabDisplayer.getCurrentTab(), remainingDisplayTime: this.remainingCycleTime, isActive: this.isActive });
    }

    /**
     * Method that is called on loop continue.
     *
     * @return {Promise} The promise that executes tab switch loop specific code
     *
     * @emits The "continue" event
     */
    onLoopContinue()
    {
        this.emit("continue", { tab: this.tabDisplayer.getCurrentTab(), remainingDisplayTime: this.remainingCycleTime, isActive: this.isActive });

        this.tabDisplayer.restoreOriginalPage();

        let self = this;
        return new Promise(function(_resolve){
            if (self.tabDisplayer.getCurrentTab() && self.tabDisplayer.getCurrentTab().getReloadTime() > 0)
            {
                self.tabDisplayer.getTabReloadLoop().continue().then(function(){
                    _resolve("Tab reload loop continued");
                });
            }
            else _resolve("No tab reload loop continue necessary");
        });
    }

    /**
     * Method that is called on each loop cycle.
     *
     * @returns {Promise} The promise that executes tab switch loop specific code
     */
    onCycle()
    {
        let nextTab = this.tabDisplayer.getTabList().getNextTab();

        return this.showTab(nextTab);
    }


    // Private Methods

    /**
     * Shows a specified tab.
     *
     * @param {Tab} _tab The tab to show
     *
     * @return {Promise} The promise that shows the tab
     *
     * @emits The "show" event when the tab is shown
     */
    showTab(_tab)
    {
        this.init(_tab.getDisplayTime());

        let self = this;
        return new Promise(function(_resolve){
            self.tabDisplayer.showTab(_tab, self.isActive).then(function(){
                self.emit("show", { tab: self.tabDisplayer.getCurrentTab(), remainingDisplayTime: self.remainingCycleTime, isActive: self.isActive });
                _resolve("Tab shown");
            });
        });
    }

    /**
     * Switches the tab switch loop to a specific page.
     *
     * @param {int} _tabId The tab id
     *
     * @return {Promise} The promise that switches the tab switch loop to a specific page
     */
    switchToPage(_tabId)
    {
        let tabList = this.tabDisplayer.getTabList();
        let tab = tabList.getTab(_tabId);

        if (! tab) return new Promise(function(_resolve, _reject){
            _reject("Tab is not set");
        });

        this.halt();

        let self = this;
        return new Promise(function(_resolve){
            self.showTab(tab).then(function(){
                tabList.setCurrentTabIndex(_tabId);
                _resolve("Switched to page");
            });
        });
    }
}


/**
 * The tab displayer
 *
 * @type {TabDisplayer} tabDisplayer
 */
TabSwitchLoop.tabDisplayer = null;


module.exports = TabSwitchLoop;
