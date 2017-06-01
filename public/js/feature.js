var browser = typeof window !== 'undefined'

class Feature {
  constructor (data, pcm, isFromDB = false) {
    var self = this

    this.pcm = pcm

    if (typeof data.id !== 'string') console.error('feature id is incorrect')
    if (typeof this.pcm.featuresById[data.id] !== 'undefined') console.error('feature id already exists')
    this.id = data.id

    if (typeof data.name !== 'string') console.error('feature name is incorrect')
    this.name = data.name

    this.types = {}
    this.type = null
    this.values = []
    this.occurrences = {}
    this.min = null
    this.max = null
    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var cell = this.pcm.products[p].cellsByFeatureId[this.id]
      if (typeof this.types[cell.type] === 'undefined') this.types[cell.type] = 1
      else this.types[cell.type]++

      if (!isFromDB && (this.type == null || this.types[cell.type] > this.types[this.type])) this.type = cell.type

      if (cell.type === 'multiple') {
        for (var i = 0, li = cell.value.length; i < li; i++) {
          if (typeof this.occurrences[cell.value[i]] === 'undefined') {
            this.values.push(cell.value[i])
            this.occurrences[cell.value[i]] = 1
          } else this.occurrences[cell.value[i]]++
        }
      } else {
        if (typeof this.occurrences[cell.value] === 'undefined') {
          this.values.push(cell.value)
          this.occurrences[cell.value] = 1
        } else this.occurrences[cell.value]++

        if (cell.type === 'number') {
          if (this.min == null || cell.value < this.min) this.min = cell.value
          if (this.max == null || cell.value > this.max) this.max = cell.value
        }
      }
    }

    this.values.sort(function (a, b) {
      if (self.occurrences[a] > self.occurrences[b]) return -1
      if (self.occurrences[a] < self.occurrences[b]) return 1
      return 0
    })

    if (browser) { // create div if in browser
      this.fixed = false
      this.div = document.createElement('div')
      this.div.className = 'pcmFeature'
      this.div.innerHTML = this.name
      this.fixButton = document.createElement('button')
      this.fixButton.className = 'flatButton material-icons'
      this.fixButton.innerHTML = 'place'
      this.div.appendChild(this.fixButton)

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
