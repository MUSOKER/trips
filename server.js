const mongoose = require('mongoose');
const dotenv = require('dotenv'); //module for enviroment

//BETETR TO DECLAIRE IT BEFORE REQUIRING OUR MAIN APPLICATION
//ERRORS DUE TO UNCAUGHTEXCEPTIONS(SYNCHRONOUS CODE) Eg console.log(x) which does not exist
// process.on('uncaughtException', (err) => {
//   console.log('UNCAUGHT EXCEPTION !😔  Shutting down...');
//   console.log(err.name, err.message); //Prints the error bame and message to the console //Gives a message Reference Error x is not defined //Defaults in errors in node js
//   process.exit(1); //to shut down the application and 1 is uncalled execution
// });

dotenv.config({ path: './config.env' }); //Specifying the path for our development
const app = require('./app');

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
      useUnifiedTopology: true,
    }
    //this returns a promise which is thened
  )
  .then(() => {
    console.log('DB connection successful!');
  });
//.catch((err) => console.log('ERROR')); //Catching the error incase of a problem in the database connection due to unhandled promse rejection
//console.log(app.get('env')); //to get the enviroment we are working in this z for express
//console.log(process.env); // Node js enviroment variables

// //Document created out of the tour model
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// //methods that can be applied to the document
// testTour
//   .save()
//   .then((doc) => {
//     //It provides a document
//     console.log(doc); //saving it to the tour collection in the database and it creates a promise
//   })
//   .catch((err) => {
//     //This is to catch an error incase it happens when we are saving our document to database
//     console.log('ERROR😞:', err);
//   });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
//BELLOW ARE THE ERROR HANDLERS
//HANDLES ERROR THAT OCCUR IN ASYNCHRONOUS CODE
//unhandled rejection in the process object
//This deals with the promise rejection which may not catch in the application is handled here
// process.on('unhandledRejection', (err) => {
//   console.log('UNHANDLED REJECTION !😔  Shutting down...');
//   //console.log(err) this console logs the err stack
//   console.log(err.name, err.message); //Prints the err name and err message to the console //Gives a message like bad authentication failed due to wron password //Defaults in errors in node js
//   server.close(() => {
//     //this call back function(server.close()) gives the server time to finish all the requests that have been pending or being handled at a time
//     process.exit(1); //to shut down the application and 1 is uncalled execution
//   });
// });
