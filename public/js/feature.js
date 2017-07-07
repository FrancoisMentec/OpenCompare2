var browser = typeof window !== 'undefined'

class Feature {
  constructor (data, pcm, isFromDB = false, computeData = true) {
    var self = this

    this.pcm = pcm

    this.id = isFromDB
      ? data.id
      : 'F' + this.pcm.featureIdGen++

    if (typeof data.name !== 'string') console.error('feature name is incorrect')
    this._name = data.name

    if (computeData) this.computeData(data, isFromDB)

    if (browser) { // create div if in browser
      this.fixed = false
      this.div = document.createElement('div')
      this.div.className = this.type === 'number'
        ? 'pcmFeature alignRight'
        : 'pcmFeature'
      this.nameDiv = document.createElement('span')
      this.nameDiv.innerHTML = this.name
      this.div.appendChild(this.nameDiv)
      this.fixButton = document.createElement('button')
      this.fixButton.className = 'flatButton material-icons'
      this.fixButton.innerHTML = 'place'
      this.div.appendChild(this.fixButton)

      this.column = document.createElement('div')
      this.column.className = this.type === 'number'
        ? 'pcmColumn alignRight'
        : 'pcmColumn'

      this.updateColumn()
    }
  }

  get name () {
    return this._name
  }

  set name (value) {
    this._name = value
    if (browser) {
      this.nameDiv.innerHTML = this.name
    }
  }

  /**
   * Compute data :
   * - type : main type of the feature (ex: type = 'string')
   * - types : number of every types (ex: types['string'] = 3)
   * - values : all different values sorted (ex: values = ['a', 'b', 'c'])
   * - occurences : number of occurences of every values (ex: occurences['a'] = 1)
   * - min : minimum value if type is number, else null
   * - max : maximum value if type is number, else null*
   * @param {Object} data - constructor only!
   * @param {boolean} isFromDB - constructor only!
   */
  computeData (data = null, isFromDB = false) {
    var self = this

    this.types = {}
    this.type = isFromDB
      ? data.type
      : 'undefined'
    this.values = []
    this.occurrences = {}
    this.min = null
    this.max = null
    this.minDate = null
    this.maxDate = null

    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var cell = this.pcm.products[p].cellsByFeatureId[this.id]
      if (typeof this.types[cell.type] === 'undefined') this.types[cell.type] = 1
      else this.types[cell.type]++

      if (!isFromDB && (this.type == 'undefined' || (cell.type !== 'undefined' && this.types[cell.type] > this.types[this.type]))) this.type = cell.type

      if (cell.type === 'multiple') {
        // Count occurences
        for (var i = 0, li = cell.value.length; i < li; i++) {
          if (typeof this.occurrences[cell.value[i]] === 'undefined') {
            this.values.push(cell.value[i])
            this.occurrences[cell.value[i]] = 1
          } else this.occurrences[cell.value[i]]++
        }
      } else {
        // Count occurences
        if (typeof this.occurrences[cell.value] === 'undefined') {
          this.values.push(cell.value)
          this.occurrences[cell.value] = 1
        } else this.occurrences[cell.value]++

        // look for min/max
        if (cell.type === 'number') {
          if (this.min == null || cell.value < this.min) this.min = cell.value
          if (this.max == null || cell.value > this.max) this.max = cell.value
        } else if (cell.type === 'date') {
          if (this.minDate == null || cell.value < this.minDate) this.minDate = cell.value
          if (this.maxDate == null || cell.value > this.maxDate) this.maxDate = cell.value
        }
      }
    }

    this.values.sort(function (a, b) {
      if (self.occurrences[a] > self.occurrences[b]) return -1
      if (self.occurrences[a] < self.occurrences[b]) return 1
      return 0
    })

    if (browser && this.div) {
      this.div.className = this.type === 'number'
        ? 'pcmFeature alignRight'
        : 'pcmFeature'
      this.column.className = this.type === 'number'
        ? 'pcmColumn alignRight'
        : 'pcmColumn'
    }
  }

  /**
   * Update the column (remove all products and add only those which are visible)
   * @param {number} scrollTop - the top position of the scroll in the view
   * @param {number} viewHeight - the height of the view (the visible part)
   * @param {number} productHeight - the height of a products (default 48, the height of a data table line in material design)
   */
  updateColumn (scrollTop, viewHeight, productHeight = 48) {
    while (this.column.firstChild) {
      this.column.removeChild(this.column.firstChild)
    }

    this.column.style.top = scrollTop - (scrollTop % productHeight) + 'px'

    for (var p = 0, lp = this.pcm.products.length, top = 0; p < lp && top < scrollTop + viewHeight; p++) {
      var product = this.pcm.products[p]
      if (product.show) {
        if (top + productHeight >= scrollTop) {
          this.column.appendChild(product.cellsByFeatureId[this.id].div)
        }
        top += productHeight
      }
    }
  }

  /**
   * Compute the width of the column so every cell will fit in
   * Warning: it will add every cell the column (even not shown, same than updateColumn(0, infinity)), so it's quite slow on big pcm
   * TODO: image width computation
   */
  computeWidth () {
    this.div.style.width = 'auto'
    this.column.style.width = 'auto'

    var width = this.div.offsetWidth

    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var divWidth = stringMeter.width(this.pcm.products[p].cellsByFeatureId[this.id].div.innerText, 13, 'Roboto-Regular') + 56 + 1 // 56 = padding, 1 for error
      if (divWidth > width) width = divWidth
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
