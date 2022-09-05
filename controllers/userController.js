const multer = require('multer'); //Used for uploading photos
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError'); //Global error handling  middleware
const factory = require('./handlerFactory');
const { findByIdAndUpdate } = require('./../models/userModel');
const { memoryStorage } = require('multer');

//diskStorage is important when you do not need any image processing
//Creating a multer storage (saving the image to disk)
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users'); //null means calling the cb with no error //error of null and then the path
//   }, //destination has access to current request, currently uploaded file and a call back function
//   filename: (req, file, cb) => {
//     //Providing a file nams ie user-id-time stamp.jpeg to ensure the same image does not have the same file name
//     //Extract the file name from the uploaded file ie extension of the file object that contains the mometype field ie image/jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}}`); //Gets the id from the currently logged in user //Calling the call back function with no error and also determinig the file name
//   },
// });

//Saving the image to memory hence the image will be stored as a buffer
const multerStorage = multer.memoryStorage();

//Creating a multer filter
const multerFilter = (req, file, cb) => {
  //Test if the uploaded file is an image and if its true we pass true in the cb and if false pass false i the cb along with an error
  if (file.mimetype.startsWith('image')) {
    cb(null, true); //Hence no error and then pass true
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

//Passing the storage and filter into the upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//Middleware for photo upload
exports.uploadUserPhoto = upload.single('photo'); //single ie one photo then photo is the field nmae that is going to hold this file (in the form that is going to upload the image) to hold the image to upload //Do not include the password in the body for update me route

//Resizing user photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //If there is no file on request then go to the next middleware
  if (!req.file) return next();
  //Defining the file name
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //Otherwise we do the image resizing using the sharp package
  //The store image is available at req.file.buffer since it istore as a buffer in the memory storage
  await sharp(req.file.buffer) //Calling sharp creates an object on which we use different methods in order to do our image processing
    .resize(500, 500) //Resize the width and the height
    .toFormat('jpeg') //To always convert the images to jpeg
    .jpeg({ quality: 90 }) //Compressing the image further(quality) of 90%
    .toFile(`public/img/users/${req.file.filename}`); //Finally we write it to a file on our disk (needs the entire path to the file)

  next(); //Calling the next middleware ie updateMe handler function
});

//Function for filtering the fields in the body object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //Looping through the keys in the object ie Object.keys returns an array containing all the key(field) names of obj
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]; //this creates that allowed new field into the newObj
  });
  return newObj;
};
//Routes handlers
//For the user to retrieve his oen data (from the ID coming from the cureently logged in user)
exports.getMe = (req, res, next) => {
  //Making the ID come from the automatically logged in user
  req.params.id - req.user.id;
  next();
};

//User updating his data but not the password because the password change is done in a diffrent route
exports.updateMe = catchAsync(async (req, res, next) => {
  //preventing a person from changing a password
  // 1) Create an error if user POSTs password data
  //req.body is the body we pass on the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out un wanted field names that are not that are not allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email'); //Filtering the req.body leaving only the name and the email //Adding urguments to be filtered ant the fields we want to keep in the body
  //Adding the image name to the database
  if (req.file) filterBody.photo = req.file.filename; //Adding a field of photo property to the filterBody object with a file name
  // 3) Update user document
  //If you are not dealing with password, use findByIdAndUpdate
  // (creting a function called filterBody ) because body.role:'admin' we dont use req.body because any one could change the role to admin, token ,when that reset token expires etc
  //data to be updated in the body should only contain name and email
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    //The updated data gets stored in the filterBody (DB)
    new: true,
    runValidators: true,
  }); //For now calling the data x //new set to true so as it brings the updated object
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser, //Sending that updated user to the client
    },
  });
});

//When the user wants to delet his account bt literally its made inacive
//Converting the active flag to false
exports.deleteMe = catchAsync(async (req, res, next) => {
  //the logged in user id is stored at req.user.id
  await User.findByIdAndUpdate(req.user.id, { active: false }); //This happens in the database making the user in DB inactive
  res.status(204).json({
    status: 'success',
    data: null, //We do not send any data back to the user
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    //500 is internal server error
    status: 'error',
    message: 'This route is not yet defined!',
  });
};
//Do NOTupdate passwords with this
//Done by the administrator
exports.updateUser = factory.updateOne(User); //For updating data that is not the password
exports.deleteUser = factory.deleteOne(User);
