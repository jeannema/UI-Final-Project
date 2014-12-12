// main.js
var map;
var infoWindow = new google.maps.InfoWindow;
var markers = new Array();
var events; // Results returned by NYT API
var selectedEventId;
var storedEvents; // Used in store.js object for persistent event data storage across user sessions
var localEventNames; // Local copy of stored event names
var localEventURLs; // Local copy of stored event URLs
var localEventCategory;
var localEventDateTime;
var localEventWebDescr;
var localVenueSite;
var localVenueName;
var localAddress;
var localCity;
var localState;
var localZipcode;
var localBorough;
var localNeighborhood;
var localTel;
var localMess = [];
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

// hard coded messages
var messageBlurb = ["Hiro Hamada: Hey!...", "Fred: That superhe..."];
var messages = ["Hiro Hamanda: Hey! Did you want to meet up to go to the robotics show on Friday?", "Fred: That superhero expo looks really exciting!!!! I really need someone to go with!!!"];
var messageFrom = [user3, user4];
var responseId;

$(document).ready(function(){
    /* **********Begin local storage implementation********** */
    
    //IF YOU WANT TO CLEAR ALL LOCAL STORAGE VALUES FOR DEBUGGING: store.clear();
    
    // If there is no stored data, create storedEvents object
    if (store.get("userEvents") == null) {
        store.set("userEvents", {
            eventNames: [],
            eventURLs: [],
            eventCategory: [],
            eventDateTime: [],
            eventWebDescr: [],
            venueSite: [],
            venueName: [],
            address: [],
            city: [],
            state: [],
            zipcode: [],
            borough: [],
            neighborhood: [],
            tel: [],
            mess: []
        });
    }
    storedEvents = store.get("userEvents");
    
    initLocalStorage(); // Initialize local variables with existing stored values at beginning of each session
    
    /* **********End of local storage implementation********** */
    
    for (var i = 0; i < messageBlurb.length; i++){
        $("#messagesDropdown").append("<li><a href='#' onclick='initReceivedMessageModal(" + (i+1) + "); showModal(\"receivedMessage\")'>" + messageBlurb[i] + "</a></li>");
    }
                            
    // modal handlers                                       
    $("#searchLink").click(function(){
        showModal("search");  
    });
    $("#aboutLink").click(function(){
        showModal("about");  
    });
    $("#modalWindow").click(function(){
        closeModal();  
    });

    $("#profileLink").click(function(){
        selectedUserId = 1;
        showModal("profile");  
        $("#backIcon").hide();
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
}); // end of $(document).ready

// Initialize local values to whatever the current correct values in storage are
function initLocalStorage() {
    localEventNames = storedEvents.eventNames;
    localEventURLs = storedEvents.eventURLs;
    localEventCategory = storedEvents.eventCategory;
    localEventDateTime = storedEvents.eventDateTime;
    localEventWebDescr = storedEvents.eventWebDescr;
    localVenueSite = storedEvents.venueSite;
    localVenueName = storedEvents.venueName;
    localAddress = storedEvents.address;
    localCity = storedEvents.city;
    localState = storedEvents.state;
    localZipcode = storedEvents.zipcode;
    localBorough = storedEvents.borough;
    localNeighborhood = storedEvents.neighborhood;
    localTel = storedEvents.tel;
    localMess = storedEvents.mess;
}

// show modal
function showModal(type, noInit) {
    // close all other modal windows
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#messageModal").fadeOut("fast");
    $("#receivedMessageModal").fadeOut("fast");
    $("#aboutModal").fadeOut("fast");
    $("#modalWindow").fadeIn("slow");
    
    if (type == "search")
        $("#searchModal").fadeIn("slow");
    else if (type == "event"){
        if (noInit == null){
            initEventModal();
            $("#attendingButton").show();
            $("#backToProfileIcon").hide();
        }

        $("#eventModal").fadeIn("slow");
    } else if (type == "profile"){
        if (noInit == null){
            $("#backIcon").show();
            initProfileModal();
        }
        $("#profileModal").fadeIn("slow");
    }
    else if (type == "message"){
        initMessageModal();
        $("#messageModal").fadeIn("slow");
    }
    else if (type == "receivedMessage"){
        hideResponseForm();
        $("#receivedMessageModal").fadeIn("slow");
    }
    else if (type == "about"){
        initAboutModal();
        $("#aboutModal").fadeIn("slow");
    }
}

function showEventsFromProfile(index) {
    // close all other modal windows
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#messageModal").fadeOut("fast");

    initAttendingEventModal(index, "name");
    $("#attendingButton").hide();
    $("#backToProfileIcon").show();
    $("#eventModal").fadeIn("slow");
}   

// hide modal
function closeModal(){
    $("#aboutModal").fadeOut("fast");
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#messageModal").fadeOut("fast");
    $("#receivedMessageModal").fadeOut("fast");
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
    $("#infoWindow").html("<center><img style='width:50%' src='img/loader.gif'/></center>");

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
            $("#infoWindow").html("");
            events = data.results;

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
                    if (events.length == 20)
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
        if (events[this.id].category == "spareTimes") {
            events[this.id].category = "NYT Curated";
        } else if (events[this.id].category == "forChildren") {
            events[this.id].category = "Kid-Friendly";
        }
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

function initEventModal() {     
    $("#eventTitle").html(events[selectedEventId].event_name);
    $("#eventTitle").attr("href", events[selectedEventId].event_detail_url);

    var eventHtml = ''
    if (events[selectedEventId].category !== undefined) {
        eventHtml += '</br><b>Category: </b>' + events[selectedEventId].category;
    }
    if (events[selectedEventId].date_time_description !== undefined) {
        eventHtml += '</br><b>Date/Time: </b>' + events[selectedEventId].date_time_description;
    }
    if (events[selectedEventId].web_description !== undefined){
        eventHtml += '</br><b>Description:</b><br>' + events[selectedEventId].web_description;
    }
    eventHtml += '</br><b><u>Venue Information: </b></u>';

    if ((events[selectedEventId].venue_website !== undefined) && (events[selectedEventId].venue_name !== undefined)) {
        eventHtml += '</br><a target="_blank" href="http://' + events[selectedEventId].venue_website + '">' + events[selectedEventId].venue_name + '</a>';
    } else if (events[selectedEventId].venue_name !== undefined) {
        eventHtml += '</br>' + events[selectedEventId].venue_name;
    }
    if (events[selectedEventId].street_address !== undefined) {
        eventHtml += '</br><b>Address: </b></br>' + events[selectedEventId].street_address;
    }
    if ((events[selectedEventId].city !== undefined) && (events[selectedEventId].state !== undefined) && (events[selectedEventId].postal_code !== undefined)) {
        eventHtml += '</br>' + events[selectedEventId].city + ', ' + events[selectedEventId].state + ' ' + events[selectedEventId].postal_code;
    }
    if ((events[selectedEventId].borough !== undefined) && (events[selectedEventId].neighborhood !== undefined)) {
        eventHtml += '</br><b>Borough: </b>' + events[selectedEventId].borough + ' | ' + '<b>Neigborhood: </b>' + events[selectedEventId].neighborhood;
    }
    if (events[selectedEventId].telephone !== undefined) {
        eventHtml += '</br><b> Telephone: </b>' +  events[selectedEventId].telephone;
    }

    if ((events[selectedEventId].venue_website === undefined) && (events[selectedEventId].venue_name === undefined) && (events[selectedEventId].street_address === undefined) && (events[selectedEventId].borough === undefined) && (events[selectedEventId].telephone === undefined)) {
        eventHtml += '</br> No Venue Information Available</br>';
    } 
    
    $("#eventInfo").html(eventHtml);
    htmlcode = '<h4><center><u>Attendees</u></center></h4><div class="panel-body"><ul id="attendeesList" class="list-group" style="list-style-type:none">';
    htmlcode += generateAttendeeList(true);
    htmlcode += '</ul></div>';
    $("#attendees").html(htmlcode);

    // close modal by calling closeModal();
}

// Function for loading events from profile page (only events marked as attending and in local storage)
function initAttendingEventModal(index, passedName) {
    $("#eventTitle").html(storedEvents.eventNames[index]);
    $("#eventTitle").attr("href", storedEvents.eventURLs[index]);

    var eventHtml = '';
    if (storedEvents.eventCategory[index] !== undefined) {
        eventHtml += '</br><b>Category: </b>' + storedEvents.eventCategory[index];
    }
    if (storedEvents.eventDateTime[index] !== undefined) {
        eventHtml += '</br><b>Date/Time: </b>' + storedEvents.eventDateTime[index];
    }
    if (storedEvents.eventWebDescr[index] !== undefined) {
        eventHtml += '</br><b>Description:</b><br>' + storedEvents.eventWebDescr[index];
    }
    eventHtml += '</br><b><u>Venue Information: </b></u>';

    if ((storedEvents.venueSite[index] !== undefined) && (storedEvents.venueName[index] !== undefined)) {
        eventHtml += '</br><a target="_blank" href="http://' + storedEvents.venueSite[index] + '">' + storedEvents.venueName[index] + '</a>';
    } else if (storedEvents.venueName[index] !== undefined) {
        eventHtml += '</br>' + storedEvents.venueName[index];
    }
    if (storedEvents.address[index] !== undefined) {
        eventHtml += '</br><b>Address: </b></br>' + storedEvents.address[index];
    }
    if ((storedEvents.city[index] !== undefined) && (storedEvents.state[index] !== undefined) && (storedEvents.zipcode[index] !== undefined)) {
        eventHtml += '</br>' + storedEvents.city[index] + ', ' + storedEvents.state[index] + ' ' + storedEvents.zipcode[index];
    }
    if ((storedEvents.borough[index] !== undefined) && (storedEvents.neighborhood[index] !== undefined)) {
        eventHtml += '</br><b>Borough: </b>' + storedEvents.borough[index] + ' | ' + '<b>Neigborhood: </b>' + storedEvents.neighborhood[index];
    }
    if (storedEvents.tel[index] !== undefined) {
        eventHtml += '</br><b> Telephone: </b>' +  storedEvents.tel[index];
    }

    if ((storedEvents.venueSite[index] === undefined) && (storedEvents.venueName[index] === undefined) && (storedEvents.address[index] === undefined) && (storedEvents.borough[index] === undefined) && (storedEvents.tel[index] === undefined)) {
        eventHtml += '</br> No Venue Information Available</br>';
    }
    
    $("#eventInfo").html(eventHtml);
    htmlcode = '<h4><center><u>Attendees</u></center></h4><div class="panel-body"><ul id="attendeesList" class="list-group" style="list-style-type:none">';
    htmlcode += generateAttendeeList(true, storedEvents.eventNames[index]);
    htmlcode += '</ul></div>';
    $("#attendees").html(htmlcode);

    // close modal by calling closeModal();
}

function updateSelectedUser(name) {
    for (var key in allUsers) {
        user = allUsers[key];
        if (user.name == name) {
            selectedUserId = key;
            break;
        }
    }
    showModal("profile");
}

function generateAttendeeList(init, eventName){
    if (init){
        usersAttending = defaultusersAttending.slice(0);
        // make sure button is green
        $("#eventMessageStatus").hide();
        $("#attendingButton").text("Mark as attending");
        $("#attendingButton").removeClass( "btn-danger" ).addClass( "btn-success" );
    }
    if (eventName != null) usersAttending.push(user1);
    var clickedEventName = "";
    if (eventName == null)
        clickedEventName = events[selectedEventId].event_name;
    
    var storedEvents = store.get("userEvents").eventNames;
    if(init && storedEvents.indexOf(clickedEventName) >= 0 && usersAttending.indexOf(user1) == -1)
        toggleAttendingButton();
    var htmlcode = "";
    for (var list in usersAttending){
            var item = usersAttending[list]
            var list = '<li class="list-group-item">';
            var name = item.name;
            var inputName = "'" + name + "'"
            if (item.name == "Baymax") {
                var index;
                if (eventName == null)
                    index = localEventNames.indexOf(events[selectedEventId].event_name);
                else
                    index = localEventNames.indexOf(eventName);
                var mess = localMess[index];
            } else {
                var mess = item.message;
            }
            list += '<a id="eventUser" href="#" onclick="updateSelectedUser(' + inputName + ')">' + name + '</a>'
            if (mess == 0) {
                list += '\t' + '<button type="button" class="btn btn-xs btn-primary pull-right" onclick="initMessageModal(\'' + item.name + '\'); showModal(\'message\')"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span></button>'
            } else {
                list += '\t' + '<button type="button" class="btn btn-xs btn-primary pull-right" disabled="disabled"><span class="glyphicon glyphicon-envelope" aria-hidden="true"></span></button>'
            }
        htmlcode += list + '</li>'
    }
    return htmlcode;
}

$(document).on("click", "#attendingButton", function attendEvent() {
    toggleAttendingButton(true);
});

function toggleAttendingButton(clicked){
    if ($("#attendingButton").text() == "Mark as attending"){
            
        if (clicked && localEventNames.indexOf(events[selectedEventId].event_name) == -1){
            // Add event to local copies
            localEventNames.push(events[selectedEventId].event_name);
            localEventURLs.push(events[selectedEventId].event_detail_url);
            localEventCategory.push(events[selectedEventId].category);
            localEventDateTime.push(events[selectedEventId].date_time_description);
            localEventWebDescr.push(events[selectedEventId].web_description);
            localVenueSite.push(events[selectedEventId].venue_website);
            localVenueName.push(events[selectedEventId].venue_name);
            localAddress.push(events[selectedEventId].street_address);
            localCity.push(events[selectedEventId].city);
            localState.push(events[selectedEventId].state);
            localZipcode.push(events[selectedEventId].postal_code);
            localBorough.push(events[selectedEventId].borough);
            localNeighborhood.push(events[selectedEventId].neighborhood);
            localTel.push(events[selectedEventId].telephone);
            var addMess = 0;
            localMess.push(addMess);

            // Replaces stored object with local values
            store.set("userEvents", {
                eventNames: localEventNames,
                eventURLs: localEventURLs,
                eventCategory: localEventCategory,
                eventDateTime: localEventDateTime,
                eventWebDescr: localEventWebDescr,
                venueSite: localVenueSite,
                venueName: localVenueName,
                address: localAddress,
                city: localCity,
                state: localState,
                zipcode: localZipcode,
                borough: localBorough,
                neighborhood: localNeighborhood,
                tel: localTel,
                mess: localMess
            });
        }
        usersAttending.push(user1);
        $("#attendeesList").html(generateAttendeeList());
        $("#eventMessageStatus").show();
        $("#attendingButton").text("Mark as not attending");
        $("#attendingButton").removeClass( "btn-success" ).addClass( "btn-danger" );
    }
    else if ($("#attendingButton").text() == "Mark as not attending"){
        // Remove event from local copies
        var index = localEventNames.indexOf(events[selectedEventId].event_name);
        localEventNames.splice(index, 1);
        localEventURLs.splice(index, 1);
        localEventCategory.splice(index, 1);
        localEventDateTime.splice(index, 1);
        localEventWebDescr.splice(index, 1);
        localVenueSite.splice(index, 1);
        localVenueName.splice(index, 1);
        localAddress.splice(index, 1);
        localCity.splice(index, 1);
        localState.splice(index, 1);
        localZipcode.splice(index, 1);
        localBorough.splice(index, 1);
        localNeighborhood.splice(index, 1);
        localTel.splice(index, 1);
        localMess.splice(index, 1);
        
        // Replaces stored object with local values
        store.set("userEvents", {
            eventNames: localEventNames,
            eventURLs: localEventURLs,
            eventCategory: localEventCategory,
            eventDateTime: localEventDateTime,
            eventWebDescr: localEventWebDescr,
            venueSite: localVenueSite,
            venueName: localVenueName,
            address: localAddress,
            city: localCity,
            state: localState,
            zipcode: localZipcode,
            borough: localBorough,
            neighborhood: localNeighborhood,
            tel: localTel,
            mess: localMess
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
var i; // Global var for use in showEventsFromProfile(i)

$(document).on("click", ".attendedEventURL", function () {
    showEventsFromProfile(parseInt($(this).attr("stuff")));
});

function updateMessage() {
    var select = document.getElementById("messButt");
    var val = select.options[select.selectedIndex].value;
    var index = localEventNames.indexOf(events[selectedEventId].event_name);
    if (val == "1") {
        if (index !== -1) {
            localMess[index] = 1
            store.set("userEvents", {
                eventNames: localEventNames,
                eventURLs: localEventURLs,
                eventCategory: localEventCategory,
                eventDateTime: localEventDateTime,
                eventWebDescr: localEventWebDescr,
                venueSite: localVenueSite,
                venueName: localVenueName,
                address: localAddress,
                city: localCity,
                state: localState,
                zipcode: localZipcode,
                borough: localBorough,
                neighborhood: localNeighborhood,
                tel: localTel,
                mess: localMess
            });
        }
    }
    else if (val == "0") {
        if (index !== -1) {
            localMess[index] = 0
            store.set("userEvents", {
                eventNames: localEventNames,
                eventURLs: localEventURLs,
                eventCategory: localEventCategory,
                eventDateTime: localEventDateTime,
                eventWebDescr: localEventWebDescr,
                venueSite: localVenueSite,
                venueName: localVenueName,
                address: localAddress,
                city: localCity,
                state: localState,
                zipcode: localZipcode,
                borough: localBorough,
                neighborhood: localNeighborhood,
                tel: localTel,
                mess: localMess
            });
        }
    }
    toastr.success("Messaging preferences updated!");
    initEventModal();
}

function updateMess2(eventName, val) {
    var index = localEventNames.indexOf(eventName);
    if (val == 0) {
        localMess[index] = 0;
    } else {
        localMess[index] = 1;
    }
    store.set("userEvents", {
        eventNames: localEventNames,
        eventURLs: localEventURLs,
        eventCategory: localEventCategory,
        eventDateTime: localEventDateTime,
        eventWebDescr: localEventWebDescr,
        venueSite: localVenueSite,
        venueName: localVenueName,
        address: localAddress,
        city: localCity,
        state: localState,
        zipcode: localZipcode,
        borough: localBorough,
        neighborhood: localNeighborhood,
        tel: localTel,
        mess: localMess
    });
    toastr.success("Messaging preferences updated!");
    initProfileModal();

}

function initProfileModal(){
    // open by calling showModal("profile") and setting selectedUserId to appropriate id; should be opened from eventModal
    var id = selectedUserId;
    for (var key in allUsers) {
        if (id == key) {
            var user = allUsers[key];
            break;
        }
    }

    var userHtml = '<img src="' + user.img + '" style = "max-height: 200px; max-width: 90%" alt=""/>';
    $("#userPic").html(userHtml);
    var infoHtml = '<h1>' + user.name + '</h1><b>Age: </b>' + user.age + '</br><b>Hometown: </b>' + user.hometown + '</br><b>About Me: </b>' + user.aboutme;
    $("#userInfo").html(infoHtml);
    var attendingHtml = '';
    names = storedEvents.eventNames;
    url = storedEvents.eventURLs;
    var mess_array = storedEvents.mess;

    if (selectedUserId == 1) {
        // Display each row of events being attended
        i = 0;
        for (i in names) {
            attendingHtml += '<tr><td style="width: 55%">' + '<a href="#" class="attendedEventURL" stuff="' + i + '">' + names[i]+ '</a></td><td style="width: 25%">';
            var messageButton = ''
            inputEvent = "'" + names[i] + "'";
            if (mess_array[i]== 0) {
                messageButton = '<div class="form-group" style="display: inline;"><select class="form-control input-sm" id="messButt2">><option value="0">Message</option>';
                messageButton += '<option value ="1">Do not Message</option></select></div><button type="message" onclick="updateMess2(' + inputEvent + ', 1)"'
                messageButton += ' class="btn btn-xs btn-primary pull-right">Update</button></div>';
            } else {
                messageButton = '<div class="form-group" style="display: inline;"><select class="form-control input-sm" id="messButt3">><option value="0">Do Not Message</option>';
                messageButton += '<option value="1">Message</option></select></div><button type="message" onclick="updateMess2(' + inputEvent + ', 0)"'
                messageButton += ' class="btn btn-xs btn-primary pull-right">Update</button></div>';
            }
            attendingHtml += messageButton;
            attendingHtml += '<td style="width: 25%" align = "pull-right">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a id="eventUser" href="#" style="color: #CC0000" onclick="removeEvent(' + inputEvent + ')">' + 'Remove Event' + '</a></td></tr><br><br>';
        }

    } else {
        attendingHtml = '<ul class="list-group">';
        for (var i in names) {
            attendingHtml += '<li class="list-group-item">' + '<a href="' + url[i] + '">' + names[i]+ '</a></li>';
        }
        attendingHtml += '</ul>';
    }
    $("#eventTable").html(attendingHtml);
}    
    
function removeEvent(eventName) {
    storedEvents = store.get("userEvents");
    initLocalStorage();
    
    var index = localEventNames.indexOf(eventName);
    localEventNames.splice(index, 1);
    localEventURLs.splice(index, 1);
    localEventCategory.splice(index, 1);
    localEventDateTime.splice(index, 1);
    localEventWebDescr.splice(index, 1);
    localVenueSite.splice(index, 1);
    localVenueName.splice(index, 1);
    localAddress.splice(index, 1);
    localCity.splice(index, 1);
    localState.splice(index, 1);
    localZipcode.splice(index, 1);
    localBorough.splice(index, 1);
    localNeighborhood.splice(index, 1);
    localTel.splice(index, 1);
    localMess.splice(index, 1);
    
    store.set("userEvents", {
        eventNames: localEventNames,
        eventURLs: localEventURLs,
        eventCategory: localEventCategory,
        eventDateTime: localEventDateTime,
        eventWebDescr: localEventWebDescr,
        venueSite: localVenueSite,
        venueName: localVenueName,
        address: localAddress,
        city: localCity,
        state: localState,
        zipcode: localZipcode,
        borough: localBorough,
        neighborhood: localNeighborhood,
        tel: localTel,
        mess: localMess
    });
    toastr.success("You are no longer attending " + eventName);
    initProfileModal();
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
    var message = $("#messageBody").val();
    
    var blurb = name + ": " + message;
    if (blurb.length > 20)    messageBlurb.push(blurb.substr(0, 16) + "...");
    else                        messageBlurb.push(blurb);
    messages.push("You: " + message);
    
    var user;
    if (name == "Baymax")               user = user1;
    else if (name == "Honey Lemon")     user = user2;
    else if (name == "Hiro Hamada")     user = user3;
    else if (name == "Fred")            user = user4;
    else if (name == "Go Go Tomago")    user = user5;
    else if (name == "Wasabi")          user = user6;
    messageFrom.push(user);
    toastr.success("Message sent to " + name + "!");
    $("#messagesDropdown").html("");

    for (var i = 0; i < messageBlurb.length; i++){
        $("#messagesDropdown").append("<li><a href='#' onclick='initReceivedMessageModal(" + (i+1) + ");   showModal(\"receivedMessage\")'>" + messageBlurb[i] + "</a></li>");
    }
    showModal("event", true);
}

//@Mahd
function initAboutModal(){
    var aboutImg = '<img src="img/nyc.jpg" style = "max-height: 200px; max-width: 90%" alt=""/>';
    $("#aboutPic").html(aboutImg);
}

function initReceivedMessageModal(index){
    responseId = index - 1;
    $("#receivedMessageTitle").text("Conversation with " + messageFrom[responseId].name);
    $("#receivedMessageBody").html(messages[responseId]);
}

function replyToMessage(){
    $("#replyButton").hide();
    $("#responseDiv").show();
    $("#hrTag").show();
    $('#receivedMessageModal').animate({'height': '60%'}, { duration: 600, queue: false });
    $('#receivedMessageModal').animate({'top': '20%'}, { duration: 600, queue: false });
}

function sendResponse(){
    toastr.success("Sent reply to " + messageFrom[responseId].name + "!");
    messages[responseId] = messages[responseId] + "<hr>You: " + $("#responseMssageBody").val();
    $("#receivedMessageBody").html($("#receivedMessageBody").html() + "<hr>You: " + $("#responseMssageBody").val());
    $("#responseMssageBody").val("");
    $("#responseMessageSubject").val("");
    hideResponseForm();
}

function hideResponseForm(){
    $("#replyButton").show();
    $("#responseDiv").hide();
    $("#hrTag").hide();
    $('#receivedMessageModal').animate({'height': '50%'}, { duration: 600, queue: false });
    $('#receivedMessageModal').animate({'top': '24%'}, { duration: 600, queue: false });
}