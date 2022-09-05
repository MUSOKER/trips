const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //This npm script for stripe only works for back end //This script //Pass a stripe scret key that gives us the object to work with
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//This is a protected route therefore the user is already at request hence using req.
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create the checkout session
  //stripe creates an object of optionsbut 3 of them are required
  const session = await stripe.checkout.sessions.create({
    //Session
    payment_method_types: ['card'], //an array where we can specify multiple types ie credit cards
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, //to create a new booking// url not secure yet beacause anyone who know this url can book a tour without pay //url to be called as soon as a credit card id has been successfully charged and for now let it be the home page
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, //The page the user goes to if they choose to cancel the current payment ie make them g to the tour page where they were are previously
    customer_email: req.user.email, //since its a protected route hence the user is at req //saving the user one step and make the checkout exprience a little smoother
    client_reference_id: req.params.tourId, //this field helps us to pass in some data about the session we are currently creating ie enabling to create new booking in the DB  Specifying a custom field ie client reference id
    //Information about the product
    line_items: [
      {
        name: `${tour.name} Tour`, //Name of the product
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //Has to be changed when we deploy //Need to be live images ie images that are hosted on internet because stripe will upload these images to their own server
        amount: tour.price * 100, //mu;ltiply by 100 to cents ie 1 dollar=100cents //Price of the product being purchased
        currency: 'usd', //Specifying the currencies
        quantity: 1, //ie one tour for this case
      },
    ], //Specifying details about our product ie the tour its self which accepts an array of objects ie one per item
  });
  // 3) Create  session as response ie send it to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

//When a credit card is succesfully charged, it goes to the home page so we create a route at the home page for creating a new booking
//Function to create a new booking in the database
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This is only TEMPORARY,because its UNSECURE: everyone can make bookings without paying
  //getting our data from query string in the success url
  //distructuring
  const { tour, user, price } = req.query;
  //only create a new tour when all the above exist ie tour, user and price
  if (!tour && !user && !price) return next();
  //Create that booking in DB
  await Booking.create({ tour, user, price }); //this goes to DB //With an object of tour, user and price  //not saved as a variable because we do not want to send it back as an api response
  //Making the website more secure so as after creating the booking, it goes to home page by removing he query string
  //removing the query from our original(success) url
  res.redirect(req.originalUrl.split('?')[0]); //To prevent the query string from showing up in the url bar hence redirecting it to this new url //Home page there follow up the view route / next middleware they help crete a new booking and since the query wont be defined, it will go to next middleware which will render the home page
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
