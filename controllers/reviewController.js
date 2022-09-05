const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');

//Creating a moddleware to run before creat Review to enable set the tourID and userID
exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes
  //user and tour not specified in the request body
  //If the user does not sepicify tour, the tour the obtain the tour Id from the URL
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; //req.user.id id obtained from the protect middleware
  next();
};
//It is an async function because we are dealing with DBs
exports.createReview = factory.createOne(Review);

exports.getAllReviews = factory.getAll(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getReview = factory.getOne(Review);
