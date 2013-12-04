$(document).ready(function() {

	//The term 'user' is used as a generic example of possible uses of this plugin
	
	var returned_names = []; //Keep track of names of every user (String)
	var current_user_id = 0; //Keep track of ID of user being currently added as a tag (Integer)
	
	$("#tagit_ul").tagit({
		placeholderText: "Type a topic", //Placeholder text to show user before they type
		//For every tag created, two hidden input fields will also be created
    	fieldName: "usernames", //This field is for the actual String displayed on the tag- to access it in PHP, call $_POST['usernames']
    	itemName: "userids", //This is for the user ID that we don't want displayed- to access it in PHP, call $_POST['userids']
        singleField: false, //Don't store every value in a single hidden input field
        allowSpaces: true, //Allow tags to have spaces
        minLength: 2, //Minimum length of tag- anything less and an AJAX request will not be sent
        removeConfirmation: true, //Requires two Backspaces before deleting a tag
        allowDuplicates: false, //Prevent duplicate tags- the Array [] returned_names comes in handy here
		autocomplete: { 
			source: function( request, response ) { //Get autocomplete options
				$.ajax({
					type: "GET", //GET data
					url: "../secure/retrieve_taglist_names.php", //PHP file that will return all the data we need (names and IDs)
					dataType: "json", //In JSON format
					data: {
						query: request.term
					},
					success: function( usernames ) { //Returned data stored in Array [] usernames
						returned_names = []; //Clear the Array [] returned_names
						for (i=0; i<usernames.length; i++) { //Loop through all elements in Array [] usernames
							returned_names.push(usernames[i].user_name); //Push user name onto returned names array
						}
						//console.log("Names: "+returned_names);
						response( $.map( topicnames, function( name ) {
							//console.log("User id: "+name.user_id+" User name: "+name.user_name);
							return {
								label: name.user_name, //Label: String displayed on tag
								value: name.user_id //ID: Value not shown
							}
						}));
					},					
					error: function(xhr, status, error) {
						returned_names = []; //Clear the Array [] returned_names
						$("#error_div").html("ERROR connecting to database. Please refresh the page. If the problem persists, please contact support.").show(); //Display error to user that AJAX request failed
					}
				});
			}
		},		
		beforeTagAdded: function(event, ui) { //Prevent invalid names from being entered
			if ($.inArray(ui.tagLabel, returned_names)==-1) { //Check if tag is in the autocomplete options
				return false; //Tag isn't an option, so don't allow it to be added
			}
		},
		afterTagAdded: function(event, ui) { //Recolor "prevent-duplicate" CSS yellow background-color on tags
			$(".tagit-choice").css("background-color"); //Remove in-line CSS styling that makes background-color of tags yellow
		}
	});
