/**
* @file
* @version 2.0
* @copyright 2018-2025 cn-mobility GmbH
* @author Jens Stahl <jens.stahl@cn-mobility.eu>
*/

/**
 * CookieEditorDialog constructor.
 *
 * @param {Socket} _socket The socket which is necessary to save the edited configuration
 */
function CookieEditorDialog(_socket)
{
    this.socket = _socket;
}


/**
 * Handles showing of the "cookie editor" and the "Really save?" dialogs.
 *
 * @property {Socket} socket The socket which is necessary to save the edited configuration
 * @property {jQuery} cookieEditorDialogElement The element for the cookie editor dialog (must contain a "cookie-editor" sub div)
 * @property {jQuery} confirmDialogElement The element for the "Really save?" dialog
 * @property {JSONEditor} editor The cookie Editor
 */
CookieEditorDialog.prototype = {

    /**
     * Initializes the dialogs and the cookie editor.
     *
     * @param {jQuery} _cookieEditorDialogElement The element for the cookie editor dialog (must contain a "cookie-editor"
     * div)
     * @param {jQuery} _confirmDialogElement The element for the "Really save?" dialog
     */
    init: function(_cookieEditorDialogElement, _confirmDialogElement)
    {
        this.cookieEditorDialogElement = _cookieEditorDialogElement;
        this.confirmDialogElement = _confirmDialogElement;

        this.initializeDialogs();
        this.initializeJsonEditor();
    },


    /**
     * Loads a specified cookie object into the cookie editor and shows the cookie editor dialog.
     *
     * @param {object} _cookieObject The cookie object
     * @param {number} _windowId The index of the window for which we are editing cookies.
     */
    show: function(_cookieObject, _windowId, _pageId)
    {
        console.log('We prepare the window id: ' + _windowId);
        this.windowId = _windowId; // We need the window for the save instruction!
        this.pageId = _pageId;     // We need the page id for save instruction!
        this.editor.setValue(_cookieObject);
        $(this.cookieEditorDialogElement).dialog("open");
    },

    /**
     * Shows the "Really save?" confirmation dialog.
     */
    showConfirmDialog: function()
    {
        $(this.confirmDialogElement).dialog("open");
    },


    // Private Methods

    /**
     * Initializes the "cookie editor" and the "Really save?" dialogs.
     */
    initializeDialogs: function()
    {
        let showConfirmDialog = this.showConfirmDialog.bind(this);

        // Initialize cookie Editor dialog
        $(this.cookieEditorDialogElement).dialog({
            resizable: true,
            height: 600,
            width: 1000,
            modal: true,
            autoOpen: false,
            buttons: {
                "Speichern": function() {
                    $(this).dialog("close");
                    showConfirmDialog();
                },
                "Abbrechen": function() {
                    $(this).dialog("close");
                }
            }
        });
        $(this.cookieEditorDialogElement).css("visibility", "visible");


        let saveEditedCookie = this.saveEditedCookie.bind(this);

        // Initialize confirm dialog
        $(this.confirmDialogElement).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            autoOpen: false,
            buttons: {
                "Fortfahren": function() {
                    $(this).dialog("close");
                    saveEditedCookie();
                },
                "Abbrechen": function() {
                    $(this).dialog("close");
                }
            }
        });
        $(this.confirmDialogElement).css("visibility", "visible");
    },

    /**
     * Initializes the cookie editor.
     */
    initializeJsonEditor: function()
    {
        // Must edit the default icon lib because it won't work otherwise
        // Creating a custom icon lib is not an option because the icon lib that is defined in the constructor will
        // already be used for some parts of the editor
        JSONEditor.defaults.iconlibs.fontawesome4 = JSONEditor.AbstractIconLib.extend({
            mapping: {
                collapse: "caret-square-down",
                expand: "caret-square-right",
                delete: "trash-alt",
                edit: "pen",
                add: "plus-square",
                cancel: "ban",
                save: "save",
                moveup: "arrow-up",
                movedown: "arrow-down"
            },
            icon_prefix: "fas fa-"
        });

        let self = this;
        $.getJSON("/javascript/index/cookie.schema.json", function(_json){

            // Initialize JSON Editor
            self.editor = new JSONEditor(
                $(self.cookieEditorDialogElement).find("div#cookie-editor").get(0),
                {
                    schema: _json,
                    show_errors: "always",
                    theme: "bootstrap4",
                    iconlib: "fontawesome4"
                }
            );
        });
    },

    /**
     * Saves the edited cookie to the config file.
     *
     * @emits "editConfiguration" event
     */
    saveEditedCookie: function()
    {
        // Before we save the cookies we want to verify the date data the user entered
        const cookies = this.editor.getValue().cookies;
        cookies.forEach((cookie) => {
            if (typeof cookie.expirationDate === 'string' && cookie.expirationDate.indexOf(' ') !== false) {
                // ToDo: Remove  3 LINES  debugging code!!!
                console.log('Invalid expiration date: ' + cookie.expirationDate);
                const intermediateDate = new Date(cookie.expirationDate);
                cookie.expirationDate = intermediateDate.getTime() / 1000;
                console.log('Calculated Expiration: ' + cookie.expirationDate);
                console.log('New date: ' + intermediateDate.toString());
            }
        });

        const result = {
            windowId: this.windowId,
            pageId: this.pageId,
            cookies: cookies,
        };
        this.socket.emit("saveCookies", result);
    }
};
