function isUrl (value) {
  return /^(https?:\/\/)?([\w-\.]+)\.([a-z\.]{2,})(\/.*)?$/.test(value)
}

function isMail (value) {
  return /^[^@\s]+@[^@\s]+\.[a-zA-Z]+$/.test(value)
}

/**
 * Return if value is a valid date
 * @param {string} value - the value to test
 */
function isDate (value) {
  return !isNaN(Date.parse(value))
  // regex for ISO 8601 : ^((\+|-)\d{2})?\d{4}(-\d{2}(-\d{2}(T\d{2}(:\d{2}(:\d{2}(\.\d{3}(Z|(\+|-)\d{2}:\d{2})?)?)?)?)?)?)?$
}

function detectType (value) {
  var type = typeof value
  if (value == null) {
    type = 'undefined'
  } else if (Array.isArray(value)) {
    type = 'multiple'
  } else if (type === 'object' || type === 'function') {
    type = 'undefined'
    value = null
  } else if (type === 'string') {
    if (value.length == 0) {
      type = 'undefined'
    } else if (/^true$/i.test(value)) {
      value = true
      type = 'boolean'
    } else if (/^false$/i.test(value)) {
      value = false
      type = 'boolean'
    } else if (/^\s*(\d+((,|\.)\d+)?|\d{1,3}(\ \d{3})*((,|\.)(\d{3}\ )*\d{1,3})?)\s*$/.test(value)) { // match integer and real with , or . as decimal separator and space every 3 number
      value = parseFloat(value.replace(',', '.').replace(/\ /g, ''))
      type = 'number'
    } else if (/^.+\.(jpg|jpeg|JPG|JPEG|gif|png|bmp|ico|svg)$/.test(value)) {
      type = 'image'
    } else if (isUrl(value)) {
      type = 'url'
    } else if (isDate(value)) {
      type = 'date'
      value = new Date(value)
    }
  }

  return {
    type: type,
    value: value
  }
}

if (typeof window === 'undefined') {
  module.exports.isUrl = isUrl
  module.exports.isMail = isMail
  module.exports.isDate = isDate
  module.exports.detectType = detectType
}
