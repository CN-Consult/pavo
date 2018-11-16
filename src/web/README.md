Web Interface
=============

The web server provides the web interface for the pavo app.
The structure of this folder is:

* Controller: Controller classes that are called when a specific url route is used
* resources: Contains the resources for the web interface
  * css: Css files (Should have the same name like the template in which they are used)
  * external: External libraries (jQuery, bootstrap, etc.)
  * javascript: Javascript files (Should have the same name like the template in which they are used)
  * templates: The page templates (See [nunjucks](https://mozilla.github.io/nunjucks/)); Hint: Set njk file association to twig to get syntax highlighting
