/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseApiController = require(__dirname + "/BaseApiController.js");

/**
 * Provides methods to control PageSwitchLoop's.
 */
class PageSwitchLoopController extends BaseApiController
{
    /**
     * PageSwitchLoopController constructor.
     *
     * @param {PavoApi} _parentPavoApi The parent pavo API
     */
    constructor(_parentPavoApi)
    {
        super(_parentPavoApi, ["haltPageSwitchLoopOfWindow", "resumePageSwitchLoopOfWindow", "switchToPageInWindow"]);
    }


    /**
     * Halts the page switch loop for a specified window.
     *
     * @param {int} _windowId The window id
     */
    haltPageSwitchLoopOfWindow(_windowId)
    {
        this.logger.info("Received page switch loop halt request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            let pageSwitchLoop = window.getPageSwitchLoop();
            if (pageSwitchLoop.getIsActive())
            {
                this.logger.info("Halting page switch loop for window #" + window.getDisplayId());
                pageSwitchLoop.halt();
            }
        }
    }

    /**
     * Resumes the page switch loop for a specified window.
     *
     * @param {int} _windowId The window id
     */
    resumePageSwitchLoopOfWindow(_windowId)
    {
        this.logger.info("Received page switch loop resume request for window " + _windowId);

        let window = this.getWindows()[_windowId];
        if (window)
        {
            let pageSwitchLoop = window.getPageSwitchLoop();
            if (! pageSwitchLoop.getIsActive())
            {
                this.logger.info("Resuming page switch loop for window #" + window.getDisplayId());
                pageSwitchLoop.continue();
            }
        }
    }

    /**
     * Switches the page switch loop inside a specified window to a specific page id.
     *
     * @param {int} _windowId The window id
     * @param {int} _pageId The page id
     */
    switchToPageInWindow(_windowId, _pageId)
    {
        this.logger.info("Received switch to page window request for window " + _windowId + " with target page " + _pageId);

        let window = this.getWindows()[_windowId];
        if (window) window.getPageSwitchLoop().switchToPage(_pageId);
    }
}


module.exports = PageSwitchLoopController;
