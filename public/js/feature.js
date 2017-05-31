var browser = typeof window !== 'undefined'

class Feature {
  constructor (data, pcm, isFromDB = false) {
    this.pcm = pcm

    if (typeof data.id !== 'string') console.error('feature id is incorrect')
    if (typeof this.pcm.featuresById[data.id] !== 'undefined') console.error('feature id already exists')
    this.id = data.id

    if (typeof data.name !== 'string') console.error('feature name is incorrect')
    this.name = data.name

    this.types = {}
    this.type = null
    this.occurrences = {}
    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var cell = this.pcm.products[p].cellsByFeatureId[this.id]
      var type = cell.type
      if (typeof this.types[type] === 'undefined') this.types[type] = 1
      else this.types[type]++

      if (!isFromDB && (this.type == null || this.types[type] > this.types[this.type])) this.type = type

      if (type === 'multiple') {
        for (var i = 0, li = cell.value.length; i < li; i++) {
          if (typeof this.occurrences[cell.value[i]] === 'undefined') this.occurrences[cell.value[i]] = 1
          else this.occurrences[cell.value[i]]++
        }
      } else {
        if (typeof this.occurrences[cell.value] === 'undefined') this.occurrences[cell.value] = 1
        else this.occurrences[cell.value]++
      }
    }

    if (browser) { // create div if in browser
      this.div = document.createElement('div')
      this.div.className = 'pcmFeature'
      this.div.innerHTML = this.name

      this.column = document.createElement('div')
      this.column.className = 'pcmColumn'

      if (this.type === 'number') {
        this.div.className += ' alignRight'
        this.column.className += ' alignRight'
      }

      this.updateColumn()
    }
  }

  updateColumn () {
    while (this.column.firstChild) {
      this.column.removeChild(this.column.firstChild)
    }

    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      this.column.appendChild(this.pcm.products[p].cellsByFeatureId[this.id].div)
    }
  }

  computeWidth () {
    var width = this.div.offsetWidth

    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var div = this.pcm.products[p].cellsByFeatureId[this.id].div
      if (div.offsetWidth > width) width = div.offsetWidth
    }

    this.div.style.width = width + 'px'
    this.column.style.width = width + 'px'
  }

  export () {
    return {
      id: this.id,
      name: this.name,
      type: this.type
    }
  }
}

if (typeof window === 'undefined') {
  module.exports = Feature
}
