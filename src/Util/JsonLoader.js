/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const fs = require("fs");

/**
 * Loads and returns the content of a json file.
 */
class JsonLoader
{
    /**
     * Loads and returns the content of a json file.
     *
     * @param {String} _filePath The json file path
     *
     * @returns {Object} The parsed content of the config file
     */
    getJson(_filePath)
    {
        let configFileContent = fs.readFileSync(_filePath);

        return JSON.parse(String(configFileContent));
    }
}


module.exports = JsonLoader;
