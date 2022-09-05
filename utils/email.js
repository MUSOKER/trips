const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const AppError = require('./appError');

//When ever we want to send a new  email, we import this wmail class and use it as below
//new Email(user, url).sendWelcome();//This helps to send different emails for different scenarios //User might contain the name and the email address, url forexample the reset password url and the method that is going to sendd the email. //send welcome when ever user signs up for an application

//A CLASS MUST HAVE A CONSTRUCTOR A FUNCTION WHICH NEEDS TO ALWAYS RUN WHEN EVER A NEW OBJECT IS ADDED TO THAT CLASS
//An email class
module.exports = class Email {
  //since we passed the user and the url ito the new email, then our construture needs to take these as arguments
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url; //this.url=incoming url
    this.from = `Rogers Musoke <${process.env.EMAIL_FROM}>`;
  }
  //A method in order to create the transport
  newTransport() {
    //here we need different traansports whether we are in production or not
    if (process.env.NODE_ENV === 'production') {
      //use sendgrid ie sends the email to the person
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    } //otherwise  return the email trap nodemailer.createTransport
    // 1) Create a transporter like gmail
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      PORT: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //Activate in gmail the "less sucure app" option
    });
  }
  //The method that does the actual sending
  async send(template, subject) {
    //This receives a template and a subject
    // 1) Render HTML based on  a pug template ie the one we are passing into the template
    //Render function create the HTML based on the pug template and send it to the client
    //taking in the file and render the pug code into real html
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      //Passing in the render options
      //these options are included(substitute) in the email templates
      firstName: this.firstName,
      url: this.url,
      subject, //Included as title=base in the baseEmail template
    }); //Indicating where the file could be making it an html
    //Create the html out of the template and send it as an email
    // 2) Define the email options ie incleded in the entire email
    const mailOptions = {
      from: this.from,
      to: this.to, //Coming from the above options //Kinda creating a field
      subject, //Coming from the above options
      html,
      text: htmlToText.fromString(html), //Coverting the html to text and the string comes from html
      // html:
    };
    // 3) Create a transport and send email
    //Using the transporter objected
    await this.newTransport().sendMail(mailOptions);
  }
  //Specific functions
  //Send the actual eamil like welcome, password reset
  async sendWelcome() {
    //This function makes the welcome template get used when ever the it is called
    //this method calls the method send with the template and the subject we want for this email hence making it easy to create different emails we want for this kind of application
    await this.send('welcome', 'Welcome to the Natours Family!'); //use this because these methods are going to be defined on the current object //pass in the template name(welcome) and the subject line
  }
  //Sending the resetPassword email
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)' //This appears as the heading line but not in the body of the eamil sent
    );
  }
};
