const path = require('path'); //Used to manipulate path modules(no need to install it)
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser'); //Enable parse all cookies in the incoming request
const compression = require('compression'); // compresses responses

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController'); //Comes from error controller
const { status, json } = require('express/lib/response');

const tourRouter = require('./routes/tourRoutes'); //importing the tourRoutes module
const userRouter = require('./routes/userRoutes'); //importing the userRoutes module
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express(); //Standard
//Routing ie how an pplication will respond to the severs request(url)
//when a get method is sent to the server using the '/' url
//CREATING OUR OWN MIDDLEWARE
//this middleware applies to every single request

//cors
app.use(
  cors({
    Credential: true,
  })
);

//Setting up th template enginee to use(pug) hence the view engine is set to pug
app.set('view engine', 'pug');
//Our pug templates are called views
//Defining the folder in which the views are located
app.set('views', path.join(__dirname, 'views')); //Creates a path joining the directory name/views  //Folder and the path

//GLOBAL MIDDLEWARES on express
//Serving statics files
//ACCESSING THE STATIC FILES
app.use(express.static(path.join(__dirname, 'public'))); //Forexample enabling utilizing the css from public folder in the pug template engine //path.join prevents the slush overload(uncertainity)
// app.use((req, res, next) => {
//   console.log('Hello from middleware👋');
//   next(); //next function has to b e called in the middleware
// });

//Set security HTTP headers
app.use(helmet());
//Development logging
//to use morgan when we are in development
if ((process.env.NODE_ENV = 'development')) {
  app.use(morgan('dev')); //morgan middleware
}

//Limiting requests from the same API
//Limiting request from same IP (ie /api done by the any person doing any request, it could be log in etc) so as to avoid brute force and DOS
const limiter = rateLimit({
  max: 100, //Specifies how many request should be done could be adjusted depending on the app you are developing
  windowMs: 60 * 60 * 1000, //Specifying 100 request per hour(in millisecods) so 100 requests in one hour
  message: 'Too many requests from this IP, please try again in one hour!',
}); //rateLimit is a function which receives an object of options

//In app.use , we need a function bt not calling a function
//Applying this limiter to only /api
app.use('/api', limiter);
//Body parse, reading data from body into req.body
//Limiting the amount of data that comes into the body
app.use(express.json({ limit: '10kb' })); //Passes data from body  //req.body//Helps to get access to request body //middle ware that modify th incoming request  FOR REQUEST.BODY TO WORK
app.use(cookieParser()); //passes data from cookie
//Data sanitization against NoSQL injection attacks
app.use(mongoSanitize()); //Returns a middleware function that looks at req.body, req.queryString, req.params and filters out all the dollars signs and dots
//Data sanitizationa against XSS
//Always use validators to avoid this in the database
app.use(xss()); //cleans any user input from malicious html code attached to javaScript whose symbols are converted by this middleware(xss)

//Preventing parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
); //White list is an array of properties for which we allow duplicates in the query string //It will only consider the first parameter during sorting and they will be the only results to be provided

// to compress the responses
app.use(compression());

//Test middleware
//Manipulating the middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //to know when was the request made
  // console.log(req.cookies); //To display all the cookies(jwt) in the console Eg a cookie is sent into the application by loading a page in the browser
  next();
});
//v1 version to enable the users still use the v1 api when you want to make changes and creat a copy v2

//sending tours to the client inform of json
//2 ROUTE HANDLERS

//app.get('/api/v1/tours', getAllTours);
//GET MTHD
//Adding a variable id to the route
//app.get('/api/v1/tours/:id', getTour);
//using the post method
//sending data to the server
//POST MTHD
//app.post('/api/v1/tours'.createTour);
//PATCH MTHD
//app.patch('/api/v1/tours/:id', updateTour);
//DELETE MTHD
//app.delete('/api/v1/tours/:id', deleteTour);
// //Starting up the server
//Refactoring our route
//These routes too are middleware that apply to a certain url
//3 ROUTES

//MOUTING THE ROUTERs on the two routes we have currently implemented
//In other words using the two applications wwe have created into the main app
//for the routes(url) below we apply the two middlware ie the tourRouter and the userRouter
//Route to access the pug template

app.use('/', viewRouter); // A route with the route function
app.use('/api/v1/tours', tourRouter); // A route with the route function
app.use('/api/v1/users', userRouter); // A route with the route function
app.use('/api/v1/reviews', reviewRouter); // the created review router imported
app.use('/api/v1/bookings', bookingRouter); // the created review router imported

//This should be the last part after all the routes
//middleware to run all the requests ie all for get, post , update typed wrongly etc
app.all('*', (req, res) => {
  //Below calls the constructor whose formula is in the appError.js
  next(new AppError(`Can't find the ${req.originalUrl} on this server!`), 404); //kind like an object to the constructor and error controller //This skips all the middleware in stake and go to the error handling middleware one it receives next
}); //* for all the urls

//EXPRESS MIDDLEWARE FOR HANDLING ERRORS (ERROR HANDLING MIDDLEWARE) bt takes on four arguments
//Specifying with the below parameters, express gets to know that this is an error handling middleware
app.use(globalErrorHandler);
//4 START SERVER
module.exports = app;
