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

    if (this.type === 'number') {
      this.slider = new SliderRange(0, 100)
      this.slider.appendTo(this.content)
      this.slider.rangeChangeListener = function (lower, upper) {
        //console.log('[' + lower + ', ' + upper + ']')
      }
    } else {
      this._searchString = ''
      this.matchAll = true

      this.input = new TextField('Search (accept regex)')
      this.input.addEventListener('keyup', function () {
        if (self.input.value !== self.searchString) {
          self.searchString = self.input.value
          self.filterChanged()
        }
      })
      this.input.appendTo(this.content)
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
    if (this.matchAll) return true
    return this.searchRegex.test(product.cellsByFeatureId[this.feature.id].value)
  }

  filterChanged () {
    this.matchAll = false
    if (this.searchString.length === 0) this.matchAll = true
    this.editor.filterChanged(this)
  }
}
