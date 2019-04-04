/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const url = require("url");
const BaseController = require(__dirname + "/BaseController");

/**
 * Handles the "/show-text" route.
 */
class ShowTextController extends BaseController
{
    // Public Methods

    /**
     * Creates the response for a specific request.
     *
     * @param {http.IncomingMessage} _request The request from the user
     * @param {http.ServerResponse} _response The object that can be used to respond to the request
     */
    respond(_request, _response)
    {
        if (! _request.socket.remoteAddress.endsWith("127.0.0.1"))
        { // Send a 403 error to every client that does not connect from the local host
            _response.sendStatus(403);
        }
        else
        {
            // Parse the url query string
            let parsedUrl = url.parse(_request.url, true);

            let backgroundColor;
            if (parsedUrl.query.backgroundColor) backgroundColor = this.getCssColorFromString(parsedUrl.query.backgroundColor);
            else backgroundColor = "#000";

            let color;
            if (parsedUrl.query.color) color = this.getCssColorFromString(parsedUrl.query.color);
            else color = "#FFF";

            _response.render("show-text.njk", {
                "backgroundColor": backgroundColor,
                "color": color,
                "showText": parsedUrl.query.text
            });
        }
    }


    // Private Methods

    /**
     * Returns a css color from a input color string.
     * This prepends a "#" to valid hexadecimal value colors and returns the input color string in any other case.
     *
     * @param {String} _colorString The input color string
     *
     * @return {String} The css color string
     */
    getCssColorFromString(_colorString)
    {
        let allowedHexadecimalValueLengths = [3, 4, 6, 8];
        if (allowedHexadecimalValueLengths.includes(_colorString.length))
        {
            let hexadecimalValue = parseInt(_colorString, 16);
            if (hexadecimalValue.toString(16) === _colorString.toLowerCase())
            { // The value is a hexadecimal value with one of the allowed value lengths
                return "#" + _colorString;
            }
        }

        // Assume that another color type was passed, e.g. a color name
        return _colorString;
    }
}


module.exports = ShowTextController;
