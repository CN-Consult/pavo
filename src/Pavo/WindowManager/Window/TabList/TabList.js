/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Stores a list of tabs and provides methods to get/set the entries.
 *
 * @property {Tab[]} tabs The list of tabs
 * @property {int} currentTabIndex The current tab index that is updated by the getNextTab() method
 */
class TabList
{
    /**
     * TabList constructor.
     */
    constructor()
    {
        this.tabs = [];
        this.currentTabIndex = 0;
    }


    // Getters and Setters

    /**
     * Sets the current tab index.
     *
     * @param {int} _currentTabIndex The current tab index
     */
    setCurrentTabIndex(_currentTabIndex)
    {
        this.currentTabIndex = _currentTabIndex;
    }

    /**
     * Returns the list of all tabs.
     *
     * @returns {Tab[]} The list of all tabs
     */
    getTabs()
    {
        return this.tabs;
    }


    // Public Methods

    /**
     * Adds a tab to the list of tabs.
     */
    addTab(_tab)
    {
        this.tabs.push(_tab);
        this.currentTabIndex = this.tabs.length - 1;
    }

    /**
     * Returns a tab by id.
     *
     * @param {int} _tabId The tab id
     *
     * @return {Tab} The tab
     */
    getTab(_tabId)
    {
        return this.tabs[_tabId];
    }

    /**
     * Removes one tab from the list of tabs.
     * Also updates the current tab id.
     *
     * @param {Tab} _tab The tab
     */
    removeTab(_tab)
    {
        // TODO: Find usage for this  method
        let tabIndex = _tab.id;
        let numberOfTabs = this.tabs.length;

        // Move all array entries above the tab index down by one index
        for (let i = tabIndex; i < numberOfTabs - 1; i++)
        {
            this.tabs[tabIndex] = this.tabs[tabIndex + 1];
        }

        // Remove the last tab entry
        this.tabs.pop();

        if (this.currentTabIndex > tabIndex) this.currentTabIndex -= 1;
    }


    // Fetch information about the list

    /**
     * Returns whether this tab list contains at least one tab with a reload time greater than 0 seconds.
     *
     * @return {boolean} True if this tab list contains at least one tab with a reload time greater than 0 seconds, false otherwise
     */
    containsReloadTabs()
    {
        for (let tab of this.tabs)
        {
            if (tab.reloadTime > 0) return true;
        }

        return false;
    }

    /**
     * Returns the list of tabs that need to be reloaded after app init.
     *
     * @return {Tab[]} The list of tabs that need to be reloaded after app init
     */
    getReloadAfterAppInitTabs()
    {
        let reloadAfterAppInitTabs = [];
        this.tabs.forEach(function(_tab){
           if (_tab.reloadAfterAppInit) reloadAfterAppInitTabs.push(_tab);
        });

        return reloadAfterAppInitTabs;
    }


    // Iterate over the list

    /**
     * Returns the current tab.
     *
     * @return {Tab|null} The current tab or null if the tab list doesn't contain any tabs
     */
    getCurrentTab()
    {
        if (this.tabs.length > 0)
        {
            return this.tabs[this.currentTabIndex];
        }
        else return null;
    }

    /**
     * Increases the current tab index by one and returns the new current tab.
     *
     * @return {Tab|null} The current tab or null if the tab list doesn't contain any tabs
     */
    getNextTab()
    {
        if (this.tabs.length > 0)
        {
            this.currentTabIndex++;
            if (this.currentTabIndex === this.tabs.length) this.currentTabIndex = 0;

            return this.getCurrentTab();
        }
        else return null;
    }
}


module.exports = TabList;
