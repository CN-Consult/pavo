/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const BaseEventProcessor = require(__dirname + "/../BaseEventProcessor");

/**
 * Handles the "customUrlLoad" events of the page displayer.
 */
class CustomUrlLoadEventProcessor extends BaseEventProcessor
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
                self.initializeEventListenersFor(_window.getPageSwitchLoop(), [ "customUrlLoad" ]);
            }
        );
    }

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {PageSwitchLoop} _pageSwitchLoop The page switch loop that emitted the event
     * @param {String} _eventName The name of the event
     * @param {Page} _data The url and the page into which the url was loaded
     */
    processEvent(_pageSwitchLoop, _eventName, _data)
    {
        let statusUpdate = {
            window: _data.page.getParentWindow().getId(),
            url: _data.url
        };

        this.socket.emit("customUrlLoad", statusUpdate);
    }
}


module.exports = CustomUrlLoadEventProcessor;
