const CHART_PADDING = 50
const MINIMAL_GRADUATION_GAP_IN_PX = 15
const GRADUATION_PER_PIXEL = 1 / MINIMAL_GRADUATION_GAP_IN_PX
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
      pieChart: {},
      barChart: {}
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
    while (this.featureImageSelect.firstChild) this.featureImageSelect.removeChild(this.featureImageSelect.firstChild)
    while (this.feature0Select.firstChild) this.feature0Select.removeChild(this.feature0Select.firstChild)
    while (this.feature1Select.firstChild) this.feature1Select.removeChild(this.feature1Select.firstChild)
    while (this.feature2Select.firstChild) this.feature2Select.removeChild(this.feature2Select.firstChild)

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
    var c = color.substring(1) // strip #
    var rgb = parseInt(c, 16) // convert rrggbb to decimal
    var r = (rgb >> 16) & 0xff // extract red
    var g = (rgb >>  8) & 0xff // extract green
    var b = (rgb >>  0) & 0xff // extract blue

    return 0.2126 * r + 0.7152 * g + 0.0722 * b // per ITU-R BT.709
  }

  range (min, max, size, feature = null, round = null) {
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

    if (typeof round == 'number') {
      for (var i = 0, li = range.length; i < li; i++) {
        range[i] = Math.round(range[i] * round) / round
      }
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

  /**
   * Draw the x axis
   * @param {string} name - the name of the line (ex: the name of the x feature)
   * @param {Array} arr - An array that contains values for graduations
   * @param {function} calcX - A function that compute the pos X of the graduation
   */
  drawXAxis (name, arr = null, calcX = null) {
    var self = this

    if (this.xLine) this.xLine.remove()
    this.xLine = this.svg.append('line')
      .attr('x1', CHART_PADDING)
      .attr('y1', this.height - CHART_PADDING)
      .attr('x2', this.width - CHART_PADDING)
      .attr('y2', this.height - CHART_PADDING)

    if (this.xName) this.xName.remove()
    this.xName = this.svg.append('text')
      .text(name)
      .attr('text-anchor', 'middle')
      .attr('x', this.width / 2)
      .attr('y', this.height - 2)

    if (arr) { // graduations
      if (this.xGraduation) this.xGraduation.remove()
      this.xGraduation = this.svg.selectAll('.xGraduations')
        .data(arr)
        .enter().append('line')
        .each(function (d, i) {
          this._x = calcX
            ? calcX(d, i)
            : d
        })
        .attr('x1', function (x) { return this._x })
        .attr('y1', this.height - CHART_PADDING)
        .attr('x2', function (x) { return this._x })
        .attr('y2', this.height - CHART_PADDING + 5)

      if (this.xGraduationText) this.xGraduationText.remove()
      this.xGraduationText = this.svg.selectAll('.xGraduations')
        .data(arr)
        .enter().append('text')
        .each(function (d, i) {
           this._x = calcX
             ? calcX(d, i)
             : d
        })
        .text(function (d) { return d })
        .attr('text-anchor', 'end')
        .attr('x', function (x) { return this._x + 4 })
        .attr('y', this.height - CHART_PADDING + 10)
        .attr('transform', function (d) {
          return 'rotate(-60, ' + (this._x + 3) + ', ' + (self.height - CHART_PADDING + 10) + ')'
        })
        .style('font-size', '11px')
    }
  }

  /**
   * Draw the y axis
   * @param {string} name - the name of the line (ex: the name of the y feature)
   * @param {Array} arr - An array that contains values for graduations
   * @param {function} calcY - A function that compute the pos Y of the graduation
   */
  drawYAxis (name, arr = null, calcY = null) {
    if (this.yLine) this.yLine.remove()
    this.yLine = this.svg.append('line')
      .attr('x1', CHART_PADDING)
      .attr('y1', CHART_PADDING)
      .attr('x2', CHART_PADDING)
      .attr('y2', this.height - CHART_PADDING)

    if (this.yName) this.yName.remove()
    this.yName = this.svg.append('text')
      .text(name)
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90, 13,  ' + (this.height / 2) + ')')
      .attr('x', 13)
      .attr('y', this.height / 2)

    if (arr) { // graduations
      if (this.yGraduation) this.yGraduation.remove()
      this.yGraduation = this.svg.selectAll('.yGraduations')
        .data(arr)
        .enter().append('line')
        .each(function (d, i) {
          this._y = calcY
            ? calcY(d, i)
            : d
        })
        .attr('x1', CHART_PADDING - 5)
        .attr('y1', function (d) { return this._y })
        .attr('x2', CHART_PADDING)
        .attr('y2', function (d) { return this._y })

      if (this.yGraduationText) this.yGraduationText.remove()
      this.yGraduationText = this.svg.selectAll('.yGraduations')
        .data(this.yGraduationsValues)
        .enter().append('text')
        .each(function (d, i) {
          this._y = calcY
            ? calcY(d, i)
            : d
        })
        .text(function (d) { return d })
        .attr('text-anchor', 'end')
        .attr('x', CHART_PADDING - 6)
        .attr('y', function (y) { return this._y + 3 })
        .style('font-size', '11px')
    }
  }

  /**
   * Compute data about feature 0 (for pieChart and bar chart)
   */
  computeData () {
    this.values = []
    this.occurrences = {}
    this.total = 0
    this.max = 0

    for (var p = 0, lp = this.pcm.products.length; p < lp; p++) {
      var cell = this.pcm.products[p].cellsByFeatureId[this.feature0.id]

      if (cell.type === 'multiple') {
        for (var i = 0, li = cell.value.length; i < li; i++) {
          if (typeof this.occurrences[cell.value[i]] === 'undefined') {
            this.values.push(cell.value[i])
            this.occurrences[cell.value[i]] = 0
          }
          if (cell.product.match) {
            this.total++
            this.occurrences[cell.value[i]]++
            if (this.occurrences[cell.value[i]] > this.max) this.max = this.occurrences[cell.value[i]]
          }
        }
      } else {
        if (typeof this.occurrences[cell.value] === 'undefined') {
          this.values.push(cell.value)
          this.occurrences[cell.value] = 0
        }
        if (cell.product.match) {
          this.total++
          this.occurrences[cell.value]++
          if (this.occurrences[cell.value] > this.max) this.max = this.occurrences[cell.value]
        }
      }
    }

    this.values.sort()
  }

  /**
   * Draw a chart
   * @param {string} chart - the name of the chart to draw, if null re-draw current chart
   */
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

      if (this.x == null || this.y == null) {
        console.log('x == null or y == null')
        return
      }

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
      this.xGraduationsValues = this.range(this.xMin, this.xMax, this.chartWidth, this.feature1, 100)

      this.drawXAxis(this.x.name, this.xGraduationsValues, function (d, i) {
        return ((d - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
      })

      // y
      this.yGraduationsValues = this.range(this.yMin, this.yMax, this.chartHeight, this.feature2, 100)

      this.drawYAxis(this.y.name, this.yGraduationsValues, function (d, i) {
        return self.chartHeight - ((d - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING
      })

      // Set the pos (x,y) of every prod
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

      this.title = this.node.append('title')
        .text(function (p) {
          return self.pcm.primaryFeature.name + ': ' + p.cellsByFeatureId[self.pcm.primaryFeatureId].value + '\n'
            + self.feature1.name + ': ' + p.cellsByFeatureId[self.feature1.id].value + '\n'
            + self.feature2.name + ': ' + p.cellsByFeatureId[self.feature2.id].value
        })
    } else if (this.chart === 'pieChart') { // Pie Chart ------------------------------------------------------------------------
      this.showDivs('feature0')

      this.computeData()

      this.radius = Math.min(this.width, this.height) / 2 - 10

      this.arc = d3.arc()
        .outerRadius(self.radius)
        .innerRadius(0)

      this.labelArc = d3.arc()
        .outerRadius(self.radius / 2)
        .innerRadius(self.radius / 2)

      this.pie = d3.pie()
        .sort(null)
        .value(function (d) { return self.occurrences[d] })

      this.pieChart = this.svg.append('g')
        .attr('class', 'pieChart')
        .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')

      this.path = self.pieChart.datum(this.values).selectAll('.arc')
        .data(self.pie)
        .enter().append('path')
        .style('fill', function (d) { return self.valueToColor(d.data) })
        .each(function (d) {
          this._current = d
        })

      this.path.transition().delay(function (d, i) {
          return self.delay(d, i)
        })
        .duration(function (d) {
          return self.duration(d)
        })
        .ease(d3.easeLinear)
        .attrTween('d', function (d) {
      		var i = d3.interpolate(d.startAngle, d.endAngle)
      		return function (t) {
      			return self.arc({
              startAngle: d.startAngle,
              endAngle: i(t)
            })
        	}
  		  })

      this.text = this.pieChart.datum(this.values).selectAll('.arc')
        .data(self.pie)
        .enter().append('text')
        .attr('transform', function (d) {
          var angle = (d.startAngle + d.endAngle) * 57.2958 / 2
          angle = angle < 180
            ? angle - 90
            : angle + 90
          return 'translate(' + self.labelArc.centroid(d) + ')'
            + ', rotate(' + angle + ')'
        })
        .attr('dy', '.35em')
        .attr('fill', function (d) {
          return self.colorBrightness(self.valueToColor(d.data)) > 180
            ? 'black'
            : 'white'
        })
        .attr('text-anchor', 'middle')
        .text(function (d) {
          return d.data
        })
        .attr('opacity', '0')

      this.text.transition().delay(function (d, i) {
          return self.delay(d, i)
        })
        .duration(function (d) {
          return self.duration(d)
        }).attr('opacity', function (d) { return (d.endAngle - d.startAngle) * self.radius > 50
          ? '1'
          : '0'
        })


      this.title = this.path.append('title')
        .text(function (d) {
          return self.feature0.name + ' : ' + d.data + '\n'
            + 'occurrences : ' + self.occurrences[d.data] + ' (' + (Math.round(self.occurrences[d.data] * 10000 / self.total) / 100) + '%)'
        })
    } else if (this.chart === 'barChart') { // Bar Chart ------------------------------------------------------------------------
      this.showDivs('feature0')

      this.computeData()

      this.barMargin = this.values.length * 2 + 1 < this.chartWidth
      this.barWidth = this.barMargin
        ? (this.chartWidth - this.values.length - 1) / this.values.length
        : this.chartWidth / this.values.length

      if (this.barMargin) {
        this.drawXAxis(this.feature0.name, this.values, function (d, i) {
          return (i + 0.5) * self.barWidth + CHART_PADDING + i + 1
        })
      } else {
        this.drawXAxis(this.feature0.name)
      }

      this.drawYAxis('occurrences')

      this.bar = this.svg.selectAll('.bar')
        .data(this.values)
        .enter().append('rect')
        .each(function (d, i) {
          this._height = (self.chartHeight - 1) * (self.occurrences[d] / self.max)
          this._x = self.barMargin
           ? i * self.barWidth + CHART_PADDING + i + 1
           : i * self.barWidth + CHART_PADDING
        }).attr('class', 'bar')
        .attr('x', function () { return this._x })
        .attr('width', this.barWidth)
        .attr('y', this.chartHeight - 1 + CHART_PADDING)
        .attr('height', 0)

      this.bar.transition().duration(TRANSITION_DURATION)
        .attr('y', function () { return self.chartHeight - 1 + CHART_PADDING - this._height })
        .attr('height', function () { return this._height })

      this.title = this.bar.append('title')
        .text(function (d) {
          return self.feature0.name + ' : ' + d + '\n'
            + 'occurrences : ' + self.occurrences[d]
        })

      if (this.barWidth > 10) {
        this.text = this.svg.selectAll('.text')
          .data(this.values)
          .enter().append('text')
          .each(function (d, i) {
            this._text = self.occurrences[d]
            this._barHeight = (self.chartHeight - 1) * (self.occurrences[d] / self.max)
            this._barX = self.barMargin
             ? i * self.barWidth + CHART_PADDING + i + 1
             : i * self.barWidth + CHART_PADDING

            this._rotate = false
            var fitWidth = self.barWidth >= stringMeter.width(this._text, 10, 'Roboto-Regular')
            var fitHeight = this._barHeight >= stringMeter.height(this._text, 10, 'Roboto-Regular')
            if (fitWidth) {
              this._x = this._barX + self.barWidth / 2
              this._textAnchor = 'middle'
              if (fitHeight) {
                this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight + 10
              } else {
                this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight - 2
              }
            } else {
              fitWidth = self.barWidth >= stringMeter.height(this._text, 10, 'Roboto-Regular')
              fitHeight = this._barHeight >= stringMeter.width(this._text, 10, 'Roboto-Regular')
              this._rotate = true
              if (fitHeight) {
                this._x = this._barX + self.barWidth / 2 + 4
                this._textAnchor = 'end'
                this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight + 2
              } else {
                this._x = this._barX + self.barWidth / 2 + 4
                this._textAnchor = 'start'
                this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight - 2
              }
            }

            this._class = fitHeight
              ? 'textWhite'
              : ''
          })
          .text(function (d) { return this._text })
          .attr('text-anchor', function (d) { return this._textAnchor })
          .attr('transform', function (d) {
            return this._rotate
              ? 'rotate(-90, ' + this._x + ', ' + this._y + ')'
              : ''
          })
          .attr('x', function (d) { return this._x })
          .attr('y', function (d) { return this._y })
          .attr('font-size', '10px')
          .attr('class', function (d) { return this._class || '' })
          .attr('opacity', '0')

        this.text.transition().duration(TRANSITION_DURATION)
          .attr('opacity', '1')
      }
    } else {
      this.drawn = false
    }
  }

  /**
   * Compute the delay of a transition for d3
   */
  delay (d, i) {
    var sum = 0
    for (var j = 0; j < i; j++) {
      sum += this.occurrences[this.values[j]]
    }
    return sum * TRANSITION_DURATION / this.total
  }

  /**
   * Compute the duration of a transition for d3
   */
  duration (d, i) {
    return this.occurrences[d.data] * TRANSITION_DURATION / this.total
  }

  /**
   * Update the chart
   * @param {string} change - The attribute which changed, if null it's the configurator
   */
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

          this.xGraduationsValues = this.range(this.xMin, this.xMax, this.chartWidth, this.feature1, 100)

          this.drawXAxis(this.x.name, this.xGraduationsValues, function (d, i) {
            return ((d - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + CHART_PADDING
          })
        }

        if (change === 'feature2') {
          this.yMin = self.y.min - (self.y.max - self.y.min) * 0.05
          this.yMax = self.y.max + (self.y.max - self.y.min) * 0.05

          this.yGraduationsValues = this.range(this.yMin, this.yMax, this.chartHeight, this.feature2, 100)

          this.drawYAxis(this.y.name, this.yGraduationsValues, function (d, i) {
            return self.chartHeight - ((d - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + CHART_PADDING
          })
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

        this.title.text(function (p) {
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
    } else if (this.chart == 'pieChart') { // Pie Chart ------------------------------------------------------------------------
      if (change == 'feature0') {
        this.drawChart()
      } else {
        this.computeData()

        this.path.data(this.pie).transition().duration(TRANSITION_DURATION).attrTween("d", function (d) {
          var i = d3.interpolate(this._current.startAngle, d.startAngle)
          var j = d3.interpolate(this._current.endAngle, d.endAngle)
          this._current = d
          return function (t) {
            return self.arc({
              startAngle: i(t),
              endAngle: j(t)
            })
          }
        })

        this.text.data(this.pie).transition().duration(TRANSITION_DURATION).attr('transform', function (d) {
          var angle = (d.startAngle + d.endAngle) * 57.2958 / 2
          angle = angle < 180
            ? angle - 90
            : angle + 90
          return 'translate(' + self.labelArc.centroid(d) + ')'
            + ', rotate(' + angle + ')'
        }).attr('opacity', function (d) { return (d.endAngle - d.startAngle) * self.radius > 50
          ? '1'
          : '0'
        })

        this.title.text(function (d) {
            return self.feature0.name + ' : ' + d.data + '\n'
              + 'occurrences : ' + self.occurrences[d.data] + ' (' + (Math.round(self.occurrences[d.data] * 10000 / self.total) / 100) + '%)'
          })
      }
    } else if (this.chart == 'barChart') { // Bar Chart ------------------------------------------------------------------------
      if (change == 'feature0') {
        this.drawChart()
      } else {
        this.computeData()

        this.bar.each(function (d, i) {
            this._height = self.max != 0
              ? (self.chartHeight - 1) * (self.occurrences[d] / self.max)
              : 0
          }).transition().duration(TRANSITION_DURATION)
          .attr('y', function () { return self.chartHeight - 1 + CHART_PADDING - this._height })
          .attr('height', function () { return this._height })

        this.title.text(function (d) {
            return self.feature0.name + ' : ' + d + '\n'
              + 'occurrences : ' + self.occurrences[d]
          })

        if (this.barWidth > 10) {
          this.text.remove()
          this.text = this.svg.selectAll('.text')
            .data(this.values)
            .enter().append('text')
            .each(function (d, i) {
              this._text = self.occurrences[d]
              this._barHeight = self.max != 0
                ? (self.chartHeight - 1) * (self.occurrences[d] / self.max)
                : 0
              this._barX = self.barMargin
               ? i * self.barWidth + CHART_PADDING + i + 1
               : i * self.barWidth + CHART_PADDING

              this._rotate = false
              var fitWidth = self.barWidth >= stringMeter.width(this._text, 10, 'Roboto-Regular')
              var fitHeight = this._barHeight >= stringMeter.height(this._text, 10, 'Roboto-Regular')
              if (fitWidth) {
                this._x = this._barX + self.barWidth / 2
                this._textAnchor = 'middle'
                if (fitHeight) {
                  this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight + 10
                } else {
                  this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight - 2
                }
              } else {
                fitWidth = self.barWidth >= stringMeter.height(this._text, 10, 'Roboto-Regular')
                fitHeight = this._barHeight >= stringMeter.width(this._text, 10, 'Roboto-Regular')
                this._rotate = true
                if (fitHeight) {
                  this._x = this._barX + self.barWidth / 2 + 4
                  this._textAnchor = 'end'
                  this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight + 2
                } else {
                  this._x = this._barX + self.barWidth / 2 + 4
                  this._textAnchor = 'start'
                  this._y = self.chartHeight - 1 + CHART_PADDING - this._barHeight - 2
                }
              }

              this._class = fitHeight
                ? 'textWhite'
                : ''
            })
            .text(function (d) { return this._text })
            .attr('text-anchor', function (d) { return this._textAnchor })
            .attr('transform', function (d) {
              return this._rotate
                ? 'rotate(-90, ' + this._x + ', ' + this._y + ')'
                : ''
            })
            .attr('x', function (d) { return this._x })
            .attr('y', function (d) { return this._y })
            .attr('font-size', '10px')
            .attr('class', function (d) { return this._class || '' })
            .attr('opacity', '0')

          this.text.transition().duration(TRANSITION_DURATION)
            .attr('opacity', '1')
        }
      }
    } else {
      this.drawChart()
    }
  }
}
