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
        let windows = this.parentPavo.getWindowManager().getWindows();

        if (Array.isArray(windowConfigurations))
        {
            for (let windowId in windowConfigurations)
            { // Add the isTabSwitchLoopActive information to the running configuration

                if (windowConfigurations.hasOwnProperty(windowId))
                {
                    windowsStatus[windowId] = {};
                    windowsStatus[windowId].configuration = windowConfigurations[windowId];
                    windowsStatus[windowId].isTabSwitchLoopActive = windows[windowId].getTabSwitchLoop().getIsActive();
                }
            }
        }

        return windowsStatus;
    }

    /**
     * Halts the tab switch loop for a specified list of window ids.
     *
     * @param {string[]} _windowIds The window ids
     *
     * @return {int[]|string} The list of halted tab loop window ids or an error message if the pavo app is not initialized yet
     */
    haltTabSwitchLoopsFor(_windowIds)
    {
        if (! this.parentPavo.getIsInitialized()) return "ERROR: Pavo app not initialized yet";

        pavoApiLogger.info("Received tab switch loop halt request for windows " + JSON.stringify(_windowIds));

        let windows = this.parentPavo.getWindowManager().getWindows();
        let haltedTabLoopWindowIds = [];

        _windowIds.forEach(function(_windowId){
            let window = windows[_windowId];

            if (window)
            {
                let tabSwitchLoop = window.getTabSwitchLoop();
                if (tabSwitchLoop.getIsActive())
                {
                    pavoApiLogger.info("Halting tab switch loop for window #" + window.getDisplayId());
                    tabSwitchLoop.halt();
                    haltedTabLoopWindowIds.push(window.getId());
                }
            }
        });

        return haltedTabLoopWindowIds;
    }

    /**
     * Resumes the tab switch loop for a specified list of window ids.
     *
     * @param {string[]} _windowIds The list of window ids
     *
     * @return {Promise} The promise that returns the list of resumed tab loop window ids or an error message if the pavo app is not initialized yet
     */
    resumeTabSwitchLoopsFor(_windowIds)
    {
        if (! this.parentPavo.getIsInitialized()) return new Promise(function(_resolve, _reject){
            _reject("ERROR: Pavo app not initialized yet");
        });

        pavoApiLogger.info("Received tab switch loop resume request for windows " + JSON.stringify(_windowIds));

        let windows = this.parentPavo.getWindowManager().getWindows();
        let resumedTabLoopWindowIds = [];
        let numberOfWindowIds = _windowIds.length;
        let numberOfResumedTabSwitchLoops = 0;

        return new Promise(function(_resolve){
            _windowIds.forEach(function(_windowId){
                let window = windows[_windowId];

                if (window)
                {
                    let tabSwitchLoop = window.getTabSwitchLoop();
                    if (! tabSwitchLoop.getIsActive())
                    {
                        pavoApiLogger.info("Resuming tab switch loop for window #" + window.getDisplayId());
                        tabSwitchLoop.continue().then(function(){
                            resumedTabLoopWindowIds.push(window.getId());
                            numberOfResumedTabSwitchLoops++;
                            if (numberOfWindowIds === numberOfResumedTabSwitchLoops) _resolve(resumedTabLoopWindowIds);
                        })
                    }
                    else
                    {
                        numberOfResumedTabSwitchLoops++;
                        if (numberOfWindowIds === numberOfResumedTabSwitchLoops) _resolve(resumedTabLoopWindowIds);
                    }
                }
                else
                {
                    numberOfResumedTabSwitchLoops++;
                    if (numberOfWindowIds === numberOfResumedTabSwitchLoops) _resolve(resumedTabLoopWindowIds);
                }
            });
        });
    }
}


/**
 * The parent pavo app which can be accessed with this pavo api
 *
 * @type {Pavo} parentPavo
 */
PavoApi.parentPavo = null;


module.exports = PavoApi;
