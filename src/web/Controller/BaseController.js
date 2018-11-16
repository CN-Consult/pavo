/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const url = require("url");

/**
 * Parent class for controllers.
 * Controllers handle creating the html contents that a web server visitor receives when accessing a specific route.
 */
class BaseController
{
    /**
     * BaseController constructor.
     *
     * @param {PavoApi} _pavoApi The pavo api
     */
    constructor(_pavoApi)
    {
        this.pavoApi = _pavoApi;
    }


    /**
     * Creates the response for a specific request.
     *
     * @param {http.IncomingMessage} _request The request from the user
     * @param {http.ServerResponse} _response The object that can be used to respond to the request
     */
    respond(_request, _response)
    {
    }


    // Protected Methods

    /**
     * Parses and returns the url/get parameters of a request.
     *
     * @param {http.IncomingMessage} _request The request
     *
     * @returns {Object} The parsed url/get parameters
     */
    getUrlParameters(_request)
    {
        let parsedUrl = url.parse(_request.url, true);

        return parsedUrl.query;
    }
}


module.exports = BaseController;
