var browser = typeof document !== 'undefined'

var jsdom = !browser
  ? require('jsdom')
  : null

var htmlTableToMatrice = function (html, returnType = 'element') {
  if (typeof html !== 'string') throw new Error('html parameter is of type ' + typeof html + ', it must be of type string')

  var matrices = []
  var doc = null

  // Parse html
  if (browser) {
    doc = document.createElement('html')
    doc.innerHTML = html
  } else {
    const { JSDOM } = jsdom
    doc = (new JSDOM(html)).window.document
  }

  // Extract table
  var _tables = doc.getElementsByTagName('table')
  var tables = []

  // Tables that contain other tables are not matrice
  for (var i = 0, li = _tables.length; i < li; i++) {
    if (_tables[i].getElementsByTagName('table').length == 0) {
      tables.push(_tables[i])
    }
  }

  // Iterate over tables
  for (var t = 0, lt = tables.length; t < lt; t++) {
    var table = tables[t]
    var rows = table.getElementsByTagName('tr')
    //var rowLengthOccurence = {}
    var maxRowLength = -1
    var name = ''
    var array = []

    if (rows.length === 0) break // If the table doesn't contain any row, it's not a matrice

    for (var r = 0, lr = rows.length; r < lr; r++) {
      var row = rows[r]
      row._ths = []
      row._tds = []
      row._cells = []

      // Extract cells
      for (var c = 0, lc = row.childNodes.length; c < lc; c++) {
        var cell = row.childNodes[c]
        if (cell.tagName) { // check if cell is an element and not just some text like "\n" that screw up your entire day
          if (!cell.hasAttribute('rowspan')) cell.setAttribute('rowspan', 1)
          if (!cell.hasAttribute('colspan')) cell.setAttribute('colspan', 1)
          if (/th/i.test(cell.tagName)) {
            row._ths.push(cell)
            row._cells.push(cell)
          } else if (/td/i.test(cell.tagName)) {
            row._tds.push(cell)
            row._cells.push(cell)
          }
        }
      }

      /*if (typeof rowLengthOccurence[row._cells.length] == 'undefined') rowLengthOccurence[row._cells.length] = 1
      else rowLengthOccurence[row._cells.length]++

      if (maxRowLength == -1 || rowLengthOccurence[row._cells.length] > rowLengthOccurence[maxRowLength]) maxRowLength = row._cells.length*/
      if (row._cells.length > maxRowLength) maxRowLength = row._cells.length
      //if (name.length == 0 && row._cells.length == 1) name = row._cells[0].textContent.replace(/^\s+|\s+$/g, '')
    }

    var superFeatureAreDangerous = true

    for (var r = 0, lr = rows.length; r < lr; r++) {
      var row = rows[r]
      var matriceRow = []

      // Handle rowspan (cell that cover multiple row)
      for (var c = 0; c < maxRowLength; c++) {
        var upperCell = r > 0
          ? rows[r - 1]._cells[c]
          : null

        var leftCell = c > 0 && row._cells.length > 1
          ? row._cells[c - 1]
          : null

        if (upperCell && upperCell.getAttribute('rowspan') > 1) {
          var cell = upperCell.cloneNode(true)
          cell.setAttribute('rowspan', upperCell.getAttribute('rowspan') - 1)
          row._cells.splice(c, 0, cell)
        } else if (!superFeatureAreDangerous && leftCell && leftCell.getAttribute('colspan') > 1) {
          var cell = leftCell.cloneNode(true)
          cell.setAttribute('colspan', leftCell.getAttribute('colspan') - 1)
          cell.setAttribute('rowspan', 1)
          row._cells.splice(c, 0, cell)
        }
        if (row._cells.length <= c) break

        if (returnType == 'element') {
          matriceRow.push(row._cells[c])
        } else if (returnType == 'innerHTML') {
          matriceRow.push(row._cells[c].innerHTML)
        } else if (returnType == 'outerHTML') {
          matriceRow.push(row._cells[c].outerHTML)
        } else {
          throw new Error('Unsupported return type : ' + returnType)
        }
      }

      if (superFeatureAreDangerous && name.length == 0 && row._cells.length == 1) name = row._cells[0].textContent.replace(/^\s+|\s+$/g, '')

      if (row._cells.length == maxRowLength) {
        superFeatureAreDangerous = false
        array.push(matriceRow)
      }
    }

    if (array.length > 0 && maxRowLength > 0) matrices.push({
      name: name.length > 0
        ? name
        : null,
      array: array
    })
  }

  return matrices
}

if (!browser) {
  module.exports = htmlTableToMatrice
}
