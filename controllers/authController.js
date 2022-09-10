const crypto = require('crypto');
const { promisify } = require('util'); //Built in util model that allows the use of promisify function
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError'); //Global error handling  middleware
const Email = require('./../utils/email'); //uses the   Email class
const { DESTRUCTION } = require('dns');

//Creating a token function that only receives the user id
const signToken = (id) => {
  //Meaning id:id
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//FACTORING OUT THE FUNCTION
//A function to create and send token to the user
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id); //contains the payload which is the id of the new user, secret and other options still added to the payload

  //SEND JWT VIA COOKIE
  //Making sure JWT are stored in cookies so as not accessed or edited by an intruder using the crsoo site scripting
  //A cookie is a small piece of text the server can send to the client and browser automatically store it and sends it(browser) back with all future request to the same server
  //Sending a cookie we attach it to the respond object
  //Name is a unique identifier for a cookie so if the same name logs in and out and in it will be the same cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //Converting it to miliseconds //This property enables the client/browser to automatically delete the cookie when it has expired
    httpOnly: true, //That is the cookie can not be modified by the browser preventing cross site scripting attacks ie browser receives the cookie, store it and automatically send it along any http request
  };
  //This should be done in production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //Cookie only sent on an encrypted connection that is https hence secure(//This is an http only cookie therefore we can not manipulate this cookie anyway by the browser)
  res.cookie('jwt', token, cookieOptions); //Name of the cookie(jwt), and data we want to send in the cookie and lastly options of the cookie

  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token, //Sending the token to the user
    data: {
      user,
    },
  });
}; //Need the user where the id is stored and also the status code and aslo acccess to respond object
//We dont pass arguments to middlewares
//It is an async function because we need to interact with the database
exports.signup = catchAsync(async (req, res, next) => {
  //Creating a new user based on the User model
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/me`; //'http://127.0.0.1:3000/me'; getting the data from request //url points to the user account
  await new Email(newUser, url).sendWelcome(); //prints the welcome template
  //Below allows only the data we need to be input in the new user preventing just anyone to register as admin
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  // });
  //AS SOON  AS THE USER SIGNS UP HE HAS TO GET LOGGED IN
  //Sending the new user to the client
  //Creating a token
  //config file stores the secret data
  // when the jwt expires the user is automatically logged out
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //User sends in the email and password for checking
  const { email, password } = req.body; //distructuring same as const email=req.body.email tho this is not allowed //Reading the email from body
  // 1 Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2 check if user exist && password is correct
  // select('+password') also includes the password since it could not have come with the email according to the User schema
  const user = await User.findOne({ email }).select('+password'); //Explicitly selecting the password since it initialy before selcting it wont be outputed but we need it to compare it wit h the DB password //email(field)= email(variable) //Finding the user by email
  //We await because correctPassword is an async function
  //const correct =await user.correctPassword(password,user.password) //This is either true or false//body password and DB password
  //if the user does not exist then it will not run this await
  //BCRYPT generated an encrypted password from the normal password
  // correctPassword(uses bcrypt) is an instance method(always available on that collection eg user) created in the userSchema
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); //This statement prevents the hacker from knowing which of the two is incorrect
  }
  //if thabove correspond i go the next line of code
  // 3 If everything is ok, send token to client  in other wards allow the user to log in
  //These works on the stateless authentication
  createSendToken(user, 200, res);
});

//ENSURING LOGGOING OUT BY SENDING BACK A NEW COOKIE WITH ITS ORIGINAL NAME BUT NOT WITH A JWT(SECURE) BECAUSE WHEN CREATING A COOKIE IT WAS SPECIFIED HTTP ONLY
//Token based authentication(for a super secure cookie)

exports.logout = (res, req) => {
  res.cookie('jwt', 'loggedout', {
    //Instead of a token we send 'loggedout'
    expires: new Date(Date.now() + 10 * 1000), //Expire in 10  by creating a new date
    httpOnly: true,
  }); //Sending a super secure cookie then a send a damy text(logged out) and then specify cookie options //on response we sent the cookie name jwt

  //sending the response back
  res.status(200).json({
    status: 'success',
  });
};

//MIDDLEWARE TO PROTECT THE ROUTE ONLY FOR API
//middleware function to only allow logged in users access tours
exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting the token and check if it's there
  let token; //Making it to be used even outside the blocks of if
  if (
    // The bearer token the client sends back to the server
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //req.headers is the array object with an authorisation element
    //This is the token the user sends when requsting a request to get all the tours(token coming from authorisation header)
    token = req.headers.authorization.split(' ')[1]; //Splitting the two by space and form an array and then consider the second element of the array
  }
  //Authenticating user via tokens sent via cookies
  //token coming from the cookies
  //Deleting a user is like logging out a user
  else if (req.cookies.jwt) {
    //Focusing on the prperty jwt in the cookie object
    token = req.cookies.jwt;
  }
  if (!token) {
    next(
      new AppError('You are not logged in! Please log in to get access', 401)
    ); //401 satus code means un authorised
  }
  // 2) Verification of the token
  //It should be the right token and should not have expired
  //decoded data object that conatains the user id payload from this jwt like {id:3324444, etc} like the token is decoded can be abit read
  //Showing that the token payload is not manipulated by a malicious person
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //Returns a promise which we can await into a variable //contains the token and secret. the secret is used to create the other token which is compared with the sent one
  //The decoded (verification process) makes sure to us that the userwe issued the jwt is the one whoe id is in the decode payload
  // 3) Check if the user still exists
  const currentUser = await User.findById(decoded.id); //user based on the decode id
  //if the use nolonger there
  if (!currentUser) {
    //His id is nolonger in the decode payload ie the user was deleted from the database
    return next(
      new AppError('The user belonging to this token does nolonger exist.', 401)
    );
  }
  // 4) Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //This means if the password was changed //It will go to the above retun false in this function
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  //GRANT ACCESS TO THAT PROTECTED ROUTE
  //req object is the one that travels from middleware to middleware
  req.user = currentUser; //So as to use the currrent user in the next middleware function //Putting the entire user data on request //The code reaches this point when everything is correct
  res.locals.user = currentUser; //So as to ue thic in the template //Putting the current user on res.locals ie we have access to the user in our pug template//Passing data into a template using the render function //Means inside the template, there will be a variable called user ie every pug template will have access to res.locals
  next();
});

//MIDDLEWARE FOR ONLY RENDERED PAGES THEREFORE NO NEED OF ERROR(THERE ARE NO ERRORS) //KIND LIKE A PROTECT MIDDLEWARE BUT ON TEMPLATE SIDE
//middleware function to ren der login and sign up incase the user is not logged in and and also render sign out if he is logged in
exports.isLoggedIn = async (req, res, next) => {
  //PERFORM THE FOLLOWING WHEN THERE IS A COOKIE
  //for the rendered website the token is only sent using the cookie
  //We get a cookie when we log in
  if (req.cookies.jwt) {
    //Cacthing errors locally we use try catch
    try {
      // 2) Verification of the token
      //It should be the right token and should not have expired
      //decoded data object that contains the user id payload from this jwt like {id:3324444, etc} like the token is decoded can be abit read
      //Showing that the token payload is not manipulated by a malicious person
      const decoded = await promisify(jwt.verify)(
        //In logged out the jwt was not verified therefore, we went to the next middleware
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //Returns a promise which we can await into a variable //contains the token and secret. the secret is used to create the other token which is compared with the sent one
      //The decoded (verification process) makes sure to us that the userwe issued the jwt is the one whoe id is in the decode payload
      // 3) Check if the user still exists
      const currentUser = await User.findById(decoded.id); //user based on the decode id
      //if the use nolonger there
      if (!currentUser) {
        //His id is nolonger in the decode payload ie the user was deleted from the database
        return next();
      }
      // 4) Check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        //This means if the password was changed //It will go to the above retun false in this function
        return next();
      }
      //THEN THERE IS A LOGGED IN USER
      //Then make the user accessible to our templates
      //req object is the one that travels from middleware to middleware
      res.locals.user = currentUser; //Putting the current user on res.locals ie we have access to the user in our pug template//Passing data into a template using the render function //Means inside the template, there will be a variable called user ie every pug template will have access to res.locals
      return next();
    } catch (err) {
      return next(); //Go to the next middleware
    }
  }
  next(); //If ther is no cookie ie ther is no logged in user, the next middleware will be called right away hence it will not put the current user on res.locals
};

//THIS MIDDLEWARE IS SO IMPORTANT IN BUIDING APPLICATIONS
//We dont pass arguments to middlewares
// (...roles) for all the roles that were specified
exports.restrictTo = (...roles) => {
  //Which returns a middleware function its self that has access to roles
  return (req, res, next) => {
    //roles ['admin', 'lead-guide].role='user'
    //req.user is the current user
    if (!roles.includes(req.user.roles)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      ); //403 means forbidden
    }
  };
  next();
};

//PASSWORD RESET (STANDAND ie aplied to most of the spplication) incase one forgot the password
//You just provide your email address and then get an email with a lin that help you to which takes to the page where you can put in your new password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTED email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('There is no user with that email address.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //If not worked upon it creates errors in the response to thser if the user only sends his email for password reset //This deactivates all the validators defined in our schema //Because we didnt save the document in database after modifying it

  // 3) Send it back to the user's email
  //Incase of an error
  try {
    const resetUrl = `${req.protocal}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`; //Which protocal is it https or http //The link the user eceives in the email
    //Eg https://127.0.0.1:3000/api/v1/users/resetPassword/3030454434453

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    //These modify the data but does not save it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    //To save the data
    await user.save({ validateBeforeSave: false }); //If not worked upon it creates errors in the response to thser if the user only sends his email for password reset //This deactivates all the validators defined in our schema //Because we didnt save the document in database after modifying it
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //Token sent to the user is unecrtpted while that in the database is encrypted
  // 1) Get user based on the token
  //req.params.token is the token parameter specified by the user eg ....resetPassword/token
  const hashedToken = crypto //in DB
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); //Encrypting the sent token to user so as it natches that in database
  //finding the user and  also checking if the token has not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  //setting the password bt it does not save
  //setting the DB password to the new entered password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //deleting the password reset token after thie above but just modifies the document so we need to save it
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // we dont trun off the validator because we want it to check if the password=passwordConfirm
  // 3) Update the passwordChangedAt property for the current user
  //Done in the user model on the pre save middleware where the passwordChangedAt property was updated before the token was released
  // 4) Log the user in, send the JWT
  createSendToken(user, 200, res);
});

//Only works when the suer is already logged in
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from  collection
  //Already have the current user on the req object from the protect middleware and also ask for the password inorder to compare it with the one stored in the database
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if the POSTED current password is correct
  //Calling our function for checking the password ie correctPassword
  //If password is not correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3) If the password is correct, update the password
  //user.password is the DB password
  //These are two fields created in the req.body and in the DB for the set up new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //We want the validator to take action to confirm if the password=passwordConfirm because they have to be the same when entered
  //User.findByIdAndUpdate() can not work as intended
  // 4) log the use in, send JWT
  createSendToken(user, 201, res);
});
