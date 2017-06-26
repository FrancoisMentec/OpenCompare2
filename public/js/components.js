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
  constructor (actions) {
    var self = this

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
      (function(){
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
      })()
    }

    this.visible = false
  }

  hide () {
    var self = this

    $(this.div).animate({height: 0}, 200, function () {
      self.visible = false
      self.div.style.display = 'none'
    })
  }

  show (x, y) {
    var self = this

    if (x < 0) x = 0
    if (x + this.content.offsetWidth > window.innerWidth) x = window.innerWidth - this.content.offsetWidth
    if (y < 0) y = 0
    if (y + this.content.offsetHeight > window.innerHeight) x = window.inneinnerHeightrWidth - this.content.offsetHeight

    this.div.style.left = x + 'px'
    this.div.style.top = y + 'px'
    this.div.style.display = 'inline-block'
    $(this.div).animate({height: this.content.offsetHeight}, 200, function () {
      self.visible = true
    })
  }
}
