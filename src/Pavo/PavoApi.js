/**
 * @version 0.1
 * @copyright 2018-2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const glob = require("glob");

/**
 * Provides the api methods for the pavo app.
 *
 * @property {Pavo} parentPavo The parent pavo app which can be accessed with this PavoApi
 * @property {BaseApiController[]} controllers The API controllers
 */
class PavoApi
{
    /**
     * PavoApi constructor.
     *
     * @param {Pavo} _parentPavo The parent pavo
     */
    constructor(_parentPavo)
    {
        this.parentPavo = _parentPavo;
        this.controllers = [];

        // Create a proxy for this instance that searches the controllers for methods when an unknown member is accessed
        let proxy = this.generateProxy();

        // Initialize the controllers
        let pavoControllerFilePaths = glob.sync(__dirname + "/API/*Controller.js", { ignore: [__dirname + "/API/BaseApiController.js"] });

        let self = this;
        pavoControllerFilePaths.forEach(function(_pavoControllerFilePath){
            let pavoController = require(_pavoControllerFilePath);
            self.controllers.push(new pavoController(proxy));
        });

        return proxy;
    }


    // Getters and Setters

    /**
     * Returns the parent pavo of this Pavo API.
     *
     * @return {Pavo} The parent pavo
     */
    getParentPavo()
    {
        return this.parentPavo;
    }


    // Private Methods

    /**
     * Creates and returns a proxy for this instance that searches this instances controllers for methods when an unknown member is accessed.
     *
     * @return {PavoApi} The proxy
     * @private
     */
    generateProxy()
    {
        let self = this;
        return new Proxy(this, {
            get(_target, _key) {
                let member = self[_key];
                if (member) return member;
                else return self.getReturnValueForUnknownMember(_key);
            }
        });
    }

    /**
     * Returns a value for an unknown member.
     *
     * @param {String} _memberName The name of the member
     *
     * @return {function|string} The return value for the member name or an error message if no member with that name exists
     * @private
     */
    getReturnValueForUnknownMember(_memberName)
    {
        if (this.parentPavo.getIsInitialized())
        {
            let method = this.getApiMethodByName(_memberName);
            if (method) return method;
            else return "ERROR: Tried to access unknown API member '" + _memberName + "'";
        }
        else
        {
            return function(){
                return new Promise(function(_resolve){
                    _resolve("ERROR: Pavo app not initialized yet")
                });
            };
        }
    }

    /**
     * Returns a method from one of the controllers by its name.
     *
     * @param {String} _methodName The method name
     *
     * @return {function|null} The method or null if no controller provides a method with that name
     * @private
     */
    getApiMethodByName(_methodName)
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            let method = this.controllers[i].getProvidedMethodByName(_methodName);
            if (method) return method;
        }
    }
}


module.exports = PavoApi;
