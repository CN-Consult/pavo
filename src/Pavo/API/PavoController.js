/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const fs = require("fs");
const mv = require("mv");
const { objectEquals } = require("object-equals");

const BaseApiController = require(__dirname + "/BaseApiController.js");
const JsonLoader = require(__dirname + "/../../Util/JsonLoader.js");

/**
 * Provides methods to get and set the pavo configuration.
 */
class PavoController extends BaseApiController
{
    /**
     * WindowManagerController constructor.
     *
     * @param {PavoApi} _parentPavoApi The parent pavo API
     */
    constructor(_parentPavoApi)
    {
        super(_parentPavoApi, ["getLoadedConfiguration", "setConfiguration", "getPavoStatus"]);
    }


    /**
     * Returns the currently loaded pavo configuration.
     *
     * @return {Object} The currently loaded pavo configuration
     */
    getLoadedConfiguration()
    {
        return this.parentPavoApi.getParentPavo().getLoadedConfiguration();
    }

    /**
     * Sets the pavo configuration inside the configuration file.
     * This new configuration will not be applied until a restart of the pavo app.
     *
     * @param {object} _configuration The new configuration
     */
    setConfiguration(_configuration)
    {
        this.logger.info("Received configuration set request");

        let configBaseDirectory = this.parentPavoApi.getParentPavo().getConfigDirectoryPath();

        let currentConfiguration = JsonLoader.getJson(configBaseDirectory + "/config.json");
        if (objectEquals(_configuration, currentConfiguration))
        {
            this.logger.info("Did not save configuration: New configuration matches current config.json");
            return;
        }

        let configBackupDirectory = configBaseDirectory + "/config-backups";

        // Create the backup directory for config files if necessary
        if (! fs.existsSync(configBackupDirectory)) fs.mkdirSync(configBackupDirectory);

        let configFilePath = configBaseDirectory + "/config.json";
        let backupFilePath = configBackupDirectory + "/" + Date.now() + ".json";

        // Backup the previous file
        mv(configFilePath, backupFilePath, function(_error){

            if (_error)
            {
                this.logger.warn(_error);
                this.logger.warn("Could not create backup of previous config file, aborting configuration update.");
            }
            else
            { // Write the new configuration to the config file
                fs.writeFileSync(configFilePath, JSON.stringify(_configuration));
            }
        });
    }

    /**
     * Returns a object that contains status information about the pavo app.
     *
     * @return {object} The object that contains status information
     */
    getPavoStatus()
    {
        let startTimestamp = new Date(this.parentPavoApi.getParentPavo().getStartTimestamp());
        return {
            startTimestamp: startTimestamp.toString()
        };
    }
}


module.exports = PavoController;
