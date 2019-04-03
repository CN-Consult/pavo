/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WebClientEventProcessor = require(__dirname + "/../WebClientEventProcessor");

/**
 * Handles the "showText" events.
 */
class ShowTextEventProcessor extends WebClientEventProcessor
{
    /**
     * ShowTextEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "showText" ]);
    }


    // Public Methods

    /**
     * Processes one of the events that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {*} _data The data that was sent with the event
     */
    processWebClientEvent(_eventName, _data)
    {
        this.pavoApi.showText(parseInt(_data.windowId), String(_data.text));
    }
}


module.exports = ShowTextEventProcessor;
