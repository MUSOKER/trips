const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
//Creating our router
//POST/tour/121345454/review
//GET/tour/121345454/review/224232
const router = express.Router({ mergeParams: true }); //Beacuse each router only has access to the parameters of its specific routes//Making the reviewRouter match params specified in the url on which its in the tourRouter

//No one who is not authenticated is allowed to perform any action on the reviews
router.use(authController.protect); //No one can perform the below routes without getting authenticated

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  ); //This only to the user

router
  .route('/:id')
  .get(reviewController.getReview) //This could be done by everyone
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
