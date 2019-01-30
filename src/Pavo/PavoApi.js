/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const { app } = require("electron");
const fs = require("fs");
const mv = require("mv");

const pavoApiLogger = require("log4js").getLogger("pavoApi");

/**
 * Provides the api methods for the pavo app.
 * TODO: Split into sub classes
 *
 * @property {Pavo} parentPavo The parent pavo app which can be accessed with this PavoApi
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
     * Returns whether the pavo API is ready to be used.
     *
     * @return {boolean} True if the pavo API is ready to be used, false otherwise
     */
    isReady()
    {
        return (this.parentPavo.getIsInitialized());
    }


    /**
     * Returns the windows of the parent pavo.
     *
     * @return {string|Window[]} The error message if the pavo app is not initialized yet or the list of windows
     */
    getWindows()
    {
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        return this.parentPavo.getWindowManager().getWindows();
    }

    /**
     * Returns the currently loaded pavo configuration.
     *
     * @return {string|Object} The error message if the pavo app is not initialized yet or the currently loaded pavo configuration
     */
    getLoadedConfiguration()
    {
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

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
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

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
     * This includes the configuration and whether the page switch loop is active
     *
     * @return {string|Promise} The error message if the pavo app is not initialized yet or the promise that returns the window status object
     */
    getWindowsStatus()
    {
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        let windowsStatus = [];

        let windowConfigurations = this.getLoadedConfiguration().windows;
        let windows = this.getWindows();

        if (! Array.isArray(windowConfigurations))
        {
            return new Promise(function(_resolve, _reject) {
                _reject("No windows found in loaded configuration");
            });
        }
        else
        {
            let numberOfWindows = windowConfigurations.length;
            let numberOfProcessedWindows = 0;

            return new Promise(function(_resolve){
                for (let windowId in windowConfigurations)
                {
                    if (windowConfigurations.hasOwnProperty(windowId))
                    {
                        windowsStatus[windowId] = {};
                        windowsStatus[windowId].configuration = windowConfigurations[windowId];
                        windowsStatus[windowId].isPageSwitchLoopActive = windows[windowId].getPageSwitchLoop().getIsActive();

                        let currentPage = windows[windowId].getPageSwitchLoop().getPageDisplayer().getCurrentPage();
                        if (currentPage)
                        {
                            windowsStatus[windowId].currentPage = currentPage.getId();
                            windowsStatus[windowId].remainingDisplayTime = windows[windowId].getPageSwitchLoop().calculateRemainingCycleTime();
                        }

                        let customURL = windows[windowId].getPageSwitchLoop().getPageDisplayer().getCustomURL();
                        if (customURL) windowsStatus[windowId].customURL = customURL;

                        numberOfProcessedWindows++;
                        if (numberOfProcessedWindows === numberOfWindows - 1) _resolve(windowsStatus);
                    }
                }
            });
        }
    }

    /**
     * Halts the page switch loop for a specified window.
     *
     * @param {int} _windowId The window id
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    haltPageSwitchLoopOfWindow(_windowId)
    {
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received page switch loop halt request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            let pageSwitchLoop = window.getPageSwitchLoop();
            if (pageSwitchLoop.getIsActive())
            {
                pavoApiLogger.info("Halting page switch loop for window #" + window.getDisplayId());
                pageSwitchLoop.halt();
            }
        }
    }

    /**
     * Resumes the page switch loop for a specified window.
     *
     * @param {int} _windowId The window id
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    resumePageSwitchLoopOfWindow(_windowId)
    {
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received page switch loop resume request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            let pageSwitchLoop = window.getPageSwitchLoop();
            if (! pageSwitchLoop.getIsActive())
            {
                pavoApiLogger.info("Resuming page switch loop for window #" + window.getDisplayId());
                pageSwitchLoop.continue();
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
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received url load request for window " + _windowId + " with target url \"" + _url + "\"");

        let window = this.getWindows()[_windowId];
        if (window)
        {
            this.haltPageSwitchLoopOfWindow(_windowId);
            window.getPageDisplayer().displayCustomURL(_url);
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
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received reload window request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getPageDisplayer().reloadCurrentPage();
        }
    }

    /**
     * Switches the page switch loop inside a specified window to a specific page id.
     *
     * @param {int} _windowId The window id
     * @param {int} _pageId The page id
     *
     * @return {string|null} The error message if the pavo app is not initialized yet or null
     */
    switchToPageInWindow(_windowId, _pageId)
    {
        if (! this.isReady()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received switch to page window request for window " + _windowId + " with target page " + _pageId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            window.getPageSwitchLoop().switchToPage(_pageId);
        }
    }
}


module.exports = PavoApi;
