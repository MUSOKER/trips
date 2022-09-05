//Rendering the template with the name we pass in
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //How to render the overvview page
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using tour data from 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and the tour guide)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    //populating creates tour.reviews and therefore it contains the actual review data
    //when displaying a tour, we should include reviews
    //We cant find by id beacause we do not know the id
    path: 'reviews',
    fields: 'review rating user',
  }); //Populate include the model(reviews) we and also the fields to be included
  if (!tour) {
    return next(new AppError('There is no tour with such a name', 404)); //404 not found
  }
  // 2)Build Template
  // 3) Render template using data from 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour, //Passing the tour variable into the tour templae
  }); //Creating an object to make data be available in the pug template//Sends the template base as a response to the browser
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account', //The base template will read this title and put it in title html element
  }); //Rendering a login template with a custom title
};
exports.getAccount = (req, res) => {
  //Simply render the account page
  res.status(200).render('account', {
    title: 'Your account',
  });
};

//To dikspaly all my booked tours
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  //Since bookings contain the user id in its model, we therefore query by the user Id which will return all tours that belong to the current user
  const bookings = await Booking.find({ user: req.user.id }); //Filter by the user //get bookings of currently logged in user
  // 2) Find tours for the returned IDs (Ids for the bookings of the user)
  const tourIDs = bookings.map((el) => el.tour); //from that bookings find the tourIDS
  //Getting the tours corresponding to those IDs
  //it will select all tours that have an id in the toursID array
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //obtian the tours in the tourIDs array  //Same as a virtaul populate
  //Will be kind of an overview template with only bboked tours
  res.status(200).render('overview', {
    title: 'My Tours',
    tours, //Passing in the tours variable
  });
});

exports.updateUserData = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
