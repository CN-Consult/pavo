/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseEventProcessor = require(__dirname + "/../BaseEventProcessor");

/**
 * Handles the "displayText" events of the page displayer.
 */
class DisplayTextEventProcessor extends BaseEventProcessor
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
                self.initializeEventListenersFor(_window.getPageDisplayer(), [ "displayText" ]);
            }
        );
    }

    /**
     * Processes one of the events that this event processor listens to.
     *
     * @param {PageDisplayer} _pageDisplayer The page displayer that emitted the event
     * @param {String} _eventName The name of the event
     * @param {Page} _data The text that was displayed
     */
    processEvent(_pageDisplayer, _eventName, _data)
    {
        let statusUpdate = {
            window: _pageDisplayer.getParentWindow().getId(),
            text: _data.text
        };

        this.socket.emit("displayText", statusUpdate);
    }
}


module.exports = DisplayTextEventProcessor;
