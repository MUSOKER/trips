const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect); //This shows that the routes below are protected

//These booking routes are not about creating, deleting etc
//router for the client to get a check out session
router.get(
  '/checkout-session/:tourId', //for the currently booked tour so as to fill out the check up session with all the data that is necesary like tour price, tour price etc
  bookingController.getCheckoutSession
); //Route for only authenticated users

//All the routes to only be accessible to the administrator(to delete, cerate etc a booking) and the lead guide(which tour has been booked)
router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
