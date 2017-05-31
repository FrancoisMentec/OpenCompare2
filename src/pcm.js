var Product = require('./product.js')
var Feature = require('./feature.js')

exports = class PCM {
  constructor (data, isFromDB = false) {
    this.id = isFromDB
      ? data.id
      : null
    this.name = typeof data.name === 'string'
      ? data.name
      : null
    this.description = typeof data.description === 'string'
      ? data.description
      : null
    this.license = typeof data.license === 'string'
      ? data.license
      : null
    this.source = typeof data.source === 'string'
      ? data.description
      : null
    this.author = typeof data.author === 'string'
      ? data.author
      : 'OpenCompare'

    if (typeof data.primaryFeatureID !== 'undefined') data.primaryFeatureId = data.primaryFeatureID
    this.primaryFeatureId = typeof data.primaryFeatureId === 'string'
      ? data.primaryFeatureId
      : null

    this.products = []
    this.productsById = {}
    if (typeof data.products === 'object') {
      for (var p in data.products) {
        var product = new Product(data.products[p], this)
        this.products.push(product)
        this.productsById[product.id] = product
      }
    }

    this.features = []
    this.featuresById = {}
    if (typeof data.features === 'object') {
      for (var f in data.features) {
        var feature = new Feature(data.features[f], this)
        this.features.push(feature)
        this.featuresById[feature.id] = feature
      }
    }
    if (this.primaryFeatureId == null && this.features.length > 0) this.primaryFeatureId = this.features[0].id
  }

  export () {
    var products = []
    for (var p = 0, lp = this.products.length; p < lp; p++) {
      products.push(this.products[p].export())
    }

    var features = []
    for (var f = 0, lf = this.features.length; f < lf; f++) {
      features.push(this.features[f].export())
    }

    return {
      id: this.id,
      name: this.name,
      description: this.description,
      license: this.license,
      source: this.source,
      author: this.author,
      primaryFeatureId: this.primaryFeatureId,
      features: features,
      products: products
    }
  }
}
