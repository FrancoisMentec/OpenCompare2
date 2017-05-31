const API = '/api/'

const INCREASE = 1
const DECREASE = -1

class Editor {
  constructor (pcmId) {
    var self = this

    this.pcmId = pcmId
    this.pcm = null
    this.sortId = null
    this.sortOrder = null // INCREASE or DECREASE

    this.pcmName = $('#pcmName')
    this.pcmSource = $('#pcmSource')
    this.pcmAuthor = $('#pcmAuthor')
    this.pcmLicense = $('#pcmLicense')

    this.pcmView = document.getElementById('pcmView')
    this.pcmView.addEventListener('scroll', function (event) {
      var top = self.pcmView.scrollTop
      self.pcmFeatures.style.top = top + 'px'
      self.pcmFeatures.className = top > 0
        ? 'scrolled'
        : ''
      self.configurator.className = self.pcmView.scrollLeft > 0
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
    this.pcmProducts = document.getElementById('pcmProducts')

    this.filters = []
    this.filtersByFeatureId = {}

    this.loadPCM()
  }

  loadPCM () {
    var self = this

    $.get(API + this.pcmId, function (data) {
      if (data == null) {
        alert('pcm ' + self.pcmId + ' doesn\'t exists')
      } else if (typeof data.error !== 'undefined') {
        alert(data.error)
      } else {
        self.pcm = new PCM(data)
        self.pcmLoaded()
      }
    })
  }

  pcmLoaded () {
    var self = this

    // display pcm attributes
    this.pcmName.text(this.pcm.name || 'No name')

    var source = this.pcm.source == null
      ? 'unknown'
      : isUrl(this.pcm.source)
        ? '<a href="' + this.pcm.source + '" target="_blank">' + this.pcm.source + '</a>'
        : this.pcm.source
    this.pcmSource.html(source)

    this.pcmAuthor.text(this.pcm.author || 'unknown')
    this.pcmLicense.text(this.pcm.license || 'unknown')

    // sort pcm
    this.sort(this.pcm.primaryFeatureId)

    // create filters
    for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
      var feature = this.pcm.features[f]
      var filter = new Filter(self, feature)
      this.filters.push(filter)
      self.filtersByFeatureId[feature.id] = filter
    }

    // add features, products and filter to the DOM
    this.pcmFeatures.appendChild(this.pcm.primaryFeature.div)
    this.pcmProducts.appendChild(this.pcm.primaryFeature.column)
    this.pcm.primaryFeature.computeWidth()
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
        feature.div.addEventListener('click', function () {
          self.sort(feature.id)
        })
      }())
    }
  }

  sort (featureId) {
    if (this.sortId != null) {
      $(this.pcm.featuresById[this.sortId].div).removeClass('increase decrease')
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
      $(this.pcm.featuresById[this.sortId].div).addClass('increase')
    } else {
      $(this.pcm.featuresById[this.sortId].div).addClass('decrease')
    }

    this.pcm.sort(this.pcm.featuresById[this.sortId], this.sortOrder)
  }

  filterChanged (filter) {
    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var product = this.pcm.products[p]
      product.cellsByFeatureId[filter.feature.id].match = filter.match(product)
      product.show = product.match
    }
  }
}
