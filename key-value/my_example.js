
$(document).ready(function(){
    create_it_list();
    create_it_ajax();
});

//Example:
/*
The original implementation of the tagit widget suppose that label is only string, this example shows how it could bw done
if tag has these 3 fileds : Key, Value, Label.
Value - string which corresponds tag and which is shown in widget when user enter or select some item from the list.
Label - string which is shown in drop-down list of widget's autocomplete
Key - the key of the tag (usually number)
 */


function tagItGetItems(array)
{
    return $.map(array, function(element) {
                var key =  typeof element.key != 'undefined' ? element.key : -1;
                var val = typeof element.value != 'undefined' ? element.value :
                        (typeof element.label != 'undefined'  ? element.label : element);
                var label = typeof element.label != 'undefined'  ? element.label : val;
                return {value : val, label : label, key : key};
    });
}

function tagItGetKey($tagit, tag)
{
    var vn = $tagit.options.valuesNode;
    if (vn){
        var value = $(":first", tag).text();
        var item = $.grep(getTagItTags($tagit.options.availableTags), function(element){
            return element.value == value;
        });

        return item.length > 0 ? item[0].key : -1;
    }
}

function tagItExpellExistent(items, existent)
{
    return $.grep(items, function(e) {return $.inArray(existent,  e.value);});
}

//Example for the static list, each list item could be represented either object which has 3 fields - key, name, label either
//just string in which case object will be created by default with {key : -1, name : [item], label : [item]}
//options :
//valuesNode - html element where key values of the tags will be stored
function create_it_list()
{
    var sampleTags = [{key : 0, value : 'c++'}, {key : 1, label : 'java'} , {key : 2, value : 'php', label : 'php [2]'} , 'coldfusion', 'javascript', 'asp', 'ruby', 'python', 'c', 'scala', 'groovy', 'haskell', 'perl', 'erlang', 'apl', 'cobol', 'go', 'lua'];

    $('#listTagField').tagit({
        availableTags: sampleTags,
        animate : false,
        valuesNode : $("#listTagFieldVlues"),
        tagSource : function(search, showChoices)
        {
            var that = (this.element).data("tagit");
            var filter = search.term.toLowerCase();
            var choices = tagItGetItems(that.options.availableTags);
            choices = $.grep(choices, function(element) {
                // Only match autocomplete options that begin with the search term.
                // (Case insensitive.)
                 return (element.value.toLowerCase().indexOf(filter) === 0);
            });

            showChoices(tagItExpellExistent(choices, that.assignedTags()));
        },
        onTagAdded: function(event, tag) {

            var that = tag.data("tagit");
            var vn = that.options.valuesNode;

            if (vn){
                var value = $(":first", tag).text();
                var item = $.grep(tagItGetItems(that.options.availableTags), function(element){
                    return element.value == value;
                });

                var key = item.length > 0 ? item[0].key : -1;

                vn.val((vn.val() ? vn.val() + "," : "") + key);
            }
        },

        onTagRemoved: function(event, tag) {

            var that = tag.data("tagit");
            var vn = that.options.valuesNode;

            if (vn){
                var val = $(":first", tag).text();
                var values = $(this).val().split(',');
                var i = values.indexOf(val);
                var keys = vn.val().split(',');
                keys.splice(i, 1);
                vn.val(keys.join(','));
            }

        }
    });
}

//Example for the ajax list, all the same as above, only tag source is ajax function which return list of the items from the server.
//These items should be parsed in [success] method and then displayed through [showChoices] callback
function create_it_ajax()
{
    $('#ajaxTagField').tagit({

        animate : false,
        valuesNode : $("#ajaxTagFieldVlues"),
        tagSource : function(search, showChoices)
        {
            var that = (this.element).data("tagit");

            $.ajax({
              url:        "http://localhost:53765/DataService.svc/Items?$select=Id,Name,Label&$format=json",
              dataType:   "json",
              data:       { $filter: "startswith(Name,'" + search.term + "')" },
              success:    function(data) {
                  var choices = $.map(data.d, function(element)
                  {return {
                      value : element.Name,
                      label : element.Label,
                      key : element.Id }});

                  that.options.availableTags = choices;

                  showChoices(tagItExpellExistent(choices, that.assignedTags()));
              }
            });
        },
        onTagAdded: function(event, tag) {

            var that = tag.data("tagit");
            var vn = that.options.valuesNode;

            if (vn){
                var value = $(":first", tag).text();
                var item = $.grep(tagItGetItems(that.options.availableTags), function(element){
                    return element.value == value;
                });

                var key = item.length > 0 ? item[0].key : -1;

                vn.val((vn.val() ? vn.val() + "," : "") + key);
            }
        },

        onTagRemoved: function(event, tag) {

            var that = tag.data("tagit");
            var vn = that.options.valuesNode;

            if (vn){
                var val = $(":first", tag).text();
                var values = $(this).val().split(',');
                var i = values.indexOf(val);
                var keys = vn.val().split(',');
                keys.splice(i, 1);
                vn.val(keys.join(','));
            }

        }
    });
}
