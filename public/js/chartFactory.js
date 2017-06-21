const CHART_PADDING = 40
const GRADUATION_PER_PIXEL = 0.02
const MINIMAL_GRADUATION_GAP_IN_PX = 40
const TRANSITION_DURATION = 1000
const MAX_NODE_SIZE = 16

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

    this.featureImageDiv = document.getElementById('featureImage')
    this.featureImageSelect = document.getElementById('featureImageSelect')
    this.featureImageSelect.addEventListener('change', function (e) {
      self.updateChart(false, true, false, false)
    })
    this.feature1Div = document.getElementById('feature1')
    this.feature1Select = document.getElementById('feature1Select')
    this.feature1Select.addEventListener('change', function (e) {
      self.updateChart(false, false, true, false)
    })
    this.feature2Div = document.getElementById('feature2')
    this.feature2Select = document.getElementById('feature2Select')
    this.feature2Select.addEventListener('change', function (e) {
      self.updateChart(false, false, false, true)
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
    {
      var fdiv = document.createElement('option')
      fdiv.setAttribute('value', 'null')
      fdiv.innerHTML = 'None'
      this.featureImageSelect.appendChild(fdiv)
    }
    for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
      var feature = this.pcm.features[f]
      if (feature.type === 'number' && feature.min !== feature.max) {
        var fdiv = document.createElement('option')
        fdiv.setAttribute('value', feature.id)
        fdiv.innerHTML = feature.name
        this.feature1Select.appendChild(fdiv)
        this.feature2Select.appendChild(fdiv.cloneNode(true))
        if (this.feature1 == null) this.feature1Select.value = feature.id
        else if (this.feature2 == null) this.feature2Select.value = feature.id
      } else if (feature.type === 'image') {
        var fdiv = document.createElement('option')
        fdiv.setAttribute('value', feature.id)
        fdiv.innerHTML = feature.name
        this.featureImageSelect.appendChild(fdiv)
        if (this.featureImage == null) this.featureImageSelect.value = feature.id
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
    return this.width - CHART_PADDING * 2
  }

  get height () {
    return this.content.offsetHeight
  }

  get chartHeight () {
    return this.height - CHART_PADDING * 2
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
    return typeof this.pcm.featuresById[this.featureImageSelect.value] !== 'undefined'
      ? this.pcm.featuresById[this.featureImageSelect.value]
      : null
  }

  /*set featureImage (value) {
    this._featureImage = value
    this.featureImageSelect.value = this.featureImage.id
    this.updateChart(false, true, false, false)
  }*/

  get feature1 () {
    return typeof this.pcm.featuresById[this.feature1Select.value] !== 'undefined'
      ? this.pcm.featuresById[this.feature1Select.value]
      : null
  }

  get x () {
    return this.feature1
  }

  /*set feature1 (value) {
    this._feature1 = value
    this.feature1Select.value = this.feature1.id
    this.updateChart(false, false, true, false)
  }*/

  get feature2 () {
    return typeof this.pcm.featuresById[this.feature2Select.value] !== 'undefined'
      ? this.pcm.featuresById[this.feature2Select.value]
      : null
  }

  get y () {
    return this.feature2
  }

  /*set feature2 (value) {
    this._feature2 = value
    this.feature2Select.value = this.feature2.id
    this.updateChart(false, false, false, true)
  }*/

  cleanContent () {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild)
    }
  }

  range (min, max, size, feature = null) {
    var range = []
    if (feature) { // clustering
      var minimalGap = (max - min) * MINIMAL_GRADUATION_GAP_IN_PX / this.chartWidth
      var clusters = []
      for (var i = 0, li = feature.values.length; i < li; i++) {
        if (typeof feature.values[i] === 'number') {
          var j = 0
          while (clusters[j] && clusters[j][0] < feature.values[i]) {
            j++
          }
          clusters.splice(j, 0, [feature.values[i]])
        }
      }

      var clustering = true
      while (clustering) {
        var index = -1
        var gap = -1
        for (var i = 0, li = clusters.length; i < li - 1; i++) {
          var igap = this.clusterCenter(clusters[i+1]) - this.clusterCenter(clusters[i])
          if (index == -1 || igap < gap) {
              index = i
              gap = igap
          }
        }

        if (gap < minimalGap) {
          clusters[index] = clusters[index].concat(clusters[index+1])
          clusters.splice(index + 1, 1)
        } else {
          clustering = false
        }
      }

      for (var i = 0, li = clusters.length; i < li; i++) {
        range.push(this.clusterCenter(clusters[i]))
      }
    } else { // no clustering
      var step = (max - min) / (size * GRADUATION_PER_PIXEL)
      var n = min
      while (n < max) {
        range.push(n)
        n += step
      }
      range.push(max)
    }
    return range
  }

  clusterCenter (cluster) {
    var sum = 0
    for (var i = 0, li = cluster.length; i < li; i++) {
      sum += cluster[i]
    }
    return sum / cluster.length
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
      /*this.nodeClipPath = this.defs.append('clipPath')
        .attr('id', 'nodeClipPath')
        .append('circle')
          .attr('r', this.nodeSize)*/
      if (this.featureImage) {
        this.images = this.defs.selectAll('pattern')
          .data(this.pcm.products)
          .enter().append('pattern')
          .attr('id', function (p) {
            return 'image' + p.id
          })
          .attr('patternUnits', 'objectBoundingBox')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('viewBox', '0 0 1 1')
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .append('image')
          .attr('width', '1')
          .attr('height', '1')
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .attr('href', function (p) {
            return p.cellsByFeatureId[self.featureImage.id].value
          })
      }

      // x
      this.xLine = this.svg.append('line')
        .attr('x1', CHART_PADDING)
        .attr('y1', this.height - CHART_PADDING)
        .attr('x2', this.width - CHART_PADDING)
        .attr('y2', this.height - CHART_PADDING)

      this.xGraduationsValues = this.range(this.xMin, this.xMax, this.chartWidth, this.feature1)

      this. xGraduation = this.svg.selectAll('.xGraduations')
        .data(this.xGraduationsValues)
        .enter().append('line')
        .attr('x1', function (x) {
          return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
        })
        .attr('y1', self.height - CHART_PADDING)
        .attr('x2', function (x) {
          return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
        })
        .attr('y2', self.height - CHART_PADDING + 5)

      this.xGraduationText = this.svg.selectAll('.xGraduations')
        .data(this.xGraduationsValues)
        .enter().append('text')
        .text(function (x) {
          return Math.round(x * 100) / 100
        })
        .attr('text-anchor', 'middle')
        .attr('x', function (x) {
          return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
        })
        .attr('y', self.height - CHART_PADDING + 15)
        .style('font-size', '10px')


      this.xName = this.svg.append('text')
        .text(this.x.name)
        .attr('text-anchor', 'middle')
        .attr('x', self.width / 2)
        .attr('y', self.height - 2)

      // y
      this.yLine = this.svg.append('line')
        .attr('x1', CHART_PADDING)
        .attr('y1', CHART_PADDING)
        .attr('x2', CHART_PADDING)
        .attr('y2', this.height - CHART_PADDING)

      this.yGraduationsValues = this.range(this.yMin, this.yMax, this.chartHeight, this.feature2)

      this.yGraduation = this.svg.selectAll('.yGraduations')
        .data(this.yGraduationsValues)
        .enter().append('line')
        .attr('x1', CHART_PADDING - 5)
        .attr('y1', function (y) {
          return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING
        })
        .attr('x2', CHART_PADDING)
        .attr('y2', function (y) {
          return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING
        })

      this.yGraduationText = this.svg.selectAll('.yGraduations')
        .data(this.yGraduationsValues)
        .enter().append('text')
        .text(function (y) {
          return Math.round(y * 100) / 100
        })
        .attr('text-anchor', 'end')
        .attr('x', CHART_PADDING - 6)
        .attr('y', function (y) {
          return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING + 3
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
          ? ((product.cellsByFeatureId[this.x.id].value - this.xMin) / (this.xMax - this.xMin)) * this.chartWidth + CHART_PADDING
          : -MAX_NODE_SIZE
        product.y = product.cellsByFeatureId[this.y.id].type === 'number'
          ? this.chartHeight - ((product.cellsByFeatureId[this.y.id].value - this.yMin) / (this.yMax - this.yMin)) * this.chartHeight + CHART_PADDING
          : this.height + MAX_NODE_SIZE
      }

      this.node = this.svg.selectAll('.node')
        .data(this.pcm.products)
        .enter().append('g')
        .attr('class', 'node')
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
        .attr('fill', function (p) {
          return self.featureImage && p.cellsByFeatureId[self.featureImage.id].type === 'image'
            ? 'url(#image' + p.id + ')'
            : '#009688'
        })

      this.titles = this.node.append('title')
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
        this.circles.transition()
          .duration(TRANSITION_DURATION)
          .attr('r', this.nodeSize)
      }

      if (updateImage) {
        if (this.featureImage != null) {
          this.images.attr('href', function (p) {
            return p.cellsByFeatureId[self.featureImage.id].value
          })
        }
        this.circles.attr('fill', function (p) {
            return self.featureImage && p.cellsByFeatureId[self.featureImage.id].type === 'image'
              ? 'url(#image' + p.id + ')'
              : '#009688'
          })
      }

      if (updateFeature1 || updateFeature2) {
        if (updateFeature1) {
          this.xMin = self.x.min - (self.x.max - self.x.min) * 0.05
          this.xMax = self.x.max + (self.x.max - self.x.min) * 0.05

          this.xGraduationsValues = this.range(this.xMin, this.xMax, this.chartWidth, this.feature1)

          this.xGraduation.remove()
          this.xGraduation = this.svg.selectAll('.xGraduations')
            .data(this.xGraduationsValues)
            .enter().append('line')
            .attr('x1', function (x) {
              return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
            })
            .attr('y1', self.height - CHART_PADDING)
            .attr('x2', function (x) {
              return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
            })
            .attr('y2', self.height - CHART_PADDING + 5)

          this.xGraduationText.remove()
          this.xGraduationText = this.svg.selectAll('.xGraduations')
            .data(this.xGraduationsValues)
            .enter().append('text')
            .text(function (x) {
              return Math.round(x * 100) / 100
            })
            .attr('text-anchor', 'middle')
            .attr('x', function (x) {
              return ((x - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
            })
            .attr('y', self.height - CHART_PADDING + 15)
            .style('font-size', '10px')


          this.xName.text(this.x.name)
        }

        if (updateFeature2) {
          this.yMin = self.y.min - (self.y.max - self.y.min) * 0.05
          this.yMax = self.y.max + (self.y.max - self.y.min) * 0.05

          this.yGraduationsValues = this.range(this.yMin, this.yMax, this.chartHeight, this.feature2)

          this.yGraduation.remove()
          this.yGraduation = this.svg.selectAll('.yGraduations')
            .data(this.yGraduationsValues)
            .enter().append('line')
            .attr('x1', CHART_PADDING - 5)
            .attr('y1', function (y) {
              return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING
            })
            .attr('x2', CHART_PADDING)
            .attr('y2', function (y) {
              return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING
            })

          this.yGraduationText.remove()
          this.yGraduationText = this.svg.selectAll('.yGraduations')
            .data(this.yGraduationsValues)
            .enter().append('text')
            .text(function (y) {
              return Math.round(y * 100) / 100
            })
            .attr('text-anchor', 'end')
            .attr('x', CHART_PADDING - 6)
            .attr('y', function (y) {
              return self.chartHeight - ((y - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING + 3
            })
            .style('font-size', '10px')

          this.yName.text(this.y.name)
        }

        for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
          var product = this.pcm.products[p]
          if (updateFeature1) {
            product.x = product.cellsByFeatureId[this.x.id].type === 'number'
              ? ((product.cellsByFeatureId[this.x.id].value - this.xMin) / (this.xMax - this.xMin)) * this.chartWidth + CHART_PADDING
              : -MAX_NODE_SIZE
          }
          if (updateFeature2) {
            product.y = product.cellsByFeatureId[this.y.id].type === 'number'
              ? this.chartHeight - ((product.cellsByFeatureId[this.y.id].value - this.yMin) / (this.yMax - this.yMin)) * this.chartHeight + CHART_PADDING
              : this.height + MAX_NODE_SIZE
          }
        }

        this.node.transition()
          .duration(TRANSITION_DURATION)
          .attr('transform', function (p) {
            return 'translate(' + p.x + ',' + p.y + ')'
          })

        this.titles.text(function (p) {
            return self.pcm.primaryFeature.name + ': ' + p.cellsByFeatureId[self.pcm.primaryFeatureId].value + '\n'
              + self.feature1.name + ': ' + p.cellsByFeatureId[self.feature1.id].value + '\n'
              + self.feature2.name + ': ' + p.cellsByFeatureId[self.feature2.id].value
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
