export const handleErrors = (errorResponse, errorsRef) => {
  if (errorResponse.errors) {
    // Clear existing errors
    for (const key in errorsRef) delete errorsRef[key];

    // Handle array of errors (dari express-validator)
    if (Array.isArray(errorResponse.errors)) {
      errorResponse.errors.forEach((error) => {
        errorsRef[error.path] = error.msg;
      });
    } 
    // Handle string error (dari catch block)
    else if (typeof errorResponse.errors === "string") {
      // Set generic error jika format string
      errorsRef.general = errorResponse.errors;
    }
    // Handle object errors
    else if (typeof errorResponse.errors === "object" && errorResponse.errors !== null) {
      Object.entries(errorResponse.errors).forEach(([key, value]) => {
        errorsRef[key] = value;
      });
    }
  }
};
