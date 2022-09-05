const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router;

//Here we use get instead of route through out
//Rendering a template called overview
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
); //Also enable the user create new booking //We do not route '/overview' beacause we want to straight go to over view when ever we open the page
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour); //use slug instead   like clicking on the detail button
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount); //Loading a user account and must be a logged in user
router.get('/my-tours', authController.protect, viewsController.getMyTours); // Apage that shows booked tours

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
