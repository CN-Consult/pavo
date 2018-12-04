/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Handles showing of the "json editor" and the "Really save?" dialogs.
 */
class JsonEditorDialog
{
    /**
     * JsonEditorDialog constructor.
     *
     * @param {Socket} _socket The socket which is necessary to save the edited configuration
     */
    constructor(_socket)
    {
        this.socket = _socket;
    }


    /**
     * Initializes the dialogs and the json editor.
     *
     * @param {jQuery} _jsonEditorDialogElement The element for the json editor dialog (must contain a "json-editor" sub div
     * @param {jQuery} _confirmDialogElement The element for the "Really save?" dialog
     */
    init(_jsonEditorDialogElement, _confirmDialogElement)
    {
        this.jsonEditorDialogElement = _jsonEditorDialogElement;
        this.confirmDialogElement = _confirmDialogElement;

        this.initializeDialogs();
        this.initializeJsonEditor();
    }


    /**
     * Loads a specified json object into the json editor and show the json editor dialog.
     *
     * @param {object} _jsonObject The json object
     */
    show(_jsonObject)
    {
        this.editor.setValue(_jsonObject);
        $(this.jsonEditorDialogElement).dialog("open");
    }

    /**
     * Shows the "Really save?" confirmation dialog.
     */
    showConfirmDialog()
    {
        $(this.confirmDialogElement).dialog("open");
    }


    // Private Methods

    /**
     * Initializes the "json editor" and the "Really save?" dialogs.
     */
    initializeDialogs()
    {
        let showConfirmDialog = this.showConfirmDialog.bind(this);

        // Initialize JSON Editor dialog
        $(this.jsonEditorDialogElement).dialog({
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


        let saveEditedJson = this.saveEditedJson.bind(this);

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
                    saveEditedJson();
                },
                "Abbrechen": function() {
                    $(this).dialog("close");
                }
            }
        });
    }

    /**
     * Initializes the json editor.
     */
    initializeJsonEditor()
    {
        // Must edit the default icon lib because it won't work otherwise
        // Creating a custom icon lib is not a option because the icon lib that is defined in the constructor will already
        // be used for some parts of the editor
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
        $.getJSON("/javascript/index/schema.json", function(_json){

            // Initialize JSON Editor
            self.editor = new JSONEditor(
                $(self.jsonEditorDialogElement).find("div#json-editor").get(0),
                {
                    schema: _json,
                    show_errors: "always",
                    theme: "bootstrap3",
                    iconlib: "fontawesome4"
                }
            );
        });
    }

    /**
     * Saves the edited json to the config file.
     */
    saveEditedJson()
    {
        this.socket.emit("editConfiguration", this.editor.getValue());
    }
}
