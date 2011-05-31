
(function($) {

    $.widget('ui.tagit', {
        options: {
            'itemName'          : 'item',
            'fieldName'         : 'tags',
            'availableTags'     : [],
            // callback: called when a tag is added
            'onTagAdded'        : null,
            // callback: called when a tag is removed
            'onTagRemoved'      : null,
            // callback: called when a tag is clicked
            'onTagClicked'      : null,
            'tagSource'         : null,
            'removeConfirmation': false,
            'caseSensitive': true,
            'allowSpaces': false, // when enabled, quotes are not neccesary for inputting multi-word tags

            // The below options are for using a single field instead of several for our form values.
            'singleField': false, // When enabled, will use a single hidden field for the form, rather than one per tag.
                                  // It will delimit tags in the field with singleFieldDelimiter.
            'singleFieldDelimiter': ',',
            'singleFieldNode': null, // Set this to an input DOM node to use an existing form field.
                                     // Any text in it will be erased on init. But it will be populated with 
                                     // the text of tags as they are created, delimited by singleFieldDelimiter.
                                     // If this is not set, we create an input node for it, with the name 
                                     // given in settings.fieldName, ignoring settings.itemName.

            'tabIndex': null // Optionally set a tabindex attribute on the input that gets created for tag-it.
        },


        _create: function() {
            // for handling static scoping inside callbacks
            var self = this;

            this.tagList = this.element;
            this._tagInput = $('<input class="tagit-input" type="text" ' + (this.options.tabIndex ? 'tabindex="' + this.options.tabIndex + '"' : '') + '>');

            this.options.tagSource = this.options.tagSource || function(search, showChoices) {
                var filter = search.term.toLowerCase();
                var choices = $.grep(self.options.availableTags, function(element) {
                    // Only match autocomplete options that begin with the search term.
                    // (Case insensitive.)
                    return (element.toLowerCase().indexOf(filter) === 0);
                });
                showChoices(self._subtractArray(choices, self.assignedTags()));
            };

            this.tagList
                .addClass('tagit')
                .addClass('ui-widget ui-widget-content ui-corner-all')
                // create the input field.
                .append($('<li class="tagit-new"></li>\n').append(this._tagInput))
                .click(function(e) {
                    var target = $(e.target);
                    if (target.hasClass('close')) {
                        // Removes a tag when the little 'x' is clicked.
                        // Event is binded to the UL, otherwise a new tag (LI > A) wouldn't have this event attached to it.
                        self.removeTag(target.parent());
                    } else if (target.hasClass('tagit-label') && self.options.onTagClicked) {
                        self.options.onTagClicked(target.parent());
                    } else {
                        // Sets the focus() to the input field, if the user clicks anywhere inside the UL.
                        // This is needed because the input field needs to be of a small size.
                        self._tagInput.focus();
                    }
                });

            // Add existing tags.
            this.tagList.children('li').each(function() {
                if (!$(this).hasClass('tagit-new')) {
                    self.createTag($(this).html(), $(this).attr('class'));
                    $(this).remove();
                }
            });

            if (this.options.singleField) {
                if (this.options.singleFieldNode) {
                    // Add existing tags from the input field
                    var node = $(this.options.singleFieldNode);
                    var tags = node.val().split(this.options.singleFieldDelimiter);
                    node.val('');
                    $.each(tags, function(index, tag) {
                        self.createTag(tag);
                    });
                } else {
                    // Create our single field input after our list.
                    this.options.singleFieldNode = this.tagList.after('<input type="hidden" style="display:none;" value="" name="' + this.options.fieldName + '">');
                }
            }

            this._tagInput
                .keydown(function(event) {
                    // Backspace is not detected within a keypress, so it must use keydown.
                    if (event.which == $.ui.keyCode.BACKSPACE && self._tagInput.val() === '') {
                        var tag = self._lastTag();
                        if (!self.options.removeConfirmation || tag.hasClass('remove')) {
                            // When backspace is pressed, the last tag is deleted.
                            self.removeTag(tag);
                        } else if (self.options.removeConfirmation) {
                            tag.addClass('remove');
                        }
                    } else if (self.options.removeConfirmation) {
                        self._lastTag().removeClass('remove');
                    }

                    // Comma/Space/Enter are all valid delimiters for new tags,
                    // except when there is an open quote or if setting allowSpaces = true.
                    // Tab will also create a tag, unless the tag input is empty, in which case it isn't caught.
                    if (
                        event.which == $.ui.keyCode.COMMA ||
                        event.which == $.ui.keyCode.ENTER ||
                        (
                            event.which == $.ui.keyCode.TAB &&
                            self._tagInput.val() !== ''
                        ) ||
                        (
                            event.which == $.ui.keyCode.SPACE &&
                            self.options.allowSpaces !== true &&
                            (
                                $.trim(self._tagInput.val()).replace( /^s*/, '' ).charAt(0) != '"' ||
                                (
                                    $.trim(self._tagInput.val()).charAt(0) == '"' &&
                                    $.trim(self._tagInput.val()).charAt($.trim(self._tagInput.val()).length - 1) == '"' &&
                                    $.trim(self._tagInput.val()).length - 1 !== 0
                                )
                            )
                        )
                    ) {
                        event.preventDefault();
                        self.createTag(self._cleanedInput());
                    }
                }).blur(function(e){
                    // Create a tag when the element loses focus (unless it's empty).
                    self.createTag(self._cleanedInput());
                });
                

            if (this.options.availableTags || this.options.tagSource) {
                this._tagInput.autocomplete({
                    source: this.options.tagSource,
                    select: function(event, ui) {
                        // Delete the last tag if we autocomplete something despite the input being empty
                        // This happens because the input's blur event causes the tag to be created when
                        // the user clicks an autocomplete item.
                        // The only artifact of this is that while the user holds down the mouse button
                        // on the selected autocomplete item, a tag is shown with the pre-autocompleted text,
                        // and is changed to the autocompleted text upon mouseup.
                        if (self._tagInput.val() === '') {
                            self.removeTag(self._lastTag(), false);
                        }
                        self.createTag(ui.item.value);
                        // Preventing the tag input to be updated with the chosen value.
                        return false;
                    }
                });
            }
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
            var self = this;
            var tags = [];
            if (this.options.singleField) {
                tags = $(this.options.singleFieldNode).val().split(this.options.singleFieldDelimiter);
                if (tags[0] === '') {
                    tags = [];
                }
            } else {
                this.tagList.children('.tagit-choice').each(function() {
                    tags.push(self.tagLabel(this));
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
            var self = this;
            var isNew = true;
            this.tagList.children('.tagit-choice').each(function(i) {
                if (self._formatStr(value) == self._formatStr(self.tagLabel(this))) {
                    isNew = false;
                    return;
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
            // Automatically trims the value of leading and trailing whitespace.
            value = $.trim(value);

            // Cleaning the input.
            this._tagInput.val('');

            if (!this._isNew(value) || value === '') {
                return false;
            }

            var label = $(this.options.onTagClicked ? '<a class="tagit-label"></a>' : '<span class="tagit-label"></span>').text(value);

            // Create tag.
            var tag = $('<li></li>')
                .addClass('tagit-choice ui-widget-content ui-state-default ui-corner-all')
                .addClass(additionalClass)
                .append(label);
            var removeTag = $('<a></a>')
                .addClass('ui-icon ui-icon-close close');
            tag.append(removeTag);

            if (this.options.singleField) {
                var tags = this.assignedTags();
                tags.push(value);
                this._updateSingleTagsField(tags);
            } else {
                var escapedValue = label.html();
                tag.append('<input type="hidden" style="display:none;" value="' + escapedValue + '" name="' + this.options.itemName + '[' + this.options.fieldName + '][]">');
            }

            if (this.options.onTagAdded) {
                this.options.onTagAdded(tag);
            }

            // insert tag
            this._tagInput.parent().before(tag);
        },
        
        removeTag: function(tag, animate) {
            if (typeof animate === 'undefined') { animate = true; }

            tag = $(tag);

            if (this.options.onTagRemoved) {
                this.options.onTagRemoved(tag);
            }
            if (this.options.singleField) {
                var tags = this.assignedTags();
                var removedTagLabel = tag.children('.tagit-label').text();
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
            // Removes all tags. Takes an optional `animate` argument.
            var self = this;
            this.tagList.children('.tagit-choice').each(function(index, tag) {
                self.removeTag(tag, false);
            });
        }

    });

})(jQuery);


