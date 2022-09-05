/* eslint-disable */ //because eslint is specified for node js only

import axios from 'axios';
import { showAlert } from './alerts';

//This function is then called in index.js
export const updateSettings = async (data, type) => {
  //data is an object
  //type is to cater for the url
  //type is either password or data
  //This function receives data(of all the data to update)
  //Use axios to create an API call
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    //Doing the http request
    const res = await axios({
      //We have to wait for the axios request
      method: 'PATCH', //Better to write method in uppercase
      url,

      //Specifying the data ie the body to be sent along side the request
      data, //this is email,name or password
    });

    //Test if we get our succes back
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message); //If its 'error' it prints out the read block //Message property is the one defined on the server whenever there is an error
  }
};
