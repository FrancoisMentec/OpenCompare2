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
    this.cellsById = {}
    this.cellsByFeatureId = {}
    for (var c in data.cells) {
      this.addCell(data.cells[c], isFromDB)
    }

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

  addCell (cellData, isFromDB = false) {
    if (typeof cellData.id === 'undefined') {
      var id = 0
      while (this.cellsById['C' + id]) id++
      cellData.id = 'C' + id
    }
    var cell = new Cell(cellData, this, isFromDB)
    this.cells.push(cell)
    this.cellsById[cell.id] = cell
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
