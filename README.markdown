# Tag-it: a jQuery UI plugin

Tag-it is a simple and configurable tag editing widget with autocomplete support.

[Homepage](http://miking98.github.com/tag-it/)


## New Options

Ability to have values be separate from the string displayed on tags. For example, you can display a user's name, like "John Doe," while storing his user ID in a hidden input field. Both values will be POSTed on form submission in different arrays. 

Additionally...
	
	Fixed autocomplete bugs and cleaned up the jQuery implementation.
	
	Tags with strings longer than 20 characters will be shortened- this can be modified on line 401.

### itemName (String)

Name of hidden input field whose values won't be shown (i.e. a user's ID)

### fieldName (String)

Name of hidden input field whose value is shown on tag (i.e. a user's name). Defaults to *tags*


## How to implement autocomplete in jQuery

See the "autocompleteexample.js" file under the ".js" folder



## Old Documentation (still useful for other features)


## Demo (note: doesn't show autocomplete options)

![Screenshot](http://aehlke.github.com/tag-it/_static/screenshot.png)

Check the [examples.html](http://aehlke.github.com/tag-it/examples.html) for several demos and the [prototype.js](http://aehlke.github.com/tag-it/prototype.js) file for a JavaScript prototype with all options and events.

## Usage (important! Make sure you do this!)

First, load [jQuery](http://jquery.com/) (v1.4 or greater), [jQuery UI](http://jqueryui.com/) (v1.8 or greater), and the plugin:

    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/jquery-ui.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="js/tag-it.js" type="text/javascript" charset="utf-8"></script>

If you're using a custom jQuery UI build, it must contain the Core, Widget, Position, and Autocomplete components. The Effects Core with "Blind" and "Highlight" Effect components are optional, but used if available.

The plugin requires either a jQuery UI theme or a Tag-it theme to be present, as well as its own included base CSS file ([jquery.tagit.css](http://github.com/aehlke/tag-it/raw/master/css/jquery.tagit.css)). Here we use the Flick theme as an example:

    <link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1/themes/flick/jquery-ui.css">
	<link href="css/jquery.tagit.css" rel="stylesheet" type="text/css">

Now, let's attach it to an existing `<ul>` box:

    <script type="text/javascript">
        $(document).ready(function() {
            $("#myTags").tagit();
        });
    </script>

    <ul id="myTags">
        <!-- Existing list items will be pre-added to the tags -->
        <li>Tag1</li>
        <li>Tag2</li>
    </ul>

This will turn the list into a tag-it widget. There are several other possible configurations and ways to instantiate the widget, including one that uses a single comma-delimited `input` field rather than one per tag, so see the **Options** documentation below as well as the [examples page](http://aehlke.github.com/tag-it/examples.html) (and its source) which demonstrates most of them, as well as the Tag-it Zendesk theme used in the screenshot above.


## Theming

Tag-it is as easily themeable as any jQuery UI widget, using your own theme made with [Themeroller](http://jqueryui.com/themeroller/), or one of the jQuery UI [premade themes](http://jqueryui.com/themeroller/#themeGallery). The old ZenDesk-like theme is included as an optional CSS file ([tagit.ui-zendesk.css](http://github.com/aehlke/tag-it/raw/master/css/tagit.ui-zendesk.css)).


## Options 

### Note: All this stuff is optional- If you just copy and use the autocompleteexample.js file in the 'js' folder, you should be good to go

Still, this version of Tag-it will accept all these options to customize its behaviour:

### removeConfirmation (boolean)

When removeConfirmation is enabled the user has to press the backspace key twice to remove the last tag.
After the first keypress the last tag receives a *remove* css class which can be used to visually highlight the tag.

Defaults to *false*.

### caseSensitive (boolean)

whether the duplication check should do a case sensitive check or not.

Defaults to *true*.

### allowDuplicates (boolean)

Allows duplicate tags to be created.
One implication of this is that `removeTagByLabel` will remove all tags which match the given label.

Defaults to *false*.

### allowSpaces (boolean)

When allowSpaces is enabled the user is not required to wrap multi-word tags in quotation marks.
For example, the user can enter `John Smith` instead of `"John Smith"`.

Defaults to *false*.

### readOnly (boolean)

When enabled, tag-it just render tags. It disables the ability to edit tags.

Defaults to *false*.

### tagLimit (integer)

Limits the total number of tags that can be entered at once. Note that if you use this option with preloaded data,
it may truncate the number of preloaded tags. Set to `null` for unlimited tags. See the **onTagLimitExceeded**
callback for customizing this behavior.

Defaults to *null*.

### singleField (boolean)

When enabled, will use a single hidden field for the form, rather than one per tag.
It will delimit tags in the field with **singleFieldDelimiter**.

Defaults to *false*, unless Tag-it was created on an `input` element, in which case **singleField** will be overridden as true.

### singleFieldDelimiter (String)

Defaults to *","*

### singleFieldNode (DomNode)

Set this to an input DOM node to use an existing form field.
Any text in it will be erased on init. But it will be populated with the text of tags as they are created, delimited by **singleFieldDelimiter**.
If this is not set, we create an input node for it, with the name given in **fieldName**.

Defaults to *null*, unless Tag-it was created on an `input` element, in which case **singleFieldNode** will be overridden with that element.

### tabIndex (integer)
Optionally set a *tabindex* attribute on the `input` that gets created for tag-it user input.

Defaults to *null*

### placeholderText (String)
Optionally set a *placeholder* attribute on the `input` that gets created for tag-it user input.

Defaults to *null*


## Events

### beforeTagAdded (function, Callback)

Can be used to add custom behaviour before the tag is added to the DOM.

The function receives a null event, and an object containing the properties `tag`, `tagLabel`, and `duringInitialization`.

`duringInitialization` is a boolean indicating whether the tag was added during the initial construction of this widget,
e.g. when initializing tag-it on an input with preloaded data. You can use this to tell whether the event was initiated by
the user or by the widget's initialization.

To cancel a tag from being added, simply return `false` in your event callback to bail out from adding the tag and stop propagation of the event.

    $("#myTags").tagit({
        beforeTagAdded: function(event, ui) {
            // do something special
            console.log(ui.tag);
        }
    });

### afterTagAdded (function, Callback)

Behaves the same as **beforeTagAdded** except that it fires after the tag has been added to the DOM.
It too receives the `duringInitialization` parameter — see **beforeTagAdded** for details.

### beforeTagRemoved (function, Callback)

Can be used to add custom behaviour before the tag is removed from the DOM.

To cancel a tag from being removed, simply return `false` in your event callback to bail out from removing the tag and stop propagation of the event.

The function receives a null event, and an object with `tag` and `tagLabel` properties.

    $("#myTags").tagit({
        beforeTagRemoved: function(event, ui) {
            // do something special
            console.log(ui.tag);
        }
    });

### afterTagRemoved (function, Callback)

Behaves the same as **beforeTagRemoved** except that it fires after the tag has been removed from the DOM.

### onTagExists (function, Callback)

Triggered when attempting to add a tag that has already been added in the widget. The callback receives a null event,
and an object containing the properties `existingTag` and `duringInitialization`, since technically you could try to preload
duplicate tags during the widget initialization.

If the **allowDuplicates** option is enabled, this will not be triggered.

By default it will visually highlight the existing tag, unless you return *false* in your callback.

### onTagClicked (function, Callback)

Can be used to add custom behaviour when the tag is clicked.
The function receives the click event and an objecting containing `tag` and `tagLabel` properties.

    $("#myTags").tagit({
        onTagClicked: function(event, ui) {
            // do something special
            console.log(ui.tag);
        }
    });

### onTagLimitExceeded (function, Callback)

Called when attempting to create a tag while the tag limit has already been reached. Receives a null event,
and an object with the property `duringInitialization`. This can only be called if **tagLimit** is set.

## Methods

### assignedTags()
Returns an array of the text values of all the tags currently in the widget.

    $("#myTags").tagit("assignedTags");

### createTag(tagLabel, additionalClass)
Adds new tag to the list. The `additionalClass` parameter is an optional way to add classes to the tag element.

    $("#myTags").tagit("createTag", "brand-new-tag");

### preprocessTag(function, Callback)
Set a function to be called before tag is created. Callback receives the
value of the tag created.

    // ensure all tags are capitalized
    $(#tag-it").tagit("preprocessTag", function(val) {
      if (!val) { return ''; }
      return val[0].toUpperCase() + val.slice(1, val.length);
    });
    // foo -> Foo

### removeTagByLabel(tagLabel, animate)
Finds the tag with the label `tagLabel` and removes it. If no such tag is found, it'll throw an exception.

    $("#myTags").tagit("removeTagByLabel", "my-tag");

### removeAll()
Clears the widget of all tags — removes each tag it contains, so the **beforeTagRemoved** / **afterTagRemoved** event callbacks (if set) will be called for each.

    $("#myTags").tagit("removeAll");

## Properties

### tagInput
The `<input>` field which is used for entering new tags. It's a jQuery object, so you may use it to add a class or anything to it, e.g.:

    $("#myTags").tagit("tagInput").addClass("fancy");


## Authors

* [Levy Carneiro Jr.](http://github.com/levycarneiro) *original author*
* [Martin Rehfeld](http://github.com/martinrehfeld)
* [Tobias Schmidt](http://github.com/grobie)
* [Skylar Challand](http://github.com/sskylar)
* [Alex Ehlke](http://github.com/aehlke) *current maintainer*


## License

tag-it is released under the [MIT license](http://github.com/aehlke/tag-it/raw/master/LICENSE).

