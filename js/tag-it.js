
(function($) {

    $.fn.tagit = function(options) {

        var settings = {
            'itemName'          : 'item',
            'fieldName'         : 'tags',
            'availableTags'     : [],
            // callback: called when a tag is added
            'onTagAdded'        : null,
            // callback: called when a tag is removed
            'onTagRemoved'      : null,
            // callback: called when a tag is clicked
    	    'onTagClicked'      : null,
            'tagSource':
                function(search, showChoices) {
                    var filter = new RegExp(search.term, 'i');
                    var choices = settings.availableTags.filter(function(element) {
                        return (element.search(filter) != -1);
                    });
                    showChoices(subtractArray(choices, assignedTags()));
                },
            'removeConfirmation': false,
            'caseSensitive': true,
            'allowSpaces': false, // when enabled, quotes are not neccesary for inputting multi-word tags

            'singleField': false, // When enabled, will use a single hidden field for the form, rather than one per tag.
                                  // It will delimit tags in the field with singleFieldDelimiter.
            'singleFieldDelimiter': ','
        };

        if (options) {
            $.extend(settings, options);
        }

        var tagList = $(this),
            tagInput  = $('<input class="tagit-input" type="text" />');
            BACKSPACE = 8,
            ENTER     = 13,
            SPACE     = 32,
            COMMA     = 44,
            TAB       = 9;

        tagList
            // add the tagit CSS class.
            .addClass('tagit')
            // create the input field.
            .append($('<li class="tagit-new"></li>\n').append(tagInput))
            .click(function(e) {
                if (e.target.className == 'close') {
                    // Removes a tag when the little 'x' is clicked.
                    // Event is binded to the UL, otherwise a new tag (LI > A) wouldn't have this event attached to it.
                    removeTag($(e.target).parent());
                } else if (e.target.className == 'tagLabel' && settings.onTagClicked) {
                    settings.onTagClicked($(e.target).parent());
                } else {
                    // Sets the focus() to the input field, if the user clicks anywhere inside the UL.
                    // This is needed because the input field needs to be of a small size.
                    tagInput.focus();
                }
            })
            // add existing tags
            .children('li')
                .each(function() {
                    if (!$(this).hasClass('tagit-new')) {
                        createTag($(this).html(), $(this).attr('class'));
                        $(this).remove();
                    }
                });

        tagInput
            .keydown(function(event) {
                var keyCode = event.keyCode || event.which;
                // Backspace is not detected within a keypress, so using a keydown
                if (keyCode == BACKSPACE && tagInput.val() == '') {
                    var tag = tagList.children('.tagit-choice:last');
                    if (!settings.removeConfirmation || tag.hasClass('remove')) {
                        // When backspace is pressed, the last tag is deleted.
                        removeTag(tag);
                    } else if (settings.removeConfirmation) {
                        tag.addClass('remove');
                    }
                }
            })
            .keypress(function(event) {
                var keyCode = event.keyCode || event.which;
                // Comma/Space/Enter are all valid delimiters for new tags. except when there is an open quote or if setting allowSpaces = true
                if (
                    keyCode == COMMA ||
                    keyCode == ENTER ||
                    keyCode == TAB ||
                    (
             	        keyCode == SPACE && 
             	        settings.allowSpaces != true &&
				        (
					        ($.trim(tagInput.val()).replace( /^s*/, '' ).charAt(0) != '"') ||
					        (
					            $.trim(tagInput.val()).charAt(0) == '"' &&
					            $.trim(tagInput.val()).charAt(tagInput.val().trim().length - 1) == '"' &&
					            $.trim(tagInput.val()).length - 1 != 0
					        )
				        )
                    )
                ) {

                    event.preventDefault();
                    $.trim(createTag(tagInput.val().replace(/^'|"$|,+$/g, '')));
                }
                if (settings.removeConfirmation) {
                    tagList.children('.tagit-choice:last').removeClass('remove');
                }
            });

        if (options.availableTags || options.tagSource) {
            tagInput.autocomplete({
                source: settings.tagSource,
                select: function(event, ui) {
                    createTag(ui.item.value);
                    // Preventing the tag input to be updated with the chosen value.
                    return false;
                }
            });
        }

        function assignedTags() {
            // Returns an array of tag string values
            var tags = [];
            tagList.children('.tagit-choice').each(function() {
                tags.push($(this).children('input').val());
            });
            return tags;
        }

        function subtractArray(a1, a2) {
            var result = new Array();
            for (var i = 0; i < a1.length; i++) {
                if (a2.indexOf(a1[i]) == -1) {
                    result.push(a1[i]);
                }
            }
            return result;
        }

        function isNew(value) {
            var isNew = true;
            tagList.children('.tagit-choice').each(function(i) {
                if (formatStr(value) == formatStr($(this).children('input').val())) {
                    isNew = false;
                    return;
                }
            });
            return isNew;
        }
	    function formatStr(str) {
		    if(settings.caseSensitive)
			    return str;
		    return str.toLowerCase();
	    }
        function createTag(value, additionalClass) {
            // Cleaning the input.
            tagInput.val('');

            if (!isNew(value) || value == '') {
                return false;
            }
            var linkValue = value;
            if (settings.onTagClicked) {
      	        linkValue = '<a class="tagLabel">' + value + '</a>';
            }
            // create tag
            var tag = $('<li />')
                .addClass('tagit-choice')
                .addClass(additionalClass)
                .append(linkValue)
                .append('<a class="close">x</a>');
            if (settings.singleField) {
                //TODO
            } else {
                tag.append('<input type="hidden" style="display:none;" value="' + value + '" name="' + settings.itemName + '[' + settings.fieldName + '][]">');
            }

            if (settings.onTagAdded) {
                settings.onTagAdded(tag);
            }

            // insert tag
            tagInput.parent().before(tag);
        }
        function removeTag(tag) {
            if (settings.onTagRemoved) {
                settings.onTagRemoved(tag);
            }
            if (settings.singleField) {
                //TODO
            }
            tag.remove();
        }

        // maintaining chainability
        return this;
    };

})(jQuery);


