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

    this.featureName = document.createElement('span')
    this.featureName.className = 'filterFeatureName'
    this.featureName.innerHTML = this.feature.name
    this.featureName.addEventListener('click', function (e) {
      //e.stopPropagation()
      if (!self.feature.fixed) {
        //$(self.editor.pcmContent).animate({scrollLeft: self.feature.column.offsetLeft - self.editor.fixedFeaturesColumn.offsetWidth}, 200)
        self.editor.pcmContent.scrollLeft = self.feature.column.offsetLeft - self.editor.fixedFeaturesColumn.offsetWidth
      }
    })
    this.button.appendChild(this.featureName)

    this.resetButton = document.createElement('button')
    this.resetButton.className = 'material-icons flatButton filterResetButton'
    this.resetButton.innerHTML = 'settings_backup_restore'
    this.resetButton.addEventListener('click', function (e) {
      e.stopPropagation()
      self.reset()
    })
    this.button.appendChild(this.resetButton)

    this.content = document.createElement('div')
    this.content.className = 'filterContent'

    this.buildFilter()
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

  get lower () {
    return this.slider.lower
  }

  get upper () {
    return this.slider.upper
  }

  /**
   * Call it in the constructor and when feature change
   */
  buildFilter () {
    var self = this

    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild)
    }

    this.div.appendChild(this.content)

    this._searchString = ''
    this.matchAll = true

    this.hasCheckboxes = false
    this.checkboxes = []
    this.checkboxesByValue = {}

    if (this.type === 'number') { // Number
      this.lowerInput = new TextField('Min', 'number')
      this.lowerInput.value = this.feature.min
      this.lowerInput.addEventListener('change', function () {
        var val = parseFloat(self.lowerInput.value)
        if (!isNaN(val)) self.slider.lower = val
      })
      this.lowerInput.appendTo(this.content)

      this.slider = new SliderRange(this.feature.min, this.feature.max)
      this.slider.appendTo(this.content)
      this.slider.rangeChangeListener = function (lower, upper) {
        self.lowerInput.value = Math.round(self.lower * 100) / 100
        self.upperInput.value = Math.round(self.upper * 100) / 100
        self.filterChanged()
      }

      this.upperInput = new TextField('Max', 'number')
      this.upperInput.value = this.feature.max
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
    } else if (this.type === 'multiple') { // Multiple
      this.hasCheckboxes = true

      for (var v = 0, lv = this.feature.values.length; v < lv; v++) {
        var value = this.feature.values[v]
        var checkbox = new Checkbox(value, false, true)
        checkbox.stateChangeListener = function () {
          self.filterChanged()
        }
        checkbox.appendTo(this.content)
        this.checkboxes.push(checkbox)
        this.checkboxesByValue[value] = checkbox
      }
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
          var checkbox = new Checkbox(value/* + ' (' + this.feature.occurrences[value] + ')'*/)
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
    } else if (this.type == 'date') { // Date
      this.content.appendChild(document.createTextNode('Start date :'))

      this.minDate = new DatePicker(this.feature.minDate, function () {
        self.filterChanged()
      })
      this.minDate.appendTo(this.content)

      this.content.appendChild(document.createTextNode('End date :'))

      this.maxDate = new DatePicker(this.feature.maxDate, function () {
        self.filterChanged()
      })
      this.maxDate.appendTo(this.content)
    } else { // Other
      this.content.innerHTML += this.type + '<br><br> Sorry can\'t filter on this type for now, it will be coming soon'
    }
  }

  checkCheckboxesState (checked = true, not = false) {
    for (var c = 0, lc = this.checkboxes.length; c < lc; c++) {
      if (this.checkboxes[c].checked != checked || this.checkboxes[c].not != not) return false
    }
    return true
  }

  match (product) {
    var cell = product.cellsByFeatureId[this.feature.id]

    if (cell.type !== this.type) console.error('Cross type matching not supported yet (feature type : ' + this.type + ', cell type : ' + cell.type + ')')

    return this.matchAll ||
      (cell.type === this.type && (
        ((cell.type === 'string' || cell.type === 'url' || cell.type === 'image') && (
          (this.hasCheckboxes && this.checkboxesByValue[cell.value].checked) ||
          (!this.hasCheckboxes && this.searchRegex.test(cell.value)))) ||
        (cell.type === 'number' && cell.value >= this.lower && cell.value <= this.upper) ||
        (cell.type === 'boolean' && ((this.trueCheckbox.checked && cell.value) || (this.falseCheckbox.checked && !cell.value))) ||
        (cell.type === 'date' && cell.value >= this.minDate.date && cell.value <= this.maxDate.date)) ||
        (cell.type === 'multiple' && this.matchMultiple(cell)))
  }

  matchMultiple (cell) {
    for (var v in this.checkboxesByValue) {
      if ((this.checkboxesByValue[v].checked && cell.value.indexOf(v) === -1) || (this.checkboxesByValue[v].not && cell.value.indexOf(v) !== -1)) return false
    }
    return true
  }

  filterChanged () {
    //console.time('filter.filterChanged')
    this.matchAll =
      ((this.type === 'string' || this.type === 'url' || this.type === 'image') && (
        (this.hasCheckboxes && this.checkCheckboxesState()) ||
        (!this.hasCheckboxes && this.searchString.length === 0))) ||
      (this.type === 'number' && this.lower === this.feature.min && this.upper === this.feature.max) ||
      (this.type === 'boolean' && this.trueCheckbox.checked && this.falseCheckbox.checked) ||
      (this.type === 'multiple' && this.checkCheckboxesState(false, false)) ||
      (this.type === 'date' && this.minDate.date.getTime() === this.feature.minDate.getTime() && this.maxDate.date.getTime() === this.feature.maxDate.getTime())

    this.button.className = this.matchAll
      ? 'filterButton'
      : 'filterButton resetButtonVisible'

    this.editor.filterChanged(this)
    //console.timeEnd('filter.filterChanged')
  }

  /**
   * Reset the filter
   */
  reset () {
    if (this.type === 'string' || this.type === 'url' || this.type === 'image') {
      if (this.hasCheckboxes) {
        for (var i = 0, li = this.checkboxes.length; i < li; i++) {
          this.checkboxes[i].checked = true
        }
      } else {
        this.input.value = ''
      }
    } else if (this.type === 'number') {
      this.slider.lower = this.feature.min
      this.slider.upper = this.feature.max
    } else if (this.type === 'boolean') {
      this.trueCheckbox.checked = true
      this.falseCheckbox.checked = true
    } else if (this.type === 'multiple') {
      for (var i = 0, li = this.checkboxes.length; i < li; i++) {
        this.checkboxes[i].checked = false
      }
    } else if (this.type === 'date') {
      this.minDate.date = this.feature.minDate
      this.maxDate.date = this.feature.maxDate
      this.filterChanged()
    }
  }
}
