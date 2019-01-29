/**
 * @file
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WebClientEventProcessor = require(__dirname + "/../WebClientEventProcessor");

/**
 * Handles the "haltPageSwitchLoops" events.
 */
class HaltPageSwitchLoopsEventProcessor extends WebClientEventProcessor
{
    /**
     * HaltPageSwitchLoopsEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "haltPageSwitchLoops" ]);
    }

    // Public Methods

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {*} _data The data that was sent with the event
     */
    processWebClientEvent(_eventName, _data)
    {
        let windowIds = _data["windowIds"];
        if(! Array.isArray(windowIds)) this.socket.emit("error", { message: "haltPageSwitchLoops expects a list of window ids" });

        // Convert window ids to integers
        windowIds = windowIds.map(function(_windowIdString){
            return parseInt(_windowIdString);
        });

        let self = this;
        windowIds.forEach(function(_windowId){
            self.pavoApi.haltPageSwitchLoopOfWindow(_windowId);
        });
    }
}


module.exports = HaltPageSwitchLoopsEventProcessor;
