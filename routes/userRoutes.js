const express = require('express'); //Express module
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const { route } = require('./reviewRoutes');

const router = express.Router();
//User routes are abit diffrent from the other routes
//route for signing up
//USER ROUTES
//These include passwords
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout); //We are simply getting a cookie

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); //token is the user parameter

//Protect all routes after this middleware
//This middleware auth protect all the routes that come after this point because middlewares run in a sequence (using this mini app called router)
router.use(authController.protect);

//To perform this you need to be logged in
router.patch('/updateMyPassword', authController.updatePassword);
//authController.protect gets the user ID from the jwt sent to the user(save)
router.get('/me', userController.getMe, userController.getUser); //We have to be logged in then putting the user ID into the params then finally get the user whe his logged in id has gone to params by the middleware before
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe); //Do not include the password in the body for update me route

//Should be performed by administrators
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router; //Exporting the module
