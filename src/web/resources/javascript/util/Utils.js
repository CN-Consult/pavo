/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Provides some static util functions.
 */
var Utils = {

    // Toast messages

    /**
     * Shows a success message.
     *
     * @param {String} _message The message
     */
    showSuccessMessage: function(_message)
    {
        nativeToast({
            message: _message,
            position: "north-east",
            closeOnClick: true,

            timeout: 3500,
            type: "success"
        });
    },

    /**
     * Shows a error message.
     *
     * @param {String} _message The error message
     */
    showErrorMessage: function(_message)
    {
        nativeToast({
            message: _message,
            position: "north-east",
            closeOnClick: true,

            timeout: 3500,
            type: "error"
        });
    }
};
