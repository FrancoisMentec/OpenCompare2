var browser = typeof window !== 'undefined'

if (!browser) {
  Cell = require('./cell.js')
}

class Product {
  constructor (data, pcm, isFromDB = false) {
    this.pcm = pcm

    if (typeof data.id !== 'string') console.error('product id is incorrect (value : ' + data.id + ', type : ' + typeof data.id + ')')
    if (typeof this.pcm.productsById[data.id] !== 'undefined') console.error('product id already exists')
    this.id = data.id

    this.cells = []
    this.cellsByFeatureId = {}
    for (var c in data.cells) {
      this.addCell(data.cells[c], isFromDB)
    }

    this._color = null // used in vizualisations

    if (browser) {
      this._show = true
    }
  }

  get match () {
    for (var c = 0, lc = this.cells.length; c < lc; c++) {
      if (!this.cells[c].match) return false
    }
    return true
  }

  get show () {
    return this._show
  }

  set show (value) {
    if (value != this.show) {
      this._show = value
      for (var c = 0, lc = this.cells.length; c < lc; c++) {
        this.cells[c].div.style.display = this.show
          ? ''
          : 'none'
      }
    }
  }

  /**
   * return a color based on the product id (computed once)
   */
  get color () {
    if (this._color) return this._color

    var hash = 1
    for (var i = 0; i < this.id.length; i++) {
       hash *= this.id.charCodeAt(i)
    }

    var c = (hash)
        .toString(16)
        .toUpperCase()
    while (c.length < 6) {
      c += c
    }

    this._color = '#' + c.substring(0, 6)
    return this._color
  }

  addCell (cellData, isFromDB = false) {
    var cell = new Cell(cellData, this, isFromDB)
    this.cells.push(cell)
    this.cellsByFeatureId[cell.featureId] = cell

    return cell
  }

  export () {
    var cells = []
    for (var c = 0, lc = this.cells.length; c < lc; c++) {
      cells.push(this.cells[c].export())
    }

    return {
      id: this.id,
      cells: cells
    }
  }
}

if (!browser) {
  module.exports = Product
}
