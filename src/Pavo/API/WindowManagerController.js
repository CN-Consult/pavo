/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseApiController = require(__dirname + "/BaseApiController.js");

/**
 * Provides methods to fetch information about the WindowManager.
 */
class WindowManagerController extends BaseApiController
{
    /**
     * WindowManagerController constructor.
     *
     * @param {PavoApi} _parentPavoApi The parent pavo API
     */
    constructor(_parentPavoApi)
    {
        super(_parentPavoApi, ["getWindows", "getWindowsStatus"]);
    }


    /**
     * Returns the windows of the pavo app.
     *
     * @return {Window[]} The list of windows
     */
    getWindows()
    {
        return this.parentPavoApi.getParentPavo().getWindowManager().getWindows();
    }

    /**
     * Returns the status for each window of the pavo app.
     * This includes the configuration and whether the page switch loop is active
     *
     * @return {Promise} The promise that returns the window status object
     */
    getWindowsStatus()
    {
        let windowsStatus = [];

        let windowConfigurations = this.parentPavoApi.getParentPavo().getLoadedConfiguration().windows;
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

                        if (windows[windowId].getPageSwitchLoop().getPageDisplayer().isDisplayingCustomURL())
                        {
                            windowsStatus[windowId].customURL = windows[windowId].getPageSwitchLoop().getPageDisplayer().getCustomURL();
                        }

                        numberOfProcessedWindows++;
                        if (numberOfProcessedWindows === numberOfWindows) _resolve(windowsStatus);
                    }
                }
            });
        }
    }
}


module.exports = WindowManagerController;
