// 是否為 undefined 的型態
function isUndefined(value) {
    return value === undefined;
}

// 是否不為字串的防呆
function isNotValidString(value) {
    return typeof value !== "string" || value.trim().length === 0 || value === "";
}

// 是否不為數字(整數)的防呆
function isNotValidInteger(value) {
    return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

// 是否為有效密碼格式
function isValidPassword(value) {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;    
    return passwordPattern.test(value);
}

// 是否為 email 格式
function isValidEmail(value) { 
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(value);
}

  
module.exports = {
    isUndefined,
    isNotValidInteger,
    isNotValidString,
    isValidPassword,
    isValidEmail
};