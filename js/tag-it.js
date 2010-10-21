(function($) {

  $.fn.tagit = function(options) {

    var defaults = {
      'itemName'      : 'item',
      'fieldName'     : 'tags',
      'availableTags' : [],
      // event handler: called when a tag is added
      'onTagAdded'    : null,
      // event handler: called when a tag is removed
      'onTagRemoved'  : null,
    };

    if (options) {
      $.extend(defaults, options);
    }

    var tagList = $(this),
      tagInput  = $("<input class=\"tagit-input\" type=\"text\" />");
      BACKSPACE = 8,
      ENTER     = 13,
      SPACE     = 32,
      COMMA     = 44,
      TAB       = 9;

    tagList
      // add the tagit CSS class.
      .addClass("tagit")
      // create the input field.
      .append($("<li class=\"tagit-new\"></li>\n").append(tagInput))
      // add existing tags
      .click(function(e) {
        if (e.target.tagName == 'A') {
          // Removes a tag when the little 'x' is clicked.
          // Event is binded to the UL, otherwise a new tag (LI > A) wouldn't have this event attached to it.
          remove_tag($(e.target).parent());
        } else {
          // Sets the focus() to the input field, if the user clicks anywhere inside the UL.
          // This is needed because the input field needs to be of a small size.
          tagInput.focus();
        }
      })
      .children("li")
        .each(function() {
          if (!$(this).hasClass('tagit-new')) {
            create_tag($(this).html());
            $(this).remove();
          }
        });

    tagInput
      .keydown(function(event) {
        var keyCode = event.keyCode || event.which;
        // Backspace is not detected within a keypress, so using a keyup
        if (keyCode == BACKSPACE) {
          if (tagInput.val() == "") {
            // When backspace is pressed, the last tag is deleted.
            remove_tag(tagList.children(".tagit-choice:last"));
          }
        }
      })
      .keypress(function(event) {
        var keyCode = event.keyCode || event.which;
        // Comma/Space/Enter are all valid delimiters for new tags. except when there is an open quote
        if (
            keyCode == COMMA ||
            keyCode == ENTER ||
            keyCode == TAB ||
            (
              keyCode == SPACE &&
              (
                (tagInput.val().trim().replace( /^s*/, "" ).charAt(0) != '"') ||
                (
                  tagInput.val().trim().charAt(0) == '"' &&
                  tagInput.val().trim().charAt(tagInput.val().trim().length - 1) == '"' &&
                  tagInput.val().trim().length - 1 != 0
                )
              )
            )
          ) {

          event.preventDefault();
          create_tag(tagInput.val().replace(/^"|"$|,+$/g, "").trim());
        }
      })
      .autocomplete({
        source: function(search, show_choices) {
          var filter = new RegExp(search.term, "i");
          var choices = options.availableTags.filter(function(element) {
            return (element.search(filter) != -1);
          });

          show_choices(subtract_array(choices, assigned_tags()));
        },
        select: function(event, ui) {
          create_tag(ui.item.value);
          // Preventing the tag input to be updated with the chosen value.
          return false;
        }
      });

    function assigned_tags() {
      var tags = [];
      tagList.children(".tagit-choice").each(function() {
        tags.push($(this).children("input").val());
      });
      return tags;
    }

    function subtract_array(a1, a2) {
      var result = new Array();
      for(var i = 0; i < a1.length; i++) {
        if (a2.indexOf(a1[i]) == -1) {
          result.push(a1[i]);
        }
      }
      return result;
    }

    function is_new(value) {
      var isNew = true;
      tagList.children(".tagit-choice").each(function(i) {
        if (value == $(this).children("input").val()) {
          isNew = false;
          return;
        }
      });
      return isNew;
    }

    function create_tag(value) {
      // Cleaning the input.
      tagInput.val("");

      if (!is_new(value) || value == "") {
        return false;
      }

      var tag = "<li class=\"tagit-choice\">\n";
      tag += value + "\n";
      tag += "<a class=\"close\">x</a>\n";
      tag += "<input type=\"hidden\" style=\"display:none;\" value=\""+value+"\" name=\"" + options.itemName + "[" + options.fieldName + "][]\">\n";
      tag += "</li>\n";

      if (options.onTagAdded) {
        options.onTagAdded($(tag));
      }

      // insert tag
      tagInput.parent().before(tag);
    }

    function remove_tag(tag) {
      if (options.onTagRemoved) {
        options.onTagRemoved(tag);
      }
      tag.remove();
    }

    // maintaining chainability
    return this;
  };

  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
  };

})(jQuery);
