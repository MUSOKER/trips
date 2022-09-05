//READING THE JSON FILE
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); //module for enviroment
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' }); //Specifying the path for our development
//CONNECTING TO DATABASE
//process.env is like an object array in the config.env file
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
//Calling our mongoose
//always copy and use them when you are writing your application
mongoose
  .connect(
    DB,
    {
      //'mongodb+srv://zac:test1234@cluster0.ytputqf.mongodb.net/natours?retryWrites=true&w=majority'
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
    //this returns a promise which is thened
  )
  .then(() => {
    console.log('DB connection successful!');
  });

//READING JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //Json converted into javascript
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8')); //Json converted into javascript
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
); //Json converted into javascript

//IMPORTING DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); //All the validation in the model will be skipped //To remove the validations to allow import our own data
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //to stop the process of importing data
};

//DELETE ALL THE DATA IN DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //to stop the process of deleting
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

//process.argv is an array directory
console.log(process.argv);
