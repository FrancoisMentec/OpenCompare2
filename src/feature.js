exports = class Feature {
  constructor (data, pcm) {
    this.pcm = pcm

    if (typeof data.id !== 'string') console.error('feature id is incorrect')
    if (typeof this.pcm.featuresById[data.id] !== 'undefined') console.error('feature id already exists')
    this.id = data.id

    if (typeof data.name !== 'string') console.error('feature name is incorrect')
    this.name = data.name

    this.types = {}
    this.type = null
    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var type = this.pcm.products[p].cellsByFeatureId[this.id].type
      if (typeof this.types[type] === 'undefined') this.types[type] = 1
      else this.types[type]++

      if (this.type == null || this.types[type] > this.types[this.type]) this.type = type
    }
  }

  export () {
    return {
      id: this.id,
      name: this.name,
      type: this.type
    }
  }
}
