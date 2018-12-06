/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseEventProcessor = require(__dirname + "/../BaseEventProcessor");

/**
 * Handles the "customUrlLoad" events of the tab displayer.
 */
class CustomUrlLoadEventProcessor extends BaseEventProcessor
{
    /**
     * Initializes the event listeners.
     */
    initializeEventListeners()
    {
        let self = this;
        this.pavoApi.getWindows().forEach(function(_window){
            _window.getTabSwitchLoop().getTabDisplayer().on("customUrlLoad", function(_data){
                self.processEvent("customUrlLoad", _data);
            });
        });
    }

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {Tab} _data The url and the tab into which the url was loaded
     */
    processEvent(_eventName, _data)
    {
        let statusUpdate = {
            window: _data["tab"].getParentWindow().getId(),
            url: _data["url"]
        };

        this.socket.emit("customUrlLoad", statusUpdate);
    }
}


module.exports = CustomUrlLoadEventProcessor;
