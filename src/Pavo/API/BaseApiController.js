/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const pavoApiLogger = require("log4js").getLogger("pavoApi");

/**
 * Base class for API controllers.
 * A API controller provides methods to fetch information about and to control a component of the Pavo app.
 * All methods that are defined as provided methods will be callable from the pavo API.
 *
 * @property {PavoApi} parentPavoApi The parent pavo API
 * @property {String[]} providedMethodNames The list of method names that this controller provides
 * @property {Logger} logger The pavo API logger
 */
class BaseApiController
{
    /**
     * BaseApiController constructor.
     *
     * @param {PavoApi} _parentPavoApi The parent pavo API
     * @param {String[]} _providedMethodNames The list of method names that this controller provides
     */
    constructor(_parentPavoApi, _providedMethodNames = [])
    {
        this.parentPavoApi = _parentPavoApi;
        this.providedMethodNames = _providedMethodNames;
        this.logger = pavoApiLogger;
    }


    /**
     * Returns a method that is provided by this controller by its name.
     *
     * @param {String} _methodName The method name
     *
     * @return {function|null} The method that is provided by this controller or null if this controller doesn't provide a method with that name
     */
    getProvidedMethodByName(_methodName)
    {
        for (let i = 0; i < this.providedMethodNames.length; i++)
        {
            if (this.providedMethodNames[i] === _methodName) return this[this.providedMethodNames[i]].bind(this);
        }
    }
}


module.exports = BaseApiController;
