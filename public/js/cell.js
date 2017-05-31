var browser = typeof window !== 'undefined'

if (!browser) {
  isUrl = require('./typeDetection.js').isUrl
}

class Cell {
  constructor (data, product, isFromDB = false) {
    this.product = product

    if (typeof data.id !== 'string') console.error('cell id is incorrect (value : ' + data.id + ', type : ' + typeof data.id + ')')
    if (typeof this.product.cellsById[data.id] !== 'undefined') console.error('cell id already exists')
    this.id = data.id

    if (typeof data.featureID !== 'undefined') data.featureId = data.featureID
    if (typeof data.featureId !== 'string') console.error('cell featureId is incorrect')
    this.featureId = data.featureId

    if (isFromDB) {
      this._value = data.value
      this.type = data.type
    } else {
      this.value = data.value
    }

    this.isPartial = typeof data.isPartial === 'boolean'
      ? data.isPartial
      : false

    this.unit = typeof data.unit === 'string'
      ? data.unit
      : 'undefined'

    if (browser) {
      this.match = true // used for configurator / filter

      this.div = document.createElement('div')
      this.div.className = 'pcmCell'
      this.div.innerHTML = this.html
    }
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
      if (/^true$/i.test(value)) {
        value = true
        type = 'boolean'
      } else if (/^false$/i.test(value)) {
        value = false
        type = 'boolean'
      } else if (/^(\d+((,|\.)\d+)?|\d{1,3}(\ \d{3})*((,|\.)(\d{3}\ )*\d{1,3})?)$/.test(value)) { // match integer and real with , or . as decimal separator and space every 3 number
        value = parseFloat(value.replace(',', '.').replace(/\ /g, ''))
        type = 'number'
      } else if (/^.+\.(jpg|jpeg|JPG|JPEG|gif|png|bmp|ico|svg)$/.test(value)) {
        type = 'image'
      } else if (isUrl(value)) {
        type = 'url'
      }
    }

    this._value = value
    this.type = type
  }

  get html () {
    var html = ''

    switch (this.type) {
      case 'string':
      case 'number':
      case 'boolean':
      default:
        html += this.value
        break
      case 'url':
        html += '<a href="' + this.value + '" target="_blank">' + this.value + "</a>"
        break
      case 'image':
        html += '<img src="' + this.value + '">'
        break
      case 'multiple':
        for (var i = 0, li = this.value.length; i < li; i++) {
          if (i > 0) html += ', '
          html += this.value[i]
        }
        break
    }

    return html
  }

  export () {
    return {
      id: this.id,
      featureId: this.featureId,
      type: this.type,
      isPartial: this.isPartial,
      unit: this.unit,
      value: this.value
    }
  }
}

if (!browser) {
  module.exports = Cell
}
