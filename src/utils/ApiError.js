// hey github copilot only suggest comment for me, I will write the code myself
// this file is for handling errors in the application the ApiError class is a custom error class that extends the Error class

class ApiError extends Error {
    constructor(
        statusCode, 
        message="something went wrong",
        errors =[],
        stack = null
    ) {
       super(message);
       this.statusCode = statusCode;
       this.data = null;
       this.message = message;
       this.success = false;
       this.errors = errors;

       if(stack) {
            this.stack = stack;
       }else{
            Error.captureStackTrace(this, this.constructor);
       }
    }
}

export { ApiError };