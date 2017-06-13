const API = '/api/'

const INCREASE = 1
const DECREASE = -1

class Editor {
  constructor (pcmId) {
    var self = this

    this.server = null
    this.connected = false
    this.connectedToEditSession = false

    this._chatVisible = false
    this.chatAutoscroll = true // auto scroll when new message
    this.chat = document.getElementById('chat')
    this.chatButton = document.getElementById('chatButton')
    this.chatButton.addEventListener('click', function () {
      self.chatVisible = !self.chatVisible
    })
    this.chatTopBar = document.getElementById('chatTopBar')
    this.chatMessageList = document.getElementById('chatMessageList')
    this.chatMessageList.addEventListener('scroll', function (e) {
      self.chatAutoscroll = self.chatMessageList.scrollTop + self.chatMessageList.offsetHeight >= self.chatMessageList.scrollHeight
      self.chatTopBar.className = self.chatMessageList.scrollTop > 0
        ? 'scrolled'
        : ''
      self.chatMessageInput.className = self.chatMessageList.scrollTop + self.chatMessageList.offsetHeight < self.chatMessageList.scrollHeight
        ? 'scrolledBottom'
        : ''
    })
    this.chatMessageInput = document.getElementById('chatMessageInput')
    this.chatMessageInput.addEventListener('keyup', function (e) {
      if (e.keyCode == 13 && self.chatMessageInput.value.length > 0) {
        self.emit('message', self.chatMessageInput.value)
        self.chatMessageInput.value = ''
      }
    })

    this.pcmId = pcmId
    this.pcm = null
    this.productMathing = 0
    this.sortId = null
    this.sortOrder = null // INCREASE or DECREASE
    this._selectedCell = null

    this.pcmName = document.getElementById('pcmName')
    this.pcmSource = document.getElementById('pcmSource')
    this.pcmAuthor = document.getElementById('pcmAuthor')
    this.pcmLicense = document.getElementById('pcmLicense')

    this.showConfiguratorButton = document.getElementById('showConfiguratorButton')
    this.showConfiguratorButton.addEventListener('click', function () {
      self.div.className = self.div.className === 'configuratorHidden'
        ? ''
        : 'configuratorHidden'

      self.showConfiguratorButton.innerHTML = self.div.className === 'configuratorHidden'
        ? 'Show the configurator'
        : 'Hide the configurator'
    })

    this.div = document.getElementById('editor')
    this.editorContent = document.getElementById('editorContent')

    this.pcmView = document.getElementById('pcmView')
    this.pcmDiv = document.getElementById('pcm')
    this.pcmDiv.addEventListener('scroll', function (event) {
      var top = self.pcmDiv.scrollTop
      self.pcmFeatures.style.top = top + 'px'
      self.pcmFeatures.className = top > 0
        ? 'scrolled'
        : ''
      var left = self.pcmDiv.scrollLeft
      self.fixedFeaturesName.style.left = self.fixedFeaturesColumn.style.left = left + 'px'
      self.configurator.className = self.fixedFeaturesName.className = self.fixedFeaturesColumn.className = left > 0
        ? 'scrolledRight'
        : ''
    })
    this.configurator = document.getElementById('configurator')
    this.configuratorTitle = document.getElementById('configuratorTitle')
    this.configuratorContent = document.getElementById('configuratorContent')
    this.configuratorContent.addEventListener('scroll', function () {
      self.configuratorTitle.className = self.configuratorContent.scrollTop > 0
        ? 'scrolled'
        : ''
    })
    this.pcmFeatures = document.getElementById('pcmFeatures')
    this.fixedFeaturesName = document.getElementById('fixedFeaturesName')
    this.pcmProducts = document.getElementById('pcmProducts')
    this.fixedFeaturesColumn = document.getElementById('fixedFeaturesColumn')

    this.filters = []
    this.filtersByFeatureId = {}

    /* cell edition */
    this.cellEdit = document.getElementById('cellEdit')
    this.cellEditType = document.getElementById('cellEditType')
    this.cellEditType.addEventListener('click', function (e) {
      if (self.selectedCell) {
        if (self.selectedCell.type !== 'multiple') {
          self.selectedCell.value = [self.selectedCell.value]
          self.selectedCell = self.selectedCell
        } else {
          self.selectedCell.value = self.selectedCell.value[0] || ''
          self.selectedCell = self.selectedCell
        }
      }
    })
    this.cellEditInputWrap = document.getElementById('cellEditInputWrap')
    this.cellEditInput = document.getElementById('cellEditInput')
    this.cellEditInput.addEventListener('change', function () {
      if (self.connectedToSession) {
        if (self.editType !== 'multiple') {
          self.emit('editCell', {
            productId: self.selectedCell.product.id,
            cellId: self.selectedCell.id,
            value: self.cellEditInput.value
          })
        }
      } else {
        alert('Your not connected to the edit sesion')
      }
    })
    this.cellEditInput.addEventListener('keyup', function (e) {
      if (self.editType !== 'multiple') {
        self.editType = detectType(self.cellEditInput.value).type
      } else if (e.keyCode === 13) {
        if (self.cellEditInput.value.length > 0) {
          if (self.connectedToSession) {
            self.emit('editCell', {
              productId: self.selectedCell.product.id,
              cellId: self.selectedCell.id,
              value: self.selectedCell.value.concat(self.cellEditInput.value)
            })
          } else {
            alert('Your not connected to the edit sesion')
          }
          self.cellEditInput.value = ''
        }
      }

    })

    this.loadPCM()
  }

  get chatVisible () {
    return this._chatVisible
  }

  set chatVisible (value) {
    this._chatVisible = value
    if (this.chatVisible) {
      this.chat.className = 'visible'
      this.chatButton.innerHTML = 'close'
      this.chatMessageInput.focus()
    } else {
      this.chat.className = ''
      this.chatButton.innerHTML = 'chat'
    }
  }

  get selectedCell () {
    return this._selectedCell
  }

  set selectedCell (value) {
    var self = this

    if (this.selectedCell) {
      this.selectedCell.div.className = 'pcmCell' // remove selected
      this.removeAllEditChips()
      if (value == null) this.pcmView.className = ''
    } else if (value) {
      this.pcmView.className = 'cellEditVisible'
    }
    this._selectedCell = value
    if (this.selectedCell != null) {
      this.selectedCell.div.className = 'pcmCell selected'
      this.editType = this.selectedCell.type
      if (this.editType === 'multiple') {
        this.cellEditInput.value = ''
        for (var i = 0, li = this.selectedCell.value.length; i < li; i++) {
          this.addEditChips(this.selectedCell.value[i])
        }
      } else {
        this.cellEditInput.value = this.selectedCell.value
      }
      this.cellEditInput.focus()
    }
  }

  get editType () {
    return this._editType
  }

  set editType (value) {
    this._editType = value
    this.cellEditType.innerHTML = this.editType
    //this.cellEditInput.style.width = (this.cellEdit.offsetWidth - 56 - this.cellEditType.offsetWidth - 5) + 'px'
  }

  addEditChips (value) {
    var self = this
    var chips = document.createElement('div')
    chips.className = 'chips'
    chips.innerHTML = value
    var chipsDelete = document.createElement('div')
    chipsDelete.className = 'chipsDelete'
    chipsDelete.addEventListener('click', function () {

      if (self.connectedToSession) {
        self.cellEditInputWrap.removeChild(chips)
        var arr = self.selectedCell.value
        arr.splice(arr.indexOf(value), 1)
        self.emit('editCell', {
          productId: self.selectedCell.product.id,
          cellId: self.selectedCell.id,
          value: arr
        })
      } else {
        alert('Not connected to edit session')
      }
    })
    chips.appendChild(chipsDelete)
    this.cellEditInputWrap.insertBefore(chips, this.cellEditInput)
  }

  removeAllEditChips () {
    while (this.cellEditInputWrap.firstChild !== this.cellEditInput) {
      this.cellEditInputWrap.removeChild(this.cellEditInputWrap.firstChild)
    }
  }

  loadPCM () {
    var self = this

    //console.time('get pcm')

    var r = new XMLHttpRequest()
    r.open('GET', API + this.pcmId, true)
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return

      var data = JSON.parse(r.responseText)
      //console.timeEnd('get pcm')

      if (data == null) {
        alert('pcm ' + self.pcmId + ' doesn\'t exists')
      } else if (typeof data.error !== 'undefined') {
        alert(data.error)
      } else {
        self.pcm = new PCM(data, true)
        self.pcmLoaded()
      }
    }
    r.send()
  }

  pcmLoaded () {
    var self = this

    // display pcm attributes
    this.pcmName.innerHTML = this.pcm.name || 'No name'

    this.pcmSource.innerHTML = this.pcm.source == null
      ? 'unknown'
      : isUrl(this.pcm.source)
        ? '<a href="' + this.pcm.source + '" target="_blank">' + this.pcm.source + '</a>'
        : this.pcm.source

    this.pcmAuthor.innerHTML = this.pcm.author || 'unknown'
    this.pcmLicense.innerHTML = this.pcm.license || 'unknown'

    this.productMathing = this.pcm.products.length
    this.updateConfiguratorTitle()

    // sort pcm
    this.sort(this.pcm.primaryFeatureId)

    // create filters
    for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
      var feature = this.pcm.features[f]
      var filter = new Filter(self, feature)
      this.filters.push(filter)
      self.filtersByFeatureId[feature.id] = filter
    }

    // bind click to cells
    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      for (var c = 0, lc = this.pcm.products[p].cells.length; c < lc; c++) {
        (function () {
          var cell = self.pcm.products[p].cells[c]
          cell.div.addEventListener('click', function () {
            self.selectedCell = cell
          })
        }())
      }
    }

    // add features, products and filter to the DOM
    this.pcm.primaryFeature.fixed = true
    this.fixedFeaturesName.appendChild(this.pcm.primaryFeature.div)
    this.fixedFeaturesColumn.appendChild(this.pcm.primaryFeature.column)
    this.pcm.primaryFeature.computeWidth()
    this.computeFixedWidth()
    this.configuratorContent.appendChild(this.filtersByFeatureId[this.pcm.primaryFeatureId].div)
    for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
      (function () {
        var feature = self.pcm.features[f]
        if (feature.id != self.pcm.primaryFeatureId) {
          self.pcmFeatures.appendChild(feature.div)
          self.pcmProducts.appendChild(feature.column)
          feature.computeWidth()
          self.configuratorContent.appendChild(self.filtersByFeatureId[feature.id].div)
        }

        // bind click event to sort products
        feature.div.addEventListener('click', function (e) {
          if (e.button === 0) {
            self.sort(feature.id)
          }
        })
        feature.fixButton.addEventListener('click', function (e) {
          e.stopPropagation()
          e.preventDefault()
          if (feature.fixed) self.unfixFeature(feature)
          else self.fixFeature(feature)
        })
      }())
    }

    this.connect()
  }

  fixFeature (feature) {
    feature.fixed = true
    this.pcmFeatures.removeChild(feature.div)
    this.pcmProducts.removeChild(feature.column)
    if (feature.id === this.pcm.primaryFeatureId) {
      this.fixedFeaturesName.insertBefore(feature.div, this.fixedFeaturesName.firstChild)
      this.fixedFeaturesColumn.insertBefore(feature.column, this.fixedFeaturesColumn.firstChild)
    } else {
      var nextName = null
      var nextColumn = null
      var found = false
      for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
        if (found && this.pcm.features[f].fixed && this.pcm.features[f].id !== this.pcm.primaryFeatureId) {
          nextName = this.pcm.features[f].div
          nextColumn = this.pcm.features[f].column
          break
        } else if (!found && this.pcm.features[f].id === feature.id) found = true
      }
      this.fixedFeaturesName.insertBefore(feature.div, nextName)
      this.fixedFeaturesColumn.insertBefore(feature.column, nextColumn)
    }
    this.computeFixedWidth()
  }

  unfixFeature (feature) {
    feature.fixed = false
    this.fixedFeaturesName.removeChild(feature.div)
    this.fixedFeaturesColumn.removeChild(feature.column)
    if (feature.id === this.pcm.primaryFeatureId) {
      this.pcmFeatures.insertBefore(feature.div, this.pcmFeatures.firstChild)
      this.pcmProducts.insertBefore(feature.column, this.pcmProducts.firstChild)
    } else {
      var nextName = null
      var nextColumn = null
      var found = false
      for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
        if (found && !this.pcm.features[f].fixed && this.pcm.features[f].id !== this.pcm.primaryFeatureId) {
          nextName = this.pcm.features[f].div
          nextColumn = this.pcm.features[f].column
          break
        } else if (!found && this.pcm.features[f].id === feature.id) found = true
      }
      this.pcmFeatures.insertBefore(feature.div, nextName)
      this.pcmProducts.insertBefore(feature.column, nextColumn)
    }
    this.computeFixedWidth()
  }

  computeFixedWidth () {
    this.pcmFeatures.style.paddingLeft = this.fixedFeaturesName.offsetWidth + 'px'
    this.pcmProducts.style.paddingLeft = this.fixedFeaturesColumn.offsetWidth + 'px'
  }

  sort (featureId) {
    if (this.sortId != null) {
      this.pcm.featuresById[this.sortId].div.className = this.pcm.featuresById[this.sortId].type === 'number'
        ? 'pcmFeature alignRight'
        : 'pcmFeature'
      if (featureId === this.sortId) {
        this.sortOrder *= -1
      } else {
        this.sortOrder = INCREASE
      }
    } else {
      this.sortOrder = INCREASE
    }
    this.sortId = featureId

    if (this.sortOrder === INCREASE) {
      this.pcm.featuresById[this.sortId].div.className += ' increase'
    } else {
      this.pcm.featuresById[this.sortId].div.className +=' decrease'
    }

    this.pcm.sort(this.pcm.featuresById[this.sortId], this.sortOrder)
  }

  updateConfiguratorTitle () {
    this.configuratorTitle.innerHTML = this.productMathing + ' / ' + this.pcm.products.length +
      ' (' + Math.round((this.productMathing / this.pcm.products.length) * 10000) / 100 + '%)'
  }

  filterChanged (filter) {
    this.productMathing = 0
    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var product = this.pcm.products[p]
      product.cellsByFeatureId[filter.feature.id].match = filter.match(product)
      if (product.match) {
        this.productMathing++
        product.show = true
      } else {
        product.show = false
      }
    }
    this.updateConfiguratorTitle()
  }

  connect () {
    if (this.server != null) return false
    var self = this
    var res = /token=([^;]+)/.exec(document.cookie)
    var token = res != null
      ? res[1]
      : null
    if (token) {
      this.server = io.connect()
      this.server.on('connect', function () {
        self.connected = true
        self.server.emit('handshake', {
          pcmId: self.pcmId,
          token: token
        })
      })
      this.server.on('disconnect', function () {
        console.log('disconnected from server')
        self.connected = self.connectedToSession = false
        self.cellEdit.className = 'disable'
        self.chatVisible = false
        setTimeout(function () {
          self.chat.style.display = 'none'
          self.chatButton.style.display = 'none'
        }, 200)
        self.server = null
      })
      this.server.on('error', function (data) {
        alert('server send error:' + data)
      })
      this.server.on('connectedToSession', function (data) {
        self.connectedToSession = true
        self.cellEdit.className = ''
        self.chat.style.display = 'block'
        self.chatButton.style.display = 'block'
      })
      this.server.on('updateUsersList', function (data) {
        /*console.log('userList')
        console.log(data)*/
        self.chatTopBar.innerHTML = data.length > 1
          ? data.length + ' people connected'
          : 'You\'re alone :-('
      })
      this.server.on('editCell', function (data) {
        var cell = self.pcm.productsById[data.productId].cellsById[data.id]
        cell.setValue(data.value, data.type)
        if (cell == self.selectedCell) {
          self.editType = cell.type
          if (self.editType === 'multiple') {
            self.removeAllEditChips()
            for (var i = 0, li = self.selectedCell.value.length; i < li; i++) {
              self.addEditChips(self.selectedCell.value[i])
            }
          } else {
            self.cellEditInput.value = self.selectedCell.value
          }
        }
      })
      this.server.on('message', function (data) {
        self.chatMessageList.innerHTML += '<div class="chatMessage"><div class="chatMessagePseudo">' + data.pseudo + '</div>'
          + '<div class="chatMessageContent">' + data.message + '</div></div>'
        if (self.chatAutoscroll) {
          self.chatMessageList.scrollTop = self.chatMessageList.scrollHeight
        }
      })
    }
  }

  disconnect () {
    if (this.server && this.connected) this.server.disconnect()
  }

  emit (action, data) {
    if (this.server == null) console.log('No server')
    else {
      this.server.emit(action, data)
    }
  }
}
