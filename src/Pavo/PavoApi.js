/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const fs = require("fs");
const mv = require("mv");

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
     * @return {string|Window[]} The error message if the pavo app is not initialized yet or the list of windows
     */
    getWindows()
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        return this.parentPavo.getWindowManager().getWindows();
    }

    /**
     * Returns the currently loaded pavo configuration.
     *
     * @return {string|Object} The error message if the pavo app is not initialized yet or the currently loaded pavo configuration
     */
    getLoadedConfiguration()
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        return this.parentPavo.getLoadedConfiguration();
    }

    /**
     * Sets the pavo configuration inside the configuration file.
     * This new configuration will not be applied until a restart of the pavo app.
     *
     * @param {object} _configuration The new configuration
     */
    setConfiguration(_configuration)
    {
        // TODO: Check that configuration is different from current one
        let configBaseDirectory = app.getPath("home") + "/config";
        let configBackupDirectory = configBaseDirectory + "/config-backups";

        // Create the backup directory for config files if necessary
        if (! fs.existsSync(configBackupDirectory)) fs.mkdirSync(configBackupDirectory);

        let configFilePath = configBaseDirectory + "/config.json";
        let backupFilePath = configBackupDirectory + "/" + Date.now() + ".json";

        // Backup the previous file
        mv(configFilePath, backupFilePath, function(_error){

            if (_error)
            {
                pavoApiLogger.warn(_error);
                pavoApiLogger.warn("Could not create backup of previous config file, aborting configuration update.");
            }
            else
            { // Write the new configuration to the config file
                fs.writeFileSync(configFilePath, JSON.stringify(_configuration));
            }
        });
    }

    /**
     * Returns the status for each window of the pavo app.
     * This includes the configuration and whether the tab switch loop is active
     *
     * @return {string|Object} The error message if the pavo app is not initialized yet or the window status object
     */
    getWindowsStatus()
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        let windowsStatus = [];

        let windowConfigurations = this.getLoadedConfiguration().windows;
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
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
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
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    resumeTabSwitchLoopOfWindow(_windowId)
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

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
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    loadURLIntoWindow(_windowId, _url)
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received url load request for window " + _windowId + " with target url \"" + _url + "\"");

        let window = this.getWindows()[_windowId];
        if (window)
        {
            this.haltTabSwitchLoopOfWindow(_windowId);
            window.getTabDisplayer().displayCustomURL(_url);
        }
    }

    /**
     * Reloads a specified window.
     *
     * @param {int} _windowId The id of the window
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    reloadWindow(_windowId)
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received reload window request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getTabDisplayer().reloadCurrentPage();
        }
    }

    /**
     * Switches the tab switch loop inside a specified window to a specific tab id.
     *
     * @param {int} _windowId The window id
     * @param {int} _tabId The tab id
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    switchToPageInWindow(_windowId, _tabId)
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received switch to page window request for window " + _windowId + " with target page " + _tabId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getTabSwitchLoop().halt();
            window.getTabSwitchLoop().switchToPage(_tabId);
        }
    }
}


/**
 * The parent pavo app which can be accessed with this pavo api
 *
 * @type {Pavo} parentPavo
 */
PavoApi.parentPavo = null;


module.exports = PavoApi;
