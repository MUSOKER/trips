const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

//Generalisation of functions
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      //Works for thing of the id
      //Use new every time we call that fnction the second time
      //next(error) ie as soon as next receivessomething it assumes it as error an pushes it to error handling middleware
      return next(new AppError('No document found with that ID', 404)); //if no tor found it goes to the error handling middleware
      //We use return in order to return this function immediately no to move on to next line
    }
    res.status(204).json({
      status: 'success',
      data: null, //We send null when deleting
    });
  });

// exports.deleteTour = catchAsync(async (req, res) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id, req.body);
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
//Populate options since its contained in getting a tour with its reviews
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //Create a query to cater for the populate option
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    //populate ie to fill out the fields called guides in our model in the query but not in the actual DB
    //Adding a qn mark to the parameter makes it optional
    //console.log(req.params); //params is where endpoint variable like id for this case are stored
    //req.params is an id array eg {id:1}
    //creating the array of that specific id or parameter
    //const id = req.params.id * 1; //Converts the id strings to numbers
    // const tour = tours.find((el) => el.id === id);
    // //if (id > tours.length) {

    //if no tour iks found
    if (!doc) {
      //Works for thing of the id
      //Use new every time we call that fnction the second time
      //next(error) ie as soon as next receivessomething it assumes it as error an pushes it to error handling middleware
      return next(new AppError('No document found with that ID', 404)); //if no tor found it goes to the error handling middleware
      //We use return in order to return this function immediately no to move on to next line
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow nested GET reviews on tour (hack)
    let filter = {};
    //GET ALL REVIEWS ON TOUR
    //For the get url method
    //To give all the reviews whose tourId is indicated in the params
    if (req.params.tourId) filter = { tour: req.params.tourId }; //then without the tour Id(Nested route) then filter object will be empty which returns all the reviews

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query) //this contains the object and the query string when search Tour.find() creates a query
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain(); //.explian give deatils of waht was searched for eg out 9 we obtained 3 results that coresponded to what was needed //here the query is executed
    const doc = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //find a tour by id and update it, id and want we want to change {} are the options
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //we dont save the variable coz we dont send the data back
      new: true, //to return the new updated document
      runValidators: true, //for a number should be a number not a string
    });

    if (!doc) {
      //Works for thing of the id
      //Use new every time we call that fnction the second time
      //next(error) ie as soon as next receivessomething it assumes it as error an pushes it to error handling middleware
      return next(new AppError('No document found with that ID', 404)); //if no tor found it goes to the error handling middleware
      //We use return in order to return this function immediately no to move on to next line
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc, //sending the updated tour property back to the client
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //In async await we test the errors using the try catch method

    //Creating a new doc using the Model model
    //async await prevents the creating of a promise that could use .then
    const doc = await Model.create(req.body); //req.body is the data that comes with the post request
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
