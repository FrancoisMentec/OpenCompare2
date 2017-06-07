function isUrl (value) {
  return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w?=\.-]*)*\/?$/.test(value)
}

function isMail (value) {
  return /^[^@\s]+@[^@\s]+\.[a-zA-Z]+$/.test(value)
}

if (typeof window === 'undefined') {
  module.exports.isUrl = isUrl
  module.exports.isMail = isMail
}
