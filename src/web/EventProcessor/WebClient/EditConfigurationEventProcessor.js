/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const WebClientEventProcessor = require(__dirname + "/../WebClientEventProcessor");

/**
 * Handles the "editConfiguration" events.
 */
class EditConfigurationEventProcessor extends WebClientEventProcessor
{
    /**
     * EditConfigurationEventProcessor constructor.
     *
     * @param {Server} _socket The socket
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_socket, _pavoApi)
    {
        super(_socket, _pavoApi, [ "editConfiguration" ]);
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
        if (_data !== null && typeof _data === "object")
        {
            this.pavoApi.setConfiguration(_data);
        }
    }
}


module.exports = EditConfigurationEventProcessor;
