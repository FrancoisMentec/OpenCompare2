class Filter {
  constructor (editor, feature) {
    var self = this

    this.editor = editor
    this.feature = feature

    this.extended = false

    this.div = document.createElement('div')
    this.div.className = 'filter'
    this.button = document.createElement('div')
    this.button.className = 'filterButton'
    this.button.addEventListener('click', function () {
      self.extended = !self.extended
      self.div.className = self.extended
        ? 'filter extended'
        : 'filter'
      var height = self.extended
        ? self.button.offsetHeight + self.content.offsetHeight
        : self.button.offsetHeight
      $(self.div).animate({height: height}, 200)
    })
    this.div.appendChild(this.button)
    this.arrow = document.createElement('div')
    this.arrow.className = 'filterArrow'
    this.button.appendChild(this.arrow)
    this.button.innerHTML += ' ' + this.feature.name
    this.content = document.createElement('div')
    this.content.className = 'filterContent'
    this.content.innerHTML = 'Type : ' + this.type
    this.div.appendChild(this.content)

    this._searchString = ''
    this.matchAll = true

    if (this.type === 'number') {
      this.lower = this.feature.min
      this.upper = this.feature.max

      this.lowerInput = new TextField('Min')
      this.lowerInput.value = this.lower
      this.lowerInput.addEventListener('change', function () {
        var val = parseFloat(self.lowerInput.value)
        if (!isNaN(val)) self.slider.lower = val
      })
      this.lowerInput.appendTo(this.content)

      this.slider = new SliderRange(this.lower, this.upper)
      this.slider.appendTo(this.content)
      this.slider.rangeChangeListener = function (lower, upper) {
        self.lower = lower
        self.upper = upper
        self.lowerInput.value = Math.round(self.lower * 100) / 100
        self.upperInput.value = Math.round(self.upper * 100) / 100
        self.filterChanged()
      }

      this.upperInput = new TextField('Max')
      this.upperInput.value = this.upper
      this.upperInput.addEventListener('change', function () {
        var val = parseFloat(self.upperInput.value)
        if (!isNaN(val)) self.slider.upper = val
      })
      this.upperInput.appendTo(this.content)
    } else if (this.type === 'string' || this.type === 'url' || this.type === 'image') {
      this.input = new TextField('Search (accept regex)')
      this.input.addEventListener('keyup', function () {
        if (self.input.value !== self.searchString) {
          self.searchString = self.input.value
          self.filterChanged()
        }
      })
      this.input.appendTo(this.content)
    } else {
      this.conntent.innerHTML += '<br> Sorry can\'t filter on this type for now, it will be coming soon'
    }
  }

  get type () {
    return this.feature.type
  }

  get searchString () {
    return this._searchString
  }

  set searchString (value) {
    this._searchString = value
    this.searchRegex = new RegExp(this.searchString, 'i')
  }

  match (product) {
    var cell = product.cellsByFeatureId[this.feature.id]

    return this.matchAll ||
      ((cell.type === 'string' || cell.type === 'url' || cell.type === 'image') && this.searchRegex.test(cell.value)) ||
      (cell.type === 'number' && cell.value >= this.lower && cell.value <= this.upper)
  }

  filterChanged () {
    this.matchAll =
      ((cell.type === 'string' || cell.type === 'url' || cell.type === 'image') && this.searchString.length === 0) ||
      (this.type === 'number' && this.lower === this.feature.min && this.upper === this.feature.max)

    this.editor.filterChanged(this)
  }
}
