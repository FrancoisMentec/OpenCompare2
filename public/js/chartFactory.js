const CHART_PADDING = 60
const HALF_CHART_PADDING = CHART_PADDING / 2

class ChartFactory {
  constructor (editor) {
    var self = this

    this.editor = editor
    this.div = this.editor.views['chart']
    this.content = document.getElementById('chartContent')

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

  get pcm () {
    return this.editor.pcm
  }

  get width () {
    return this.content.offsetWidth
  }

  get height () {
    return this.content.offsetHeight
  }

  cleanContent () {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild)
    }
  }

  drawChart (chart) {
    var self = this
    console.log('drawChart ' + chart)

    this.cleanContent()
    if (chart === 'productChart') {
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      this.content.appendChild(this.svg)
      this.svg.setAttribute('width', this.width)
      this.svg.setAttribute('height', this.height)

      this.x = null
      this.y = null
      this.image = null

      for (var f = 0, lf = this.pcm.features.length; f < lf; f++) {
        var feature = this.pcm.features[f]
        if (feature.type === 'number') {
          if (this.x == null) this.x = feature
          else if (this.y == null) this.y = feature
        } else if (feature.type === 'image') {
          this.image = feature
        }
      }

      var svg = d3.select(this.svg)
      this.chartWidth = this.width - CHART_PADDING
      this.chartHeight = this.height - CHART_PADDING

      this.xMin = self.x.min - (self.x.max - self.x.min) * 0.05
      this.xMax = self.x.max + (self.x.max - self.x.min) * 0.05

      this.yMin = self.y.min - (self.y.max - self.y.min) * 0.05
      this.yMax = self.y.max + (self.y.max - self.y.min) * 0.05

      var xLine = svg.append('line')
        .attr('x1', HALF_CHART_PADDING)
        .attr('y1', this.height - HALF_CHART_PADDING)
        .attr('x2', this.width - HALF_CHART_PADDING)
        .attr('y2', this.height - HALF_CHART_PADDING)

      var xName = svg.append('text')
        .text(this.x.name)
        .attr('text-anchor', 'middle')
        .attr('x', self.width / 2)
        .attr('y', self.height - 2)

      var yLine = svg.append('line')
        .attr('x1', HALF_CHART_PADDING)
        .attr('y1', HALF_CHART_PADDING)
        .attr('x2', HALF_CHART_PADDING)
        .attr('y2', this.height - HALF_CHART_PADDING)

      var yName = svg.append('text')
        .text(this.y.name)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90, 13,  ' + (this.height / 2) + ')')
        .attr('x', 13)
        .attr('y', self.height / 2)

      var node = svg.selectAll('circle')
        .data(this.pcm.products)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('cx', function (p) {
          return ((p.cellsByFeatureId[self.x.id].value  - self.xMin) / (self.xMax - self.xMin)) * self.chartWidth + HALF_CHART_PADDING + 'px'
        })
        .attr('cy', function (p) {
          return self.chartHeight - ((p.cellsByFeatureId[self.y.id].value - self.yMin) / (self.yMax - self.yMin)) * self.chartHeight + HALF_CHART_PADDING + 'px'
        })
        .attr('r', 10)

      node.append('title')
        .text(function (p) {
          return p.cellsByFeatureId[self.pcm.primaryFeatureId].value
        })
    }
  }
}
