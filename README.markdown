# Tag-it: a jQuery UI plugin

---

**IMPORTANT: tag-it is _unmaintained_.**

Tag-it has reached end-of-life, and we're not looking to update or maintain it.  This library _should_ still work, but there are many PRs open and forks that you might want to consider before using it.

As a tag-it replacement, we currently recommend [tagify](https://github.com/yairEO/tagify), which appears to be a popular library that is still being actively developed as of late 2023.

Thank you!

---

Tag-it is a simple and configurable tag editing widget with autocomplete support.

[Homepage](http://aehlke.github.com/tag-it/)

## Demo

![Screenshot](http://aehlke.github.com/tag-it/_static/screenshot.png)

Check the [examples.html](http://aehlke.github.com/tag-it/examples.html) for several demos and the [prototype.js](http://aehlke.github.com/tag-it/prototype.js) file for a JavaScript prototype with all options and events.

## Usage

First, load [jQuery](http://jquery.com/) (v1.4 or greater), [jQuery UI](http://jqueryui.com/) (v1.8 or greater), and the plugin:

```html
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js" type="text/javascript" charset="utf-8"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/jquery-ui.min.js" type="text/javascript" charset="utf-8"></script>
<script src="js/tag-it.js" type="text/javascript" charset="utf-8"></script>
```

If you're using a custom jQuery UI build, it must contain the Core, Widget, Position, and Autocomplete components. The Effects Core with "Blind" and "Highlight" Effect components are optional, but used if available.

The plugin requires either a jQuery UI theme or a Tag-it theme to be present, as well as its own included base CSS file ([jquery.tagit.css](http://github.com/aehlke/tag-it/raw/master/css/jquery.tagit.css)). Here we use the Flick theme as an example:

```html
<link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1/themes/flick/jquery-ui.css">
<link href="css/jquery.tagit.css" rel="stylesheet" type="text/css">
```

Now, let's attach it to an existing `<ul>` box:

```html
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
```

This will turn the list into a tag-it widget. There are several other possible configurations and ways to instantiate the widget, including one that uses a single comma-delimited `input` field rather than one per tag, so see the **Options** documentation below as well as the [examples page](http://aehlke.github.com/tag-it/examples.html) (and its source) which demonstrates most of them, as well as the Tag-it Zendesk theme used in the screenshot above.


## Theming

Tag-it is as easily themeable as any jQuery UI widget, using your own theme made with [Themeroller](http://jqueryui.com/themeroller/), or one of the jQuery UI [premade themes](http://jqueryui.com/themeroller/#themeGallery). The old ZenDesk-like theme is included as an optional CSS file ([tagit.ui-zendesk.css](http://github.com/aehlke/tag-it/raw/master/css/tagit.ui-zendesk.css)).


## Options

Tag-it accepts several options to customize its behaviour:

### fieldName (String)

Each tag's hidden input field will have this name.
If you're using PHP, you may want to use something like `itemName[fieldName][]` for this option's value.

```javascript
$("#myTags").tagit({
    fieldName: "skills"
});
```

Defaults to *tags*.

### availableTags (Array)

Used as source for the autocompletion, unless **autocomplete.source** is overridden.

```javascript
$("#myTags").tagit({
    availableTags: ["c++", "java", "php", "javascript", "ruby", "python", "c"]
});
```

If you define your own **autocomplete.source**, this option is unused (unless you choose to reference it yourself from your custom **autocomplete.source** of course.)

Defaults to an empty array *[]*.

### autocomplete (Object)

Allows overriding the `source` and `select` options that are set by default,
as well as adding any other options you want to pass to the jQuery UI Autocomplete widget, such as `minLength` or `delay`.

The `autocomplete.source` should be overridden if you want to use custom autocompletion sources, like an Ajax / XHR response.

For example:

```javascript
$("#myTags").tagit({
    autocomplete: {delay: 0, minLength: 2}
});
```

The default `autocomplete.source` function filters the strings in **availableTags** and subtracts the already assigned tags. It also positions autocomplete underneath tag input. See the full list of available options [here](http://jqueryui.com/demos/autocomplete/).

### showAutocompleteOnFocus (boolean)

Shows autocomplete when the tag input first receives focus, before the user even types anything.

If enabled, this will also make **autocomplete.minLength** default to `0` unless you override that, so that autocomplete can show up with a blank search.

Defaults to *false*.

### removeConfirmation (boolean)

When removeConfirmation is enabled the user has to press the backspace key twice to remove the last tag.
After the first keypress the last tag receives a *remove* css class which can be used to visually highlight the tag.

Defaults to *false*.

### caseSensitive (boolean)

whether the duplication check should do a case sensitive check or not.

Defaults to *true*.

### allowDuplicates (boolean)

Allows duplicate tags to be created.
`removeTagByLabel` removes the first matching label. Duplicate detection uses submitted values.

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


### preprocessTag (function, Callback)

Transform a tag before it is added. Return an empty string to reject it.
For example, capitalize each tag:

```javascript
$("#myTags").tagit({
    preprocessTag: function(value) {
        if (!value) { return ""; }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
});
```

## Events

### beforeTagAdded (function, Callback)

Can be used to add custom behaviour before the tag is added to the DOM.

The function receives a null event, and an object containing the properties `tag`, `tagLabel`, and `duringInitialization`.

`duringInitialization` is a boolean indicating whether the tag was added during the initial construction of this widget,
e.g. when initializing tag-it on an input with preloaded data. You can use this to tell whether the event was initiated by
the user or by the widget's initialization.

To cancel a tag from being added, simply return `false` in your event callback to bail out from adding the tag and stop propagation of the event.

```javascript
$("#myTags").tagit({
    beforeTagAdded: function(event, ui) {
        // do something special
        console.log(ui.tag);
    }
});
```

### afterTagAdded (function, Callback)

Behaves the same as **beforeTagAdded** except that it fires after the tag has been added to the DOM.
It too receives the `duringInitialization` parameter — see **beforeTagAdded** for details.

### beforeTagRemoved (function, Callback)

Can be used to add custom behaviour before the tag is removed from the DOM.

To cancel a tag from being removed, simply return `false` in your event callback to bail out from removing the tag and stop propagation of the event.

The function receives a null event, and an object with `tag` and `tagLabel` properties.

```javascript
$("#myTags").tagit({
    beforeTagRemoved: function(event, ui) {
        // do something special
        console.log(ui.tag);
    }
});
```

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

```javascript
$("#myTags").tagit({
    onTagClicked: function(event, ui) {
        // do something special
        console.log(ui.tag);
    }
});
```

### onTagLimitExceeded (function, Callback)

Called when attempting to create a tag while the tag limit has already been reached. Receives a null event,
and an object with the property `duringInitialization`. This can only be called if **tagLimit** is set.

## Methods

### assignedTags()
Returns an array of the text values of all the tags currently in the widget.

```javascript
$("#myTags").tagit("assignedTags");
```

### createTag(tagLabel, additionalClass)
Adds new tag to the list. The `additionalClass` parameter is an optional way to add classes to the tag element.

```javascript
$("#myTags").tagit("createTag", "brand-new-tag");
```

### removeTagByLabel(tagLabel, animate)
Finds the tag with the label `tagLabel` and removes it. If no such tag is found, it'll throw an exception.

```javascript
$("#myTags").tagit("removeTagByLabel", "my-tag");
```

### removeAll()
Clears the widget of all tags — removes each tag it contains, so the **beforeTagRemoved** / **afterTagRemoved** event callbacks (if set) will be called for each.

```javascript
$("#myTags").tagit("removeAll");
```

## Properties

### tagInput
The `<input>` field which is used for entering new tags. It's a jQuery object, so you may use it to add a class or anything to it, e.g.:

```javascript
$("#myTags").data("ui-tagit").tagInput.addClass("fancy");
```


## Authors

* [Levy Carneiro Jr.](http://github.com/levycarneiro) *original author*
* [Martin Rehfeld](http://github.com/martinrehfeld)
* [Tobias Schmidt](http://github.com/grobie)
* [Skylar Challand](http://github.com/sskylar)
* [Alex Ehlke](http://github.com/aehlke) *current maintainer*


## License

tag-it is released under the [MIT license](http://github.com/aehlke/tag-it/raw/master/LICENSE).


## Compatible extended input

The createTag(value, additionalClass, duringInitialization) order and event
duringInitialization property are preserved. Strings still work in availableTags,
createTag and preloaded li/input fields. Autocomplete and createTag additionally
accept {label: "Japan", value: "JP"}. Labels are text; assignedTags and form fields
contain string values. Numeric zero becomes "0". tagLabel(tag) returns display text;
tagValue(tag) returns the submitted value, including during removal callbacks.
Duplicate detection compares values using caseSensitive. li elements may provide
data-value. Single-field IDs resolve against availableTags for display labels.

Set singleFieldQuoted: true to opt into quoting values containing delimiters, quotes or line breaks using
doubled double quotes. The default false preserves existing stored quote characters and the legacy representation.
Delimiter-bearing values are rejected and retained in the editor unless quoted mode is enabled. Servers
accepting delimiter-bearing values must parse this quoted-field grammar rather
than split(delimiter). apple,"New York, NY" represents two tags. Delimiters may be
multiple characters but must be nonempty and contain no quote/newline. Malformed
unmatched quotes in initial fields are preserved as literal values; an unfinished
quote in the editor stays pending. Paste and blur share the parser. Rejected, vetoed
and over-limit entries remain in the editor. createTag always creates one tag.

Optional settings (former defaults remain):

* maxTagLength: null or maximum UTF-16 length; every creation path validates the
  final preprocessed value, including autocomplete and programmatic insertion. Native
  maxlength is deliberately not used: it would truncate multi-tag pastes before parsing.
* inputType: "text"; "email" and "tel" can select mobile keyboards.
* removeOnBackspace: true; false leaves tags alone when the editor is empty.
* allowCommas: false; true allows literal typed/pasted commas without quotes.
* delimiterKeyCodes: [$.ui.keyCode.COMMA], plus Enter/Tab and optionally Space.
  Commas use typed characters for non-US layouts. Custom codes affect keyboard
  entry; singleFieldDelimiter controls pasted separators.
* matchFromStart: true; false uses substring matching in the default source.
* allowOnlyAutocompleteTags: false; true restricts all creation to availableTags
  by value. This is local catalog validation, not remote server authorization.
* autocompleteOnly: false; true restricts UI creation to selected suggestions,
  while allowing preloading and programmatic creation for remote sources.
* highlightTagsNotInAutocomplete: false; adds tagit-not-autocomplete to values
  outside availableTags. Supply its theme style; no global styles are changed.
* disableInputFocus: false; true prevents background clicks focusing the editor.
* propagateTagClicks / propagateRemoveClicks: true; false stops that click bubbling.

Use standard widget options to change readOnly without rebuilding tags or firing
add/remove events, and to replace suggestions:

```javascript
$("#myTags").tagit("option", "readOnly", true);
$("#myTags").tagit("option", "readOnly", false);
$("#myTags").tagit("option", "availableTags", ["one", "two"]);
```

Use the existing preprocessTag callback to transform or validate complete values
from every input path. For example, return /^\d+$/.test(value) ? value : "" to
accept digits. This does not filter individual keystrokes or execute strings as code.
Loop over an initial array with createTag(value, null, true); no populate API or
available-catalog mutation is needed. Set editor text using the documented instance's
tagInput.val(value).focus(). A textarea works wherever an input is accepted.
placeholderText supplies native hints without overlays. autocomplete.minLength and
autoFocus remain jQuery UI options. A custom autocomplete.source may cap results
with slice(0, limit); autocomplete.appendTo selects a menu stacking context.

RTL direction is detected at initialization from the list's computed direction.
Set dir="rtl" on the list or an ancestor. Both themes use scoped tagit-rtl rules;
unrelated jQuery UI accessibility helpers keep their accessible clipping behavior.

For development, run `npm run build` after changing the widget source to regenerate
`js/tag-it.min.js`. Run `tests/tag-it.behavior.js` against both distributions.

### Consolidated contributor credits

Contributors to these additions include mohsenksr, coremayo, anjaneyulu-paramalla, sukeerthiadiga, brunofullstack, ytxiuxiu, minhductin2, xa0c, mrcarlberg, Mohsen322, moshest, bbeckford, cleishm, beyto1974, Dr4K4n, Defee, vedatkilic, betsyecastro, mckey, dougalg, sricc, tareko, stefk, wwl2013, iamwavecut, irina-b, lturista, mindbane, cyberby, rgermanov, Disclosure, amnuts, aerlaut, dawidkkruczek, barneyb, glenntu, mindnektar, dlhageman, hilobok, ucavus, skibulk, yb66, thejonan, csillag, Lewiscowles1986, brandonwittwer, baio, viranch, robertprice.
