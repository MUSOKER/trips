/* eslint-disable */

// Obtained from mapbox next step

//Function that takes in locations
//Variable location is defined inside the index.js
export const displayMap = (locations) => {
  //come from mapbox
  mapboxgl.accessToken =
    'pk.eyJ1IjoibXVzb2tlciIsImEiOiJjbDVkc2F1d2cwdWY2M2NsMXVlejl6cHk2In0.aAo6sEodYOo4nV0GuuHTow'; //Tokens helps one to access map box

  var map = new mapboxgl.Map({
    container: 'map', //Container is set to map therefore it will put the map to the id map contained in the tour.pug
    style: 'mapbox://styles/musoker/cl5dstuxv000a15rv7r9pkrwn', //Style url obtained from the created mapbox style
    scrollZoom: false, //Prevents the zooming but does nor limit twisting of the map
    //Setting Options
    // center: [-118.113491, 34.111745], //centre point ie an array of two cordinates//Like mongoDB lontd first then latitude
    // zoom: 4, //Specifying the zoom level which is 4
    // interactive: false, //This makes the map be like an image
  });
  //MAKING THE POSITION OF THE MAP (AUTOMATICALLY) BASED ON OUT TOUR LOCATIONS POINTS
  //Putting all locations of a certain tour to fit on the map
  //Create a bound varaiable
  const bounds = new mapboxgl.LngLatBounds(); //Area to be displayed on the map //Mapbox just like mongo db lng first then lat
  //Looping through all our locations
  locations.forEach((loc) => {
    // 1) CREATE MAKER
    //Add marker(Creating a new html element ie div)
    const el = document.createElement('div');
    //Giving it a class name setting it to a marker
    el.className = 'marker'; //This can be styles in CSS  as wanted

    // 2) ADD THE MARKER
    //Creating a new marker inside mapbox
    new mapboxgl.Marker({
      element: el, //Passing on the new element created
      anchor: 'bottom', //Bottom of the element ie the pin to be at the exact GPS location
      //coordinates is an array of latlng
    })
      .setLngLat(loc.coordinates)
      .addTo(map); // 1) Adding it to the map variable(the real map we created that show the locations) on line 10
    // 2) Add a popup to the marker
    new mapboxgl.Popup({
      offset: 30, //To avoid the defined HTML ie day and description from overlapping the marker
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<P>Day ${loc.day}: ${loc.description}</P>`)
      .addTo(map); //And also defining the html for this popup ie day we want to be at this location and the name of the location
    //Extends our bounds with locations
    // 3) EXTEND THE MAP BOUNDS TO INCLUDE THE CURRENT LOCATION
    bounds.extend(loc.coordinates);
  });
  //making the  map fit the bound object
  map.fitBounds(bounds, {
    //Function that executes he moving and the zooming
    //padding property
    padding: {
      //Creating some padding with in our bound
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  }); //fitBouds method moves and zooms the map right to the bounds
};
