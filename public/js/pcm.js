var browser = typeof window !== 'undefined'

if (!browser) {
  Product = require('./product.js')
  Feature = require('./feature.js')
}

class PCM {
  constructor (data, isFromDB = false) {
    this._id = isFromDB
      ? data._id
      : null
    this.name = typeof data.name === 'string'
      ? data.name
      : null
    if (this.name == null) throw 'PCM name is null !'
    this.description = typeof data.description === 'string'
      ? data.description
      : null
    this.license = typeof data.license === 'string'
      ? data.license
      : null
    this.source = typeof data.source === 'string'
      ? data.source
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
        var productData = data.products[p]
        if (typeof productData.id === 'undefined') productData.id = p
        var product = new Product(productData, this, isFromDB)
        this.products.push(product)
        this.productsById[product.id] = product
      }
    }

    this.features = []
    this.featuresById = {}
    if (typeof data.features === 'object') {
      for (var f in data.features) {
        var featureData = data.features[f]
        if (typeof featureData.id === 'undefined') featureData.id = f
        var feature = new Feature(featureData, this, isFromDB)
        this.features.push(feature)
        this.featuresById[feature.id] = feature
      }
    }
    if (this.primaryFeatureId == null && this.features.length > 0) this.primaryFeatureId = this.features[0].id
  }

  get primaryFeature () {
    return this.featuresById[this.primaryFeatureId]
  }

  sort (feature = this.primaryFeature, order = 1) {
    //console.time('sort pcm')
    this.products.sort(function (p1, p2) {
      if (p1.cellsByFeatureId[feature.id].value < p2.cellsByFeatureId[feature.id].value) return -order
      if (p1.cellsByFeatureId[feature.id].value > p2.cellsByFeatureId[feature.id].value) return order
      0
    })
    //console.timeEnd('sort pcm')

    //console.time('update columns')
    if (browser) {
      for (var f = 0, lf = this.features.length; f < lf; f++) {
        this.features[f].updateColumn()
      }
    }
    //console.timeEnd('update columns')
  }

  export (toDB = false) {
    var products = []
    for (var p = 0, lp = this.products.length; p < lp; p++) {
      products.push(this.products[p].export())
    }

    var features = []
    for (var f = 0, lf = this.features.length; f < lf; f++) {
      features.push(this.features[f].export())
    }

    var obj = {
      name: this.name,
      description: this.description,
      license: this.license,
      source: this.source,
      author: this.author,
      primaryFeatureId: this.primaryFeatureId,
      features: features,
      products: products
    }

    if (!toDB) obj._id = this._id // don't export id bc defined by mongodb

    return obj
  }
}

if (!browser) {
  module.exports = PCM
}
