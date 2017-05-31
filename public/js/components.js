/* text field */
class TextField {
  constructor (label = null) {
    var self = this

    this._active = false

    this.div = document.createElement('div')
    this.div.className = 'textField'
    this.labelDiv = document.createElement('label')
    this.div.appendChild(this.labelDiv)
    this.input = document.createElement('input')
    this.input.addEventListener('keyup', function () {
      self.checkClassName()
    })
    this.input.addEventListener('focus', function () {
      self.active = true
    })
    this.input.addEventListener('blur', function () {
      self.active = false
    })
    this.div.appendChild(this.input)

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
  }

  checkClassName () {
    var className = 'textField'
    if (this.active) className += ' active'
    if (this.value.length > 0) className += ' notEmpty'
    this.div.className = className
  }

  appendTo (element) {
    element.appendChild(this.div)
  }

  addEventListener (eventName, listener) {
    this.input.addEventListener(eventName, listener)
  }
}
