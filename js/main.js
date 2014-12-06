// main.js

$(document).ready(function(){
    $("#searchLink").click(function(){
        showModal();  
    });
    
    // initialize map
    var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(40.7993,-73.9667)
    }
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    var current = new google.maps.Marker({
        position: new google.maps.LatLng(40.7833,-73.9667),
        map: map,
        title: 'Central Park',
        icon: 'img/puppy.png'
    });
    
    var school = new google.maps.Marker({
        position: new google.maps.LatLng(40.8075,-73.9619),
        map: map,
        title: 'School',
        icon: 'img/seas.png'
    });
});


// show search modal
function showModal() {
    $("#modal").fadeIn("fast");
    $("#modalWindow").fadeIn("fast");
}

// hide search modal, and reset all fields in modal
function closeModal(){
    $("#modal").fadeOut("fast");
    $("#modalWindow").fadeOut("fast");

}
    
