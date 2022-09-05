const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  //Using parent referencing where we keep a reference to the tour and the user who booked a tour ie every tour and user will contain a booking
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour', //points to the tour model
    required: [true, 'Booking must belong to a Tour!'], //here the statement suggest that this is parent refering
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', //points to the tour model
    required: [true, 'Booking must belong to a User'],
  },
  price: {
    type: Number,
    require: [true, 'Booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    //Here the person might not use a credit card or pays cash, then the administrator might manually using the bookings APA indicate paid or not paid
    type: Boolean,
    default: true,
  },
});

//Populate the user and the tour automatically whenever there is a query eg for the guides to get to know who has actually booked a certain tour
//For hte tour,we shall only selsect the tour name
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    //only view the tour name
    path: 'tour',
    select: 'name',
  });
  next();
});
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
