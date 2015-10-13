var map;
var cities = [];
var stations = [];
var markers = [];
var infoWindows = [];
var lastOpenedInfoWindow;
var selectedCity = 'Lyon';
var selectedMarkerLabel;
var myEventSource;
var bounds = new google.maps.LatLngBounds();

//When the window is loaded, run the initialize function to setup the map
google.maps.event.addDomListener(window, 'load', initialize);   

function initialize() {
  var map_canvas = document.getElementById('map_canvas');
  var mapOptions = {
    zoom: 12
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('legend'));
  
  //Set bike layer
  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(map);

  //Retreive list of available cities
  fetchCities();

  //Get list of stations for default city and register to updates
  myEventSource = createAndregisterEventSource(selectedCity, jcDecauxAPIKey);
  myEventSource.open();
}

function createAndregisterEventSource(selectedCity, jcDecauxAPIKey) {
  var eventSource = streamdataio.createEventSource("https://api.jcdecaux.com/vls/v1/stations?contract=" 
                    + selectedCity + "&apiKey="+ jcDecauxAPIKey, streamdataioAppToken);

  eventSource.onData(function(data){
      // initialize your data with the initial snapshot
      stations = data;
      addMarkersToMap(stations);
      
    }).onPatch(function(patches){
      // update the data with the provided patch
      console.time("perf");

      jsonpatch.apply(stations, patches);
      patches.forEach(function(patch) {
         
         // Check if it is a relevant patch before updating UI
         if (hasAvailableBikeOrDocks(patch)) {
            var stationIdx = getStationIndex(patch);
            var marker = markers[stationIdx];
            var infoWindow = infoWindows[stationIdx];
            var station = stations[stationIdx];

            var icon = (station.available_bikes === 0)?"img/cycling-red.png":"img/cycling-green.png";
            var labelClass = (station.available_bikes === 0)?"mapIconLabelRed":"mapIconLabelGreen"

            //Update InfoWindow content
            infoWindow.setContent(createWindowInfoContent(station));

            //Update Marker for animation
            marker.setIcon("img/cycling-blue.png");
            marker.setOptions({ labelContent: "" });
            marker.setAnimation(google.maps.Animation.BOUNCE);

            window.setTimeout(function() {
              marker.setAnimation(null);
              marker.setOptions({ labelClass: labelClass, labelContent: labelContent });
              marker.setIcon(icon);
            }, 3000);
         }
      });
      console.timeEnd("perf");

    }).onError(function(error){
        console.error(error);
    });

    return eventSource;
}

function changeCity() {
  stations = [];
  markers = [];
  infoWindows = [];
  bounds = new google.maps.LatLngBounds();
  
  selectedCity = document.getElementById('city').value;

  //Create a new EventSource to fetch bikes stations for newly selected city
  myEventSource.close();
  myEventSource = createAndregisterEventSource(selectedCity, jcDecauxAPIKey);
  myEventSource.open();
}

function addStationInfoWindow(index, marker) {
    var contentString;
    var infoWindow;
    var station = stations[index];

    infoWindow = new google.maps.InfoWindow({
      content: createWindowInfoContent(station)
    });

    //Creates the event listener for clicking the marker
    //and places the marker on the map
    google.maps.event.addListener(marker, 'click', function() {
      if(lastOpenedInfoWindow) lastOpenedInfoWindow.close();       
      infoWindow.open(map, marker);
      lastOpenedInfoWindow = infoWindow;
    });
    
    infoWindows.push(infoWindow);
}

function addMarkersToMap(stations) {
  for (var i = 0; i < stations.length; i++) { 
    var infoWindow;
    var station = stations[i];
    var stationLatlng = new google.maps.LatLng(station.position.lat,station.position.lng);
    var icon;

    if(selectedMarkerLabel === 'availableBikes') {
      icon = (station.available_bikes === 0)?"img/cycling-red.png":"img/cycling-green.png";
      labelClass = (station.available_bikes === 0)?"mapIconLabelRed":"mapIconLabelGreen"
      labelContent = station.available_bikes;
    } else {
      icon = (station.available_bike_stands === 0)?"img/cycling-red.png":"img/cycling-green.png";
      labelClass = (station.available_bike_stands === 0)?"mapIconLabelRed":"mapIconLabelGreen"
      labelContent = station.available_bike_stands;
    }
  
    var marker = new MarkerWithLabel({
      position: stationLatlng,
      map: map,
      icon: icon,
      draggable: false,
      raiseOnDrag: false,
      labelContent: labelContent,
      labelAnchor: new google.maps.Point(7, 33),
      labelClass: labelClass,
      labelInBackground: false
    });

    addStationInfoWindow(i, marker);
    bounds.extend(stationLatlng);
    markers.push(marker);
  }
    map.fitBounds(bounds);
}

function hasAvailableBikeOrDocks(patch) {
  return patch.path.indexOf('available_bikes') > 0;
}

function getStationIndex(patch) {
  var sepIndex = patch.path.indexOf('/', 1);
  return patch.path.substring(1, sepIndex);
}

function fetchCities() {
  var cityOptions;
  var url = "https://api.jcdecaux.com/vls/v1/contracts?apiKey=" + jcDecauxAPIKey;
  
  $.getJSON(url, function( data ) {  
    cities = data;
    for(i in cities) {
      var currentCity = cities[i];
      cityOptions += '<option value="' + currentCity.name + '">' + currentCity.name + ' ('+ currentCity.country_code+')' + " - " + currentCity.commercial_name +'</option>';
    }
    $("select#city").html(cityOptions);
    $('select#city option[value="'+ selectedCity +'"]').attr("selected",true);
  
  }).fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Unable to fetch cities: " + err );
  });
}

function createWindowInfoContent(station){
  return '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h1 id="firstHeading" class="firstHeading">'+ station.name +'</h1>'+
        '<div id="bodyContent">'+
        '<p> Status: <b>' + station.status + '</b></p>' + 
        '<p> Available Bikes: <b>' + station.available_bikes + '</b></p>' + 
        '<p> Available Docks: <b>' + station.available_bike_stands + '</b></p>' +
        '<p><i>Brought to you by <a href="streamdata.io">streamdata.io</a></i>'+
        '</div>'+
        '</div>';
}

function changeMarkersLabel() {
  var icon;
  var labelContent;
  var labelClass;
  var marker;
  var station;

  selectedMarkerLabel = $('#markerLabel').val();

  for(var i = 0; i < markers.length; i++) {
    marker = markers[i];
    station = stations[i];

    if(selectedMarkerLabel === 'availableBikes') {
      icon = (station.available_bikes === 0)?"img/cycling-red.png":"img/cycling-green.png";
      labelClass = (station.available_bikes === 0)?"mapIconLabelRed":"mapIconLabelGreen"
      labelContent = station.available_bikes;
    } else {
      icon = (station.available_bike_stands === 0)?"img/cycling-red.png":"img/cycling-green.png";
      labelClass = (station.available_bike_stands === 0)?"mapIconLabelRed":"mapIconLabelGreen"
      labelContent = station.available_bike_stands;
    }
    marker.setIcon(icon);
    marker.set('labelClass', labelClass);
    marker.set('labelContent', labelContent);
  }
}

function printStation(station) {
  console.log('latitude: ' + station.position.lat);
  console.log('longitude: ' + station.position.lng);
  console.log('availableBikes: ' + station.available_bikes);
  console.log('availableDocks: ' + station.available_bike_stands);
  console.log('distance: ' + station.distance);
  console.log('name: ' + station.name);
  console.log('address: ' + station.address);
  console.log('status: ' + station.status);
  console.log('---------------------------');
}