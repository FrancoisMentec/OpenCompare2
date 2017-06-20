const CHART_PADDING = 80
const HALF_CHART_PADDING = CHART_PADDING / 2
const GRADUATION_PER_PIXEL = 0.02

class ChartFactory {
  constructor (editor) {
    var self = this

    this.editor = editor
    this.div = this.editor.views['chart']

    this._nodeSize = 5
    this.nodeSizeDiv = document.getElementById('nodeSize')
    this.nodeSizeSelect = document.getElementById('nodeSizeSelect')
    this.nodeSizeSelect.addEventListener('change', function (e) {
      self.nodeSize = self.nodeSizeSelect.value
    })

    this._featureImage = null
    this._feature1 = null
    this._feature2 = null
    this.featureImageDiv = document.getElementById('featureImage')
    this.featureImageSelect = document.getElementById('featureImageSelect')
    this.featureImageSelect.addEventListener('change', function (e) {
      self.featureImage = self.pcm.featuresById[self.featureImageSelect.value]
    })
    this.feature1Div = document.getElementById('feature1')
    this.feature1Select = document.getElementById('feature1Select')
    this.feature1Select.addEventListener('change', function (e) {
      self.feature1 = self.pcm.featuresById[self.feature1Select.value]
    })
    this.feature2Div = document.getElementById('feature2')
    this.feature2Select = document.getElementById('feature2Select')
    this.feature2Select.addEventListener('change', function (e) {
      self.feature2 = self.pcm.featuresById[self.feature2Select.value]
    })

    this.content = document.getElementById('chartContent')

    this.drawn = false
    this.chart = null

    this.charts = {
      productChart: {}
    }

    for (var chart in this.charts) {
      (function (chart) {
        self.charts[chart].button = document.getElementById(chart + 'Button')
        self.charts[chart].button.addEventListener('click', function () {
          self.drawChart(chart)
        })
      })(chart)
    }
  }

  init () {
    for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
      var feature = this.pcm.features[f]
      if (feature.type === 'number' && feature.min !== feature.max) {
        var fdiv = document.createElement('option')
        fdiv.setAttribute('value', feature.id)
        fdiv.innerHTML = feature.name
        this.feature1Select.appendChild(fdiv)
        this.feature2Select.appendChild(fdiv.cloneNode(true))
        if (this.feature1 == null) this.feature1 = feature
        else if (this.feature2 == null) this.feature2 = feature
      } else if (feature.type === 'image') {
        var fdiv = document.createElement('option')
        fdiv.setAttribute('value', feature.id)
        fdiv.innerHTML = feature.name
        this.featureImageSelect.appendChild(fdiv)
        if (this.featureImage == null) this.featureImage = feature
      }
    }
  }

  get pcm () {
    return this.editor.pcm
  }

  get width () {
    return this.content.offsetWidth
  }

  get chartWidth () {
    return this.width - CHART_PADDING
  }

  get height () {
    return this.content.offsetHeight
  }

  get chartHeight () {
    return this.height - CHART_PADDING
  }

  get nodeSize () {
    return this._nodeSize
  }

  set nodeSize (value) {
    this._nodeSize = typeof value === 'number'
      ? value
      : parseFloat(value)
    this.nodeSizeSelect.value = this.nodeSize
    this.updateChart(true, false, false, false)
  }

  get featureImage () {
    return this._featureImage
  }

  set featureImage (value) {
    this._featureImage = value
    this.featureImageSelect.value = this.featureImage.id
    this.updateChart(false, true, false, false)
  }

  get feature1 () {
    return this._feature1
  }

  get x () {
    return this.feature1
  }

  set feature1 (value) {
    this._feature1 = value
    this.feature1Select.value = this.feature1.id
    this.updateChart(false, false, true, false)
  }

  get feature2 () {
    return this._feature2
  }

  get y () {
    return this.feature2
  }

  set feature2 (value) {
    this._feature2 = value
    this.feature2Select.value = this.feature2.id
    this.updateChart(false, false, false, true)
  }

  cleanContent () {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild)
    }
  }

  range (min, max, size) {
    var step = (max - min) / (size * GRADUATION_PER_PIXEL)
    var range = []
    var n = min
    while (n < max) {
      range.push(n)
      n += step
    }
    range.push(max)
    return range
  }

  drawChart (chart) {
    var self = this
    if (typeof chart !== 'undefined') this.chart = chart
    console.log('drawChart ' + this.chart)

    this.cleanContent()
    this.drawn = true

    if (this.chart === 'productChart') {
      this.svgDiv = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      this.content.appendChild(this.svgDiv)
      this.svgDiv.setAttribute('width', this.width)
      this.svgDiv.setAttribute('height', this.height)

      this.svg = d3.select(this.svgDiv)

      this.xMin = self.x.min - (self.x.max - self.x.min) * 0.05
      this.xMax = self.x.max + (self.x.max - self.x.min) * 0.05

      this.yMin = self.y.min - (self.y.max - self.y.min) * 0.05
      this.yMax = self.y.max + (self.y.max - self.y.min) * 0.05

      //defs

      this.defs = this.svg.append('defs')
      this.nodeClipPath = this.defs.append('clipPath')
        .attr('id', 'nodeClipPath')
        .append('circle')
          .attr('r', this.nodeSize)

      // x
      this.xLine = this.svg.append('line')
        .attr('x1', HALF_CHART_PADDING)
        .attr('y1', this.height - HALF_CHART_PADDING)
        .attr('x2', this.width - HALF_CHART_PADDING)
        .attr('y2', this.height - HALF_CHART_PADDING)

      this.xGraduationsValues = this.range(this.xMin, this.xMax, this.chartWidth)

      this. xGraduation = this.svg.selectAll('.xGraduations')
        .data(this.xGraduationsValues)
        .enter().append('line')
        .attr('x1', function (x) {
          return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING
        })
        .attr('y1', self.height - HALF_CHART_PADDING)
        .attr('x2', function (x) {
          return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING
        })
        .attr('y2', self.height - HALF_CHART_PADDING + 5)

      this.xGraduationText = this.svg.selectAll('.xGraduations')
        .data(this.xGraduationsValues)
        .enter().append('text')
        .text(function (x) {
          return Math.round(x * 100) / 100
        })
        .attr('text-anchor', 'middle')
        .attr('x', function (x) {
          return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING
        })
        .attr('y', self.height - HALF_CHART_PADDING + 15)
        .style('font-size', '10px')


      this.xName = this.svg.append('text')
        .text(this.x.name)
        .attr('text-anchor', 'middle')
        .attr('x', self.width / 2)
        .attr('y', self.height - 2)

      // y
      this.yLine = this.svg.append('line')
        .attr('x1', HALF_CHART_PADDING)
        .attr('y1', HALF_CHART_PADDING)
        .attr('x2', HALF_CHART_PADDING)
        .attr('y2', this.height - HALF_CHART_PADDING)

      this.yGraduationsValues = this.range(this.yMin, this.yMax, this.chartHeight)

      this.yGraduation = this.svg.selectAll('.yGraduations')
        .data(this.yGraduationsValues)
        .enter().append('line')
        .attr('x1', HALF_CHART_PADDING - 5)
        .attr('y1', function (y) {
          return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING
        })
        .attr('x2', HALF_CHART_PADDING)
        .attr('y2', function (y) {
          return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING
        })

      this.yGraduationText = this.svg.selectAll('.yGraduations')
        .data(this.yGraduationsValues)
        .enter().append('text')
        .text(function (y) {
          return Math.round(y * 100) / 100
        })
        .attr('text-anchor', 'end')
        .attr('x', HALF_CHART_PADDING - 6)
        .attr('y', function (y) {
          return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING + 3
        })
        .style('font-size', '10px')

      this.yName = this.svg.append('text')
        .text(this.y.name)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90, 13,  ' + (this.height / 2) + ')')
        .attr('x', 13)
        .attr('y', self.height / 2)

      for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
        var product = this.pcm.products[p]
        product.x = product.cellsByFeatureId[this.x.id].type === 'number'
          ? ((product.cellsByFeatureId[this.x.id].value - this.xMin) / (this.xMax - this.xMin)) * this.chartWidth + HALF_CHART_PADDING
          : -100
        product.y = product.cellsByFeatureId[this.y.id].type === 'number'
          ? this.chartHeight - ((product.cellsByFeatureId[this.y.id].value - this.yMin) / (this.yMax - this.yMin)) * this.chartHeight + HALF_CHART_PADDING
          : -100
      }

      this.node = this.svg.selectAll('.node')
        .data(this.pcm.products)
        .enter().append('g')
        .attr('class', 'node')
        .attr('clip-path', 'url(#nodeClipPath)')
        .attr('transform', function (p) {
          return 'translate(' + p.x + ',' + p.y + ')'
        })
        .style('visibility', function (p) {
          return p.match
            ? 'visible'
            : 'hidden'
        })

      this.circles = this.node.append('circle')
        .attr('r', this.nodeSize)

      if (this.featureImage) {
        this.images = this.node.append('image')
          .attr('x', -this.nodeSize)
          .attr('y', -this.nodeSize)
          .attr('width', this.nodeSize * 2)
          .attr('height', this.nodeSize * 2)
          .attr('xlink:href', function (p) {
            return p.cellsByFeatureId[self.featureImage.id].value
          })
      }

      this.node.append('title')
        .text(function (p) {
          return self.pcm.primaryFeature.name + ': ' + p.cellsByFeatureId[self.pcm.primaryFeatureId].value + '\n'
            + self.feature1.name + ': ' + p.cellsByFeatureId[self.feature1.id].value + '\n'
            + self.feature2.name + ': ' + p.cellsByFeatureId[self.feature2.id].value
        })
    } else {
      this.drawn = false
    }
  }

  updateChart (updateNodeSize = false, updateImage = false, updateFeature1 = false, updateFeature2 = false) {
    var self = this

    //console.log('update : ' + updateNodeSize + ' ' + updateImage + ' ' + updateFeature1 + ' ' + updateFeature2)
    if (this.chart == null) return

    if (!this.drawn) {
      this.drawChart()
      return
    }

    if (this.chart === 'productChart') {
      if (updateNodeSize) {
        this.nodeClipPath.attr('r', this.nodeSize)

        this.circles.attr('x', -this.nodeSize)
          .attr('y', -this.nodeSize)
          .attr('width', this.nodeSize * 2)
          .attr('height', this.nodeSize * 2)

          if (this.featureImage) {
            this.images.attr('x', -this.nodeSize)
              .attr('y', -this.nodeSize)
              .attr('width', this.nodeSize * 2)
              .attr('height', this.nodeSize * 2)
          }
      }

      if (updateImage) {
        this.images.attr('xlink:href', function (p) {
            return p.cellsByFeatureId[self.featureImage.id].value
          })
      }

      if (updateFeature1 || updateFeature2) {
        if (updateFeature1) {
          this.xMin = self.x.min - (self.x.max - self.x.min) * 0.05
          this.xMax = self.x.max + (self.x.max - self.x.min) * 0.05

          this.xGraduationsValues = this.range(this.xMin, this.xMax, this.chartWidth)

          this.xGraduation.remove()
          this.xGraduation = this.svg.selectAll('.xGraduations')
            .data(this.xGraduationsValues)
            .enter().append('line')
            .attr('x1', function (x) {
              return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING
            })
            .attr('y1', self.height - HALF_CHART_PADDING)
            .attr('x2', function (x) {
              return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING
            })
            .attr('y2', self.height - HALF_CHART_PADDING + 5)

          this.xGraduationText.remove()
          this.xGraduationText = this.svg.selectAll('.xGraduations')
            .data(this.xGraduationsValues)
            .enter().append('text')
            .text(function (x) {
              return Math.round(x * 100) / 100
            })
            .attr('text-anchor', 'middle')
            .attr('x', function (x) {
              return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING
            })
            .attr('y', self.height - HALF_CHART_PADDING + 15)
            .style('font-size', '10px')


          this.xName.text(this.x.name)
        }

        if (updateFeature2) {
          this.yMin = self.y.min - (self.y.max - self.y.min) * 0.05
          this.yMax = self.y.max + (self.y.max - self.y.min) * 0.05

          this.yGraduationsValues = this.range(this.yMin, this.yMax, this.chartHeight)

          this.yGraduation.remove()
          this.yGraduation = this.svg.selectAll('.yGraduations')
            .data(this.yGraduationsValues)
            .enter().append('line')
            .attr('x1', HALF_CHART_PADDING - 5)
            .attr('y1', function (y) {
              return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING
            })
            .attr('x2', HALF_CHART_PADDING)
            .attr('y2', function (y) {
              return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING
            })

          this.yGraduationText.remove()
          this.yGraduationText = this.svg.selectAll('.yGraduations')
            .data(this.yGraduationsValues)
            .enter().append('text')
            .text(function (y) {
              return Math.round(y * 100) / 100
            })
            .attr('text-anchor', 'end')
            .attr('x', HALF_CHART_PADDING - 6)
            .attr('y', function (y) {
              return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING + 3
            })
            .style('font-size', '10px')

          this.yName.text(this.y.name)
        }

        for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
          var product = this.pcm.products[p]
          if (updateFeature1) product.x = product.cellsByFeatureId[this.x.id].type === 'number'
            ? ((product.cellsByFeatureId[this.x.id].value - this.xMin) / (this.xMax - this.xMin)) * this.chartWidth + HALF_CHART_PADDING
            : -100
          if (updateFeature2) product.y = product.cellsByFeatureId[this.y.id].type === 'number'
            ? this.chartHeight - ((product.cellsByFeatureId[this.y.id].value - this.yMin) / (this.yMax - this.yMin)) * this.chartHeight + HALF_CHART_PADDING
            : -100
        }

        this.node.attr('transform', function (p) {
            return 'translate(' + p.x + ',' + p.y + ')'
          })
      }

      this.node.style('visibility', function (p) {
        return p.match
          ? 'visible'
          : 'hidden'
      })

    } else {
      this.drawChart()
    }
  }
}
