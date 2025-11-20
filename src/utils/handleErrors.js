export const handleErrors = (errorResponse, errorsRef) => {
  if (errorResponse.errors) {
    for (const key in errorsRef) delete errorsRef[key]

    errorResponse.errors.forEach((error) => {
      errorsRef[error.path] = error.msg
    })
  }
}
