/*
* jQuery UI Tag-it!
*
* @version v2.0 (06/2011)
*
* Copyright 2011, Levy Carneiro Jr.
* Released under the MIT license.
* http://aehlke.github.com/tag-it/LICENSE
*
* Homepage:
*   http://aehlke.github.com/tag-it/
*
* Authors:
*   Levy Carneiro Jr.
*   Martin Rehfeld
*   Tobias Schmidt
*   Skylar Challand
*   Alex Ehlke
*
* Maintainer:
*   Alex Ehlke - Twitter: @aehlke
*
* Dependencies:
*   jQuery v1.4+
*   jQuery UI v1.8+
*/
(function($) {

    $.widget('ui.tagit', {
        options: {
            itemName          : 'item',
            fieldName         : 'tags',
            availableTags     : [],
            tagSource         : null,
            removeConfirmation: false,
            caseSensitive     : true,

            // When enabled, quotes are not neccesary
            // for inputting multi-word tags.
            allowSpaces: false,

            // Whether to animate tag removals or not.
            animate: true,

            // The below options are for using a single field instead of several
            // for our form values.
            //
            // When enabled, will use a single hidden field for the form,
            // rather than one per tag. It will delimit tags in the field
            // with singleFieldDelimiter.
            //
            // The easiest way to use singleField is to just instantiate tag-it
            // on an INPUT element, in which case singleField is automatically
            // set to true, and singleFieldNode is set to that element. This 
            // way, you don't need to fiddle with these options.
            singleField: false,

            singleFieldDelimiter: ',',

            // Set this to an input DOM node to use an existing form field.
            // Any text in it will be erased on init. But it will be
            // populated with the text of tags as they are created,
            // delimited by singleFieldDelimiter.
            //
            // If this is not set, we create an input node for it,
            // with the name given in settings.fieldName, 
            // ignoring settings.itemName.
            singleFieldNode: null,

            // Optionally set a tabindex attribute on the input that gets
            // created for tag-it.
            tabIndex: null,


            // Event callbacks.
            onTagAdded  : null,
            onTagRemoved: null,
            onTagClicked: null,

            //user input restrictions
            //max number of characters in single tag
            maxChars :  0,
            //max number of tags
            maxCount : 0,
            //allow tags which are not in tagSource list
            allowNotInList : true,

            //events raised when user input restrictions occurs
            onMaxChars : null,
            onMaxCount : null,
            onNotAllowed : null
        },


        _create: function() {
            // for handling static scoping inside callbacks
            var that = this;

            // There are 2 kinds of DOM nodes this widget can be instantiated on:
            //     1. UL, OL, or some element containing either of these.
            //     2. INPUT, in which case 'singleField' is overridden to true,
            //        a UL is created and the INPUT is hidden.
            if (this.element.is('input')) {
                this.tagList = $('<ul></ul>').insertAfter(this.element);
                this.options.singleField = true;
                this.options.singleFieldNode = this.element;
                this.element.css('display', 'none');
            } else {
                this.tagList = this.element.find('ul, ol').andSelf().last();
            }

            this._tagInput = $('<input type="text">').addClass('ui-widget-content');
            if (this.options.tabIndex) {
                this._tagInput.attr('tabindex', this.options.tabIndex);
            }

            this.options.tagSource = this.options.tagSource || function(search, showChoices) {
                var filter = search.term.toLowerCase();
                var choices = $.grep(that.options.availableTags, function(element) {
                    // Only match autocomplete options that begin with the search term.
                    // (Case insensitive.)
                    return (element.toLowerCase().indexOf(filter) === 0);
                });
                showChoices(that._subtractArray(choices, that.assignedTags()));
            };

            this.tagList
                .addClass('tagit')
                .addClass('ui-widget ui-widget-content ui-corner-all')
                // Create the input field.
                .append($('<li class="tagit-new"></li>').append(this._tagInput))
                .click(function(e) {
                    var target = $(e.target);
                    if (target.hasClass('tagit-label')) {
                        that._trigger('onTagClicked', e, target.closest('.tagit-choice'));
                    } else {
                        // Sets the focus() to the input field, if the user
                        // clicks anywhere inside the UL. This is needed
                        // because the input field needs to be of a small size.
                        that._tagInput.focus();
                    }
                });

            //Set input tag default width
            this._updateInputTagWidth();

            // Position, must be inherited from original html element (position, top, left, width)
            this.tagList.css({
               position : this.element.css("position"),
               top : this.element.css("top"),
               left : this.element.css("left"),
               width : this.element.css("width")
            });

            // Add existing tags from the list, if any.
            this.tagList.children('li').each(function() {
                if (!$(this).hasClass('tagit-new')) {
                    that.createTag($(this).html(), $(this).attr('class'));
                    $(this).remove();
                }
            });

            // Single field support.
            if (this.options.singleField) {
                if (this.options.singleFieldNode) {
                    // Add existing tags from the input field.
                    var node = $(this.options.singleFieldNode);
                    var tags = node.val().split(this.options.singleFieldDelimiter);
                    node.val('');
                    $.each(tags, function(index, tag) {
                        that.createTag(tag);
                    });
                } else {
                    // Create our single field input after our list.
                    this.options.singleFieldNode = this.tagList.after('<input type="hidden" style="display:none;" value="" name="' + this.options.fieldName + '">');
                }
            }

            // Events.
            this._tagInput
                .keydown(function(event) {
                    // Backspace is not detected within a keypress, so it must use keydown.
                    if (event.which == $.ui.keyCode.BACKSPACE && that._tagInput.val() === '') {
                        var tag = that._lastTag();
                        if (!that.options.removeConfirmation || tag.hasClass('remove')) {
                            // When backspace is pressed, the last tag is deleted.
                            that.removeTag(tag);
                        } else if (that.options.removeConfirmation) {
                            tag.addClass('remove ui-state-highlight');
                        }
                    } else if (that.options.removeConfirmation) {
                        that._lastTag().removeClass('remove ui-state-highlight');
                    }
                    
                    // Comma/Space/Enter are all valid delimiters for new tags,
                    // except when there is an open quote or if setting allowSpaces = true.
                    // Tab will also create a tag, unless the tag input is empty, in which case it isn't caught.
                    else if (
                        event.which == $.ui.keyCode.COMMA ||
                        event.which == $.ui.keyCode.ENTER ||
                        (
                            event.which == $.ui.keyCode.TAB &&
                            that._tagInput.val() !== ''
                        ) ||
                        (
                            event.which == $.ui.keyCode.SPACE &&
                            that.options.allowSpaces !== true &&
                            (
                                $.trim(that._tagInput.val()).replace( /^s*/, '' ).charAt(0) != '"' ||
                                (
                                    $.trim(that._tagInput.val()).charAt(0) == '"' &&
                                    $.trim(that._tagInput.val()).charAt($.trim(that._tagInput.val()).length - 1) == '"' &&
                                    $.trim(that._tagInput.val()).length - 1 !== 0
                                )
                            )
                        )
                    ) {
                        event.preventDefault();

                        //if we are here then tag has been created by typing and hence supposed not from list of tags.
                        //Creating tags which are not from list is only available when options.allowNotInList = true
                        if (that.options.allowNotInList !== false){
                            that.createTag(that._cleanedInput());
                        }
                        else{
                            that._trigger("onNotAllowed", event, that);
                        }

                        //The bottom comment doesn't valid now. All works without forced 'close'

                        // The autocomplete doesn't close automatically when TAB is pressed.
                        // So let's ensure that it closes.
                        //that._tagInput.autocomplete('close');
                    }
                    else{
                        var func;

                        //check restrictions on maxCharCount and on maxCount
                        if (event.which != $.ui.keyCode.BACKSPACE && event.which != $.ui.keyCode.TAB){

                            //check if text in the input tag has length less than options.maxChars

                            if(that.options.maxChars && $.trim(that._tagInput.val()).length === that.options.maxChars){
                                        func = "onMaxChars";
                            }

                            //check if number of tags less than options.maxCount

                            if(that.options.maxCount && that.assignedTags().length == that.options.maxCount){
                                        func = "onMaxCount";
                            }
                        }

                        if (func !== undefined){
                            //some restriction has occur
                            if (func){
                                that._trigger(func, null, that);
                            }

                            event.preventDefault();
                        }
                        else{
                            //length of the text in input tag changed, update input tag width
                            that._updateInputTagWidth();
                        }
                    }

                }).blur(function(e){
                    //Widget loose focus, suppose created tag not from list.
                    //Creating tags which are not from list is only available when options.allowNotInList = true

                    // Create a tag when the element loses focus (unless it's empty).
                    if (that.options.allowNotInList !== false){
                        that.createTag(that._cleanedInput());
                    }
                }).keyup(function(e){
                        if (event.which == $.ui.keyCode.UP ||event.which == $.ui.keyCode.DOWN){
                            //user select some tag from drop down list of autocomplete control by up or down key
                            //should update input tag width in order to selected text fits to the input element width
                            that._updateInputTagWidth();
                        }
                    });
                

            // Autocomplete.
            if (this.options.availableTags || this.options.tagSource) {
                var autocomplete = this._tagInput.autocomplete({
                    source: this.options.tagSource,
                    select: function(event, ui) {
                        // Delete the last tag if we autocomplete something despite the input being empty
                        // This happens because the input's blur event causes the tag to be created when
                        // the user clicks an autocomplete item.
                        // The only artifact of this is that while the user holds down the mouse button
                        // on the selected autocomplete item, a tag is shown with the pre-autocompleted text,
                        // and is changed to the autocompleted text upon mouseup.
                        if (that._tagInput.val() === '') {
                            that.removeTag(that._lastTag(), false);
                        }
                        that.createTag(ui.item.value);
                        // Preventing the tag input to be updated with the chosen value.
                        return false;
                    }
                });
                
                autocomplete.data("tagit", this);
            }
        },

        destroy : function()
        {
            //destroy widget

            if (this.element)
            {
                this.element.css('display', this.display_orig);
            }

            $(this.tagList).remove();

            $.Widget.prototype.destroy.apply(this, arguments);
        },

        _updateInputTagWidth : function()
        {
            //function update width of the input tag on the base of the width of text inside.
            
            //calculate text width
            var sensor = $('<span />').css({
                "font-family" : this._tagInput.css("font-family"),
                "font-size" : this._tagInput.css("font-size"),
                "font-style" : this._tagInput.css("font-style"),
                "font-variant" : this._tagInput.css("font-variant"),
                "font-spacing" : this._tagInput.css("font-spacing"),
                margin: this._tagInput.css("margin"),
                padding: this._tagInput.css("padding")});
            sensor.text(this._tagInput.val() + "W");
            $("body").append(sensor);
            var w  = sensor.width();
            sensor.remove();

            //update input tag width
            this._tagInput.css("width", w);
        },

        _cleanedInput: function() {
            // Returns the contents of the tag input, cleaned and ready to be passed to createTag
            return $.trim(this._tagInput.val().replace(/^"(.*)"$/, '$1'));
        },

        _lastTag: function() {
            return this.tagList.children('.tagit-choice:last');
        },

        assignedTags: function() {
            // Returns an array of tag string values
            var that = this;
            var tags = [];
            if (this.options.singleField) {
                tags = $(this.options.singleFieldNode).val().split(this.options.singleFieldDelimiter);
                if (tags[0] === '') {
                    tags = [];
                }
            } else {
                this.tagList.children('.tagit-choice').each(function() {
                    tags.push(that.tagLabel(this));
                });
            }
            return tags;
        },

        _updateSingleTagsField: function(tags) {
            // Takes a list of tag string values, updates this.options.singleFieldNode.val to the tags delimited by this.options.singleFieldDelimiter
            $(this.options.singleFieldNode).val(tags.join(this.options.singleFieldDelimiter));
        },

        _subtractArray: function(a1, a2) {
            var result = [];
            for (var i = 0; i < a1.length; i++) {
                if ($.inArray(a1[i], a2) == -1) {
                    result.push(a1[i]);
                }
            }
            return result;
        },

        tagLabel: function(tag) {
            // Returns the tag's string label.
            if (this.options.singleField) {
                return $(tag).children('.tagit-label').text();
            } else {
                return $(tag).children('input').val();
            }
        },

        _isNew: function(value) {
            var that = this;
            var isNew = true;
            this.tagList.children('.tagit-choice').each(function(i) {
                if (that._formatStr(value) == that._formatStr(that.tagLabel(this))) {
                    isNew = false;
                    return false;
                }
            });
            return isNew;
        },

        _formatStr: function(str) {
            if (this.options.caseSensitive) {
                return str;
            }
            return $.trim(str.toLowerCase());
        },

        createTag: function(value, additionalClass) {
            var that = this;
            // Automatically trims the value of leading and trailing whitespace.
            value = $.trim(value);

            if (!this._isNew(value) || value === '') {
                return false;
            }

            var label = $(this.options.onTagClicked ? '<a class="tagit-label"></a>' : '<span class="tagit-label"></span>').text(value);

            // Create tag.
            var tag = $('<li></li>')
                .addClass('tagit-choice ui-widget-content ui-state-default ui-corner-all')
                .addClass(additionalClass)
                .append(label);

            // Button for removing the tag.
            var removeTagIcon = $('<span></span>')
                .addClass('ui-icon ui-icon-close');
            var removeTag = $('<a><span class="text-icon">\xd7</span></a>') // \xd7 is an X
                .addClass('close')
                .append(removeTagIcon)
                .click(function(e) {
                    // Removes a tag when the little 'x' is clicked.
                    that.removeTag(tag);
                });
            tag.append(removeTag);

            // Unless options.singleField is set, each tag has a hidden input field inline.
            if (this.options.singleField) {
                var tags = this.assignedTags();
                tags.push(value);
                this._updateSingleTagsField(tags);
            } else {
                var escapedValue = label.html();
                tag.append('<input type="hidden" style="display:none;" value="' + escapedValue + '" name="' + this.options.itemName + '[' + this.options.fieldName + '][]">');
            }

            tag.data("tagit", this);

            this._trigger('onTagAdded', null, tag);

            // Cleaning the input.
            this._tagInput.val('');
            that._updateInputTagWidth();

            // insert tag
            this._tagInput.parent().before(tag);
        },
        
        removeTag: function(tag, animate) {
            animate = animate || this.options.animate;

            tag = $(tag);

            this._trigger('onTagRemoved', null, tag);

            if (this.options.singleField) {
                var tags = this.assignedTags();
                var removedTagLabel = this.tagLabel(tag);
                tags = $.grep(tags, function(el){
                    return el != removedTagLabel;
                });
                this._updateSingleTagsField(tags);
            }
            // Animate the removal.
            if (animate) {
                tag.fadeOut('fast').hide('blind', {direction: 'horizontal'}, 'fast', function(){
                    tag.remove();
                }).dequeue();
            } else {
                tag.remove();
            }
        },

        removeAll: function() {
            // Removes all tags.
            var that = this;
            this.tagList.children('.tagit-choice').each(function(index, tag) {
                that.removeTag(tag, false);
            });
        }

    });

})(jQuery);


