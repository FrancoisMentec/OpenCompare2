(function () {
  class StringMeter {
    constructor () {
      this.div = document.createElement('div')
      this.div.style.position = 'fixed'
      this.div.style.left = '0'
      document.body.appendChild(this.div)

      this.fonts = {}
    }

    width (str, size = 14, font = 'Roboto-Regular') {
      if (str.length == 0) return 0
      if (str.length == 1) {
        if (typeof this.fonts[font] == 'undefined') this.fonts[font] = {}
        if (typeof this.fonts[font][size] == 'undefined') this.fonts[font][size] = {}
        if (typeof this.fonts[font][size][str] == 'undefined') {
          var div = document.createElement('span')
          div.style.fontFamily = font
          div.style.fontSize = size + 'px'
          div.innerHTML = str == ' '
            ? '&nbsp;'
            : str
          this.div.appendChild(div)
          this.fonts[font][size][str] = {
            width: div.getBoundingClientRect().width
          }
          this.div.removeChild(div)
        }

        return this.fonts[font][size][str].width
      }
      var width = 0
      for (var i = 0, li = str.length; i < li; i++) {
        width += this.width(str[i], size, font)
      }
      return width
    }
  }

  if (typeof window.stringMeter == 'undefined') window.stringMeter = new StringMeter()
})()
