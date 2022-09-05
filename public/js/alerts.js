/* eslint-disable */

//A function for hiding alerts
export const hideAlert = () => {
  //Select the element with the alert class and then remove it
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el); //Removing the child element
};

//Creating an alert function which gets a type and message
//type is 'success' or 'error'
export const showAlert = (type, msg) => {
  //When ever we show an alert, first hide all the other alerts that laready  exist
  hideAlert();
  //creating aN HTML mark up which we will insert into our HTML
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  //Selecting the element where we want to include the html ie at the top of the page(body)
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup); //at the top og body element
  //Then after hide all the alerts after 5 seconds
  window.setTimeout(hideAlert, 5000);
};
