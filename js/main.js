// main.js
var map;
var infoWindow = new google.maps.InfoWindow;
var markers = new Array();
var events; // Results returned by NYT API
var selectedEventId;
var storedEvents; // Used in store.js object for persistent event data storage across user sessions
var localEventNames; // Local copy of stored event names
var localEventURLs; // Local copy of stored event URLs
var offset = 0;
var listCounter = 1; // Used to number search results in infoWindow
var selectedUserId;

var username = "default";

// list of users
var user1 = {name:"Baymax", message:0, age:20, hometown:'San Francisco, California', aboutme: 'I am an oversized inflatable robot created by Tadashi to help treat and diagnose people.', img: 'img/baymax.png'};
var user2 = {name:"Juliet James", message:0, age:18, hometown: 'New York, NY', aboutme: 'College Freshman at Columbia. I love to explore the local art scenes!', img: 'img/honeylemon.png'};
var user3 = {name:"Romeo Ryan", message:1, age:24, hometown: 'Dallas, TX', aboutme: ''};
var allUsers = [user1, user2, user3];
var usersAttending = [user1, user2, user3];

$(document).ready(function(){
    /* **********Begin local storage implementation********** */
    
    //IF YOU WANT TO CLEAR ALL LOCAL STORAGE VALUES FOR DEBUGGING: store.clear();
    
    // If there is no stored data, create storedEvents object
    if (store.get("userEvents") == null) {
        store.set("userEvents", {
            eventNames: [],
            eventURLs: []
        });
    }
    storedEvents = store.get("userEvents");
    
    // Initialize local variables with existing stored values at beginning of each session
    localEventNames = storedEvents.eventNames;
    localEventURLs = storedEvents.eventURLs;
    
    /* **********End of local storage implementation********** */
    
    // modal handlers                                       
    $("#searchLink").click(function(){
        showModal("search");  
    });
    $("#modalWindow").click(function(){
        closeModal();  
    });
    // FOR DEBUGGING; take out later
    $("#profileLink").click(function(){
        showModal("profile");  
    });
    
    // initialize map
    var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(40.7993,-73.9667)
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    // attach event handlers to search modal elements
    $("#searchButton").click(function(){ newSearch() });
    $("#toggleAdvancedSearch").click(function(){ showAdvancedSearchFields() });
    $("#toggleAdvancedSearch").mouseover(function(){ 
        $("#arrow").css("stroke","gray");
        $("#arrow").css("fill","gray");
    });
    $("#toggleAdvancedSearch").mouseout(function(){ 
        $("#arrow").css("stroke","#000000");
        $("#arrow").css("fill","#000000");
    });
});

// show modal
function showModal(type) {
    $("#modalWindow").fadeIn("slow");
    if (type == "search")
        $("#searchModal").fadeIn("slow");
    else if (type == "event"){
        initEventModal();
        $("#eventModal").fadeIn("slow");
    }
    else if (type == "profile"){
        initProfileModal();
        $("#profileModal").fadeIn("slow");
    }
}

// hide modal
function closeModal(){
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#modalWindow").fadeOut("fast");
}
   
// ********************************************** Search methods **********************************************

// on input blur, reset the placeholders; change input type for the date fields
// because date fields cannot have text placeholders
function blurFunc(input){
    if (input.id == "stringSearch")
        input.placeholder = "search";
    else if (input.id == "minDateSearch" && input.value == ""){
        input.type = "text";
        input.placeholder = "by earliest event date";
    }
    else if (input.id == "maxDateSearch" && input.value == ""){
        input.type = "text";
        input.placeholder = "by latest event date";
    }
}

// for date input fields, on focus, change input type from text to date
function focusFunc(input){
    if (input.id == "minDateSearch" || input.id == "maxDateSearch"){
        input.type = "date";
        input.placeholder="";
    }
}

// for select fields, change color if a valid option is selected
function selectChange(input){
    if ($(input).val() && $(input).val().length > 0)
        $(input).css("color", "black");
    else
        $(input).css("color", "#B0B0B0");
}

// display advanced search fields by sliding down; change svg arrow to an up arrow
function showAdvancedSearchFields(){
    $("#advancedSearchFields").slideDown( "slow", function() {
        $("#arrow").attr("d", "M 0 12 L 12 0 L 24 12");
        $("#toggleAdvancedSearch").off("click").click(function(){ hideAdvancedSearchFields() });
    });   
    $('#searchModal').animate({'height': '70%'}, { duration: 600, queue: false });
    $('#searchModal').animate({'top': '15%'}, { duration: 600, queue: false });
}

// hide advanced search fields by sliding up; change svg arrow to a down arrow
function hideAdvancedSearchFields(){
    $("#advancedSearchFields").slideUp( "slow", function() { 
        $("#arrow").attr("d", "M 0 0 L 12 12 L 24 0");
        $("#toggleAdvancedSearch").off("click").click(function(){ showAdvancedSearchFields() });
    }); 
    $('#searchModal').animate({'height': '47%'}, { duration: 600, queue: false });
    $('#searchModal').animate({'top': '24%'}, { duration: 600, queue: false });
}

// New search
function newSearch(){
    // Reset offset
    offset = 0;
    
    // Reset numbering in list of search results
    listCounter = 1;
    
    search();
}

// search functionality
function search(){
    $("#infoWindow").html("");

    // remove and clear old markers
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = new Array();
    var query = getSearchQuery();
    
    // get data
    $.ajax({
        type: "GET",
        url: query,
        cache: true,
        dataType: "jsonp",
        success: function(data)
        {  
            events = data.results;
            console.log(events)

            // check to see if there are results
            if (events.length > 0){
                
                // keep track of where map center should be
                var count = 0;
                var centerLat = 0;
                var centerLong = 0;
                
                // iterate through results
                for (var i = 0; i < events.length; i++) {
                    
                    // only display results in new york city
                    if (events[i].city == "New York" ||
                        events[i].city == "New York " ||
                        events[i].city == "Bronx" ||
                        events[i].city == "Brooklyn" ||
                        events[i].city == "Queens" ||
                        events[i].city == "Staten Island")
                    {
                        var lat = events[i].geocode_latitude;
                        var long = events[i].geocode_longitude;

                        // continuously calculate map center
                        if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(long))){
                            centerLat += parseFloat(lat);
                            centerLong += parseFloat(long);
                            count++;
                        }

                        addEvent(events[i], i);
                    }
                }
                
                // add previous and more links
                $("#infoWindow").append("<br>");
                var previousLink = "";
                var nextLink = "";
                if (offset != 0) {
                    if (events.length < 20) // If we're on last page of search results, don't display Next
                        previousLink = "<p class='previousNextLink' onclick='showPrevious();'>Previous</p>";
                    else{
                        previousLink = "<p class='previousNextLink' onclick='showPrevious();' style='float:left; padding-left:40px;'>Previous</p>";
                        nextLink = "<p class='previousNextLink' onclick='showNext();' style='float:right; padding-right:40px;'>Next</p>";
                    }
                }
                else
                    nextLink = "<p class='previousNextLink' onclick='showNext();'>Next</p>";
                $("#infoWindow").append(previousLink);
                $("#infoWindow").append(nextLink);


                // calculate final map center and move
                centerLat /= count;
                centerLong /= count;
                if (centerLat != 0 && centerLong != 0)
                    map.setCenter(new google.maps.LatLng(centerLat, centerLong));
            }
            else // results array size 0
                $("#infoWindow").html("<br>Sorry, no events found matching the search criteria.");
        }
    }); 
    
    closeModal();
    $("#infoWindow").show();
}

// read search input vals
function getSearchQuery(){
    // get input vals
    var query = "http://api.nytimes.com/svc/events/v2/listings.jsonp?";
    var search = $("#stringSearch").val();
    var minDate = $("#minDateSearch").val();
    var maxDate = $("#maxDateSearch").val();
    var neighborhood = $("#neighborhoodSearch").val();
    var eventType = $("#eventTypeSearch").val();
    var free = $("#freeSearch").prop('checked');
    var kid = $("#kidSearch").prop('checked');
    
    // get current date format - only search events with min date of today
    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    if (day < 10)       day = "0" + day;
    if (month < 10)     month = "0" + month;
    
    // formulate query
    query += "date_range=";
    if (minDate.length > 0)                         query += minDate + "%3A";
    else                                            query += year + "-" + month + "-" + day + "01%3A";
    if (maxDate.length > 0)                         query += maxDate + "&";
    else                                            query += "2015-01-01&";
    if (search.length > 0)                          query += "query=" + search + "&filters=";
    if (query.substring(query.length-1) == "&")     query += "filters=";
    if (neighborhood && neighborhood.length > 0)    query += "neighborhood:%22" + neighborhood + "%22,";
    if (eventType && eventType.length > 0)          query += "category:" + eventType + ",";
    if (free)                                       query += "free:true,";
    if (kid)                                        query += "kid_friendly:true,";
    
    if ((minDate.length > 0 || maxDate.length > 0) && search.length == 0 && !(neighborhood && neighborhood.length > 0)
       && !(eventType && eventType.length > 0) && !free && !kid){
        alert("If searching by date, please also fill another search field");
        return;
    }
    // get rid of last comma
    if (query.substring(query.length-1) == ",")
        query = query.substring(0, query.length - 1);
    // get rid of &filters=
    if (query.substring(query.length-1) == "=")
        query = query.substring(0, query.length - 9);
    // add offset and api key
    query += "&offset=" + offset + "&api-key=b48655f732e1eca5a752c618c1d7543b:9:70165895";

    return query; // return query string
}

function addEvent(event, index){
    // create new map marker
    markers.push(new google.maps.Marker({
        position: new google.maps.LatLng(event.geocode_latitude, event.geocode_longitude),
        map: map,
        id: index,
        icon: 'img/puppy.png'
    }));

    // open event modal on marker click
    google.maps.event.addListener(markers[markers.length-1], 'click', function() {
        selectedEventId = this.id;
        showModal("event");
    });

    // on marker hover, display event category and title
    google.maps.event.addListener(markers[markers.length-1], 'mouseover', function() {
        infoWindow.setContent("<b>" + events[this.id].category + "</b>: " + events[this.id].event_name);
        infoWindow.open(map, this);
        $(".gm-style-iw").next("div").hide();
        $(".gm-style-iw").css("padding-left", "8px");
    });
    google.maps.event.addListener(markers[markers.length-1], 'mouseout', function() {
        infoWindow.close();
    });

    // add event data to the info window on the right
    var markerInfo = document.createElement("div");
    markerInfo.setAttribute("class", "eventListItem");
    markerInfo.id = index;
    markerInfo.innerHTML = "<b>" + (listCounter) + ". </b>" + event.event_name;
    $("#infoWindow").append(markerInfo);
    ++listCounter; // Increment numbering on list

    // attach handlers to the text in the infoWindow; actions are same as with markers
    $(markerInfo).click(function(){
        selectedEventId = this.id;
        showModal("event");
    });
    $(markerInfo).mouseover(function(){
        infoWindow.setContent("<b>" + events[this.id].category + "</b>: " + events[this.id].event_name);
        infoWindow.open(map, markers[this.id]);
    });
    $(markerInfo).mouseout(function(){
        infoWindow.close();
    });
}

function showNext(){
    offset += 20;
    search();
}

function showPrevious(){
    if (offset == 0)    return;
    offset -= 20;
    search();
}

/*---------- End of search methods ----------*/

// @elisha
// ********************************************** event modal methods **********************************************

function initEventModal(){
    $("#eventTitle").html(events[selectedEventId].event_name);
    $("#eventTitle").click(function(){
        window.open(events[selectedEventId].event_detail_url)
    });
    $("#eventInfo").html(
        '</br><b>Category: </b>' + events[selectedEventId].category +
        '</br><b>Date/Time: </b>' + events[selectedEventId].date_time_description + 
        '</br><b>Description:</b><br>' + 
        events[selectedEventId].web_description + '</br>' +
        '<b><u>Venue Information: </b></u>' + 
        '</br><a href="' + events[selectedEventId].venue_website + '">' + events[selectedEventId].venue_name + '</a>' +
        '</br><b>Address: </b></br>' + events[selectedEventId].street_address + 
        '</br>' + events[selectedEventId].city + ', ' + events[selectedEventId].state + ' ' + events[selectedEventId].postal_code +
        '</br><b>Borough: </b>' + events[selectedEventId].borough + ' | ' + '<b>Neigborhood: </b>' + events[selectedEventId].neighborhood +
        '</br><b> Telephone: </b>' +  events[selectedEventId].telephone

    );

    var user1 = {name:"John Doe", message:0};
    var user2 = {name:"Sally Sue", message:0};
    var user3 = {name:"Mary Lee", message:1};
    var usersAttending = [user1, user2, user3];
    htmlcode = '<h4><center><u>Attendees</u></center></h4><div class="panel-body"><ul class="list-group" style="list-style-type:none">';
    for (var list in usersAttending){
        var item = usersAttending[list]
        var list = '<li class="list-group-item">';
        var name = item.name;
        var mess = item.message;
        list += name;
        if (mess == 0) {
            list += '\t' + '<button type="button" class="btn btn-xs btn-primary pull-right"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span></button>'
        } else {
            list += '\t' + '<button type="button" class="btn btn-xs btn-primary pull-right" disabled="disabled"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span></button>'
        }

        htmlcode += list + '</li>'
    }
    htmlcode += '</ul></div>'
    $("#attendees").html(htmlcode);

    // close modal by calling closeModal();
}

// @elisha - this just stores event names and URLS for now, feel free to add anything you think we want to display on front-end!
$(document).on("click", "#attendingButton", function attendEvent() {
    // Add event to local copies
    localEventNames.push(events[selectedEventId].event_name);
    localEventURLs.push(events[selectedEventId].event_detail_url);
    
    console.log("added new values: " + localEventNames); // debugging
    console.log("added new values: " + localEventURLs); // debugging
    
    // Replaces stored object with local values
    store.set("userEvents", {
        eventNames: localEventNames,
        eventURLs: localEventURLs
    });
});

// ********************************************** profile modal methods **********************************************

function initProfileModal(){
    // open by calling showModal("profile") and setting selectedUserId to appropriate id; should be opened from eventModal
    var id = selectedUserId;
    var userHtml = '<img src="' + user1.img + '" style = "max-height: 640px; max-width: 90%" alt=""/>';
    $("#userPic").html(userHtml);
    var infoHtml = '<h1>' + user1.name + '</h1><b>Age: </b>' + user1.age + '</br><b>Hometown: </b>' + user1.hometown + '</br><b>About Me: </b>' + user1.aboutme;
    $("#userInfo").html(infoHtml);
    
}