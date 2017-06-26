const CHART_PADDING = 50
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
      self.updateChart('image')
    })
    this.feature0Div = document.getElementById('feature0')
    this.feature0Select = document.getElementById('feature0Select')
    this.feature0Select.addEventListener('change', function (e) {
      self.updateChart('feature0')
    })
    this.feature1Div = document.getElementById('feature1')
    this.feature1Select = document.getElementById('feature1Select')
    this.feature1Select.addEventListener('change', function (e) {
      self.updateChart('feature1')
    })
    this.feature2Div = document.getElementById('feature2')
    this.feature2Select = document.getElementById('feature2Select')
    this.feature2Select.addEventListener('change', function (e) {
      self.updateChart('feature2')
    })

    this.content = document.getElementById('chartContent')

    this.drawn = false
    this.chart = null

    this.charts = {
      productChart: {},
      pieChart: {}
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
    var f1 = false
    var f2 = false
    for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
      var feature = this.pcm.features[f]

      var fdiv = document.createElement('option')
      fdiv.setAttribute('value', feature.id)
      fdiv.innerHTML = feature.name

      this.feature0Select.appendChild(fdiv)

      this.featureImageSelect.appendChild(fdiv.cloneNode(true))
      if (feature.type === 'image' && this.featureImage == null) this.featureImageSelect.value = feature.id

      if (feature.type === 'number' && feature.min !== feature.max) {
        this.feature1Select.appendChild(fdiv.cloneNode(true))
        this.feature2Select.appendChild(fdiv.cloneNode(true))
        if (!f1) {
          f1 = true
          this.feature1Select.value = feature.id
        } else if (!f2) {
          f2 = true
          this.feature2Select.value = feature.id
        }
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
    this.updateChart('nodeSize')
  }

  get featureImage () {
    return typeof this.pcm.featuresById[this.featureImageSelect.value] !== 'undefined'
      ? this.pcm.featuresById[this.featureImageSelect.value]
      : null
  }

  get feature0 () {
    return typeof this.pcm.featuresById[this.feature0Select.value] !== 'undefined'
      ? this.pcm.featuresById[this.feature0Select.value]
      : null
  }

  get feature1 () {
    return typeof this.pcm.featuresById[this.feature1Select.value] !== 'undefined'
      ? this.pcm.featuresById[this.feature1Select.value]
      : null
  }

  get x () {
    return this.feature1
  }

  get feature2 () {
    return typeof this.pcm.featuresById[this.feature2Select.value] !== 'undefined'
      ? this.pcm.featuresById[this.feature2Select.value]
      : null
  }

  get y () {
    return this.feature2
  }

  valueToColor (value) {
    if (typeof value === 'object') {
      _value = ''
      for (var i = 0, li = value.length; i < li; i++) {
        _value += value[i]
      }
      value = _value
    } else if (typeof value !== 'string') {
      value = '' + value
    }

    var hash = 1
    for (var i = 0; i < value.length; i++) {
       hash *= value.charCodeAt(i)
    }

    var c = (hash)
        .toString(16)
        .toUpperCase()
    while (c.length < 6) {
      c += c
    }

    return '#' + c.substring(0, 6)
  }

  colorBrightness (color) {
    var c = color.substring(1)      // strip #
    var rgb = parseInt(c, 16)   // convert rrggbb to decimal
    var r = (rgb >> 16) & 0xff  // extract red
    var g = (rgb >>  8) & 0xff  // extract green
    var b = (rgb >>  0) & 0xff  // extract blue

    return 0.2126 * r + 0.7152 * g + 0.0722 * b // per ITU-R BT.709
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

  /**
   * Show every div specified and hide other in option bar
   * @param {string[]} arguments - An array of string
   * ex: showDivs('feature1', 'featureImage')
   */
   showDivs () {
     this.nodeSizeDiv.style.display = 'none'
     this.featureImageDiv.style.display = 'none'
     this.feature0Div.style.display = 'none'
     this.feature1Div.style.display = 'none'
     this.feature2Div.style.display = 'none'

     for (var i = 0; i < arguments.length; i++) {
       if (arguments[i] === 'nodeSize') this.nodeSizeDiv.style.display = 'inline-block'
       else if (arguments[i] === 'featureImage') this.featureImageDiv.style.display = 'inline-block'
       else if (arguments[i] === 'feature0') this.feature0Div.style.display = 'inline-block'
       else if (arguments[i] === 'feature1') this.feature1Div.style.display = 'inline-block'
       else if (arguments[i] === 'feature2') this.feature2Div.style.display = 'inline-block'
     }
   }

  /**
   * Clean chart content and create a new svg element
   */
  cleanContent () {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild)
    }
    this.svgDiv = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.content.appendChild(this.svgDiv)
    this.svgDiv.setAttribute('width', this.width)
    this.svgDiv.setAttribute('height', this.height)
    this.svg = d3.select(this.svgDiv)
  }

  drawChart (chart) {
    var self = this

    if (this.chart && this.chart != chart) this.charts[this.chart].button.className = ''
    if (typeof chart !== 'undefined') this.chart = chart
    this.charts[this.chart].button.className = 'active'

    //console.log('drawChart ' + this.chart)

    this.cleanContent()
    this.drawn = true

    if (this.chart === 'productChart') { // Product Chart ------------------------------------------------------------------------
      this.showDivs('nodeSize', 'featureImage', 'feature1', 'feature2')

      this.xMin = self.x.min - (self.x.max - self.x.min) * 0.05
      this.xMax = self.x.max + (self.x.max - self.x.min) * 0.05

      this.yMin = self.y.min - (self.y.max - self.y.min) * 0.05
      this.yMax = self.y.max + (self.y.max - self.y.min) * 0.05

      //defs
      this.defs = this.svg.append('defs')

      if (this.featureImage && this.featureImage.type === 'image') {
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
          if (self.featureImage) {
            if (p.cellsByFeatureId[self.featureImage.id].type === 'image') {
              return 'url(#image' + p.id + ')'
            } else if (p.cellsByFeatureId[self.featureImage.id].type !== 'undefined') {
              return self.valueToColor(p.cellsByFeatureId[self.featureImage.id].value)
            }
          }
          return '#009688' // Teal 500
        })

      this.titles = this.node.append('title')
        .text(function (p) {
          return self.pcm.primaryFeature.name + ': ' + p.cellsByFeatureId[self.pcm.primaryFeatureId].value + '\n'
            + self.feature1.name + ': ' + p.cellsByFeatureId[self.feature1.id].value + '\n'
            + self.feature2.name + ': ' + p.cellsByFeatureId[self.feature2.id].value
        })
    } else if (this.chart === 'pieChart') { // Pie Chart ------------------------------------------------------------------------
      this.showDivs('feature0')

      var values = []
      var occurrences = {}
      var total = 0

      for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
        var cell = this.pcm.products[p].cellsByFeatureId[this.feature0.id]

        if (this.pcm.products[p].match) {
          if (cell.type === 'multiple') {
            for (var i = 0, li = cell.value.length; i < li; i++) {
              total++
              if (typeof occurrences[cell.value[i]] === 'undefined') {
                values.push(cell.value[i])
                occurrences[cell.value[i]] = 1
              } else occurrences[cell.value[i]]++
            }
          } else {
            total++
            if (typeof occurrences[cell.value] === 'undefined') {
              values.push(cell.value)
              occurrences[cell.value] = 1
            } else occurrences[cell.value]++
          }
        }
      }

      values.sort()

      this.radius = Math.min(this.width, this.height) / 2 - 10

      this.arc = d3.arc()
        .outerRadius(self.radius)
        .innerRadius(0)

      this.labelArc = d3.arc()
        .outerRadius(self.radius - 10)
        .innerRadius(self.radius - 10)

      this.pie = d3.pie()
        .sort(null)
        .value(function(d) { return occurrences[d] })

      this.pieChart = this.svg.append('g')
        .attr('class', 'pieChart')
        .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')

      this.node = self.pieChart.selectAll('.arc')
        .data(self.pie(values))
        .enter().append('g')
        .attr('class', 'arc')

      this.path = this.node.append('path')
        .style('fill', function (d) { return d.color = self.valueToColor(d.data) })
        .transition().delay(function (d, i) {
          var sum = 0
          for (var j = 0; j < i; j++) {
            sum += occurrences[values[j]]
          }
          return d._delay = sum * TRANSITION_DURATION / total
        }).duration(function (d) {
          return d._duration = occurrences[d.data] * TRANSITION_DURATION / total
        })
        .attrTween('d', function (d) {
      		var i = d3.interpolate(d.startAngle + 0.1, d.endAngle)
      		return function (t) {
      			d.endAngle = i(t)
      			return self.arc(d)
        	}
  		  })

      this.node.append('text')
        .attr('transform', function (d) {
          var angle = (d.startAngle + d.endAngle) * 57.2958 / 2
          d._anchor = angle < 180
            ? 'end'
            : 'start'
          angle = angle < 180
            ? angle - 90
            : angle + 90
          return 'translate(' + self.labelArc.centroid(d) + ')'
            + ', rotate(' + angle + ')'
        })
        .attr('dy', '.35em')
        .attr('fill', function (d) {
          return self.colorBrightness(d.color) > 180
            ? 'black'
            : 'white'
        })
        .attr('text-anchor', function (d) {
          return d._anchor
        })
        .text(function (d) { return (d.endAngle - d.startAngle) * self.radius > 50
          ? d.data
          : ''
         })
         .attr('opacity', '0')
         .transition().delay(function (d) {
           return d._delay
         }).duration(function (d) {
           return d._duration
         }).attr('opacity', '1')


      this.node.append('title')
        .text(function (d) {
          return self.feature0.name + ' : ' + d.data + '\n'
            + 'occurences : ' + occurrences[d.data] + ' (' + (Math.round(occurrences[d.data] * 10000 / total) / 100) + '%)'
        })
    } else {
      this.drawn = false
    }
  }

  updateChart (change = null) {
    var self = this

    //console.log('update : ' + updateNodeSize + ' ' + updateImage + ' ' + updateFeature1 + ' ' + updateFeature2)
    if (this.chart == null) return

    if (!this.drawn) {
      this.drawChart()
      return
    }

    if (this.chart === 'productChart') {
      if (change === 'nodeSize') {
        this.circles.transition()
          .duration(TRANSITION_DURATION)
          .attr('r', this.nodeSize)
      }

      if (change === 'image') {
        if (this.featureImage != null) {
          if (this.images) {
            this.images.attr('href', function (p) {
              return p.cellsByFeatureId[self.featureImage.id].value
            })
          } else {
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
        }
        this.circles.attr('fill', function (p) {
            if (self.featureImage) {
              if (p.cellsByFeatureId[self.featureImage.id].type === 'image') {
                return 'url(#image' + p.id + ')'
              } else if (p.cellsByFeatureId[self.featureImage.id].type !== 'undefined') {
                return self.valueToColor(p.cellsByFeatureId[self.featureImage.id].value)
              }
            }
            return '#009688' // Teal 500
          })
      }

      if (change === 'feature1' || change === 'feature2') {
        if (change === 'feature1') {
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

        if (change === 'feature2') {
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
          if (change === 'feature1') {
            product.x = product.cellsByFeatureId[this.x.id].type === 'number'
              ? ((product.cellsByFeatureId[this.x.id].value - this.xMin) / (this.xMax - this.xMin)) * this.chartWidth + CHART_PADDING
              : -MAX_NODE_SIZE
          }
          if (change === 'feature2') {
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
