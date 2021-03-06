/**
 * @version 0.1
 * @copyright 2019 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const fs = require("fs");
const EventEmitter = require("events");

/**
 * Injects custom javascript and css files into WebContents objects.
 *
 * @property {String[]} cssFilePaths The list of css files to inject into WebContents objects
 * @property {String[]} javascriptFilePaths The list of javascript files to inject into WebContents objects
 * @property {function} domReadyHandler The function that will be called on WebContents "dom-ready" events
 * @property {float} zoomFactor The zoom factor for the web contents in percentage/100
 */
class WebContentsDataInjector extends EventEmitter
{
    /**
     * WebContentsDataInjector constructor.
     *
     * @param {String} _configDirectoryPath The path to the config directory
     * @param {String[]} _cssFilePaths The css file paths relative from the custom css file base folder
     * @param {String[]} _javascriptFilePaths The javascript file paths relative from the custom javascript file
     * @param {float} _zoomFactor The zoom factor for the web contents in percentage/100 (optional)
     */
    constructor(_configDirectoryPath, _cssFilePaths, _javascriptFilePaths, _zoomFactor = null)
    {
        super();

        let basePath = _configDirectoryPath + "/";

        // Initialize the list of css files
        if (_cssFilePaths)
        {
            this.cssFilePaths = _cssFilePaths.map(function(_filePath){
                return basePath + _filePath;
            });
        }
        else this.cssFilePaths = [];

        // Initialize the list of javascript files
        if (_javascriptFilePaths)
        {
            this.javascriptFilePaths = _javascriptFilePaths.map(function(_filePath){
                return basePath + _filePath;
            });
        }
        else this.javascriptFilePaths = [];

        if (_zoomFactor) this.zoomFactor = _zoomFactor;

        this.domReadyHandler = this.domReadyHandlerFunction.bind(this);
    }


    // Event Handlers

    /**
     * Event handler that is called when a attached web contents object emits "dom-ready".
     *
     * @param {Electron.Event} _event The event
     *
     * @emits The "data-injected" event after injecting all custom javascript and css files
     */
    domReadyHandlerFunction(_event)
    {
        let webContents = _event.sender;

        let self = this;
        this.injectData(webContents).then(function(){
            self.emit("data-injected");
        });
    }


    // Public Methods

    /**
     * Attaches the dom ready handler of this WebContentsDataInjector to a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     */
    attachToWebContents(_webContents)
    {
        // Attach the dom ready handler to the WebContents
        _webContents.on("dom-ready", this.domReadyHandler);
    }

    /**
     * Detaches the dom ready handler of this WebContentsDataInjector from a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     */
    detachFromWebContents(_webContents)
    {
        _webContents.removeListener("dom-ready", this.domReadyHandler);
    }

    /**
     * Injects the list of custom css and javascript files into a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     *
     * @return {Promise} The promise that injects the list of custom css and javascript files into the WebContents object
     */
    injectData(_webContents)
    {
        let self = this;
        return new Promise(function(_resolve){
            self.injectZoomFactor(_webContents).then(function(){
                self.injectCssFiles(_webContents).then(function(){
                    self.injectJavascriptFiles(_webContents).then(function(){
                        _resolve("Custom css and javascript files injected");
                    });
                });
            });
        });
    }


    // Private Methods

    /**
     * Injects the zoom factor as css property into a web contents object.
     * webContents.setZoomFactor() cannot be used because it uses chromium's zoom, which by design zooms per domain instead
     * of per tab as one would expect. This means that two pages with the same domain cannot be displayed with different
     * zoom factors at the same time.
     *
     * @param {Electron.WebContents} _webContents The web contents
     *
     * @return {Promise} The promise that injects the zoom factor
     * @private
     */
    injectZoomFactor(_webContents)
    {
        if (this.zoomFactor)
        {
            let zoomPercent = this.zoomFactor * 100;

            /*
             * zoom is a non-standard css property but is supported by chromium
             * That property is used instead of transform: scale(x) because transform causes unwanted behaviour in some
             * frameworks that calculate item positions based on the item widths
             */
            let zoomCssString = "body { zoom: " + zoomPercent + "%; }";

            return _webContents.executeJavaScript(WebContentsDataInjector.buildCssInjectionJavaScript(zoomCssString));
        }
        else
        {
            return new Promise(function(_resolve){
                _resolve("No zoom factor specified");
            });
        }
    }

    /**
     * Injects the list of custom css files into a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     *
     * @return {Promise} The promise that injects the list of custom css files into a WebContents object
     * @private
     */
    injectCssFiles(_webContents)
    {
        let numberOfCssFiles = this.cssFilePaths.length;
        let numberOfInjectedCssFiles = 0;

        let self = this;
        return new Promise(function(_resolve){

            if (numberOfCssFiles === 0) _resolve("No css files to inject");
            else
            {
                self.cssFilePaths.forEach(function(_cssFilePath){
                    WebContentsDataInjector.injectCssFile(_webContents, _cssFilePath).then(function(){
                        numberOfInjectedCssFiles++;
                        if (numberOfInjectedCssFiles === numberOfCssFiles) _resolve("CSS files injected");
                    });
                });
            }
        });
    }

    /**
     * Injects the list of custom javascript files into a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     *
     * @return {Promise} The promise that injects the list of custom javascript files into a WebContents object
     * @private
     */
    injectJavascriptFiles(_webContents)
    {
        let numberOfJavascriptFiles = this.javascriptFilePaths.length;
        let numberOfInjectedJavascriptFiles = 0;

        let self = this;
        return new Promise(function(_resolve){

            if (numberOfJavascriptFiles === 0) _resolve("No javascript files to inject");
            else
            {
                self.javascriptFilePaths.forEach(function(_javascriptFilePath){
                    WebContentsDataInjector.injectJavascriptFile(_webContents, _javascriptFilePath).then(function(){
                        numberOfInjectedJavascriptFiles++;
                        if (numberOfInjectedJavascriptFiles === numberOfJavascriptFiles) _resolve("Javascript files injected");
                    });
                });
            }
        });
    }

    /**
     * Injects a css file into a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     * @param {String} _cssFilePath The path to the css file
     *
     * @return {Promise} The promise that injects the css file into the WebContents object
     * @private
     */
    static injectCssFile(_webContents, _cssFilePath)
    {
        let cssFileContent = WebContentsDataInjector.getFileContentString(_cssFilePath);
        return _webContents.executeJavaScript(WebContentsDataInjector.buildCssInjectionJavaScript(cssFileContent));
    }

    /**
     * Injects a javascript file into a WebContents object.
     *
     * @param {Electron.WebContents} _webContents The WebContents object
     * @param {String} _javascriptFilePath The path to the javascript file
     *
     * @return {Promise} The promise that injects the javascript file into the WebContents object
     * @private
     */
    static injectJavascriptFile(_webContents, _javascriptFilePath)
    {
        return _webContents.executeJavaScript(WebContentsDataInjector.getFileContentString(_javascriptFilePath));
    }

    /**
     * Returns the content of a file as a string.
     *
     * @param {String} _filePath The path to the file
     *
     * @return {String} The file content
     * @private
     */
    static getFileContentString(_filePath)
    {
        return String(fs.readFileSync(_filePath));
    }

    /**
     * Builds a java script string that inserts an inline css tag into a pages header.
     * Using javascript to add the css as inline tag because using the "WebContents.insertCss" method doesn't
     * style the elements as expected (!important statements seem to be ignored).
     *
     * @param {String} _cssCode The css code
     *
     * @return {String} The javascript string that inserts an inline css tag into a pages header
     * @private
     */
    static buildCssInjectionJavaScript(_cssCode)
    {
        let oneLineCssCode = _cssCode.replace(/\r?\n|\r/gm, "");

        /*
         * Creates a <style> element and fills it with the css file content.
         * Then it adds the <style> element to the <head> tag
         */
        return "var styleElement=document.createElement(\"style\");" +
            "styleElement.type=\"text/css\";" +
            "styleElement.appendChild(document.createTextNode(\"" + oneLineCssCode + "\"));" +
            "document.getElementsByTagName(\"head\")[0].appendChild(styleElement);";
    }
}


module.exports = WebContentsDataInjector;
