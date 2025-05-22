const appError = (status, errMessage, next)=>{
    const error = new Error(errMessage);    // 所以 error 是物件？
    error.status = status;
    // console.log("appErrorrrrrrr", error.status, error.message, error);
    return error;
}

module.exports = appError;