/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WebClientEventProcessor = require(__dirname + "/WebClientEventProcessor");

/**
 * Handles the "getLoadedConfiguration" events.
 */
class GetLoadedConfigurationEventProcessor extends WebClientEventProcessor
{
    /**
     * GetLoadedConfigurationEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "getLoadedConfiguration" ]);
    }

    // Public Methods

    /**
     * Processes one of the events for the specific event that this event processor listens to.
     *
     * @param {String} _eventName The name of the event
     * @param {object} _data The data that was sent with the event
     */
    processEvent(_eventName, _data)
    {
        this.socket.emit("loadedConfigurationStatus", this.pavoApi.getLoadedConfiguration());
    }
}


module.exports = GetLoadedConfigurationEventProcessor;
