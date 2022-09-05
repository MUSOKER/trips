//CATCHING ASYNC ERROR
module.exports = (fn) => {
  //Async function(fn) returns a promise which we catch
  //The below function is called as long as the creat new tour handler is created
  //return function with res,req and next parameter and it doest and try catch
  return (req, res, next) => {
    //the return is what express calls
    fn(req, res, next).catch(next); //Calling the function this next passes the error in the next function such that it goes in the error handling middleware
  };
};
