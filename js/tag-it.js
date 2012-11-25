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
    var DOWN_PRESSED = false;

    $.widget('ui.tagit', {
        options: {
            fieldName         : 'tags',
            availableTags     : [],
            tagSource         : null,
            removeConfirmation: false,
            caseSensitive     : true,
            placeholderText   : null,
            allowDuplicates   : false,

            // The property to use as the tag label that 
            // can be either 'value' or 'label'
            tagLabel: 'value',

            // If set to true the first item will automatically 
            // be focused when the menu is shown
            autoFocus: false,

            // The minimun number of characters before a search is made
            // defaults to 0 meaning no minimun
            minLength: 0,

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
            // with the name given in settings.fieldName.
            singleFieldNode: null,

            // Optionally set a tabindex attribute on the input that gets
            // created for tag-it.
            tabIndex: null,

            // Event callbacks.
            onTagAdded  : null,
            onTagRemoved: null,
            onTagClicked: null
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

            this.tagInput = $('<input type="text" />').addClass('ui-widget-content');
            if (this.options.tabIndex) {
                this.tagInput.attr('tabindex', this.options.tabIndex);
            }
            if (this.options.placeholderText) {
                this.tagInput.attr('placeholder', this.options.placeholderText);
            }

            this.options.tagSource = this.options.tagSource || function(search, showChoices) {
                var filter = search.term.toLowerCase();
                var choices = $.grep(this.options.availableTags, function(element) {
                    // Only match autocomplete options that begin with the search term.
                    // (Case insensitive.)
                    return (element.toLowerCase().indexOf(filter) === 0);
                });
                showChoices(this._subtractArray(choices, this.assignedTags()));
            };

            // Bind tagSource callback functions to this context.
            if ($.isFunction(this.options.tagSource)) {
                this.options.tagSource = $.proxy(this.options.tagSource, this);
            }

            this.tagList
                .addClass('tagit')
                .addClass('ui-widget ui-widget-content ui-corner-all')
                // Create the input field.
                .append($('<li class="tagit-new"></li>').append(this.tagInput))
                .click(function(e) {
                    var target = $(e.target);
                    if (target.hasClass('tagit-label')) {
                        that._trigger('onTagClicked', e, target.closest('.tagit-choice'));
                    } else {
                        // Sets the focus() to the input field, if the user
                        // clicks anywhere inside the UL. This is needed
                        // because the input field needs to be of a small size.
                        that.tagInput.focus();
                    }
                });

            // Add existing tags from the list, if any.
            this.tagList.children('li').each(function() {
                if (!$(this).hasClass('tagit-new')) {
                    that.createTag($(this).text(), $(this).attr('class'));
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
                    this.options.singleFieldNode = $('<input type="hidden" style="display:none;" value="" name="' + this.options.fieldName + '" />');
                    this.tagList.after(this.options.singleFieldNode);
                }
            }

            // Events.
            this.tagInput
                .keydown(function(event) {
                    // Needed to allow the autocomplete menu to open when user hits the down arrow
                    DOWN_PRESSED = false;
                    
                    // Capture DOWN key to begin search
                    if (event.which === $.ui.keyCode.DOWN && that.tagInput.val() === '') {
                        DOWN_PRESSED = true;
                        return;
                    }

                    // Clear the input and close the autocomplete on ESCAPE
                    if (event.which === $.ui.keyCode.ESCAPE) {
                        that._clearInput();
                        that.tagInput.autocomplete('close');
                    }

                    // Backspace is not detected within a keypress, so it must use keydown.
                    if (event.which == $.ui.keyCode.BACKSPACE && that.tagInput.val() === '') {
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
                    // Tab will also create a tag, unless the tag input is empty, 
                    // in which case it isn't caught.
                    if (
                        event.which === $.ui.keyCode.COMMA ||
                        event.which === $.ui.keyCode.ENTER ||
                        (
                            event.which == $.ui.keyCode.TAB &&
                            that.tagInput.val() !== ''
                        ) ||
                        (
                            event.which == $.ui.keyCode.SPACE &&
                            that.options.allowSpaces !== true &&
                            (
                                $.trim(that.tagInput.val()).replace( /^s*/, '' ).charAt(0) != '"' ||
                                (
                                    $.trim(that.tagInput.val()).charAt(0) == '"' &&
                                    $.trim(that.tagInput.val()).charAt($.trim(that.tagInput.val()).length - 1) == '"' &&
                                    $.trim(that.tagInput.val()).length - 1 !== 0
                                )
                            )
                        )
                    ) {
                        // Enter submits the form if there's no text in the input.
                        if (!(event.which === $.ui.keyCode.ENTER && that.tagInput.val() === '')) {
                            event.preventDefault();
                        }

                        that.createTag(that.tagInput.data('value'), that._cleanedInput());

                        // The autocomplete doesn't close automatically when TAB is pressed.
                        // So let's ensure that it closes.
                        that.tagInput.autocomplete('close');
                    }
                }).blur(function(e){
                    // Create a tag when the element loses focus (unless it's empty).
                    that.createTag(that.tagInput.data('value'), that._cleanedInput());
                });
                

            // Autocomplete.
            if (this.options.availableTags || this.options.tagSource) {
                this.tagInput.autocomplete({
                    source: this.options.tagSource,
                    minLength: this.options.minLength,
                    autoFocus: this.options.autoFocus,
                    focus: function(event, ui) {
                        // Decide whether to show the value or the label
                        var label = (that.options.tagLabel == 'value') ? ui.item.value : ui.item.label;
                        that.tagInput.val(label);

                        // Always set the data value of the input to value
                        that.tagInput.data('value', ui.item.value);
                        return false;
                    },
                    select: function(event, ui) {
                        // Delete the last tag if we autocomplete something despite the input being empty
                        // This happens because the input's blur event causes the tag to be created when
                        // the user clicks an autocomplete item.
                        // The only artifact of this is that while the user holds down the mouse button
                        // on the selected autocomplete item, a tag is shown with the pre-autocompleted text,
                        // and is changed to the autocompleted text upon mouseup.
                        if (that.tagInput.val() === '') {
                            that.removeTag(that._lastTag(), false);
                        }

                        that.createTag(ui.item.value, ui.item.label);
                        // Preventing the tag input to be updated with the chosen value.
                        return false;
                    },
                    open: function(event, ui) {
                        // Needed so that when user input is deleted and nothing is left in the input
                        // the autocomplete closes like it should
                        if (that.tagInput.val() === '' && !DOWN_PRESSED) {

                            // Clear out the input
                            that._clearInput();

                            // Close it
                            that.tagInput.autocomplete('close');
                        }
                    }
                });
            }
        },

        _cleanedInput: function() {
            // Returns the contents of the tag input, cleaned and ready to be passed to createTag
            return $.trim(this.tagInput.val().replace(/^"(.*)"$/, '$1'));
        },

        _clearInput: function() {
            this.tagInput.val('');

            if (this.tagInput.data('value'))
                this.tagInput.removeData('value');
        },

        _lastTag: function() {
            return this.tagList.children('.tagit-choice:last');
        },

        _tags: function() {
            return this.tagList.children('.tagit-choice');
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
                this._tags().each(function() {
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
            this._tags().each(function(i) {
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

        createTag: function(value, tagLabel, additionalClass) {
            var that = this;
            var name;

            // Never create a tag if there is no input
            if (that.tagInput.val() === '')
                return;

            // Automatically trims the value of leading and trailing whitespace.
            value = $.trim(value);

            if (!this.allowDuplicates && (!this._isNew(value) || value === '')) {
                return false;
            }

            // Decide whether to show the value or the label in the tag
            name  = (this.options.tagLabel == 'value') ? value : tagLabel;
            label = $(this.options.onTagClicked ? '<a class="tagit-label"></a>' : '<span class="tagit-label"></span>').text(name).data('value', value);
                        
            // Create tag.
            var tag = $('<li></li>')
                .addClass('tagit-choice ui-widget-content ui-state-default ui-corner-all')
                .addClass(additionalClass)
                .append(label);

            // Button for removing the tag.
            var removeTagIcon = $('<span></span>')
                .addClass('ui-icon ui-icon-close');
            var removeTag = $('<a><span class="text-icon">\xd7</span></a>') // \xd7 is an X
                .addClass('tagit-close')
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
                var safeValue = (this.options.tagLabel == 'value') ? value : label.html();
                tag.append('<input type="hidden" style="display:none;" value="' + value + '" name="' + this.options.itemName + '[' + this.options.fieldName + '][]" />');
            }

            this._trigger('onTagAdded', null, tag);

            // Cleaning the input.
            this._clearInput();

            // insert tag
            this.tagInput.parent().before(tag);
        },

        removeTag: function(tag, animate) {
            animate = typeof animate === "undefined" ? this.options.animate : animate;

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
                var hide_args = ($.effects && $.effects.blind) ? ['blind', {direction: 'horizontal'}, 'fast'] : ['fast'];

                hide_args.push(function() {
                    tag.remove();
                });

                tag.fadeOut('fast').hide.apply(tag, hide_args).dequeue();
            } else {
                tag.remove();
            }
        },

        removeTagByName: function(tagName, animate) {
            var toRemove = this._tags().find("input[value='" + tagName + "']").closest('.tagit-choice');
            if (toRemove.length === 0) {
                throw "No such tag exists with the name '" + tagName + "'";
            }
            this.removeTag(toRemove, animate);
        },

        removeAll: function() {
            // Removes all tags.
            var that = this;
            this._tags().each(function(index, tag) {
                that.removeTag(tag, false);
            });
        }

    });

})(jQuery);
