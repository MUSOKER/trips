//const req = require('express/lib/request');
const multer = require('multer'); //Used for uploading photos
const sharp = require('sharp');
const { findByIdAndUpdate } = require('./../models/tourModel');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

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
//middleware for uploading multiple tour images
//A mix of images
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, //Specifying the field name its one imageCover (one field)
  { name: 'images', maxCount: 3 }, //Other fields in the database
]);

//On req, it puts the file property like below
// upload.single('image'); //For one image produce req.file
// //If we had one field not involving the imageCove
// upload.array('images', 5); //Field name and the maxCount of 5 produce req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) processing the imageCover
  //req.files is an object with with 1field name field:imageCover array containing the filename field 2 buffer filed
  //Since tour updates are taken from req.body then we tensfer the imageCoverFile to req.body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg `; // puts this to DB
  await sharp(req.files.imageCover[0].buffer) //Calling sharp creates an object on which we use different methods in order to do our image processing
    .resize(2000, 1333) //3:2 ratio
    .toFormat('jpeg') //To always convert the images to jpeg
    .jpeg({ quality: 90 }) //Compressing the image further(quality) of 90%
    .toFile(`public/img/tours/${req.body.imageCover}`); //Finally we write it to a file on our disk (needs the entire path to the file)

  // 2) processing the other images
  //images is still an array of elements with the file name etc
  req.body.images = [];
  //using a loop to process all the images
  await Promise.all(
    req.files.images.map(async (file, i) => {
      //Addings images field onto the req.body and use map to save the 3 promises of these 3 async functions which we can await using promise.all
      //the file array contains the filename, buffer etc
      //In the files array
      //use Promise.all to for te array
      //We use map to create an array of promises such that we can await them util when the image processing is done and move on to next line(middleware to update)
      //With a call back function for which we get acess to the current file
      //Creating the current file name
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg `; // i is the current index
      await sharp(file.buffer) //Calling sharp creates an object on which we use different methods in order to do our image processing
        .resize(2000, 1333) //3:2 ratio
        .toFormat('jpeg') //To always convert the images to jpeg
        .jpeg({ quality: 90 }) //Compressing the image further(quality) of 90%
        .toFile(`public/img/tours/${filename}`); //Finally we write it to a file on our disk (needs the entire path to the file)

      //In each iteration we push the current name to the new created image array
      req.body.images.push(filename); //pushing the image files into the images array created
    })
  );
  next();
});

//This was for testing purposes
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) //2 dots mean to go up in one folder ie moving from natours folder to routes folder
// ); //Converting the json into an array
//routes handlers functions
//req.params is like {id:5} then the req.params.id is the 5
//params middleware for checking the ID

// exports.checkId = (req, res, next, value) => {
//   console.log(`Tour id is ${value}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({ status: 'fail', meassage: 'Invalid ID' });
//   }
//   next();
// };

//check function for name and price
//req.body is what in tours.json
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); //Path property is the field we want to populate

exports.createTour = factory.createOne(Tour);
// try {

// //At this step write in postman body of the above url what you what to send to the server
// console.log(req.body);
// //Addding the body onto our database ie tours-simple.json
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body); //Ceraeting the new tour inform id:newId containing the body(req.body)
// tours.push(newTour); //pushing the newtour into the tours array
// //writing the file into tours-simple.json
// //Writing back the tours that contains the newtour
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours), //making what we what to write json
//   (err) => {
//     //This is done when the file is done written to tours-simple.json
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tours: newTour,
//       },
//     });
//   }
// );
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }

//exporting the handlers
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour); //Calling the factory handler function from handlerFactory.js
// exports.deleteTour = catchAsync(async (req, res) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     //Works for thing of the id
//     //Use new every time we call that fnction the second time
//     //next(error) ie as soon as next receivessomething it assumes it as error an pushes it to error handling middleware
//     return next(new AppError('No tour found with that ID', 404)); //if no tor found it goes to the error handling middleware
//     //We use return in order to return this function immediately no to move on to next line
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null, //We send null when deleting
//   });
// });

//Calculating a couple of statics about ur tours
exports.getTourStats = catchAsync(async (req, res, next) => {
  //match is a query object
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      //Group allows grouping objects together using accumulators
      $group: {
        _id: { $toUpper: '$difficulty' }, //Gaining the stats in groups of difficulty, medium and easy
        //_id:'ratingsAverage', //Gaining the stats inorder of ratingsAverage like how many have the ratingsAvearge as 4.7
        numTours: { $sum: 1 }, //Adding 1 to the numTour counter to get the number of tours
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAvearge' }, //$ specifying the field from where we calculate the average
        avgPrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
      },
    }, //This creates a sequence of stages
    {
      $sort: {
        avgPrice: 1, // 1 by ascending
      },
    },
    // {
    //   $match:{_id:{ne:'EASY'}} //matches that are not eaqual to easy ie medium and difficulty
    // }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats, //sending the stats to the client
    },
  });
});

//getting the monthly plan
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //req.params ie {year: 4}
  const year = req.params.year * 1; //2021 //from sting to number

  // Which ever has $ sign is a method that has to searched for in the documentary
  const plan = await Tour.aggregate([
    {
      //unwind outputs distruct the startDates and outputs one tour document eg giving each date its specific tour
      //one tour for each of the states in the array
      $unwind: '$startDates',
    },
    {
      $match: {
        $startDates: {
          //Etracting from january to december of 2021
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },

    {
      $group: {
        _id: { $month: 'startDates' }, //to extrct the month out of the startDates ie gruoping by the month
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, //creating the name of the tours array from the name field that correspond to the above in the group
      },
    },
    {
      $addFields: { month: '$_id' }, //Adding the field called month with the value id
    },
    {
      $project: {
        _id: 0, //means that the id does not show up
      },
    },
    {
      $sort: {
        numTourStarts: -1, //in ascending order
      },
    },
    {
      $limit: 12, //Allows only 12 outputs
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan, //sending the plan to the client
    },
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit',
//distance parameter and center/:latlng is where you are currently Eg tou are in los Angeles and you want to know the tours with in a distance of 200 miles
//tours-within/233/center/34.111745,-118.113491/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  //distructuring in order to get all our data (variables) at once from parameter
  const { distance, latlng, unit } = req.params; //All this comes from req.params
  //latlng is a string so spliting it by a comma
  const [lat, lng] = latlng.split(','); //This creates an array of two elements
  //But radius has a special unit called radians by mongoDB (divide our distance by the radius of the earth(3963.2))
  //if units are in miles. ternary opearator else if in kilometers
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    //More operation queries in atlas mongDB documentation
    startLocation: { $geoWithin: { $centreSphere: [[lng, lat], radius] } }, //Always lng followed by lat  //centreShpere takes in an array of cordinates of the its centre and the radius
  }); //geoWithin is a special geospatial opearator //specifying Query for start location (the start fields)
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//Gonna use the aggregation pipe line(Always used to perform calculations and is always called on the model its self)
exports.getDistances = catchAsync(async (req, res, next) => {
  //From start location to present location(lnglat)
  const { latlng, unit } = req.params; //All this comes from req.params
  //latlng is a string so spliting it by a comma
  const [lat, lng] = latlng.split(','); //This creates an array of two elements

  //Converting from metre to miles(when we want miles) and if metres then convert to km (when we want km)
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    //geoNear needs to always be the first stage in the pipeline
    //Distances are calculated from the startLocation to the near point(latlng)
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], //Converting them to numbers
        }, //requires atleast one of our fields contain a geospatial index like here for startLocation field contains a geospatial index hence geoNear will use that index to perform calculation otherwise use the keys to define
        distanceField: 'distance', //Where the calculated distances will be stored
        distanceMultiplier: multiplier, //TO CONVERT METRES TO KM whenever there is a distance(multiplied with all the distances)
      },
    },
    {
      //Project is only what we want to be displayed to avoid all the clutter(useless) we have
      $project: {
        distance: 1, //To keep the distnace
        name: 1, //to know what tour we are talking about
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
