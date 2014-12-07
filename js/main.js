// main.js
var map;
var markers = new Array();
$(document).ready(function(){
    // modal handlers
    $("#searchLink").click(function(){
        showModal("search");  
    });
    $("#modalWindow").click(function(){
        closeModal();  
    });
    // FOR DEBUGGING; take out later
    $("#eventLink").click(function(){
        showModal("event");  
    });
    $("#profileLink").click(function(){
        showModal("profile");  
    });
    
    // initialize map
    var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(40.7993,-73.9667)
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    markers.push(new google.maps.Marker({
        position: new google.maps.LatLng(40.7833,-73.9667),
        map: map,
        title: 'Central Park',
        icon: 'img/puppy.png'
    }));
    markers.push(new google.maps.Marker({
        position: new google.maps.LatLng(40.8075,-73.9619),
        map: map,
        title: 'School',
        icon: 'img/seas.png'
    }));
    
    // attach event handlers to search modal elements
    $("#searchButton").click(function(){ search() });
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
    else if (type == "event")
        $("#eventModal").fadeIn("slow");
    else if (type == "profile")
        $("#profileModal").fadeIn("slow");
}

// hide modal
function closeModal(){
    $("#searchModal").fadeOut("fast");
    $("#eventModal").fadeOut("fast");
    $("#profileModal").fadeOut("fast");
    $("#modalWindow").fadeOut("fast");

}
   
// ********************************************** search methods **********************************************

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

function search(){
    // clear old markers
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = new Array();
    
    var query = "http://api.nytimes.com/svc/events/v2/listings.jsonp?";
    var search = $("#stringSearch").val();
    var minDate = $("#minDateSearch").val();
    var maxDate = $("#maxDateSearch").val();
    var neighborhood = $("#neighborhoodSearch").val();
    var eventType = $("#eventTypeSearch").val();
    var free = $("#freeSearch").prop('checked');
    var kid = $("#kidSearch").prop('checked');
    var nytPick = $("#nytPickSearch").prop('checked');
    
    if (search.length > 0)      query += "query=" + search + "&filters=";
    
    // if no query, manually add &filters=
    if (query.substring(query.length-1) == "?")
        query += "filters=";
    
    //if (minDate.length > 0)   alert(minDate);
    //if (maxDate.length > 0)   stuff
    if (neighborhood)           query += "borough:\"" + neighborhood + "\",";
    if (eventType)              query += "category:" + eventType + ",";
    if (free)                   query += "free:true,";
    if (kid)                    query += "kid_friendly:true,";
    if (nytPick)                query += "times_pick:true,";
    
    // get rid of last comma
    if (query.substring(query.length-1) == ",")
        query = query.substring(0, query.length - 1);
    // get rid of &filters=
    if (query.substring(query.length-1) == "=")
        query = query.substring(0, query.length - 9);
    query += "&api-key=b48655f732e1eca5a752c618c1d7543b:9:70165895";
    
    $.ajax({
        type: "GET",
        url: query,
        cache: true,
        dataType: "jsonp",
        success: function(data)
        {  
            for (var i = 0; i < data.results.length; i++) {
                var lat = data.results[i].geocode_latitude;
                var long = data.results[i].geocode_longitude;

                markers.push(new google.maps.Marker({
                    position: new google.maps.LatLng(lat, long),
                    map: map,
                    icon: 'img/puppy.png'
                }));
            }
        }
    }); 
    
    closeModal();
}