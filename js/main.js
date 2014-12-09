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
var eventsPerPage = 20; // Total number of results to display per page

var username = "default";

// list of users
var user1 = {name:"Baymax", message:0, age:5, hometown:'San Francisco, California', aboutme: 'I am an oversized inflatable robot created by Tadashi to help treat and diagnose people.', img: 'img/baymax.png'};
var user2 = {name:"Honey Lemon", message:0, age:22, hometown: 'Orlando, Florida', aboutme: 'College Freshman at Columbia. I love to explore the local art scenes!', img: 'img/honeylemon.png'};
var user3 = {name:"Hiro Hamada", message:1, age:14, hometown: 'San Francisco, California', aboutme: 'Founder and leader of Big Hero 6. I love to code and battle bots', img: 'img/hiro.png'};
var user4 = {name:"Fred", message:1, age:24, hometown: 'Seattle, Washington', aboutme: 'Sign-Twirling, Monster Loving, comic-book aficionado', img: 'img/fred.png'};
var user5 = {name:"Go Go Tomago", message:1, age:23, hometown: 'New York, New York', aboutme: 'I have a need for speed. Tough. Ahtletic. Loyal', img: 'img/gogo.png'};
var user6 = {name:"Wasabi", message:0, age:24, hometown: 'Dallas, Texas', aboutme: 'Might be a bit neurotic, but hey, I care.', img: 'img/wasabi.png'};

var allUsers = {1:user1, 2:user2, 3:user3, 4:user4, 5:user5, 6:user6};
var usersAttending = [user2, user3, user4, user5, user6];
var defaultusersAttending = [user2, user3, user4, user6]; // usersAttending gets set back to default for each new event modal

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
        selectedUserId = 1;
        showModal("profile");  
    });
    $("#messageLink").click(function(){
        showModal("message");  
    });
    toastr.options = {
        "showDuration": "2000",
        "hideDuration": "2000",
        "timeOut": "2000",
        "extendedTimeOut": "2000"
    }
    
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
    // close all other modal windows
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#messageModal").fadeOut("fast");
    
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
    else if (type == "message"){
        initMessageModal();
        $("#messageModal").fadeIn("slow");
    }
}

// hide modal
function closeModal(){
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#messageModal").fadeOut("fast");
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
    if (query == null)  return;
        
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
                
                // add previous and next links
                $("#infoWindow").append("<br>");
                var previousLink = "";
                var nextLink = "";
                if (offset != 0) {
                    if (events.length < eventsPerPage) // If we're on last page of search results, don't display Next
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
    var year = today.getFullYear();
    var nextYear = today.getFullYear();
    var day = today.getDate();
    var month = today.getMonth() + 1;
    var nextMonth = today.getMonth() + 2;
    if (nextMonth == 13) {
        nextMonth = 1;
        nextYear++;
    }
    
    if (day < 10)       day = "0" + day;
    if (month < 10)     month = "0" + month;
    if (nextMonth < 10) nextMonth = "0" + nextMonth;
    
    // formulate query
    query += "date_range=";
    if (minDate.length > 0)                         query += minDate + "%3A";
    else                                            query += year + "-" + month + "-" + day + "%3A";
    if (maxDate.length > 0)                         query += maxDate + "&";
    else                                            query += nextYear + "-" + nextMonth + "-" + day + "&";
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
    
    //cannot have empty search
    if (minDate.length == 0 && maxDate.length == 0 && search.length == 0 && !(neighborhood && neighborhood.length > 0)
       && !(eventType && eventType.length > 0) && !free && !kid){
        alert("Please enter one or more search terms");
        return;
    }
    
    if (query.substring(query.length-1) == "?")
        alert("Please enter one or more search terms");
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
        icon: 'img/marker.png'
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
    offset += eventsPerPage;
    search();
}

function showPrevious(){
    if (offset == 0)    return;
    offset -= eventsPerPage;
    var firstNumber = $("#0").text().split(".")[0]; // Parses number of first displayed event
    listCounter = firstNumber - eventsPerPage;
    search();
}

/*---------- End of search methods ----------*/

// @elisha
// ********************************************** event modal methods **********************************************

function initEventModal(){
    $("#eventTitle").html(events[selectedEventId].event_name);
    $("#eventTitle").attr("href", events[selectedEventId].event_detail_url);

    var eventHtml = ''
    if (events[selectedEventId].category !== undefined) {
        eventHtml += '</br><b>Category: </b>' + events[selectedEventId].category
    }
    if (events[selectedEventId].date_time_description !== undefined) {
        eventHtml += '</br><b>Date/Time: </b>' + events[selectedEventId].date_time_description
    }
    if (events[selectedEventId].web_description !== undefined){
        eventHtml += '</br><b>Description:</b><br>' + events[selectedEventId].web_description
    }
    eventHtml += '</br><b><u>Venue Information: </b></u>'

    if ((events[selectedEventId].venue_website !== undefined) && (events[selectedEventId].venue_name !== undefined)){
        eventHtml += '</br><a target="_blank" href="http://' + events[selectedEventId].venue_website + '">' + events[selectedEventId].venue_name + '</a>'
    } else if (events[selectedEventId].venue_name !== undefined) {
        eventHtml += '</br>' + events[selectedEventId].venue_name
    }
    if (events[selectedEventId].street_address !== undefined) {
        eventHtml += '</br><b>Address: </b></br>' + events[selectedEventId].street_address
    }
    if ((events[selectedEventId].city !== undefined) && (events[selectedEventId].state !== undefined) && (events[selectedEventId].postal_code !== undefined)) {
        eventHtml += '</br>' + events[selectedEventId].city + ', ' + events[selectedEventId].state + ' ' + events[selectedEventId].postal_code
    }
    if ((events[selectedEventId].borough !== undefined) && (events[selectedEventId].neighborhood !== undefined)) {
        eventHtml += '</br><b>Borough: </b>' + events[selectedEventId].borough + ' | ' + '<b>Neigborhood: </b>' + events[selectedEventId].neighborhood
    }
    if (events[selectedEventId].telephone !== undefined) {
        eventHtml += '</br><b> Telephone: </b>' +  events[selectedEventId].telephone
    }

    if ((events[selectedEventId].venue_website === undefined) && (events[selectedEventId].venue_name === undefined) && (events[selectedEventId].street_address === undefined) && (events[selectedEventId].borough === undefined) && (events[selectedEventId].telephone === undefined)) {
        eventHtml += '</br> No Venue Information Available</br>'
    }

    console.log(eventHtml)
    $("#eventInfo").html(eventHtml);
    htmlcode = '<h4><center><u>Attendees</u></center></h4><div class="panel-body"><ul id="attendeesList" class="list-group" style="list-style-type:none">';
    htmlcode += generateAttendeeList(true);
    htmlcode += '</ul></div>'
    $("#attendees").html(htmlcode);

    // close modal by calling closeModal();
}

function updateSelectedUser(name) {
    for (var key in allUsers) {
        user = allUsers[key]
        if (user.name == name) {
            selectedUserId = key
            break;
        }
    }
    showModal("profile");
    console.log(selectedUserId)
}


function generateAttendeeList(init){
    if (init){
        usersAttending = defaultusersAttending.slice(0);
        // make sure button is green
        $("#eventMessageStatus").hide();
        $("#attendingButton").text("Mark as attending");
        $("#attendingButton").removeClass( "btn-danger" ).addClass( "btn-success" );
    }
    var clickedEventName = events[selectedEventId].event_name;
    var storedEvents = store.get("userEvents").eventNames;
    if(init && storedEvents.indexOf(clickedEventName) >= 0 && usersAttending.indexOf(user1) == -1)
        toggleAttendingButton();
    var htmlcode = "";
    for (var list in usersAttending){
            var item = usersAttending[list]
            var list = '<li class="list-group-item">';
            var name = item.name;
            var inputName = "'" + name + "'"
            var mess = item.message;
            list += '<a id="eventUser" href="#" onclick="updateSelectedUser(' + inputName + ')">' + name + '</a>'
            console.log(list)
            if (mess == 0) {
                list += '\t' + '<button type="button" class="btn btn-xs btn-primary pull-right" onclick="initMessageModal(\'' + item.name + '\'); showModal(\'message\')"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span></button>'
            } else {
                list += '\t' + '<button type="button" class="btn btn-xs btn-primary pull-right" disabled="disabled"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span></button>'
            }
        htmlcode += list + '</li>'
    }
    return htmlcode;
}
// @elisha - this just stores event names and URLS for now, feel free to add anything you think we want to display on front-end!
$(document).on("click", "#attendingButton", function attendEvent() {
    toggleAttendingButton(true);
});

function toggleAttendingButton(clicked){
    if ($("#attendingButton").text() == "Mark as attending"){
            
        if (clicked && localEventNames.indexOf(events[selectedEventId].event_name) == -1){
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
        }
        usersAttending.push(user1);
        $("#attendeesList").html(generateAttendeeList());
        $("#eventMessageStatus").show();
        $("#attendingButton").text("Mark as not attending");
        $("#attendingButton").removeClass( "btn-success" ).addClass( "btn-danger" );

    }
    else if ($("#attendingButton").text() == "Mark as not attending"){

        // remove event fromt local copies
        var index = localEventNames.indexOf(events[selectedEventId].event_name);
        localEventNames.splice(index, 1);
        index = localEventURLs.indexOf(events[selectedEventId].event_detail_url);
        localEventURLs.splice(index, 1);
        
        // Replaces stored object with local values
        store.set("userEvents", {
            eventNames: localEventNames,
            eventURLs: localEventURLs
        });
        
        var index = usersAttending.indexOf(user1.name);
        usersAttending.splice(index, 1);
        $("#attendeesList").html(generateAttendeeList());
        $("#eventMessageStatus").hide();
        $("#attendingButton").text("Mark as attending");
        $("#attendingButton").removeClass( "btn-danger" ).addClass( "btn-success" );
    }
}
// ********************************************** profile modal methods **********************************************

function initProfileModal(){
    // open by calling showModal("profile") and setting selectedUserId to appropriate id; should be opened from eventModal
    var id = selectedUserId;
    for (var key in allUsers) {
        if (id == key) {
            var user = allUsers[key]
            break;
        }
    }

    var userHtml = '<img src="' + user.img + '" style = "max-height: 200px; max-width: 90%" alt=""/>';
    $("#userPic").html(userHtml);
    var infoHtml = '<h1>' + user.name + '</h1><b>Age: </b>' + user.age + '</br><b>Hometown: </b>' + user.hometown + '</br><b>About Me: </b>' + user.aboutme;
    $("#userInfo").html(infoHtml);
    var attendingHtml = ''
    names = storedEvents.eventNames
    console.log(names)
    url = storedEvents.eventURLs
    console.log(url)

    if (selectedUserId == 1) {

        if (user.message == 0) {
            messageButton = '<form class="form-inline" role="form"><div class="form-group"><select class="form-control input-sm"><option>Message</option>'
            messageButton += '<option>Do not Message</option></select></div><button type="message" class="btn btn-xs btn-primary pull-right">Update</button></form>'
        } else {
            messageButton = '<form class="form-inline" role="form"><div class="form-group"><select class="form-control input-sm"><option>Do Not Message</option>'
            messageButton += '<option>Message</option></select></div><button type="message" class="btn btn-xs btn-primary pull-right">Update</button></form>'
        }
        for (var i in names) {
            attendingHtml += '<tr><td>' + '<a href="' + url[i] + '">' + names[i]+ '</a></td><td>'
            attendingHtml += messageButton
            inputEvent = "'" + names[i] + "'"
            attendingHtml += '<td align = "pull-right">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a id="eventUser" href="#" onclick="removeEvent(' + inputEvent + ')">' + 'Remove Event' + '</a></td></tr>'
        }
    } else {
        for (var i in names) {
            attendingHtml += '<tr>' + '<a href="' + url[i] + '">' + names[i]+ '</a></tr>'
        }
    }
    $("#eventTable").html(attendingHtml);
}

function removeEvent(eventName) {
    storedEvents = store.get("userEvents");
    localEventNames = storedEvents.eventNames;
    localEventURLs = storedEvents.eventURLs;

    var index = localEventNames.indexOf(eventName)
    localEventNames.splice(index, 1)
    localEventURLs.splice(index, 1)

    storedEvents.eventNames = localEventNames
    storedEvents.eventURLs = localEventNames

    initProfileModal()
}


function initMessageModal(name){
    if (name != null)
        $("#messageTitle").text("Send a message to " + name);
    $("#messageSubject").val("");
    $("#messageBody").val("");
}

function sendMessage(){
    var title = $("#messageTitle").text().split("Send a message to ");
    var name = title[title.length-1];
    toastr.success("Message sent to " + name + "!");
    showModal("event");
}