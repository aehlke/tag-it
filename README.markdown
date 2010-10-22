# tag-it: a jQuery plugin

> After looking for a jQuery plugin for handling a 'tag suggestion' form field, in much the same way ZenDesk.com does, I ended up developing a customization of jQuery UI that does the same interaction.
[Levy Carneiro Jr.](http://github.com/levycarneiro)

## Demo

![Screenshot](http://github.com/grobie/tag-it/raw/master/screenshot.png)

Check the [example.html](http://github.com/grobie/tag-it/blob/master/example.html) for a demo.

## Usage

First, load [jQuery](http://jquery.com/), [jQuery UI](http://jqueryui.com/) and the plugin:

    <script src="js/jquery/jquery-1.4.2.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="js/jquery-ui/jquery-ui-1.8.core-and-interactions.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="js/jquery-ui/jquery-ui-1.8.autocomplete.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="js/tag-it.js" type="text/javascript" charset="utf-8"></script>

Notice, to make it work under IE you have to additionally load 'js/ie-compat.js'.

    <script src="js/ie-compat.js" type="text/javascript" charset="utf-8"></script>

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

    <ul id="mytags" class="tagit">
      <!-- Existing list items will be pre-added to the tags -->
      <li class="tagit-choice">
        Tag1
        <a class="close">x</a>
        <input type="hidden" style="display:none;" value="Tag1" name="item[tags][]">
      </li>
      <li class="tagit-choice">
        Tag2
        <a class="close">x</a>
        <input type="hidden" style="display:none;" value="Tag2" name="item[tags][]">
      </li>
      <li class="tagit-new">
        <input class="tagit-input ui-autocomplete-input" type="text" autocomplete="off" role="textbox" aria-autocomplete="list" aria-haspopup="true">
      </li>
    </ul>

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

### onTagAdded (function, Callback)

Can be used to add custom behaviour before the Tag is added to the DOM.
The function receives the tag as parameter.

    $("#mytags").tagit({
      onTagAdded: function(tag) {
        // do something special
      }
    });

### onTagRemoved (function, Callback)

Can be used to add custom behaviour before the Tag is removed from the DOM.
The function receives the tag as parameter.

    $("#mytags").tagit({
      onTagRemoved: function(tag) {
        // do something special
      }
    });

### tagSource (function)

Can be overwritten in order to use custom autocompletion sources like Ajax requests.
The default function filters the strings in **availableTags** and subtracts the already assigned tags.

### removeConfirmation (boolean)

When removeConfirmation is enabled the user has to press the backspace key twice to remove the last tag.
After the first keypress the last tag receives a *remove* css class which can be used to visually highlight the tag.

Defaults to *false*.

## Authors

* [Levy Carneiro Jr.](http://github.com/levycarneiro)
* [Martin Rehfeld](http://github.com/martinrehfeld)
* [Tobias Schmidt](http://github.com/grobie)
