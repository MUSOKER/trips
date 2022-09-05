/* eslint-disable */ //because eslint is specified for node js only
import axios from 'axios'; //Installed npm package(axios)
import { showAlert } from './alerts';

//NB THE JS USES EXPORT UNLIKE IN NODE
//Creating a login function to accept hte email and password
export const login = async (email, password) => {
  //We do a http request using an axios library
  try {
    //axios throws an error incase there is one when we are loading data in the server that is why we use try catch block
    const res = await axios({
      //axios returns a promise therefore we use async await
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      //Specifying the data we are sending along the request in the body
      data: {
        email,
        password,
      },
    });
    // res.data is the data we sent as our JSON response where we can read .status
    if (res.data.status === 'success') {
      //Giving an alert
      showAlert('succes', 'Logged in successfully');
      //After one and a half seconds load the front page
      window.setTimeout(() => {
        //Loading a new page ie the home page
        location.assign('/');
      }, 1500); //loading takes 1500 milliseconds
    }
  } catch (err) {
    showAlert('error', err.response.data.message); //I t is in the axis documentation Dat response(JSON) where we read the message property
  }
};

//What hapens when we do a get request of logging out
export const logout = async () => {
  try {
    //Doing our request with axios
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    //We reload the page which sends an invalid cookie to the server then we are nolonger logged in(Because this cant be done in the back end)
    //Hence send the invalid cookie to the server (the one with out a token).Hence our user menue will disappear the one we have just received
    if ((res.data.status = 'success')) location.reload(true); //When this is true, we force a reload from the server but not browser cache
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
