//Importing the express module
const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes'); //Importing the review router
//using the middleware
const router = express.Router();
//Param middleware ie what runs when a given parameter like id is used
//this middleware will only work in the tours routing because it is specified in the tourRoutes
//router.param('id', tourController.checkId); //This runs the params middleware in the tourController

//IMPLEMENTING NESTED ROUTES
//Accessing the review resource on the tour resource
//POST/tour/121345454/review (Parent-child relationship between resources where reviews is a child of tours) means nested routes(When creating reviews we do not need to enter the user id and tour Id) ie ID is automatically generated from logged in user tour is the cuurent tour
//GET/tour/121345454/review/224232 //Acessing reviews from a given tour with that ID last is the ID of the review

//Tour router should we a review router when ever it encouter this route ('/:tourId/reviews') instead
router.use('/:tourId/reviews', reviewRouter);

//Create a check body middleware
//check if the body contains the name and the price property
//if not send back 400(bad request)
//Route the top 5 cheap
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  ); //Restricted from the user

//Geospatial routes ie get to know the tours near you
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin); //distance parameter and center/:latlng is where you are currently Eg tou are in los Angeles and you want to know the tours with in a distance of 200 miles
//tour-distance/233/center/34.111745,-118.113491/unit/mi

//Calculating the disatnces from all the tours
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances); //latlng where the user is
router
  .route('/')
  .get(tourController.getAllTours) //No authententication to allow this route get exposed to any one forexample tour sites might need to get access to our tours
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  ); //This should be done by lead guies and admins

router
  .route('/:id')
  .get(tourController.getTour) //getting a single tour is free to everyone
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //Means this can only be done by adminstrator amd the lead-guide
    tourController.deleteTour
  );

//exporting the router
module.exports = router;
