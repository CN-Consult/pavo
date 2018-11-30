/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseEventProcessor = require(__dirname + "/../BaseEventProcessor");

/**
 * Handles the "show" events of the tab switch loop.
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
            _window.getTabSwitchLoop().on("show", function(_data){
                self.processEvent("show", _data);
            });
            _window.getTabSwitchLoop().on("halt", function(_data){
               self.processEvent("halt", _data);
            });
            _window.getTabSwitchLoop().on("continue", function(_data){
               self.processEvent("continue", _data);
            });
        });
    }

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {Tab} _data The tab to which the pavo app switched
     */
    processEvent(_eventName, _data)
    {
        let statusUpdate = {
            type: _eventName,
            window: _data["tab"].getParentWindow().getId(),
            tab: _data["tab"].getId(),
            remainingDisplayMilliseconds: _data["remainingDisplayTime"]
        };

        this.socket.emit("tabSwitchLoopStatusUpdate", statusUpdate);
    }
}


module.exports = TabSwitchEventProcessor;
