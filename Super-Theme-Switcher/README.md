Super Theme Switcher is a jQuery plugin based on the original jQuery theme switcher found here: [http://jqueryui.com/docs/Theming/ThemeSwitcher](http://jqueryui.com/docs/Theming/ThemeSwitcher)

Recently, jQuery disabled hotlinking to image resources in the switcher essentially breaking it for anyone using it. UI theme icons are included in 
the download. The super theme switcher also includes some other niceities like adding your own custom themes or overriding all of them.

### Example:
    $('#switcher').themeswitcher({
        imgpath: "images/",
    	loadTheme: "dot-luv"
    });

But since all parameters are optional you can just use it like this:
    $('#switcher').themeswitcher();
    
### Options
The super theme switcher inherits all the settings of the original [theme switcher](http://jqueryui.com/docs/Theming/ThemeSwitcher)

Additional settings are:
 
 * **imgPath**: String, path to image directory where theme icons are located
 * **rounded**: Boolean, rounded corners on themeswitcher link and dropdown
 * **themes**: An array of theme objects that will override the default themes.  
 [{title:"My theme",name:"my-theme",icon:"my-icon.png",url:"http://url-to-my-css-file.css"}]
 * **additionalThemes**: An array of theme objects that will be INCLUDED along with the default themes.  
 [{title:"My theme",name:"my-theme",icon:"my-icon.png",url:"http://url-to-my-css-file.css"}]
 * **jqueryUiVersion**: String, jQuery UI version of themes (Default themes are linked from Google CDN)

Demo located [here](http://dl.dropbox.com/u/188460/themeswitcher/sample.htm).

This plugin includes the awesome jQuery cookie plugin by Klaus Hartl found [here](https://github.com/carhartl/jquery-cookie)

Contact
----
[Twitter](http://www.twitter.com/davehoff)

[davehoff.com](http://www.davehoff.com) 