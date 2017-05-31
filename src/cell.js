exports = class Cell {
  constructor (data, product) {
    this.product = product

    if (typeof data.id !== 'string') console.error('cell id is incorrect')
    if (typeof this.product.cellsById[data.id] !== 'undefined') console.error('cell id already exists')
    this.id = data.id

    if (typeof data.featureID !== 'undefined') data.featureId = data.featureID
    if (typeof data.featureId !== 'string') console.error('cell featureId is incorrect')
    this.featureId = data.featureId

    this.value = data.value

    this.isPartial = typeof data.isPartial === 'boolean'
      ? data.isPartial
      : false

    this.unit = typeof data.unit === 'string'
      ? data.unit
      : 'undefined'
  }

  get value () {
    return this._value
  }

  set value (value) {
    var type = typeof value
    if (Array.isArray(value)) {
      type = 'multiple'
    } else if (type === 'object' || type === 'function') {
      console.error('a value can\'t be of type object or function')
    } else if (type === 'string') {
      if (value === 'true') {
        value = true
        type = 'boolean'
      } else if (value == 'false') {
        value = false
        type = 'boolean'
      } else if (/^(\d+((,|\.)\d+)?|\d{1,3}(\ \d{3})*((,|\.)(\d{3}\ )*\d{1,3})?)$/.test(value)) { // match integer and real with , or . as decimal separator and space every 3 number
        value = parseFloat(value.replace(',', '.').replace(/\ /g, ''))
        type = 'number'
      } else if (/^.+\.(jpg|jpeg|JPG|JPEG|gif|png|bmp|ico|svg)$/.test(value)) {
        type = 'image'
      } else if (/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w?=\.-]*)*\/?$/.test(value)) {
        type = 'url'
      }
    }

    this._value = value
    this.type = type
  }
}
