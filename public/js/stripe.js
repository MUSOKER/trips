import axios from 'axios';
import { showAlert } from './alerts';

/* eslint-disable */ //because eslint is specified for node js only
const stripe = Stripe(
  'pk_test_51LP0i1BuplnnDRzntTSFW6xgBw9qKb2ZrqvmmLH7TgmVKgtbBC9g2bUF2fLqPzzrweTSL3njGLiEZgvE9cYlmpub00TeHNG6lf'
); //This is the stripe object we get from the script injected in the base but use the public key

export const bookTour = async (tourId) => {
  //This takes in the Id from tour.pug (button where the user click book tour)
  try {
    // 1) Get checkout session from API (server)
    //await the session with an http request
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    /// 2)Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      //In session, there was a data object cerated in there
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    //Show an alert whwn ever there is an error
    showAlert('error', err); //specifying its an error and the err as the message
  }
};
