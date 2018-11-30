/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const pavoApiLogger = require("log4js").getLogger("pavoApi");

/**
 * Provides the api methods for the pavo app.
 */
class PavoApi
{
    /**
     * PavoApi constructor.
     *
     * @param {Pavo} _parentPavo The parent pavo
     */
    constructor(_parentPavo)
    {
        this.parentPavo = _parentPavo;
    }


    /**
     * Returns the windows of the parent pavo.
     *
     * @return {Window[]} The list of windows
     */
    getWindows()
    {
        return this.parentPavo.getWindowManager().getWindows();
    }

    /**
     * Returns the status for each window of the pavo app.
     * This includes the configuration and whether the tab switch loop is active
     *
     * @return {Object[]|string} The status of each window of the pavo app or an error message if the pavo app is not initialized yet
     */
    getWindowsStatus()
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        let windowsStatus = [];

        let windowConfigurations = this.parentPavo.getLoadedConfiguration().windows;
        let windows = this.getWindows();

        if (Array.isArray(windowConfigurations))
        {
            for (let windowId in windowConfigurations)
            { // Add the isTabSwitchLoopActive information to the running configuration

                if (windowConfigurations.hasOwnProperty(windowId))
                {
                    windowsStatus[windowId] = {};
                    windowsStatus[windowId].configuration = windowConfigurations[windowId];
                    windowsStatus[windowId].isTabSwitchLoopActive = windows[windowId].getTabSwitchLoop().getIsActive();

                    let currentTab = windows[windowId].getTabSwitchLoop().getTabDisplayer().getCurrentTab();
                    if (currentTab)
                    {
                        windowsStatus[windowId].currentTab = currentTab.getId();
                        windowsStatus[windowId].remainingDisplayTime = windows[windowId].getTabSwitchLoop().getRemainingDisplayTime();
                    }
                }
            }
        }

        return windowsStatus;
    }

    /**
     * Halts the tab switch loop for a specified window.
     *
     * @param {int} _windowId The window id
     */
    haltTabSwitchLoopOfWindow(_windowId)
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received tab switch loop halt request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            let tabSwitchLoop = window.getTabSwitchLoop();
            if (tabSwitchLoop.getIsActive())
            {
                pavoApiLogger.info("Halting tab switch loop for window #" + window.getDisplayId());
                tabSwitchLoop.halt();
            }
        }
    }

    /**
     * Resumes the tab switch loop for a specified window.
     *
     * @param {int} _windowId The window id
     */
    resumeTabSwitchLoopOfWindow(_windowId)
    {
        if (! this.parentPavo.getIsInitialized()) return new Promise(function(_resolve, _reject){
            _reject("ERROR: Pavo app not initialized yet");
        });

        pavoApiLogger.info("Received tab switch loop resume request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            let tabSwitchLoop = window.getTabSwitchLoop();
            if (! tabSwitchLoop.getIsActive())
            {
                pavoApiLogger.info("Resuming tab switch loop for window #" + window.getDisplayId());
                tabSwitchLoop.continue();
            }
        }
    }

    /**
     * Loads a url into a specific window.
     *
     * @param {int} _windowId The id of the window
     * @param {String} _url The url to load into the window
     *
     * @returns {Promise} The promise that loads the url into the specified window
     */
    loadURLIntoWindow(_windowId, _url)
    {
        if (! this.parentPavo.getIsInitialized()) return new Promise(function(_resolve, _reject){
            _reject("ERROR: Pavo app not initialized yet");
        });

        pavoApiLogger.info("Received url load request for window " + _windowId + " with target url \"" + _url + "\"");

        let window = this.getWindows()[_windowId];

        this.haltTabSwitchLoopOfWindow(_windowId);

        return window.getTabDisplayer().displayCustomURL(_url);
    }

    /**
     * Reloads a specified window.
     *
     * @param {int} _windowId The id of the window
     *
     * @return {Promise} The promise that reloads the specified window
     */
    reloadWindow(_windowId)
    {
        if (! this.parentPavo.getIsInitialized()) return new Promise(function(_resolve, _reject){
            _reject("ERROR: Pavo app not initialized yet");
        });

        pavoApiLogger.info("Received reload window request for window " + _windowId);

        let window = this.getWindows()[_windowId];

        return window.getTabDisplayer().reloadCurrentPage();
    }
}


/**
 * The parent pavo app which can be accessed with this pavo api
 *
 * @type {Pavo} parentPavo
 */
PavoApi.parentPavo = null;


module.exports = PavoApi;
