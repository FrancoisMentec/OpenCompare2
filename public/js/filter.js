const MAXIMUM_VALUES_FOR_CHECKBOX = 10

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

    this.hasCheckboxes = false
    this.checkboxes = []
    this.checkboxesByValue = {}

    if (this.type === 'number') { // Number
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
    } else if (this.type === 'boolean') { // Boolean
      this.trueCheckbox = new Checkbox('True')
      this.trueCheckbox.stateChangeListener = function () {
        self.filterChanged()
      }
      this.trueCheckbox.appendTo(this.content)
      this.falseCheckbox = new Checkbox('False')
      this.falseCheckbox.stateChangeListener = function () {
        self.filterChanged()
      }
      this.falseCheckbox.appendTo(this.content)
    } else if (this.type === 'string' || this.type === 'url' || this.type === 'image') { // String, url and image
      if (this.feature.values.length <= MAXIMUM_VALUES_FOR_CHECKBOX) {
        this.hasCheckboxes = true

        this.checkAllButton = document.createElement('button')
        this.checkAllButton.innerHTML = 'Uncheck all'
        this.checkAllButton.addEventListener('click', function () {
          //console.time('checkAll')
          if (self.matchAll) {
            for (var c = 0, lc = self.checkboxes.length; c < lc; c++) {
              self.checkboxes[c].setChecked(false)
            }
            self.checkAllButton.innerHTML = 'Check all'
          } else {
            for (var c = 0, lc = self.checkboxes.length; c < lc; c++) {
              self.checkboxes[c].setChecked(true)
            }
            self.checkAllButton.innerHTML = 'Uncheck all'
          }
          self.filterChanged()
          //console.timeEnd('checkAll')
        })
        this.content.appendChild(this.checkAllButton)

        for (var v = 0, lv = this.feature.values.length; v < lv; v++) {
          var value = this.feature.values[v]
          var checkbox = new Checkbox(value + ' (' + this.feature.occurrences[value] + ')')
          checkbox.stateChangeListener = function () {
            self.filterChanged()
          }
          checkbox.appendTo(this.content)
          this.checkboxes.push(checkbox)
          this.checkboxesByValue[value] = checkbox
        }
      } else {
        this.input = new TextField('Search (accept regex)')
        this.input.addEventListener('keyup', function () {
          if (self.input.value !== self.searchString) {
            self.searchString = self.input.value
            self.filterChanged()
          }
        })
        this.input.appendTo(this.content)
      }
    } else { // Other
      this.content.innerHTML += '<br><br> Sorry can\'t filter on this type for now, it will be coming soon'
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

  checkCheckboxesState (checked = true, not = false) {
    for (var c = 0, lc = this.checkboxes.length; c < lc; c++) {
      if (this.checkboxes[c].checked != checked || this.checkboxes[c].not != not) return false
    }
    return true
  }

  match (product) {
    var cell = product.cellsByFeatureId[this.feature.id]

    return this.matchAll ||
      ((cell.type === 'string' || cell.type === 'url' || cell.type === 'image') && (
        (this.hasCheckboxes && this.checkboxesByValue[cell.value].checked) ||
        (!this.hasCheckboxes && this.searchRegex.test(cell.value)))) ||
      (cell.type === 'number' && cell.value >= this.lower && cell.value <= this.upper) ||
      (cell.type === 'boolean' && ((this.trueCheckbox.checked && cell.value) || (this.falseCheckbox.checked && !cell.value)))
  }

  filterChanged () {
    //console.time('filter.filterChanged')
    this.matchAll =
      ((this.type === 'string' || this.type === 'url' || this.type === 'image') && (
        (this.hasCheckboxes && this.checkCheckboxesState()) ||
        (!this.hasCheckboxes && this.searchString.length === 0))) ||
      (this.type === 'number' && this.lower === this.feature.min && this.upper === this.feature.max) ||
      (this.type === 'boolean' && this.trueCheckbox.checked && this.falseCheckbox.checked)

    this.editor.filterChanged(this)
    //console.timeEnd('filter.filterChanged')
  }
}
