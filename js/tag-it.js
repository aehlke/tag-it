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

    var el      = this,
      BACKSPACE = 8,
      ENTER     = 13,
      SPACE     = 32,
      COMMA     = 44,
      TAB       = 9;

    // add the tagit CSS class.
    el.addClass("tagit");

    // create the input field.
    var html_input_field = "<li class=\"tagit-new\"><input class=\"tagit-input\" type=\"text\" /></li>\n";
    el.append(html_input_field);

    var tag_input = el.children(".tagit-new").children(".tagit-input");

    // add existing tags
    el.children("li").each(function() {
      if (!$(this).hasClass('tagit-new')) {
        create_tag($(this).html());
        $(this).remove();
      }
    });

    $(this).click(function(e) {
      if (e.target.tagName == 'A') {
        // Removes a tag when the little 'x' is clicked.
        // Event is binded to the UL, otherwise a new tag (LI > A) wouldn't have this event attached to it.
        remove_tag($(e.target).parent());
      }
      else {
        // Sets the focus() to the input field, if the user clicks anywhere inside the UL.
        // This is needed because the input field needs to be of a small size.
        tag_input.focus();
      }
    });

    tag_input.keydown(function(event) {
      var keyCode = event.keyCode || event.which;
      // Backspace is not detected within a keypress, so using a keyup
      if (keyCode == BACKSPACE) {
        if (tag_input.val() == "") {
          // When backspace is pressed, the last tag is deleted.
          remove_tag($(el).children(".tagit-choice:last"));
        }
      }
    });
    tag_input.keypress(function(event) {
      var keyCode = event.keyCode || event.which;
      // Comma/Space/Enter are all valid delimiters for new tags. except when there is an open quote
      if (
          keyCode == COMMA ||
          keyCode == ENTER ||
          keyCode == TAB ||
          (
            keyCode == SPACE &&
            (
              (tag_input.val().trim().replace( /^s*/, "" ).charAt(0) != '"') ||
              (
                tag_input.val().trim().charAt(0) == '"' &&
                tag_input.val().trim().charAt(tag_input.val().trim().length - 1) == '"' &&
                tag_input.val().trim().length - 1 != 0
              )
            )
          )
        ) {

        event.preventDefault();

        var typed = tag_input.val();
        typed = typed.replace(/,+$/,"").trim().replace(/^"/, "").replace(/"$/, "");
        typed = typed.trim();

        if (typed != "") {
          create_tag(typed);
        }
      }
    });

    tag_input.autocomplete({
      source: function(search, show_choices) {
        var filter = new RegExp(search.term, "i");
        var choices = options.availableTags.filter(function(element) {
          return (element.search(filter) != -1);
        });

        show_choices(subtract_array(choices,assigned_tags()));
      },
      select: function(event, ui) {
        create_tag(ui.item.value);
        // Preventing the tag input to be updated with the chosen value.
        return false;
      }
    });

    function assigned_tags() {
      var tags = [];
      tag_input.parents("ul").children(".tagit-choice").each(function() {
        tags.push($(this).children("input").val());
      });
      return tags;
    }

    function subtract_array(a1,a2) {
      var result = new Array();
      for(var i = 0; i < a1.length; i++) {
        if (a2.indexOf(a1[i]) == -1) {
          result.push(a1[i]);
        }
      }
      return result;
    }

    function is_new(value) {
      var is_new = true;
      tag_input.parents("ul").children(".tagit-choice").each(function(i) {
        n = $(this).children("input").val();
        if (value == n) {
          is_new = false;
        }
      });
      return is_new;
    }

    function create_tag(value) {
      if (!is_new(value)) {
        return false;
      }

      var el = "<li class=\"tagit-choice\">\n";
      el += value + "\n";
      el += "<a class=\"close\">x</a>\n";
      el += "<input type=\"hidden\" style=\"display:none;\" value=\""+value+"\" name=\"" + options.itemName + "[" + options.fieldName + "][]\">\n";
      el += "</li>\n";

      var tag = $(el);

      if (options.onTagAdded) {
        options.onTagAdded(tag);
      }

      tag_input
        // Cleaning the input.
        .val("")
        // insert tag
        .parent()
          .before(tag);
    }

    function remove_tag(element) {
      if (options.onTagRemoved) {
        options.onTagRemoved(element);
      }
      element.remove();
    }

    // maintaining chainability
    return this;
  };

  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
  };

})(jQuery);
