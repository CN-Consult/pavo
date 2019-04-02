/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseEventProcessor = require(__dirname + "/../BaseEventProcessor");

/**
 * Handles the "show", "halt" and "continue" events of the page switch loop.
 */
class PageSwitchEventProcessor extends BaseEventProcessor
{
    /**
     * Initializes the event listeners.
     */
    initializeEventListeners()
    {
        let self = this;
        this.pavoApi.getWindows().forEach(

            /** @param {Window} _window */
            function(_window){
                self.initializeEventListenersFor(_window.getPageSwitchLoop(), [ "show", "halt", "continue" ]);
            }
        );
    }

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {PageSwitchLoop} _pageSwitchLoop The page switch loop that emitted the event
     * @param {String} _eventName The name of the event
     * @param {Object} _data The page to which the pavo app switched
     */
    processEvent(_pageSwitchLoop, _eventName, _data)
    {
        let statusUpdate = {
            type: _eventName,
            window: _data.page.getParentWindow().getId(),
            page: _data.page.getId(),
            remainingDisplayMilliseconds: _data.remainingDisplayTime,
            pageSwitchLoopIsActive: _data.isActive
        };

        this.socket.emit("pageSwitchLoopStatusUpdate", statusUpdate);
    }
}


module.exports = PageSwitchEventProcessor;
