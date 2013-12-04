$(document).ready(function() {

	var returned_topics = [];	
	var current_topic_id = 0; //Keep track of ID of topic being currently added as a tag
	
	$("#debateleagues_taglist").tagit({
		placeholderText: "Type a topic",
    	fieldName: "debateleaguetopics",
    	itemName: "debateleaguetopics_tags", //For tags
        singleField: false,
        allowSpaces: true,
        minLength: 2,
        removeConfirmation: true,
        allowDuplicates: false,
		autocomplete: { 
			source: function( request, response ) { //Get autocomplete options
				print_loadingicon("debateleagues_taglist_loadingicon");
				$.ajax({
					type: "GET", //GET data
					url: "../secure/process_taglist_topics.php",
					dataType: "json",
					data: {
						query: request.term
					},
					success: function( topicnames ) {
						returned_topics = [];
						for (i=0; i<topicnames.length; i++) {
							returned_topics.push(topicnames[i].topic_name); //Push topic name onto returned names array
						}
						//console.log("Names: "+returned_topics);
						response( $.map( topicnames, function( name ) {
							//console.log("topic id: "+name.topic_id+" topic name: "+name.topic_name);
							return {
								label: name.topic_name,
								value: name.topic_id
							}
						}));
						end_loadingicon("debateleagues_taglist_loadingicon");
					},					
					error: function(xhr, status, error) {
						returned_topics = [];
						end_loadingicon("debateleagues_taglist_loadingicon");
						$("#debateleagues_taglist_loadingicon").html("ERROR connecting to database. Please refresh the page. If the problem persists, please contact support.");
						$("#debateleagues_taglist_loadingicon").css("display","block"); //Show ERROR div
					}
				});
			}
		},		
		beforeTagAdded: function(event, ui) { //Prevent invalid names from being entered
			if ($.inArray(ui.tagLabel, returned_topics)==-1) { //Check if tag is in the autocomplete options
				return false;
			}
		},
		afterTagAdded: function(event, ui) { //Recolor "prevent-duplicate" CSS yellow background-color on tags
			$(".tagit-choice").css("background-color"); //Remove in-line CSS styling that makes background-color of tags yellow
		}
	});
