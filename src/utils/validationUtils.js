export function validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && emailRegex.test(value);
};
  
export function validatePassword(value) {
    return value && value.length >= 6;
};