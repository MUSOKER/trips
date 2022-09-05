const crypto = require('crypto'); //Random bit inbuilt node model function used for creating random tokens
const mongoose = require('mongoose');
const validator = require('validator'); //Validator package
const bcrypt = require('bcryptjs');
//Stateless means it is not saved any where

const userSchema = new mongoose.Schema({
  //Creating a new mongoose
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, //This transforms the email to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'], //Custom validator from documentation to prove whether the email is valid not like rogersm@gmail.com.de
  },
  photo: {
    type: String,
    default: 'default.jpg',
  }, //Optional though
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], //roles of different people
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8, //Password should have atleast 8 characters
    select: false, //Here password wont show up to the cliet like to any output // in comparision we use .select(+password) inorder to add it there for the purposes of comparing it with the DB password
  },
  passwordConfirm: {
    //To re enter yur password to make sure that its correct
    type: String,
    required: [true, 'Please confirm your password'], //Meaning its a required input
    validate: {
      //This only works on CREAT and SAVE!!! ie it can not work on things like update
      valdator: function (el) {
        return el === this.password; //abc=abc returns true therefore no error ie this.password is the initial password
      }, //Callback function which is called when a new document is created
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String, //These be in the database
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true, //Hidding this property from the user
    select: false,
  },
});

//Encrypting the passwords in the database ie use a middleware
//This runs between receiving the data and saving it to the database this for when a new password is created or updated
//this key word refers to the current document folr this case the user

userSchema.pre('save', async function (next) {
  //Only run this function if password was modified
  if (!this.isModified('password')) return next(); //Specifically the field is password then call the next middleware
  //this.password=to the current password in this document
  //hash is aychronous version
  //HARSH PASSWORD WITH HTE COST OF 12
  this.password = await bcrypt.hash(this.password, 12); //12(encrypt version) is the CPU intensive like the better the processor could be
  //DELETE THE PASSWORD CONFIRM FIELD
  this.passwordConfirm = undefined; //Like to delete the password confirm field in the database (so as not to be hashed)
  next();
});

//Changing the pasword changed ta property to right now incase we modified
//Running this function before a new document is saved
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //Incase we did not change the pasword property or if the documment is new then we dont manipulate the passwordChangedAt
  //If t does not pass the above
  //Saving to DB is slower than releasing the token then ie ensuring that he token is created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000; //Subtracting one second so as the passwordChangedAt property gets save first in the BD before the token is released on resertpassword
  next();
});

//A regular function ie function(){} provides acess to this key word
//Querying middleware that links active to the user
//Something that happen before a query ie find(should apply to every query that starts withnfind, findAndUpdate, findAndDelete)
userSchema.pre(/^find/, function (next) {
  //Since its a query middleware, this points to the current query
  //(/^)Means that those that starts with find
  //Only find properties in query where active is set to true
  this.find({ active: { $ne: false } }); //Only find documents whose active is set to true
  next();
});

//CHECKING IF THE USER PROVIDED PASSWORD = HARSHED PASSWORD IN DB
//Using an instance method (always available on all the documents of certain collection) e on user document like whenever we have a user any where
//method is correct password which accepts a candidate password the user passes in the body and the userPassword(harshed) in DB
//correctPassword is an instance method that takes in the entered password and the originating DB password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword); //This compare function returns a true if the two passwords are the same
};

//Creating another instance method available for all user documents
//JWTTimeStamp is the time stamp which says when the token was issued (when the token was issued to the user)
//In insatnce method this key word points to the current document
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  //By default this returns false from this method which says that the user has not changed his password after the token was issued
  if (this.passwordChangedAt) {
    //Meaning only if they have changed their password
    //Converting the changedTimestamp(when the password was changed) to same units(seconds) as JWTTimeStamp
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //10 Shows that its a base 10 number//passing it as an intenger
    return JWTTimestamp < changedTimestamp; //100 < 200 returns true for this 100 and 200
  }
  //FALSE MEANS NOT CHANGED ie JWTTimestamp < changedTimestamp
  return false;
};

//An intance method for creating password reset token (Has to be a random string)
userSchema.methods.createPasswordResetToken = function () {
  //Generating the reset token (which is sent to the user) which is again sent by the user together with the new rest password
  const resetToken = crypto.randomBytes(32).toString('hex'); //32 is number of bits and converting it to hex decimal string
  //Fairly encrypting the token
  //thi.passwordResetToken is what the token the user provides
  //Below is passwordResetToken encrtpted version in the database
  this.passwordResetToken = crypto //Creating this field in the object array in the database
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //sha256 is an encrypting algorithm then updating the variable where the token is stored and the storing it as hex decimal

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Expires in 10 minutes which is changed to milliseconds
  return resetToken; //This is what we want to send as an email to the user and it has to be unencrypted
};

//Creating a model out of the schema
//Model variables always start with capital letter
const User = mongoose.model('User', userSchema); //Model to be called User created out of the userSchema
module.exports = User;
