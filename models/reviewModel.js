const mongoose = require('mongoose');
const { findByIdAndDelete, findByIdAndUpdate } = require('./tourModel');
const Tour = require('./tourModel');

//If you dont know how many arrays will grow then opt for parent referncing
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    //Tour and user being the parents of review in parent referencing
    //Referncing takes the ID input
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    //Now who wrote this review
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  //The virtual properties (fields that are not stored in DB when calculated in order to show up whenever there is an output)
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//POPULATING tour and user
reviewSchema.pre('/^find/', function (next) {
  //Works for all find methods ie findAll, findOne etc available in mongoose
  // this.populate({
  //   path: 'tour',
  //   select: 'name', //Only include the name
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});
//Called statics method so as to create the aggregate function on the model on the model(Review)
//REVIEW CONTAING ratings, tourID user id etc
//(Static function)Calculating the avearage rating each time a review is added or deleted and the tour will be automatically updated on its ratingsAverage
//Function takes in the tour ID to which the current review belongs to
//These are tours shown in the review
//Method to be performed on reviews (just a method to ba available and be called hence statics method)
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //tourId for which the current review was created
  //this key word points to the current model because aggregate is called on the model and that why we are using a static method
  const stats = await this.aggregate([
    //this returns a promise
    //Aggregation pipeline
    {
      //Select all the reviews that belong to the current tour that was passed i as the argument
      $match: { tour: tourId }, // focusing on all the reviews that match with that current Id
    },
    {
      //Calculating the statics
      $group: {
        //Where the statics be
        //groups all the reviews of that tour
        //In group always the first phase is the id
        _id: '$tour', //tour ID //Grouping all the tours together by tour //Common field that all the documents have in common that we want to group by
        //We want ot calculate number and rating in this aggregation

        nRating: { $sum: 1 }, //Number of rating we add one to each tour that was matched
        avgRating: { $avg: '$rating' }, //rating is the name of the field
      },
    },
  ]);
  // console.log(stats);

  //Transferring the calculated statics to the corresponding tour such that the tour in DB is updated with its own new ratings
  // Done by finding the current tour and update it
  if (stats.length > 0) {
    //Only perform this when there is one review or more
    await Tour.findByIdAndUpdate(tourId, {
      //The updated stats are stored as an array of stat ie [{id,nRating,avgRating}]
      //Filling in the updates ie saving the statics to the currrent tour
      //these are fileds on the tour
      ratingsQuantity: stats[0].nRating, //stat[0] is the position of the object array conataining the statics
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      //The updated stats are stored as an array of stat ie [{id,nRating,avgRating}]
      //Filling in the updates ie saving the statics to the currrent tour
      //these are fileds on the tour
      ratingsQuantity: 0, //We st back to the defaults
      ratingsAverage: 4.5,
    });
  }
};

//Creating the review index (One user can not write multiple reviews for the same tour)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //Combination of user and tour has to be unique ie a seu must have one review on a tour

//We need the current review then get the tour field Id and apply the above statics(calcAverageRatings)
//calcAverageRatings should be performed every time a new review is created hence this middleware
reviewSchema.post('save', function () {
  //This happens when the document is already saved in DB
  //works only on creating a review
  //Post(beacause we want to call this function after anew review has been created) because the review(avg rating) is saved when it is in database and it does not get access to next
  //this points to the current review (document saved)
  //this.constructor(helps to point to the current model) helps to call the function before the model Review because it has to be like Review.function
  this.constructor.calcAverageRatings(this.tour); //Saves it to the DB //(stands for the tour) //this points to the model ie this key word is the current document and the contructor is the model that created that document
});

//TO RUN caclAverageRatings function on delete or update on every where we use thw middleware below
//These can not work on the query middleware
//findByIdAndUpdate   works behind the scene as findOneAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //pre means before the query is executed
  //Use pre because we need to access query
  //In pre, data in DB  is not changed
  //Goal is get access to the curent review document
  //this key word is the current query then execute the query that will give us the document
  this.r = await this.findOne(); //Retrieving the current document from the DB //Creating a property on this variable //Find one gets the document from the database //r stands for review in order to get access to the review document
  // console.log(this.r); //this.r)(To enable us access it in the post middleware) is the review which contains a tour
  next();
});
//Passing the data (this.r ) from pre middleware to post middleware
//After the query has executed and therefore the review has been updated
reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne() does NOT work here beacause the query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
