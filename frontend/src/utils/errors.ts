export const toErrorString = (error: Error = new Error('Unknown error')) => {
  let errorString = ''

  if (Object.prototype.hasOwnProperty.call(error, 'message')) {
    errorString = (error as Error).message
  } else if (typeof error === 'object') {
    errorString = JSON.stringify(errorString)
  } else {
    errorString = error
  }

  return errorString
}
