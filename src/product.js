var Cell = require('./cell.js')

exports = class Product {
  constructor (data, pcm) {
    this.pcm = pcm

    if (typeof data.id !== 'string') console.error('product id is incorrect')
    if (typeof this.pcm.productsById[data.id] !== 'undefined') console.error('product id already exists')
    this.id = data.id

    this.cells = []
    this.cellsById = {}
    this.cellsByFeatureId = {}
    for (var c in data.cells) {
      var cell = new Cell(data.cells[c], this)
      this.cells.push(cell)
      this.cellsById[cell.id] = cell
      this.cellsByFeatureId[cell.featureId] = cell
    }
  }

  export () {
    
  }
}
