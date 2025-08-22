// Util polyfill for React Native
const util = require('util');

// Create a safe promisify that doesn't throw
const safePromisify = (fn) => {
  // If it's not a function, return a function that returns a rejected promise
  if (typeof fn !== 'function') {
    console.warn('util.promisify called with non-function:', fn);
    return (...args) => {
      return Promise.reject(new TypeError('The "original" argument must be of type Function'));
    };
  }
  
  // If the function already returns a promise, return it as-is
  if (fn.constructor && fn.constructor.name === 'AsyncFunction') {
    return fn;
  }
  
  // Otherwise use the original promisify
  if (util.promisify.original) {
    return util.promisify.original(fn);
  }
  
  // Fallback implementation
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
};

// Store the original promisify
safePromisify.original = util.promisify;

// Replace util.promisify with our safe version
util.promisify = safePromisify;

module.exports = util;