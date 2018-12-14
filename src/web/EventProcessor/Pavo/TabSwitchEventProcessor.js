/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseEventProcessor = require(__dirname + "/../BaseEventProcessor");

/**
 * Handles the "show", "halt" and "continue" events of the tab switch loop.
 */
class TabSwitchEventProcessor extends BaseEventProcessor
{
    /**
     * Initializes the event listeners.
     */
    initializeEventListeners()
    {
        let self = this;
        this.pavoApi.getWindows().forEach(function(_window){

            let tabSwitchLoop = _window.getTabSwitchLoop();
            self.initializeEventListenersFor(tabSwitchLoop, [ "show", "halt", "continue" ]);
        });
    }

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {TabSwitchLoop} _tabSwitchLoop The tab switch loop that emitted the event
     * @param {String} _eventName The name of the event
     * @param {Object} _data The tab to which the pavo app switched
     */
    processEvent(_tabSwitchLoop, _eventName, _data)
    {
        let statusUpdate = {
            type: _eventName,
            window: _data["tab"].getParentWindow().getId(),
            tab: _data["tab"].getId(),
            remainingDisplayMilliseconds: _data["remainingDisplayTime"],
            tabSwitchLoopIsActive: _data["isActive"]
        };

        this.socket.emit("tabSwitchLoopStatusUpdate", statusUpdate);
    }
}


module.exports = TabSwitchEventProcessor;
