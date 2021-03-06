// NY // searchAPIS("python", 40.728862, -73.996413);
// LA // searchAPIS("javascript", 34.020204, -118.490765)

/**
 * Globals and constants
 */

var meetupResponse = [];
var youtubeResponse;
var wikiResponse;
var mapCoordinates;
var allData = [];
var geocoder;
var map;
var address;
var lat;
var lng;

/**
 * Map on.load
 */

function initMap() {

    var theLat = 34.01839828491211;
    var theLong = -118.48661041259766;

    var uluru = {
        lat: theLat,
        lng: theLong
    };

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: uluru
    });

    var marker = new google.maps.Marker({
        position: uluru,
        map: map
    });
} // end initMap

/**
 * Convert Address to Lat/Lng
 */

function geocodeAddress(geocoder, userInput) {
    geocoder = new google.maps.Geocoder();
    address = userInput;
    geocoder.geocode({ 'address': address }, function(results, status) {
        if (status === 'OK') {
            lat = results[0].geometry.location.lat();
            lng = results[0].geometry.location.lng();
            console.log("address: " + address + " lat: " + lat + " lng: " + lng);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
        var search = $("#search-subject").val();
        searchMeetup(search, lat, lng);
    });

}

/**
 * API Calls
 */

function searchMeetup(search, lat, lng) {
    var query = search;
    var theMoment = $("#datepicker").val() + " " + $("#timepicker").val();

    $.ajax({
        url: "https://api.meetup.com/find/events?&sign=true&photo-host=public&lon=" +
            lng + "&text=" + query + "&radius=" + "30" + "&lat=" + lat + "&key=13493128171b80333fc956a274b1c",
        method: "GET",
    }).done(function(response) {
        console.log(meetupResponse.length);
        response.forEach(function(item, index) {
            var evalStatement = (moment(item.time).diff(moment($("#datepicker").val() + " " + $("#timepicker").val(), 'YYYY-MM-DD hh:mm a'), 'hours') <= 5);
            console.log(evalStatement);
            // filter results to NOT include meetups with NO VENUE
            if (item.venue !== undefined && evalStatement === true) {
                meetupResponse.push(response[index]);
                // console.log(index);
            }
        });
        // error handle
        if (meetupResponse.length === 0) {
            alert("Looks like no Meetups match your search criteria. Please check the input fields and try again.");
        } else {
            searchAPIS(search, lat, lng);
        }

    });
}

// uses inputed subject & geocodeAddress Latitude & Longitude
// generates meetupResonse of data to be used on page
function searchAPIS(search, lat, lng) {
    var query = search;
    var numFinished = 0;
    var totalNeeded = 2;


    // call youtube
    $.get("https://www.googleapis.com/youtube/v3/search", {
            part: 'snippet, id',
            q: query,
            type: 'video',
            'maxResults': 6,
            key: 'AIzaSyBCZgipwmv-daOhKVQWBKISU5dGjx24rng'
        },
        function(data) {
            console.log("youtube Data: " + data.items);
            youtubeResponse = data.items;
            // waits for all 3 API's calls to finish loading data
            numFinished++;
            if (numFinished === totalNeeded) {
                updatePage(meetupResponse);
                updateMap(meetupResponse);
            }
        }
    );
    // call wikipedia
    // call wikipedia
    $.ajax({
        type: 'GET',
        dataType: 'jsonp',
        url: 'https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=' + meetupResponse.length + '&prop=pageimages|extracts&inprop=url&pilimit=max&exintro&explaintext&exsentences=1&exlimit=max&gsrsearch=' + query,
        crossDomain: true,
        cache: false,
        success: function(json) {
            console.log("Wiki data: " + json.query.pages);
            wikiResponse = Object.values(json.query.pages);
            // waits for all 3 API's calls to finish loading data
            numFinished++;
            if (numFinished === totalNeeded) {
                updatePage(meetupResponse);
                updateMap(meetupResponse);
            }
        }
    });
}

/**
 * Render Page
 */

var updatePage = function(meetupResponse) {

        allData = [];

        // store values from API calls in 1 object
        for (var i = 0; i < meetupResponse.length; i++) {
            // push into empty array with iterate == key
            allData.push(allData[meetupResponse[i]] = {
                "meetupName": meetupResponse[i].name,
                "meetupDescription": meetupResponse[i].description,
                "startTime": moment(meetupResponse[i].time).format("hh:mm A"),
                "meetingLength": meetupResponse[i].duration,
                "lat": meetupResponse[i].group.lat,
                "lon": meetupResponse[i].group.lon,
                "rsvp": meetupResponse[i].yes_rsvp_count,
                "waitlist": meetupResponse[i].waitlist_count,
                "venueName": meetupResponse[i].venue.name,
                "venueAddress": meetupResponse[i].venue.address_1,
                "venueCity": meetupResponse[i].venue.city,
                "meetupURL": meetupResponse[i].link,
                "waitlist": meetupResponse[i].waitlist_count
            });
        }

        // append Youtube results to object
        addYoutubeLinks(youtubeResponse);
        addWikiLinks(wikiResponse);

        console.log("All Data:");
        console.log(allData);

        // Append items to page
        for (j = 0; j < meetupResponse.length; j++) {

            // structures accordion & title
            var panelDefault = $("<div>").addClass("panel panel-default");
            var panelHeading = $("<div>")
                .addClass("panel-heading")
                .attr("role", "tab")
                .attr("id", "heading" + j);

            var panelName = $("<h4>")
                .addClass("panel-title")
                .append('<a role="button" class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#collapse' + j + '">' + allData[j].meetupName + '</a>');

            // accordion collapsed data
            var collapseId = $("<div>")
                .addClass("panel-collapse collapse")
                .attr("id", "collapse" + j)
                .attr("role", "tabpanel")
                .attr("aria-labelledby", "heading" + j);

            // add Meetup Details
            var collapseBody = $("<div>").addClass("panel-body");
            var collapseDescription = $('<p>').html("Meetup Details: " + allData[j].meetupDescription).text();
            var collapseStartTime = $('<p>').text("Start Time: " + allData[j].startTime);
            var collapseVenue = $("<p>").text("Venue Name: " + allData[j].venueName + " Address: " + allData[j].venueAddress + " " + allData[j].venueCity);
            var collapseUrl = $("<a>").text("Click to RSVP").attr({
                href: allData[j].meetupURL,
                target: "_blank"
            });
            var collapseAttending = $("<p>").text("RSVP'd: " + allData[j].rsvp);
            var collapseWaitlist = $("<p>").text("Waitlist: " + allData[j].waitlist);

            // add Youtube details
            var videoTitle = $("<p>").text("Youtube Example: " + allData[j].youtubeTitle);
            var videoLink = $("<a>")
                .attr({
                    href: allData[j].youtubeURL,
                    target: "_blank"
                })
                .html("<img src=" + allData[j].youtubeThumbnail + ">");
            var imgContainer = $("<div>").addClass("ytImgContainer");

            // add Wikipedia details
            var wiki = $("<a>").attr({
                    href: allData[j].wikiURL,
                    target: "_blank"
                })
                .html('<i class="fa fa-wikipedia-w" aria-hidden="true"></i>' + "ikipedia: " + allData[j].wikiTitle)

            // create accordion HTML elements
            panelHeading.append(panelName);
            panelDefault.append(panelHeading);
            collapseBody.append(collapseDescription);
            collapseBody.append(collapseStartTime);
            collapseBody.append(collapseVenue);
            collapseBody.append(collapseUrl);
            collapseBody.append(collapseAttending);
            collapseBody.append(collapseWaitlist);
            collapseBody.append(wiki);
            imgContainer.append(videoTitle);
            imgContainer.append(videoLink);
            collapseBody.append(imgContainer);
            collapseId.append(collapseBody);
            panelDefault.append(collapseId);

            // update accordion to page
            $("#accordion").append(panelDefault);
            // $("#accordion").append(collapseBody);

        } // end for loop
    } // end updatePage()

/**
 * Add Youtube to meetupResponse Object
 */

// adds Youtube query to meetupResponse object
function addYoutubeLinks(youtubeResponse) {
    var totalItems = meetupResponse.length;
    if (youtubeResponse.length < totalItems) {
        totalItems = youtubeResponse.length;
    }
    for (var i = 0; i < totalItems; i++) {
        allData[i].youtubeTitle = youtubeResponse[i].snippet.title;
        allData[i].youtubeURL = "https://www.youtube.com/watch?v=" + youtubeResponse[i].id.videoId;
        allData[i].youtubeThumbnail = youtubeResponse[i].snippet.thumbnails.high.url;
    }
} // end addYoutubeResponse()

// adds Wikipedia query to meetupResponse object
function addWikiLinks(wikiResponse) {
    var totalItems = meetupResponse.length;
    if (wikiResponse.length < totalItems) {
        totalItems = wikiResponse.length;
    }

    for (m = 0; m < totalItems; m++) {
        allData[m].wikiTitle = wikiResponse[m].title;
        allData[m].wikiURL = "http://en.wikipedia.org/?curid=" + wikiResponse[m].pageid;
    }
} // end addYoutubeResponse()

// Updates Map to display one marker for each meetup
// utilizes meetupResponse for lat/lng
function updateMap(meetupResponse) {

    var locations = [];

    for (i = 0; i < meetupResponse.length; i++) {
        if ('venue' in meetupResponse[i]) {
            locations.push([meetupResponse[i].name, meetupResponse[i].venue.lat, meetupResponse[i].venue.lon, meetupResponse[i].venue.name, meetupResponse[i].link, meetupResponse[i].time]);
        }
    }
    console.log(locations);

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: new google.maps.LatLng(locations[2][1], locations[2][2]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i;

    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i][1], locations[i][2]),
            map: map
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent("<a href='" + locations[i][4] + "' target='_blank'>" + locations[i][0] + "</a>" + "<br />" + locations[i][3] + "<br />" + moment(locations[i][5]).format("MMMM DD") + ", " + moment(locations[i][5]).format("hh:mm a"));
                infowindow.open(map, marker);
            }
        })(marker, i));
    }

    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

}

/**
 * Event Handler
 */

// User submits form for query data
// stores data for use in other functions
$("#user-submit").on("click", function() {
    meetupResponse = [];
    var search = $("#search-subject").val();
    var address = $("#search-address").val();
    geocodeAddress(geocoder, address);
    $('html, body').animate({
        scrollTop: $("#resources").offset().top
    }, 2000);
})

/**
 * Bootstrap Carousel (tming)
 */

$('.carousel').carousel({
    interval: 6000
})

/**
 * JS Picker - On Load
 */

$(function() {
    $('#datepicker').pickadate()
    $('#timepicker').pickatime()
});