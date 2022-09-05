const AppError = require('./../utils/appError');
//THESE SHOULD BE DONE WHEN RUNNING PRODUCTION
//Contained in the error object
//Function for invalid ID
const handleCastErrorDB = (err) => {
  //This just contains the message used in the app error
  const message = `Invalid ${err.path}: ${err.value}.`; //path is where the you insert forexample the id and value is the value inserted
  return new AppError(message, 400);
};
//Function for duplicated fields
//Contained in the error object
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; //First element of that allay // (Regular function) So as to match the text in quotation of the err.errmsg field of the err object
  const message = `Duplicated field value: ${value} Please use another value`;
  return new AppError(message, 400);
};

//Contained in the error object
//This message appears on all the errors that is if difficulty, name etc are wrong and each contain an error object
const handleValidationErrorDB = (err) => {
  //Creating an object for errors which we loop ie loopng through all the error messages
  //These messages are the one specified in the schema eg the ratingsAverage shoulbe less than 5 etc
  //Because there are so many validation error fields so we have to loop them
  const errors = Object.values(err.errors).map((el) => el.message); //el.message is the message in the message in that object
  //Object.values are the individual objects ie difficulty object, name object etc
  const message = `Invalid input data. ${errors.join('. ')}`; //joining all of them by . and space
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired!, Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  //originalUrl is the entire url but not with the host
  if (req.originalUrl.startsWith('/api')) {
    //Perform this if the url starts with /api
    //We need the response object to run this code
    //Return prevents un necessary else statements
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack, //Showing where the error happened
    });
  } //If not,we render an error(rendered website)
  // B) RENDERED WEBSITE
  console.error('ERROR 🎇', err); //This is a consle for errors

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message, //It is okay to link our messages in development because no one is going to see our message
  }); //Name of the template called error and the data we want to send is just for the title
};

//Where thr operational error is distinguished fro the other
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    //When we are in production, we dont want the stack and the error
    if (err.isOperational) {
      // A) operational, trusted error: send message to client
      //The error msut be operational
      //return inorder to end the request respond cycle
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or any other error: dont leak the error details
    // 1.Log error
    console.error('ERROR 🎇', err); //This is a consle for errors
    // 2.Send generic message
    //THIS IS WHAT HAPPENS FOR AN ERROR INSIDE ANY EXPRESS MIDDLEWARE
    return res.status(500).json({
      satus: 'error',
      message: 'Something went wrong',
    });
  }
  // B) RENDER WEBSITE
  // A) operational, trusted error: send message to client
  //When we are in production, we dont want the stack and the error
  if (err.isOperational) {
    //RENDERED WEBSITE
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message, //It is okay to link our messages in development because no one is going to see our message
    }); //Name of the template called error and the data we want to send is just for the title
  }
  // B) Programming or any other error: dont leak the error details
  // 1.Log error
  console.error('ERROR 🎇', err); //This is a consle for errors
  // 2.Send generic message
  //THIS IS WHAT HAPPENS FOR AN ERROR INSIDE ANY EXPRESS MIDDLEWARE
  //RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later', //It is okay to link our messages in development because no one is going to see our message
  }); //Name of the template called error and the data we want to send is just for the title
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack); //This shows where the error happened
  err.statusCode = err.statusCode || 500; //err.statusCode  incase it was defined eg 404
  err.status = err.status || 'error'; //err.status incase its defined eg fail
  //errors developed durin production or development
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res); //Calling the function
  } else if (process.env.NODE_ENV === 'production') {
    //In the error object, if there is an error in the may id entered by the user, the err.name is always CastError
    //These are marked as operation error caused in the mongoose not by an individual
    let error = { ...err }; //Distructuring the original error
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error); //This returns a new error craeted by app error class
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); //This is the code returned for a duplicated field
    if (error.name === 'ValidationError ')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    //This function works in scenarios of not having the above ifs
    sendErrorProd(error, req, res); //This sends the eroor to the client
  }
};
