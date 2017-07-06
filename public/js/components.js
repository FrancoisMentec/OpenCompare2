/* text field */

class TextField {
  constructor (label = null, type = 'text', getError = null) {
    var self = this

    this._active = false
    this.getError = getError

    this.div = document.createElement('div')
    this.div.className = 'textField'
    this.labelDiv = document.createElement('label')
    this.div.appendChild(this.labelDiv)
    if (type === 'area') {
      this.input = document.createElement('textarea')
    } else {
      this.input = document.createElement('input')
      this.input.type = type
    }
    this.input.addEventListener('keyup', function () {
      if (self.getError) self.errorMessage.innerHTML = self.getError(self) || ''
      self.checkClassName()
    })
    this.input.addEventListener('focus', function () {
      self.active = true
    })
    this.input.addEventListener('blur', function () {
      self.active = false
    })
    this.div.appendChild(this.input)
    this.errorMessage = document.createElement('div')
    this.errorMessage.className = 'errorMessage'
    this.div.appendChild(this.errorMessage)

    this.label = label
  }

  get active () {
    return this._active
  }

  set active (value) {
    this._active = value
    this.checkClassName()
  }

  get label () {
    return this._label
  }

  set label (value) {
    this._label = value
    this.labelDiv.innerHTML = this.label
      ? this.label
      : ''
  }

  get value () {
    return this.input.value
  }

  set value (value) {
    this.input.value = value
    this.checkClassName()
  }

  checkClassName () {
    var className = 'textField'
    if (this.active) className += ' active'
    if (this.value.length > 0) className += ' notEmpty'
    if (this.errorMessage.innerHTML.length > 0) className += ' error'
    this.div.className = className
  }

  appendTo (element) {
    element.appendChild(this.div)
  }

  addEventListener (eventName, listener) {
    this.input.addEventListener(eventName, listener)
  }

  focus () {
    this.input.focus()
  }
}

/* slider range */

class SliderRange {
  constructor (min, max) {
    var self = this

    this.min = min
    this.max = max
    this.rangeChangeListener = null
    this.dragLower = false
    this.dragUpper = false

    this.div = document.createElement('div')
    this.div.className = 'slider'
    this.bar = document.createElement('div')
    this.bar.className = 'sliderBar'
    this.div.appendChild(this.bar)
    this.fullBar = document.createElement('div')
    this.fullBar.className = 'sliderFullBar'
    this.div.appendChild(this.fullBar)
    this.lowerThumb = document.createElement('div')
    this.lowerThumb.className = 'sliderThumb'
    this.lowerThumb.addEventListener('mousedown', function (e) {
      e.stopPropagation()
      e.preventDefault()
      self.dragLower = true
    })
    this.div.appendChild(this.lowerThumb)
    this.upperThumb = document.createElement('div')
    this.upperThumb.className = 'sliderThumb'
    this.upperThumb.addEventListener('mousedown', function (e) {
      e.stopPropagation()
      e.preventDefault()
      self.dragUpper = true
    })
    this.div.appendChild(this.upperThumb)
    document.addEventListener('mouseup', function (e) {
      if (self.dragLower || self.dragUpper) {
        e.stopPropagation()
        self.dragLower = self.dragUpper = false
      }
    })
    document.addEventListener('mousemove', function (e) {
      if (self.dragLower) {
        e.stopPropagation()
        self.lower = ((e.pageX - self.div.getBoundingClientRect().left) / self.div.offsetWidth) * (self.max - self.min) + self.min
      }
      if (self.dragUpper) {
        e.stopPropagation()
        self.upper = ((e.pageX - self.div.getBoundingClientRect().left) / self.div.offsetWidth) * (self.max - self.min) + self.min
      }
    })
    document.addEventListener('mouseleave', function (e) {
      self.dragLower = self.dragUpper = false
    })

    this._upper = max
    this.lower = min
    this.upper = max
  }

  get lower () {
    return this._lower
  }

  set lower (value) {
    if (value < this.min) value = this.min
    if (value > this.upper) value = this.upper
    this._lower = value
    this.lowerThumb.style.left = ((this.lower - this.min) / (this.max - this.min)) * 100 + '%'
    this.computeFullBar()
    this.triggerRangeChange()
  }

  get upper () {
    return this._upper
  }

  set upper (value) {
    if (value < this.lower) value = this.lower
    if (value > this.max) value = this.max
    this._upper = value
    this.upperThumb.style.left = ((this.upper - this.min) / (this.max - this.min)) * 100 + '%'
    this.computeFullBar()
    this.triggerRangeChange()
  }

  computeFullBar () {
    var min = ((this.lower - this.min) / (this.max - this.min)) * 100
    var max = ((this.upper - this.min) / (this.max - this.min)) * 100
    this.fullBar.style.left = min + '%'
    this.fullBar.style.width = max - min + '%'
  }

  triggerRangeChange () {
    if (this.rangeChangeListener) this.rangeChangeListener(this.lower, this.upper)
  }

  appendTo (element) {
    element.appendChild(this.div)
  }
}

/* Checkbox */

class Checkbox {
  constructor (label, checked = true, triState = false) {
    var self = this

    this.triState = triState
    this.stateChangeListener = null

    this.div = document.createElement('div')
    this.div.className = 'checkbox'
    this.checkbox = document.createElement('div')
    this.checkbox.className = 'box'
    this.checkbox.addEventListener('click', function () {
      self.switchState()
    })
    this.div.appendChild(this.checkbox)
    this.labelDiv = document.createElement('label')
    this.labelDiv.addEventListener('click', function () {
      self.switchState()
    })
    this.div.appendChild(this.labelDiv)

    this.label = label
    this.checked = checked
  }

  set label (value) {
    this.labelDiv.innerHTML = value
  }

  get checked () {
    return this._checked
  }

  set checked (value) {
    this._not = false
    this._checked = value
    this.checkClassName()
    this.triggerStateChange()
  }

  // Don't trigger stateChange
  setChecked (value) {
    this._not = false
    this._checked = value
    this.checkClassName()
  }

  get not () {
    return this._not
  }

  set not (value) {
    this._checked = false
    this._not = value
    this.checkClassName()
    this.triggerStateChange()
  }

  checkClassName () {
    var className = 'checkbox'
    if (this.checked) className += ' checked'
    else if (this.not) className += ' not'
    this.div.className = className
  }

  switchState () {
    if (this.triState) {
      if (this.checked) this.not = true
      else if (this.not) this.checked = false
      else this.checked = true
    } else {
      this.checked = !this.checked
    }
  }

  triggerStateChange () {
    if (this.stateChangeListener) this.stateChangeListener()
  }

  appendTo (element) {
    element.appendChild(this.div)
  }
}

/* Popup */

class Popup {
  constructor (title, content, actions = null) {
    this.visible = false
    this.wrap = document.createElement('div')
    this.wrap.className = 'popupWrap'
    document.body.appendChild(this.wrap)
    this.popup = document.createElement('div')
    this.popup.className = 'popup'
    this.wrap.appendChild(this.popup)
    this.title = document.createElement('div')
    this.title.className = 'popupTitle'
    this.title.innerHTML = title
    this.popup.appendChild(this.title)
    this.content = document.createElement('div')
    this.content.className = 'popupContent'
    if (typeof content === 'string') {
      this.content.innerHTML = content
    } else {
      this.content.appendChild(content)
    }
    this.popup.appendChild(this.content)
    if (actions) {
      this.actionDiv = document.createElement('div')
      this.actionDiv.className = 'popupActions'
      this.popup.appendChild(this.actionDiv)
      for (var a in actions) {
        var action = document.createElement('button')
        action.className = 'flatButton'
        action.innerHTML = a
        action.addEventListener('click', actions[a])
        this.actionDiv.appendChild(action)
      }
    }
  }

  show () {
    //this.wrap.className = 'popupWrap visible'
    this.visible = true
    $(this.wrap).fadeIn(200)
    $(this.popup).animate({top: '50px'}, 200)
  }

  hide () {
    //this.wrap.className = 'popupWrap'
    this.visible = false
    $(this.wrap).fadeOut(200)
    $(this.popup).animate({top: '100%'}, 200)
  }

  delete () {
    var self = this
    if (this.visible) {
      this.hide()
      setTimeout(function () {
        document.body.removeChild(self.wrap)
      }, 200)
    } else {
      document.body.removeChild(self.wrap)
    }
  }
}

/* Context menu */

class ContextMenu {
  constructor (actions, deleteOnHide = false) {
    var self = this

    this.deleteOnHide = deleteOnHide

    this.div = document.createElement('div')
    this.div.className = 'contextMenu'
    document.body.appendChild(this.div)

    document.body.addEventListener('click', function () {
      if (self.visible) self.hide()
    })

    document.body.addEventListener('contextmenu', function () {
      if (self.visible) self.hide()
    })

    this.content = document.createElement('div')
    this.content.className = 'contextMenuContent'
    this.div.appendChild(this.content)

    this.actions = {}
    for (var a in actions) {
      (function(a){
        self.actions[a] = document.createElement('button')
        self.actions[a].className = 'flatButton'
        self.actions[a].innerHTML = a
        self.actions[a].addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()

          actions[a]()
          self.hide()
        })
        self.content.appendChild(self.actions[a])
      })(a)
    }

    this.visible = false
  }

  hide () {
    if (!this.visible) return
    var self = this

    $(this.div).animate({height: 0}, 200, function () {
      self.visible = false
      self.div.style.display = 'none'
      if (self.deleteOnHide) document.body.removeChild(self.div)
    })
  }

  show (x, y) {
    if (this.visible) return
    var self = this

    this.div.style.display = 'block'
    if (x < 0) x = 0
    if (x + this.content.offsetWidth > document.body.clientWidth) x = document.body.clientWidth - this.content.offsetWidth
    if (y < 0) y = 0
    if (y + this.content.offsetHeight > document.body.clientHeight) x = document.body.clientHeight - this.content.offsetHeight

    this.div.style.left = x + 'px'
    this.div.style.top = y + 'px'
    $(this.div).animate({height: this.content.offsetHeight}, 200, function () {
      self.visible = true
    })
  }
}

const SHORT_DAY_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/* Date Picker */
class DatePicker {
  constructor (date = null, onOk = null) {
    var self = this
    this._visible = false
    this.onOk = onOk

    this.button = document.createElement('button')
    this.button.className = 'flatButton datePickerButton'
    this.button.addEventListener('click', function () {
      self.toggle()
    })
    this.buttonIcon = document.createElement('span')
    this.buttonIcon.className = 'material-icons'
    this.buttonIcon.innerHTML = 'event'
    this.button.appendChild(this.buttonIcon)
    this.buttonText = document.createElement('span')
    this.button.appendChild(this.buttonText)

    this.div = document.createElement('div')
    this.div.className = 'datePicker'
    document.body.appendChild(this.div)

    // year div
    this.yearDiv = document.createElement('div')
    this.yearDiv.className = 'yearDiv'
    this.div.appendChild(this.yearDiv)
    this.previousYearButton = document.createElement('button')
    this.previousYearButton.className = 'material-icons flatButton'
    this.previousYearButton.innerHTML = 'keyboard_arrow_left'
    this.previousYearButton.addEventListener('click', function () {
      var d = new Date(self.shownDate)
      d.setFullYear(d.getFullYear() - 1)
      self.showDate(d)
    })
    this.yearDiv.appendChild(this.previousYearButton)
    this.yearInput = document.createElement('input')
    this.yearInput.className = 'yearInput'
    this.yearDiv.appendChild(this.yearInput)
    this.nextYearButton = document.createElement('button')
    this.nextYearButton.className = 'material-icons flatButton'
    this.nextYearButton.innerHTML = 'keyboard_arrow_right'
    this.nextYearButton.addEventListener('click', function () {
      var d = new Date(self.shownDate)
      d.setFullYear(d.getFullYear() + 1)
      self.showDate(d)
    })
    this.yearDiv.appendChild(this.nextYearButton)

    // month div
    this.monthDiv = document.createElement('div')
    this.monthDiv.className = 'monthDiv'
    this.div.appendChild(this.monthDiv)
    this.previousMonthButton = document.createElement('button')
    this.previousMonthButton.className = 'material-icons flatButton'
    this.previousMonthButton.innerHTML = 'keyboard_arrow_left'
    this.previousMonthButton.addEventListener('click', function () {
      var d = new Date(self.shownDate)
      d.setMonth(d.getMonth() - 1)
      self.showDate(d)
    })
    this.monthDiv.appendChild(this.previousMonthButton)
    this.monthInput = document.createElement('span')
    this.monthInput.className = 'monthInput'
    this.monthDiv.appendChild(this.monthInput)
    this.nextMonthButton = document.createElement('button')
    this.nextMonthButton.className = 'material-icons flatButton'
    this.nextMonthButton.innerHTML = 'keyboard_arrow_right'
    this.nextMonthButton.addEventListener('click', function () {
      var d = new Date(self.shownDate)
      d.setMonth(d.getMonth() + 1)
      self.showDate(d)
    })
    this.monthDiv.appendChild(this.nextMonthButton)

    // date div
    this.dayDiv = document.createElement('div')
    this.dayDiv.className = 'dayDiv'
    this.div.appendChild(this.dayDiv)
    this.dayNameDiv = document.createElement('div')
    this.dayNameDiv.className = 'dayLine'
    this.dayDiv.appendChild(this.dayNameDiv)
    for (var i = 0; i < SHORT_DAY_NAME.length; i++) {
      var div = document.createElement('div')
      div.className = 'dayName'
      div.innerHTML = SHORT_DAY_NAME[i]
      this.dayNameDiv.appendChild(div)
    }
    this.dayWrap = document.createElement('div')
    this.dayDiv.appendChild(this.dayWrap)

    // time div
    this.timeDiv = document.createElement('div')
    this.timeDiv.className = 'timeDiv'
    this.div.appendChild(this.timeDiv)
    this.hourInput = new TextField('Hour', 'number')
    this.hourInput.addEventListener('change', function () {
      var d = new Date(self.date)
      d.setHours(self.hourInput.value)
      self.date = d
    })
    this.hourInput.appendTo(this.timeDiv)
    this.minuteInput = new TextField('Min', 'number')
    this.minuteInput.addEventListener('change', function () {
      var d = new Date(self.date)
      d.setMinutes(self.minuteInput.value)
      self.date = d
    })
    this.minuteInput.appendTo(this.timeDiv)
    this.secondInput = new TextField('Sec', 'number')
    this.secondInput.addEventListener('change', function () {
      var d = new Date(self.date)
      d.setSeconds(self.secondInput.value)
      self.date = d
    })
    this.secondInput.appendTo(this.timeDiv)
    this.millisecondInput = new TextField('Milli', 'number')
    this.millisecondInput.addEventListener('change', function () {
      var d = new Date(self.date)
      d.setMilliseconds(self.millisecondInput.value)
      self.date = d
    })
    this.millisecondInput.appendTo(this.timeDiv)

    // action div
    this.actionDiv = document.createElement('div')
    this.actionDiv.className = 'actionDiv'
    this.div.appendChild(this.actionDiv)
    this.okButton = document.createElement('button')
    this.okButton.className = 'flatButton'
    this.okButton.innerHTML = 'OK'
    this.okButton.addEventListener('click', function () {
      if (typeof self.onOk == 'function') self.onOk()
      self.visible = false
    })
    this.actionDiv.appendChild(this.okButton)

    // attr
    this.shownDate = null
    this.daysButton = []
    this.today = new Date()
    this.date = date || new Date()
  }

  get date () {
    return this._date
  }

  set date (value) {
    this._date = value

    this.buttonText.innerHTML = this.date.toLocaleString()
    this.showDate(this.date)
    this.hourInput.value = this.date.getHours()
    this.minuteInput.value = this.date.getMinutes()
    this.secondInput.value = this.date.getSeconds()
    this.millisecondInput.value = this.date.getMilliseconds()
  }

  get visible () {
    return this._visible
  }

  set visible (value) {
    if (value != this._visible) {
      this._visible = value
      if (this._visible) {
        var rect = this.button.getBoundingClientRect()
        this.div.style.left = rect.left + 'px'
        this.div.style.top = rect.top + this.button.offsetHeight + 'px'
        $(this.div).fadeIn()
      } else {
        $(this.div).fadeOut()
      }
    }
  }

  showDate (date) {
    if (this.shownDate == null || this.shownDate.getFullYear() != date.getFullYear() || this.shownDate.getMonth() != date.getMonth()) {
      var day = new Date(date.getFullYear(), date.getMonth(), 1)

      this.yearInput.value = day.getFullYear()
      this.monthInput.innerHTML = day.toLocaleString('en-us', {month: 'long'})

      while (this.dayWrap.firstChild) this.dayWrap.removeChild(this.dayWrap.firstChild)

      for (var i = 0; i < day.getDay(); i++) {
        var div = document.createElement('div')
        div.className = 'dayPadding'
        this.dayWrap.appendChild(div)
      }
      this.daysButton = []
      while (day.getMonth() === date.getMonth()) {
        this.daysButton[day.getDate()] = this.addDay(day)
        day.setDate(day.getDate() + 1)
      }
    } else if (this.shownDate.getFullYear() == this.date.getFullYear() && this.shownDate.getMonth() == this.date.getMonth()) {
      for (var i in this.daysButton) {
        this.daysButton[i].className = 'flatButton day'
        if (this.date.getFullYear() == this.today.getFullYear() && this.date.getMonth() == this.today.getMonth() && i == this.today.getDate()) {
          this.daysButton[i].className +=  ' today'
        }
        if (i == this.date.getDate()) {
          this.daysButton[i].className +=  ' current'
        }
      }
    }

    this.shownDate = date
  }

  /**
   * Add a button for the specified day to the day wrap
   * @param {Date} day - the day
   */
  addDay (d) {
    var day = new Date(d)
    var self = this

    var div = document.createElement('button')
    div.className = 'flatButton day'

    if (day.getFullYear() == this.today.getFullYear() && day.getMonth() == this.today.getMonth() && day.getDate() == this.today.getDate()) {
      div.className +=  ' today'
    }
    if (day.getFullYear() == this.date.getFullYear() && day.getMonth() == this.date.getMonth() && day.getDate() == this.date.getDate()) {
      div.className +=  ' current'
    }

    div.innerHTML = day.getDate()
    div.addEventListener('click', function () {
      self.date.setDate(day.getDate())
      var d = new Date(self.date)
      d.setFullYear(day.getFullYear())
      d.setMonth(day.getMonth())
      d.setDate(day.getDate())
      self.date = d
    })
    this.dayWrap.appendChild(div)

    return div
  }

  toggle () {
    this.visible = !this.visible
  }

  appendTo (element) {
    element.appendChild(this.button)
  }
}
