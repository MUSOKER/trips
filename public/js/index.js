/* eslint-disable */ //because eslint is specified for node js only
//index makes the template buttons and forms work

//index.js file is more of getting data from the user interface and delegate the action
//Index.js is an entry file which gets data from user interface and delegate actions coming from other modules like login.js
//Selecting the form(containg the logins) element and then listen for a submit event (An event that will occur when one clicks on submit)

//IMPORTING MODULE FROM LOGIN.JS
import '@babel/polyfill'; // polyfill makes the new javascript features work in all the browsers (Always make it appear on the first line of inputs)
import { dispalyMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//Check if the element map exists
//DOM ELEMENTS (CSelecting elements) ie selecting the form on the page
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
//  the book tour green button
const bookBtn = document.getElementById('book-tour');

//DELEGATION
if (mapBox) {
  // Obtaining the data locations from tour.pug known as data-locations though named as dataset locations and conerting it back to JSON beacuse it was converted into a string
  const locations = JSON.parse(mapBox('map').dataset.locations);
  dispalyMap(locations);
}
if (loginForm) {
  //Add an event listener if element foem exists
  loginForm.addEventListener('sibmit', (e) => {
    e.preventDefault(); //Prevents the form from reloading the page
    //eamil and password are set loginForm function is called and this is the time we can read them
    //VALUES
    //Getting the email value and the password the user submits in using the id in html
    const email = document.getElementById('email').value; // get eleemrnt id email then obtain the valuebeing entered by user
    const password = document.getElementById('password').value; // get eleemrnt id email then obtain the valuebeing entered by user

    //Calling the login function
    login(email, password);
  });
}

//Listening to events thatgg happen on the logout button
if (logOutBtn) logOutBtn.addEventListener('click', logout);

//Sending the data to be updated in the server
if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //Creating a multerpart form data for sending the data to the server
    const form = new FormData(); //FormData is the arc name in multerpart
    //appending data on the form
    //Getting the email and the name submitted
    //for name and email update
    form.append('name', document.getElementById('name').value); //on the data we want to send, we specify the name and the value of the name
    form.append('email', document.getElementById('email').value); //on the data we want to send, we specify the name and the value of the name
    //Still obtaining the image
    form.append('photo', document.getElementById('photo').files[0]); //Since files are in an array, we need to select that first file

    console.log(form);
    //Calling the function
    updateSettings(form, 'data'); //passing the form n the update settings and axios recognise the form as an object
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    //Making the button to updating so as to wait for the process of udpdating the values since it takes some time
    document.querySelector('.btn--save-password').textContent = 'Updating...'; //Setting it to updating
    //Getting the email and the name submitted
    //for name and email update
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    //Calling the function
    //Since its a promise we should await it and perform some other stuff like removing the characters entered(password dots) from the user password
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    ); //data is either name, email or password

    //Clearing the input fields
    //select them and set them to empty
    document.querySelector('.btn--save-password').textContent = 'Save password'; //Returning it to the original wording
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    //Getting the tourId from that button
    //e.target is the element that was clicked
    //Changing the text content of the clicked element(button ) to processing
    e.target.textContent = 'Processing....';
    const { tourId } = e.target.dataset; //Storing the Id into the tourId //Same as const tourId=e.target.dataset.tourId  js converts tour_Id the one in the tour temolate to tourID//e.target is the one that causes the event to be triggered(the button)
    //Calling the function bookTour
    bookTour(tourId); //Passing the tourId into the bookTour //Calling the function bookTour with the tourId which is also passed to the url which inturn returns a checkout session
  });
