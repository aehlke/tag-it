/*
* jQuery UI Tag-it!
*
* @version v2.0 (06/2011)
*
* Copyright 2011, Levy Carneiro Jr.
* Released under the MIT license.
* https://github.com/aehlke/tag-it/blob/master/LICENSE
*
* Homepage:
*   https://github.com/aehlke/tag-it
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
            allowDuplicates   : false,
            caseSensitive     : true,
            fieldName         : 'tags',
            placeholderText   : null,   // Sets `placeholder` attr on input field.
            readOnly          : false,  // Disables editing.
            removeConfirmation: false,  // Require confirmation to remove tags.
            tagLimit          : null,   // Max number of tags allowed (null for unlimited).
            maxTagLength      : null,   // Validated after preprocessing, for every creation path.
            inputType         : 'text',
            removeOnBackspace : true,
            disableInputFocus : false,
            propagateTagClicks: true,
            propagateRemoveClicks: true,
            matchFromStart    : true,
            allowOnlyAutocompleteTags: false, // Restrict to availableTags, including programmatic creation.
            autocompleteOnly  : false, // Only UI selection; programmatic initialization remains available.
            highlightTagsNotInAutocomplete: false,

            // Used for autocomplete, unless you override `autocomplete.source`.
            availableTags     : [],

            // Use to override or add any options to the autocomplete widget.
            //
            // By default, autocomplete.source will map to availableTags,
            // unless overridden.
            autocomplete: {},

            // Shows autocomplete before the user even types anything.
            showAutocompleteOnFocus: false,

            // When enabled, quotes are unnecessary for inputting multi-word tags.
            allowSpaces: false,
            allowCommas: false,
            delimiterKeyCodes: [$.ui.keyCode.COMMA],

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

            // This is just used when preloading data from the field, and for
            // populating the field with delimited tags as the user adds them.
            singleFieldDelimiter: ',',
            singleFieldQuoted: false, // Opt in to reversible quoted-field serialization.

            // Set this to an input DOM node to use an existing form field.
            // Any text in it will be erased on init. But it will be
            // populated with the text of tags as they are created,
            // delimited by singleFieldDelimiter.
            //
            // If this is not set, we create an input node for it,
            // with the name given in settings.fieldName.
            singleFieldNode: null,

            // Whether to animate tag removals or not.
            animate: true,

            // Optionally set a tabindex attribute on the input that gets
            // created for tag-it.
            tabIndex: null,

            // Event callbacks.
            beforeTagAdded      : null,
            afterTagAdded       : null,

            beforeTagRemoved    : null,
            afterTagRemoved     : null,

            onTagClicked        : null,
            onTagLimitExceeded  : null,


            // DEPRECATED:
            //
            // /!\ These event callbacks are deprecated and WILL BE REMOVED at some
            // point in the future. They're here for backwards-compatibility.
            // Use the above before/after event callbacks instead.
            onTagAdded  : null,
            onTagRemoved: null,
            // `autocomplete.source` is the replacement for tagSource.
            tagSource: null
            // Do not use the above deprecated options.
        },

        _create: function() {
            // for handling static scoping inside callbacks
            var that = this;
            if (typeof this.options.singleFieldDelimiter !== 'string' ||
                    !this.options.singleFieldDelimiter.length || /["\r\n]/.test(this.options.singleFieldDelimiter)) {
                throw new Error('singleFieldDelimiter must be nonempty and contain no quotes or newlines');
            }

            // There are 2 kinds of DOM nodes this widget can be instantiated on:
            //     1. UL, OL, or some element containing either of these.
            //     2. INPUT, in which case 'singleField' is overridden to true,
            //        a UL is created and the INPUT is hidden.
            if (this.element.is('input, textarea')) {
                this.tagList = $('<ul></ul>').insertAfter(this.element);
                this.options.singleField = true;
                this.options.singleFieldNode = this.element;
                this.element.addClass('tagit-hidden-field');
            } else {
                var lists = this.element.find('ul, ol');
                this.tagList = (lists.addBack ? lists.addBack() : lists.andSelf()).last();
            }

            this.tagList.toggleClass('tagit-rtl', this.tagList.css('direction') === 'rtl');
            this.tagInput = $('<input />').attr('type', this.options.inputType).addClass('ui-widget-content');

            if (this.options.readOnly) this.tagInput.attr('disabled', 'disabled');

			if (null != this.options.tabIndex) {
				this.tagInput.attr('tabindex', this.options.tabIndex);
			}

            if (this.options.placeholderText) {
                this.tagInput.attr('placeholder', this.options.placeholderText);
            }

            if (!this.options.autocomplete.source) {
                this.options.autocomplete.source = function(search, showChoices) {
                    var widget = this;
                    var filter = search.term.toLowerCase();
                    var choices = $.grep(this.options.availableTags, function(element) {
                        var item = widget._normalizeTag(element);
                        var index = item.label.toLowerCase().indexOf(filter);
                        return (widget.options.matchFromStart ? index === 0 : index !== -1) &&
                            (widget.options.allowDuplicates || widget._isNew(item.value));
                    });
                    showChoices(choices);
                };
            }

            if (this.options.showAutocompleteOnFocus) {
                this.tagInput.focus(function(event, ui) {
                    that._showAutocomplete();
                });

                if (typeof this.options.autocomplete.minLength === 'undefined') {
                    this.options.autocomplete.minLength = 0;
                }
            }

            // Bind autocomplete.source callback functions to this context.
            if ($.isFunction(this.options.autocomplete.source)) {
                this.options.autocomplete.source = $.proxy(this.options.autocomplete.source, this);
            }

            // DEPRECATED.
            if ($.isFunction(this.options.tagSource)) {
                this.options.tagSource = $.proxy(this.options.tagSource, this);
            }

            this.tagList
                .addClass('tagit')
                .addClass('ui-widget ui-widget-content ui-corner-all')
                // Create the input field.
                .append($('<li class="tagit-new"></li>').append(this.tagInput))
                .bind('click.tagit', function(e) {
                    var target = $(e.target);
                    if (target.hasClass('tagit-label')) {
                        if (!that.options.propagateTagClicks) e.stopPropagation();
                        var tag = target.closest('.tagit-choice');
                        if (!tag.hasClass('removed')) {
                            that._trigger('onTagClicked', e, {tag: tag, tagLabel: that.tagLabel(tag)});
                        }
                    } else {
                        // Sets the focus() to the input field, if the user
                        // clicks anywhere inside the UL. This is needed
                        // because the input field needs to be of a small size.
                        if (!that.options.disableInputFocus && !that.options.readOnly) that.tagInput.focus();
                    }
                });

            // Single field support.
            var addedExistingFromSingleFieldNode = false;
            if (this.options.singleField) {
                if (this.options.singleFieldNode) {
                    // Add existing tags from the input field.
                    var node = $(this.options.singleFieldNode);
                    var tags = this.options.singleFieldQuoted ? this._splitTags(node.val()).values :
                        node.val().split(this.options.singleFieldDelimiter);
                    node.val('');
                    $.each(tags, function(index, tag) {
                        that.createTag(that._availableTag(tag) || tag, null, true);
                        addedExistingFromSingleFieldNode = true;
                    });
                } else {
                    // Create our single field input after our list.
                    this.options.singleFieldNode = $('<input type="hidden" />').attr('name', this.options.fieldName).val('');
                    this._createdSingleFieldNode = true;
                    this.tagList.after(this.options.singleFieldNode);
                }
            }

            // Add existing tags from the list, if any.
            if (!addedExistingFromSingleFieldNode) {
                this.tagList.children('li').each(function() {
                    if (!$(this).hasClass('tagit-new')) {
                        var value = $(this).attr('data-value');
                        that.createTag(typeof value === 'undefined' ? $(this).text() :
                            {label: $(this).text(), value: value}, $(this).attr('class'), true);
                        $(this).remove();
                    }
                });
            }

            // Control keys use keydown; printable punctuation uses its actual character.
            this.tagInput.bind('compositionstart.tagit', function() {
                that._composing = true;
            }).bind('compositionend.tagit', function() {
                that._composing = false;
                that._consumeInput(false);
            }).bind('keydown.tagit', function(event) {
                if (that.options.readOnly || that._composing || event.which === 229 ||
                        (event.originalEvent && event.originalEvent.isComposing)) return;
                if (event.which === $.ui.keyCode.BACKSPACE && that.tagInput.val() === '') {
                    if (that.options.removeOnBackspace) {
                        var tag = that._lastTag();
                        if (tag.length && (!that.options.removeConfirmation || tag.hasClass('remove'))) {
                            event.preventDefault();
                            that.removeTag(tag);
                        } else if (tag.length) {
                            tag.addClass('remove ui-state-highlight');
                        }
                    }
                } else if (that.options.removeConfirmation) {
                    that._lastTag().removeClass('remove ui-state-highlight');
                }
                var key = event.key || (event.originalEvent && event.originalEvent.key);
                var custom = $.inArray(event.which, that.options.delimiterKeyCodes) !== -1 &&
                    event.which !== $.ui.keyCode.COMMA;
                var comma = key === ',' && !that.options.allowCommas &&
                    $.inArray($.ui.keyCode.COMMA, that.options.delimiterKeyCodes) !== -1;
                var space = event.which === $.ui.keyCode.SPACE && !that.options.allowSpaces;
                var commit = event.which === $.ui.keyCode.ENTER ||
                    (event.which === $.ui.keyCode.TAB && that.tagInput.val() !== '');
                if ((commit || custom || comma || space) && !that._splitTags(that.tagInput.val()).openQuote) {
                    if (!(event.which === $.ui.keyCode.ENTER && that.tagInput.val() === '')) event.preventDefault();
                    // Delegate active Enter/Tab selection through jQuery UI's normal handler,
                    // including a user-highlighted item when autoFocus is false.
                    var selecting = commit && that.tagInput.data('autocomplete-open') && that._activeAutocompleteItem;
                    if (!selecting) {
                        that.tagInput.autocomplete('close');
                        that._consumeInput(true);
                    }
                }
            }).bind('keypress.tagit', function(event) {
                // Legacy browsers lack KeyboardEvent.key; avoid physical comma-key codes.
                if (!event.key && !that.options.readOnly && !that._composing &&
                        !that.options.allowCommas && $.inArray($.ui.keyCode.COMMA, that.options.delimiterKeyCodes) !== -1 &&
                        String.fromCharCode(event.charCode || event.which) === ',' &&
                        !that._splitTags(that.tagInput.val()).openQuote) {
                    event.preventDefault();
                    that._consumeInput(true);
                }
            }).bind('paste.tagit', function() {
                clearTimeout(that._pasteTimer);
                that._pasteTimer = setTimeout(function() {
                    if (!that.options.readOnly && !that._composing) that._consumeInput(true);
                }, 0);
            }).bind('input.tagit', function() {
                that._activeAutocompleteItem = null;
                if (!that._composing && !that.options.readOnly) that._consumeInput(false);
            }).bind('blur.tagit', function() {
                if (!that._creatingTag && !that.options.readOnly && !that.tagInput.data('autocomplete-open')) {
                    that._consumeInput(true);
                }
            });

            // Autocomplete.
            if (this.options.availableTags || this.options.tagSource || this.options.autocomplete.source) {
                var autocompleteOptions = {
                    focus: function(event, ui) {
                        that.tagInput.val(ui.item.label);
                        return false;
                    },
                    select: function(event, ui) {
                        if (!that.options.readOnly) that.createTag(ui.item);
                        // Preventing the tag input to be updated with the chosen value.
                        return false;
                    }
                };
                $.extend(autocompleteOptions, this.options.autocomplete);

                // tagSource is deprecated, but takes precedence here since autocomplete.source is set by default,
                // while tagSource is left null by default.
                autocompleteOptions.source = this.options.tagSource || autocompleteOptions.source;

                this.tagInput.autocomplete(autocompleteOptions).bind('autocompletefocus.tagit', function(event, ui) {
                    that._activeAutocompleteItem = ui.item;
                }).bind('autocompletesearch.tagit', function() {
                    that._activeAutocompleteItem = null;
                }).bind('autocompleteopen.tagit', function(event, ui) {
                    that.tagInput.data('autocomplete-open', true);
                }).bind('autocompleteclose.tagit', function(event, ui) {
                    that._activeAutocompleteItem = null;
                    that.tagInput.data('autocomplete-open', false);
                });

                this.tagInput.autocomplete('widget').addClass('tagit-autocomplete');
            }
        },

        destroy: function() {
            $.Widget.prototype.destroy.call(this);

            this.element.unbind('.tagit');
            this.tagList.unbind('.tagit');

            clearTimeout(this._pasteTimer);
            clearTimeout(this._autocompleteTimer);
            this.tagInput.autocomplete('destroy');
            this.tagInput.removeData('autocomplete-open');

            this.tagList.removeClass([
                'tagit',
                'ui-widget',
                'ui-widget-content',
                'ui-corner-all',
                'tagit-hidden-field',
                'tagit-rtl'
            ].join(' '));

            if (this.element.is('input, textarea')) {
                this.element.removeClass('tagit-hidden-field');
                this.tagList.remove();
            } else {
                this.tagList.children('li').each(function() {
                    if ($(this).hasClass('tagit-new')) {
                        $(this).remove();
                    } else {
                        $(this).removeClass([
                            'tagit-choice',
                            'ui-widget-content',
                            'ui-state-default',
                            'ui-state-highlight',
                            'ui-corner-all',
                            'remove',
                            'tagit-choice-editable',
                            'tagit-choice-read-only',
                            'tagit-not-autocomplete'
                        ].join(' '));

                        $(this).text($(this).children('.tagit-label').text());
                    }
                });

                if (this._createdSingleFieldNode) {
                    $(this.options.singleFieldNode).remove();
                }
            }

            return this;
        },

        _normalizeTag: function(item) {
            var object = item !== null && typeof item === 'object';
            var value = object ? (item.value === null || typeof item.value === 'undefined' ? item.label : item.value) : item;
            value = value === null || typeof value === 'undefined' ? '' : $.trim(String(value));
            var label = object && item.label !== null && typeof item.label !== 'undefined' ? String(item.label) : value;
            return {value: value, label: label, object: object};
        },

        _availableTag: function(value) {
            var found = null;
            var that = this;
            $.each(this.options.availableTags, function(index, item) {
                var normalized = that._normalizeTag(item);
                if (that._formatStr(normalized.value) === that._formatStr(value)) {
                    found = {value: normalized.value, label: normalized.label};
                    return false;
                }
            });
            return found;
        },

        _splitTags: function(text, input) {
            var delimiter = this.options.singleFieldDelimiter;
            var values = [], parts = [], value = '', quoted = false, start = 0;
            var i = 0, atStart = true;
            while (i < text.length) {
                var character = text.charAt(i);
                if (character === '"' && (quoted || atStart)) {
                    if (quoted && text.charAt(i + 1) === '"') {
                        value += '"'; i += 2; continue;
                    }
                    quoted = !quoted;
                    atStart = false;
                    i++;
                    continue;
                }
                var length = 0;
                if (!quoted) {
                    if ((!input || delimiter !== ',' || (!this.options.allowCommas &&
                            $.inArray($.ui.keyCode.COMMA, this.options.delimiterKeyCodes) !== -1)) &&
                            text.substr(i, delimiter.length) === delimiter) length = delimiter.length;
                    else if (input && !this.options.allowSpaces && /\s/.test(character)) length = 1;
                    else if (input && !this.options.allowCommas && character === ',' &&
                            $.inArray($.ui.keyCode.COMMA, this.options.delimiterKeyCodes) !== -1) length = 1;
                }
                if (length) {
                    values.push($.trim(value));
                    parts.push({value: $.trim(value), raw: text.substring(start, i),
                        separator: text.substr(i, length)});
                    value = ''; i += length; start = i; atStart = true;
                } else {
                    value += character;
                    if (!/\s/.test(character)) atStart = false;
                    i++;
                }
            }
            var remainder = text.substring(start);
            if (!quoted && value !== '') values.push($.trim(value));
            if (quoted && !input) values.push($.trim(remainder));
            return {values: values, parts: parts, remainder: remainder, lastValue: $.trim(value), openQuote: quoted};
        },

        _consumeInput: function(force) {
            if (this.options.autocompleteOnly || this._consumingInput || this.options.readOnly) return;
            this._consumingInput = true;
            try {
                var parsed = this._splitTags(this.tagInput.val(), true);
                var parts = parsed.parts.slice(0);
                var remaining = [];
                var boundary = '';
                if (force && !parsed.openQuote) {
                    parts.push({value: parsed.lastValue, raw: parsed.remainder, separator: ''});
                    parsed.remainder = '';
                }
                for (var index = 0; index < parts.length; index++) {
                    if (parts[index].value === '') {
                        if (remaining.length) boundary += parts[index].raw + parts[index].separator;
                    } else if (this.createTag(parts[index].value) === false) {
                        if (remaining.length) remaining.push(boundary);
                        remaining.push(parts[index].raw);
                        boundary = parts[index].separator;
                    }
                }
                if (parsed.remainder !== '') {
                    if (remaining.length) remaining.push(boundary);
                    remaining.push(parsed.remainder);
                }
                this.tagInput.val(remaining.join(''));
            } finally {
                this._consumingInput = false;
            }
        },

        _setOption: function(key, value) {
            $.Widget.prototype._setOption.call(this, key, value);
            if (key === 'readOnly' && this.tagInput) {
                if (value) {
                    this.tagInput.attr('disabled', 'disabled').autocomplete('close');
                } else {
                    this.tagInput.removeAttr('disabled');
                }
                this._tags().toggleClass('tagit-choice-read-only', !!value)
                    .toggleClass('tagit-choice-editable', !value).find('.tagit-close').toggle(!value);
            }
            if (key === 'availableTags' && this.tagInput) this.tagInput.autocomplete('close');
            return this;
        },

        _cleanedInput: function() {
            // Returns the contents of the tag input, cleaned and ready to be passed to createTag
            return $.trim(this.tagInput.val().replace(/^"(.*)"$/, '$1'));
        },

        _lastTag: function() {
            return this.tagList.find('.tagit-choice:last:not(.removed)');
        },

        _tags: function() {
            return this.tagList.find('.tagit-choice:not(.removed)');
        },

        assignedTags: function() {
            var that = this;
            var tags = [];
            if (this.options.singleField) {
                var field = $(this.options.singleFieldNode).val();
                return this.options.singleFieldQuoted ? this._splitTags(field).values :
                    (field === '' ? [] : field.split(this.options.singleFieldDelimiter));
            }
            this._tags().each(function() { tags.push(that.tagValue(this)); });
            return tags;
        },

        _updateSingleTagsField: function(tags) {
            var delimiter = this.options.singleFieldDelimiter;
            var quoted = this.options.singleFieldQuoted;
            var encoded = $.map(tags, function(value) {
                return quoted && (value.indexOf(delimiter) !== -1 || /["\r\n]/.test(value)) ?
                    '"' + value.replace(/"/g, '""') + '"' : value;
            });
            $(this.options.singleFieldNode).val(encoded.join(delimiter)).trigger('change');
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
            return $(tag).find('.tagit-label:first').text();
        },

        tagValue: function(tag) {
            var value = $(tag).data('tagit-value');
            if (typeof value === 'undefined') value = $(tag).attr('data-value');
            return typeof value === 'undefined' ? this.tagLabel(tag) : value;
        },

        _showAutocomplete: function() {
            if (!this.options.readOnly && (!this.options.tagLimit || this._tags().length < this.options.tagLimit)) {
                this.tagInput.autocomplete('search', '');
            }
        },

        _findTagByLabel: function(name) {
            var that = this;
            var tag = null;
            this._tags().each(function(i) {
                if (that._formatStr(name) == that._formatStr(that.tagLabel(this))) {
                    tag = $(this);
                    return false;
                }
            });
            return tag;
        },

        _isNew: function(name) {
            var that = this;
            var found = false;
            this._tags().each(function() {
                if (that._formatStr(name) === that._formatStr(that.tagValue(this))) found = true;
            });
            return !found;
        },

        _formatStr: function(str) {
            if (this.options.caseSensitive) {
                return str;
            }
            return $.trim(str.toLowerCase());
        },

        _effectExists: function(name) {
            return Boolean($.effects && ($.effects[name] || ($.effects.effect && $.effects.effect[name])));
        },

        createTag: function(value, additionalClass, duringInitialization) {
            var previous = this._creatingTag;
            this._creatingTag = true;
            try {
                var created = this._createTag(value, additionalClass, duringInitialization);
                return created === false ? false : undefined;
            } finally {
                this._creatingTag = previous;
            }
        },

        _createTag: function(value, additionalClass, duringInitialization) {
            var that = this;
            var item = this._normalizeTag(value);
            value = item.value;
            if (this.options.preprocessTag) value = this.options.preprocessTag(value);
            if (value === null || typeof value === 'undefined') return false;
            value = $.trim(String(value));
            if (value === '' || (this.options.maxTagLength !== null && value.length > this.options.maxTagLength)) return false;
            if (this.options.singleField && !this.options.singleFieldQuoted &&
                    value.indexOf(this.options.singleFieldDelimiter) !== -1) return false;
            if (!item.object) item.label = value;
            if (this.options.allowOnlyAutocompleteTags && !this._availableTag(value)) return false;

            if (!this.options.allowDuplicates && !this._isNew(value)) {
                var existingTag = this._tags().filter(function() {
                    return that._formatStr(that.tagValue(this)) === that._formatStr(value);
                }).first();
                if (this._trigger('onTagExists', null, {
                    existingTag: existingTag,
                    duringInitialization: duringInitialization
                }) !== false) {
                    if (this._effectExists('highlight')) {
                        existingTag.effect('highlight');
                    }
                }
                return false;
            }

            if (this.options.tagLimit && this._tags().length >= this.options.tagLimit) {
                this._trigger('onTagLimitExceeded', null, {duringInitialization: duringInitialization});
                return false;
            }

            var label = $(this.options.onTagClicked ? '<a class="tagit-label"></a>' : '<span class="tagit-label"></span>').text(item.label);

            // Create tag.
            var tag = $('<li></li>')
                .addClass('tagit-choice ui-widget-content ui-state-default ui-corner-all')
                .addClass(additionalClass)
                .append(label)
                .data('tagit-value', value)
                .attr('data-value', value);
            if (this.options.highlightTagsNotInAutocomplete && !this._availableTag(value)) {
                tag.addClass('tagit-not-autocomplete');
            }

            tag.addClass(this.options.readOnly ? 'tagit-choice-read-only' : 'tagit-choice-editable');
            var removeTagIcon = $('<span></span>').addClass('ui-icon ui-icon-close');
            var removeTag = $('<a></a>').attr('role', 'button')
                .attr('aria-label', item.label + ' close').addClass('tagit-close')
                .append($('<span></span>').addClass('text-icon').text('\xd7'))
                .append(removeTagIcon).toggle(!this.options.readOnly)
                .bind('click.tagit', function(event) {
                    event.preventDefault();
                    if (!that.options.propagateRemoveClicks) event.stopPropagation();
                    if (!that.options.readOnly) that.removeTag(tag);
                });
            if (this.options.tabIndex !== null) {
                removeTag.attr('tabindex', this.options.tabIndex).bind('keydown.tagit', function(event) {
                    if (event.which === $.ui.keyCode.ENTER || event.which === $.ui.keyCode.SPACE) {
                        event.preventDefault();
                        if (!that.options.readOnly) {
                            that.removeTag(tag);
                            that.tagInput.focus();
                        }
                    }
                });
            }
            tag.append(removeTag);

            // Unless options.singleField is set, each tag has a hidden input field inline.
            if (!this.options.singleField) {
                tag.append($('<input type="hidden" />').addClass('tagit-hidden-field')
                    .attr('name', this.options.fieldName).val(value));
            }

            if (this._trigger('beforeTagAdded', null, {
                tag: tag,
                tagLabel: this.tagLabel(tag),
                tagValue: this.tagValue(tag),
                duringInitialization: duringInitialization
            }) === false) {
                tag.remove();
                return false;
            }

            if (this.options.singleField) {
                var tags = this.assignedTags();
                tags.push(value);
                this._updateSingleTagsField(tags);
            }

            // DEPRECATED.
            this._trigger('onTagAdded', null, tag);

            this.tagInput.val('');

            // Insert tag.
            this.tagInput.parent().before(tag);

            this._trigger('afterTagAdded', null, {
                tag: tag,
                tagLabel: this.tagLabel(tag),
                tagValue: this.tagValue(tag),
                duringInitialization: duringInitialization
            });

            if (this.options.showAutocompleteOnFocus && !duringInitialization) {
                clearTimeout(this._autocompleteTimer);
                this._autocompleteTimer = setTimeout(function() { that._showAutocomplete(); }, 0);
            }
        },

        removeTag: function(tag, animate) {
            animate = typeof animate === 'undefined' ? this.options.animate : animate;

            tag = $(tag);
            if (!tag.length || !tag.hasClass('tagit-choice') || tag.hasClass('removed') ||
                    tag.parent()[0] !== this.tagList[0]) return false;

            // DEPRECATED.
            this._trigger('onTagRemoved', null, tag);

            if (this._trigger('beforeTagRemoved', null, {tag: tag, tagLabel: this.tagLabel(tag)}) === false) {
                return;
            }

            tag.addClass('removed');
            if (this.options.singleField) {
                var that = this;
                var remaining = [];
                this._tags().each(function() { remaining.push(that.tagValue(this)); });
                this._updateSingleTagsField(remaining);
            }

            if (animate) {
                tag.addClass('removed'); // Excludes this tag from _tags.
                var hide_args = this._effectExists('blind') ? ['blind', {direction: 'horizontal'}, 'fast'] : ['fast'];

                var thisTag = this;
                hide_args.push(function() {
                    tag.remove();
                    thisTag._trigger('afterTagRemoved', null, {tag: tag, tagLabel: thisTag.tagLabel(tag)});
                });

                tag.fadeOut('fast').hide.apply(tag, hide_args).dequeue();
            } else {
                tag.remove();
                this._trigger('afterTagRemoved', null, {tag: tag, tagLabel: this.tagLabel(tag)});
            }

        },

        removeTagByLabel: function(tagLabel, animate) {
            var toRemove = this._findTagByLabel(tagLabel);
            if (!toRemove) {
                throw "No such tag exists with the name '" + tagLabel + "'";
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

