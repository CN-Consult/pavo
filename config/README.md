Configuration Options
=====================

The configuration must be named "config.json" and must be stored in "/home/\<user>/config".
The config folder is automatically synced into the home directory inside the vagrant box

Possible config values are:

Root
----

| Name    | Type     | Description
|---------|----------|------------------
| windows | Object[] | List of windows |


Window
------

| Name         | Type      | Description
|--------------|-----------|-----------------------------------------------------------------------------------------------------------|
| position     | Object    | The position of the window on the displays                                                                |
| fullscreen   | Boolean   | If set to true the window will be displayed in full screen mode (Display can be selected by the position) |
| pageDefaults | Object    | Default configuration for each page (The values in this object can be overridden by each page)            |
| pages        | Object[] | The page specific configurations                                                                          |


Position
--------

| Name   | Type | Description
|--------|------|-----------------------------------------------------|
| x      | int  | The X-Position of the top left corner of the window |
| y      | int  | The Y-Position of the top left corner of the window |
| width  | int  | The width of the window                             |
| height | int  | The height of the window                            |


PageDefaults
------------

See Page


Page
----

| Name               | Type     | Description
|--------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url                | string   | Url of the website that shall be displayed in this page                                                                                                                 |
| name               | string   | A name for the page that will be displayed in the overview of the web interface (Default: url)                                                                          |
| displayTime        | int      | The time for which the page is displayed before the next page is shown                                                                                                  |
| reloadTime         | int      | The time interval in which the page is reloaded (set to 0 to disable)                                                                                                   |
| reloadAfterAppInit | Boolean  | If set to true the page will be reloaded after all pages are initialized (can be used to auto login in one page and to reload all other pages that need the same login) |
| cssFiles           | string[] | List of file paths to css files that will be injected into the page (relative from users home directory)                                                                |
| jsFiles            | string[] | List of file paths to javascript files that will be injected into the page (relative from the users home directory)                                                     |
| autoLogin          | Object   | Auto login configuration                                                                                                                                                |


Note: array values of arrays with numeric indexes are appended to the page defaults instead of replacing the page default settings (cssFiles and jsFiles)


AutoLogin
---------

| Name               | Type    | Description
|--------------------|---------|-----------------------------------------------------------------------------------------|
| loginUrl           | string  | Url to the login page                                                                   |
| form               | Object  | Specifies the login input form                                                          |
| name               | Object  | Specifies the login input name field and its value                                      |
| password           | Object  | Specifies the login input password field and its value                                  |
| redirectsToMainUrl | Boolean | Defines whether the page will automatically redirect the user to the specified page url |


Note:

At the moment the automatic login only works when:
1. The login url has a different base url than the target url (e.g. http://example.com/login and http://example.com/targetPage)
2. The complete login form is displayed on the login page
3. The page redirects the user to the target url on successful login
4. The page stays on the same page on unsuccessful login


Form, Name and Password
-----------------------

| Name               | Type    | Description
|--------------------|---------|------------------------------------------------------------------------------------------------------|
| selector           | string  | css selector that selects the element (Password and name selectors are relative from the input form) |
| value              | string  | The value for the input element (Only for name and password)                                         |
