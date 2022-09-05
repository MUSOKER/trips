const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel'); //Importing the user user model
//const validator = require('validator');
//Creating schema ie describing our data
const tourSchema = new mongoose.Schema(
  {
    //this contains two objects ie {main},{eg virtuals}
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Atour must have less or equal then 40 characters'], //what is needed an the error message
      minlength: [10, 'Atour must have more or equal then 10 characters'], //what is needed an the error message
      //inbuilt Validator
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], //Using the installed validator package tha name shoul only be alphates
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Atour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Atour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //enum is only for strings
        values: ['easy', 'medium', 'difficult'], //enum is the validator to specify that the difficlut must only be esy, mediun and difficult
        message: 'Difficulty is either: easy, medium or difficlut',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //4.6666  46.66 47  4.7 //val is the current value this function runs when ever a new value is set for this field
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //Our own built validator like customized
      validate: {
        validator: function (val) {
          //Here the this key word points to the current document when we are creating a new document
          return val < this.price; //100< 200 true
        },
        message: 'Discount price ({VALUE}) should be below regular price', //VALUE is the value that was input mongoose ha ccess to it
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Atour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Atour nust have a cover image'],
    },
    images: [String],
    createdAt: {
      //time when the user creates a tour
      type: Date,
      default: Date.now(),
      select: false, //To avoid the from getting to know when the tour was created
    },
    startDates: [Date], //Date when a  tour starts
    secretTour: {
      type: Boolean,
      default: false, //Since its a secret we do not want it to show up
    },
    //Specifying geospatial data must contiain an object with atleast two field names
    //An embedded object
    startLocation: {
      //GeoJSON inorder to specify geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //Longitude first and followed by latitude //Expecting an array of numbers
      address: String,
      description: String, //Location description
    },
    //Location should be an array which creates a brand new document inside the tour(Parent document)
    location: [
      //These are the locations in which that particular tour(id) belong
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], //Longitude first and followed by latitude //Expecting an array of numbers
        address: String,
        description: String, //Location description
        day: Number, //The day people will go to  location
      },
    ],
    //How to reference ie the tour document will only contain the ids of the guides
    guides: [
      //These coud be users
      //Always we pass the guides id array in this when creating a new tour
      {
        //This returns their IDs just not the guides in the DB
        type: mongoose.Schema.ObjectId, //Except the type of each of the element in the guides array to be mongo db ID
        ref: 'User', //How we esatblish references btn different datasets in mongoose we dont need to import the suer into this document
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//MONGOOSE MIDDLEWARE
//to filter out quickly the most liked to be query searched eg price and 1 is sorting in ascending order
//Eg returned 3 documents that were only scanned in ascending order
//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); //Compound index
tourSchema.index({ slug: 1 }); //Creating an index still called slug
//index for geospatial query for the geospatial data we are searching for is stored is startLocation
tourSchema.index({ startLocation: '2dsphere' }); //startLocation is indexed to a 2dsphere (earth like sphere where our earth like data is located )
//Creating a virtual property
//This prevents storing it in the database bt used as soon as we get the data
//This is an example of a business logic coz its not used in the cotroller
tourSchema.virtual('durationWeeks').get(function () {
  //This adds it(durationWeeks) as property to our data
  //Used a regular function because an arroe function does not get its own this key word
  return this.duration / 7; //this key word points to the current document //to return the number of weeks
});

//VIRTUAL POPULATING (coz the parents(tour) dont know about their reviews)
//Virtual populate is to keep the review IDs to the tours(like tour gets to kmnow its review)  without persisiting it in thne DB which solves the problem of child referemcing
//Virtual popilating so as the tour gets to kmnow its reviews
//With this the field reviews will output on every tour searched
tourSchema.virtual('reviews', {
  //  Child referencing the reviews(children withou persisting it to the DB)
  //so as the tour gets to know its reviews
  ref: 'Review', //Name of the model we want to reference
  foreignField: 'tour', //(to connect these two models) is the name of the field in the other model(Review) where the refrence to the current model is stored
  localField: '_id', //(id is waht is displayed in the reviews for the tour field) //How its called in the local model(id) and its called tour in the foreign model(Review model)
});

//DOCUMENT MIDDLEWARE: runs before the .save() and the .create() command
//This happens every time a new tour is save ie created (When creating new documents) responsible for performing embedding
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id)); //Results of this al promises //looping through the user id and for each iteration get the user document for each id
//   //Overwriting the array of user ids with the array of user documents and awaiting the promise
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// Document middleware that works of the cujrrently executed document
//So the current event is save with a function which is caled before the actual document is saved to the database
//Creating a model out of the schema
tourSchema.pre('save', function (next) {
  //next parameter is used and called beacause we have created another middleware in mongoose
  //console.log(this); //this key word points on the currently processed document like brings out the newly created document before saved to the database
  //Adding a slug property
  this.slug = slugify(this.name, { lower: true }); //Adding a slug property ie (slug :test-tour 3) where test tour 3 is the name
  //this.name is name field in the this document
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will sve document.....');
//   next();
// });

// //post middleware functions are executed after when all the pre middleware are executed
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE : allows to run functions after or before a certain query is executed
//this wiil run before a find query is executed
tourSchema.pre(/^find/, function (next) {
  //Means this should be executed with all the methods that have find key word eg findOne()
  //tourSchema.pre('find', function (next) {
  //This is executed before the mainf Tour.find() method
  //This tours are secret
  //Here the this key(object) word will point to the current query
  this.find({ secretTour: { $ne: true } }); //Selecting all the document where secret tour is not true
  this.start = Date.now(); //Creates a field (start) when this occured
  next(); //We do not want the secret tours to show up in the find
});
//TO POPULATE THE DOCUMENT
//This will run every time there is a query that deals with find like finding a tourSchema, tours etc
tourSchema.pre(/^find/, function (next) {
  this.populate({
    //Ths points to the currrent query
    path: 'guides',
    select: '-__v -passwordChangedAt', //To remove these two fields from the returned data after getting a tour
  }); //populate is getting e certain refrenced field //what we what to populate
  next();
});

//The middleware below runs after the query has been executed
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  //console.log(docs);
  next();
});
//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function () {
//   //this key word points to the current aggregation object that goes to the pipeline function and unshift
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //Unshift is to add an element at the beginning of an array
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   rating: 4.7,
//   price: 497,
// });
// testTour.save().then((doc) => {
//   console.log(doc).catch((err) => {
//     console.log('ERROR:', err);
//   });
// });
//We only export the mmodel ie tour for this case
module.exports = Tour;
