###
plugin for tag-it widget.
could handle cases when tag is not just a string but item which following fields:
Key, Name, Value
Value - string which represents a text of the tag and which is shown in widget when user enter or select some item from the list.
Label - string which is shown in drop-down list of widget's autocomplete
Key - the key of the tag (usually number)
###

($)->
    $.widget 'ui.tagitkv', 

        options :
           #tag it widget
           tagIt : null
           #html element where key values of the tags will be stored
           valuesNode : null

        origOtions :

            tagSource : null

            onTagAdded : null

            onTagRemoved : null

        _create: ->

            @origOptions.onTagAdded = @options.tagIt.options.onTagAdded
            @origOptions.onTagRemoved = @options.tagIt.options.onTagRemoved

            @options.tagIt.options.onTagAdded = @_onTagAdded
            @options.tagIt.options.onTagRemoved = @_onTagRemoved

        _tagSource: (search, showChoices) ->
            that = this.element.data "tagit"
            filter = search.term.toLowerCase()
            choices = @_getItems that.options.availableTags
            choices = $.grep choices, (element) ->
                 element.value.toLowerCase().indexOf filter == 0
            showChoices @_expellExistent choices, that.assignedTags()

        _onTagAdded: (event, tag) ->

            that = @options.tagit
            vn = @options.valuesNode

            if (vn)
                value = $(":first", tag).text();
                item = $.grep @_getItems(that.options.availableTags), (element)-> element.value == value
                key = if item.length > 0 then item[0].key else -1
                vn.val "#{if vn.val() then vn.val() + "," else ""}#{key}"

        _onTagRemoved: (event, tag) ->

             that = @options.tagit
             vn = @options.valuesNode

            if (vn)
                val = $(":first", tag).text()
                values = $(this).val().split ','
                i = values.indexOf val
                keys = vn.val().split ','
                keys.splice i, 1
                vn.val keys.join ','

        _getItems: (array) ->
            $.map array, element ->
                key =  element.key
                key ?= -1
                val = element.value
                val ?= element.label
                label = element.label
                label ?= val
                value : val, label : label, key : key

        _expellExistent: (items, existent) ->
            $.grep items, (element) -> $.inArray existent,  element.value
