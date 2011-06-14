# Tag-it: a jQuery UI plugin

Tag-it was originally inspired by the "tag suggestion" form field in ZenDesk.com. Now it is a full jQuery UI widget, supporting various configurations and themes.


## Demo

![Screenshot](http://aehlke.github.com/tag-it/screenshot.png)

Check the [example.html](http://aehlke.github.com/tag-it/example.html) for several demos.


## Usage

First, load [jQuery](http://jquery.com/) (v1.4 or greater), [jQuery UI](http://jqueryui.com/) (v1.8 or greater), and the plugin:

    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/jquery-ui.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="js/tag-it.js" type="text/javascript" charset="utf-8"></script>

The plugin requires a jQuery UI theme to be present, as well as its own included base CSS file ([jquery.tagit.css](http://github.com/aehlke/tag-it/raw/master/css/jquery.tagit.css)). Here we use the Flick theme as an example:

    <link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1/themes/flick/jquery-ui.css">
	<link href="css/jquery.tagit.css" rel="stylesheet" type="text/css">

Now, let's attach it to an existing `<ul>` box:

    <script type="text/javascript">
        $(document).ready(function() {
            $("#mytags").tagit();
        });
    </script>

    <ul id="mytags">
        <!-- Existing list items will be pre-added to the tags -->
        <li>Tag1</li>
        <li>Tag2</li>
    </ul>

This will turn the list into a tag-it list:

    <ul id="mytags" class="tagit ui-widget ui-widget-content ui-corner-all">
        <!-- Existing list items will be pre-added to the tags. -->
        <li class="tagit-choice ui-widget-content ui-state-default ui-corner-all">
            <span class="tagit-label">Tag1</span>
            <a class="close"><span class="ui-icon ui-icon-close"></span></a>
            <input type="hidden" style="display:none;" value="Tag1" name="item[tags][]">
        </li>
        <li class="tagit-choice ui-widget-content ui-state-default ui-corner-all">
            <span class="tagit-label">Tag2</span>
            <a class="close"><span class="ui-icon ui-icon-close"></span></a>
            <input type="hidden" style="display:none;" value="Tag2" name="item[tags][]">
        </li>
        <li class="tagit-new">
            <input type="text" class="ui-widget-content ui-autocomplete-input" autocomplete="off" role="textbox" aria-autocomplete="list" aria-haspopup="true">
        </li>
    </ul>

There are several other possible configurations and ways to instantiate the widget, including one that uses a single comma-delimited `input` field rather than one per tag, so see the **Options** documentation below as well as the [examples page](http://aehlke.github.com/tag-it/examples.html) which demonstrates most of them.


## Theming

Tag-it is as easily themeable as any jQuery UI widget, using your own theme made with [Themeroller](http://jqueryui.com/themeroller/), or one of the jQuery UI [premade themes](http://jqueryui.com/themeroller/#themeGallery). The old ZenDesk-like theme is included as an optional CSS file ([tagit.ui-zendesk.css](http://github.com/aehlke/tag-it/raw/master/css/tagit.ui-zendesk.css)).


## Options

Tag-it accepts several options to customize the behaviour:

### itemName (String)

Used to build the name of the hidden input field: `itemName[fieldName][]`.

    $("#mytags").tagit({
        itemName: "user"
    });

Defaults to *item*.

### fieldName (String)

Used to build the name of the hidden input field: `itemName[fieldName][]`.

    $("#mytags").tagit({
        fieldName: "skills"
    });

Defaults to *tags*.

### availableTags (Array)

Used as source for the autocompletion.

    $("#mytags").tagit({
        availableTags: ["c++", "java", "php", "javascript", "ruby", "python", "c"]
    });

Defaults to an empty array *[]*.

### tagSource (function)

Can be overwritten in order to use custom autocompletion sources like Ajax requests.
The default function filters the strings in **availableTags** and subtracts the already assigned tags.

### removeConfirmation (boolean)

When removeConfirmation is enabled the user has to press the backspace key twice to remove the last tag.
After the first keypress the last tag receives a *remove* css class which can be used to visually highlight the tag.

Defaults to *false*.

### caseSensitive (boolean)

whether the duplication check should do a case sensitive check or not.

Defaults to *true*.

### allowSpaces (boolean)

When allowSpaces is enabled the user is not required to wrap multi-word tags in quotation marks.
For example, the user can enter `John Smith` instead of `"John Smith"`.

Defaults to *false*.

### singleField (boolean)

When enabled, will use a single hidden field for the form, rather than one per tag.
It will delimit tags in the field with **singleFieldDelimiter**.

Defaults to *false*, unless Tag-it was created on an `input` element, in which case **singleField** will be overridden as true.

### singleFieldDelimiter (String)

Defaults to *","*

### singleFieldNode (DomNode)

Set this to an input DOM node to use an existing form field.
Any text in it will be erased on init. But it will be populated with the text of tags as they are created, delimited by **singleFieldDelimiter**.
If this is not set, we create an input node for it, with the name given in **fieldName**, ignoring **itemName**.

Defaults to *null*, unless Tag-it was created on an `input` element, in which case **singleFieldNode** will be overridden with that element.

### tabIndex (integer)
Optionally set a *tabindex* attribute on the `input` that gets created for tag-it user input.

Defaults to *null*


## Events

### onTagAdded (function, Callback)

Can be used to add custom behaviour before the Tag is added to the DOM.
The function receives an empty event, and the tag as parameters.

    $("#mytags").tagit({
        onTagAdded: function(event, tag) {
            // do something special
        }
    });

### onTagRemoved (function, Callback)

Can be used to add custom behaviour before the Tag is removed from the DOM.
The function receives an empty event, and the tag as parameters.

    $("#mytags").tagit({
        onTagRemoved: function(event, tag) {
            // do something special
        }
    });

### onTagClicked (function, Callback)

Can be used to add custom behaviour when the Tag is clicked from the DOM.
The function receives the click event and the tag as parameters.

    $("#mytags").tagit({
        onTagClicked: function(event, tag) {
            // do something special
        }
    });


## Methods

### assignedTags()
Returns an array of the text values of all the tags currently in the widget.

    $("#mytags").tagit("assignedTags");

### createTag(tagName, additionalClass)
Adds new tag to the list. The `additionalClass` parameter is an optional way to add classes to the tag element.

    $("#mytags").tagit("createTag", "brand-new-tag");

### removeAll()
Clears the widget of all tags -- removes each tag it contains, so the onTagRemoved event callback (if set in the options) will be called for each.

    $("#mytags").tagit("removeAll");


## Authors

* [Levy Carneiro Jr.](http://github.com/levycarneiro) *original author*
* [Martin Rehfeld](http://github.com/martinrehfeld)
* [Tobias Schmidt](http://github.com/grobie)
* [Skylar Challand](http://github.com/sskylar)
* [Alex Ehlke](http://github.com/aehlke) *current maintainer*


## License

tag-it is released under the [MIT license](http://github.com/aehlke/tag-it/raw/master/LICENSE).

