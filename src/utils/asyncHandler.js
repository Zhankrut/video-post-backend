// this module is used to handle the async functions in the routes and controllers
// sometimes the async functions can throw an error for that rather than using try catch block in every async function we can use this module
// it is a higher order function that takes a function as an argument and return a function
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }
}


export { asyncHandler };


// the below code is the same as the above code but in a different way
// const asyncHandler = (fn) => {}; // this is a higher order function that takes a function as an argument and returns a function
// const asyncHandler = (fn) => {() => {}}; // this is a higher order function that takes a function as an argument and returns a function
// const asyncHandler = (fn) => () => {}; // this is a higher order function that takes a function as an argument and returns a function
/*
//a simplified version of the asyncHandler function
const asyncHandler = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next); // Await the async function
      } catch (err) {
        next(err); // Catch any error and pass it to the next middleware
      }
    };
  };
*/

// const asyncHandler = (fn) => async(req, res, next) =>{
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code|| 500).json({
//             success: false,
//             message:error.message
//         })
//     }
// }