(function () {
  class StringMeter {
    constructor () {
      this.div = document.createElement('div')
      this.div.style.position = 'fixed'
      this.div.style.left = '0'
      document.body.appendChild(this.div)

      this.fonts = {}
    }

    getChar (char, size, font) {
      if (typeof char != 'string' || char.length != 1) return null

      if (typeof this.fonts[font] == 'undefined') this.fonts[font] = {}
      if (typeof this.fonts[font][size] == 'undefined') this.fonts[font][size] = {}
      if (typeof this.fonts[font][size][char] == 'undefined') {
        var div = document.createElement('span')
        div.style.fontFamily = font
        div.style.fontSize = size + 'px'
        div.innerHTML = char == ' '
          ? '&nbsp;'
          : char
        this.div.appendChild(div)
        this.fonts[font][size][char] = {
          width: div.getBoundingClientRect().width,
          height: div.getBoundingClientRect().height
        }
        this.div.removeChild(div)
      }

      return this.fonts[font][size][char]
    }

    width (str, size = 14, font = 'Roboto-Regular') {
      if (typeof str == 'number') str = '' + str
      if (str.length == 0) return 0
      if (str.length == 1) {
        return this.getChar(str, size, font).width
      }
      var width = 0
      for (var i = 0, li = str.length; i < li; i++) {
        width += this.width(str[i], size, font)
      }
      return width
    }

    height (str, size = 14, font = 'Roboto-Regular') {
      if (typeof str == 'number') str = '' + str
      if (str.length == 0) return 0
      if (str.length == 1) {
        return this.getChar(str, size, font).height
      }
      var height = 0
      for (var i = 0, li = str.length; i < li; i++) {
        height = Math.max(height, this.height(str[i], size, font))
      }
      return height
    }
  }

  if (typeof window.stringMeter == 'undefined') window.stringMeter = new StringMeter()
})()
