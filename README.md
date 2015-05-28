# bike-demo
A simple demo that displays available bikes in realtime on GoogleMaps.

Follow these steps to make it work:

1- Get a Google Maps API key at https://developers.google.com/maps/documentation/javascript/tutorial#api_key

2- Create a JCDecaux developer account at https://developer.jcdecaux.com/#/signup to get an JCDecaux API Key.

3- Create a free account on streamdata.io to get your Public and Private Keys at https://portal.streamdata.io/#/register.

4- Edit demo-bikes.html and replace [YOUR_GOOGLE_MAP_API_KEY], [YOUR_JCDECAUX_API_KEY], [YOUR_STREAMDATA.IO_PUBLIC_KEY] and [YOUR_STREAMDATA.IO_PRIVATE_KEY] with appropriate keys.

5- Save and launch demo-bikes.html in your favorite browser (works with Chrome, Firefox and Safari).

You are done! You should now see all bike docking stations available for the selected city (Lyon as default). 
As soon as an update is received (new bike/stand available), UI get's animated. When clicking on a station, detailed information is displayed.
