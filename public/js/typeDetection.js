function isUrl (value) {
  return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w?=\.-]*)*\/?$/.test(value)
}

if (typeof window === 'undefined') {
  module.exports.isUrl = isUrl
}
