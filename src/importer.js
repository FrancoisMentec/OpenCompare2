var https = require('https')
var http = require('http')
var parse = require('csv-parse')
var fs = require('fs')
var PCM = require('../public/js/pcm.js')
var htmlTableToMatrice = require('./htmlTableToMatrice.js')
var isUrl = require('../public/js/typeDetection.js').isUrl

module.exports = function (src, callback) {
  var regexRes = null
  if (typeof src === 'string') {
    if ((regexRes = /([a-z0-9]{24})/g.exec(src)) != null) {
      importFromOpenCompare(regexRes[1], callback)
    } else if (isUrl(src)) {
      importFromUrl(src, callback)
    } else {
      callback('Unknown import source : ' + src, null)
    }
  } else if (src && src.file) {
	  var reg = /\.(\S+)$/.exec(src.file.originalname)
	  var type = reg
	    ? reg[1]
		: null
    if (type === 'csv') {
      importFromCSV(src, callback)
    } else {
      callback('Unsuported file type ' + type, null)
    }
  } else {
    callback('Unknown import source', null)
  }
}

function importFromOpenCompare (id, callback) {
  var req = https.request('https://opencompare.org/api/getnewjson/' + id, function (res) {
     res.setEncoding('utf-8')
     var responseString = ''

     res.on('data', function(data) {
       responseString += data
     })

     res.on('end', function () {
       try {
         var pcm = JSON.parse(responseString)
         pcm.source = 'https://opencompare.org/pcm/' + id
         var featureIdGen = 0
         var productIdGen = 0
         for (var f in pcm.features) {
           var id = /\d+/.exec(f)[0]
           if (id > featureIdGen) featureIdGen = id
         }
         for (var p in  pcm.products) {
           pcm.products[p].id = p
           var id = /\d+/.exec(p)[0]
           if (id > productIdGen) productIdGen = id
         }
         pcm.featureIdGen = featureIdGen + 1
         pcm.productIdGen = productIdGen + 1
         pcm = new PCM(pcm, true)
         pcm.retype()
         callback(null, pcm)
       } catch (err) {
         console.error(err)
         callback(err, null)
       }
     })
   })

   req.end()
}

function importFromCSV (src, callback) {
  var output = []
  var parser = parse()
  parser.on('readable', function () {
    while (record = parser.read()) {
      output.push(record)
    }
  })
  parser.on('error', function (err) {
    callback(err, null)
  })
  parser.on('finish', function () {
    var cellN = 0
    // create pcm data
    var data = {
      name: src.name.length > 0 ? src.name : null,
      description: src.description.length > 0 ? src.description : null,
      license: src.license.length > 0 ? src.license : null,
      source: src.source.length > 0 ? src.source : null,
      author: src.author.length > 0 ? src.author : null,
      features: [],
      products: []
    }
    // add features
    for (var f = 0, lf = output[0].length; f < lf; f++) {
      data.features.push({
        name: output[0][f]
      })
    }
    // add products
    for (var p = 1, lp = output.length; p < lp; p++) {
      var product = {
        cells: []
      }
      for (var f = 0, lf = data.features.length; f < lf; f++) {
        product.cells.push({
          featureId: 'F' + f,
          value: output[p][f]
        })
      }
      data.products.push(product)
    }
    // create pcm
    callback(null, new PCM(data))
  })
  fs.readFile(src.file.path, function (err, data) {
    if (err) callback(err, null)
    else {
      parser.write(data)
      parser.end()
    }
  })
}

/**
 * Get a Node element and return a string value for pcm
 * @param {NodeElement} el - the element
 * @return {String} the value for the pcm
 */
function elementToValue (el, src) {
  var value = el.textContent.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ')

  var href
  if (el.children.length === 1 && (href = el.firstElementChild.getAttribute('href')) && href.length > 0) {
    value = href //TODO: resolve relative url
  }

  if (value.length == 0) {
    if ((img = el.getElementsByTagName('img')).length > 0) value = img[0].getAttribute('src')
    else if ((a = el.getElementsByTagName('a')).length > 0) value = a[0].getAttribute('href').startsWith('/')
      ? /^((https?:\/\/)?([\w-\.]+)\.([a-z\.]{2,}))/.exec(src)[1] + a[0].getAttribute('href')
      : a[0].getAttribute('href')
  }

  return value
}

function importFromUrl (url, callback) {
  var protocol = url.startsWith('https')
    ? https
    : http

  if (url.endsWith('/')) url = url.slice(0, -1)

  var req = protocol.request(url, function (res) {
    res.setEncoding('utf-8')
    var responseString = ''

    res.on('data', function (data) {
      responseString += data
    })

    res.on('end', function () {
      try {
        var matrices = htmlTableToMatrice(responseString, 'element')
        var pcms = []
        for (var m = 0, lm = matrices.length; m < lm; m++) {
          var matrice = matrices[m]
          if (matrice.array.length > 1) {
            var pcm = {
              name: matrice.name || 'No name',
              source: matrice.id
                ? url + '#' + matrice.id
                : url,
              features: [],
              products: []
            }

            for (var f = 0, lf = matrice.array[0].length; f < lf; f++) {
              pcm.features.push({
                name: elementToValue(matrice.array[0][f], url)
              })
            }

            for (var p = 1, lp = matrice.array.length; p < lp; p++) {
              var product = {
                cells: []
              }
              for (var f = 0, lf = matrice.array[p].length; f < lf; f++) {
                product.cells.push({
                  featureId: 'F' + f,
                  value: elementToValue(matrice.array[p][f], url)
                })
              }
              pcm.products.push(product)
            }

            pcms.push(new PCM(pcm))
          }
        }
        callback(null, pcms, url)
      } catch (err) {
        console.error(err)
        callback(err, null)
      }
    })
  })

  req.on('error', function (err) {
    //console.error(err)
    callback('Can\'t join adress ' + url)
  })

  req.end()
}

/*function importFromWikipedia (lang, title, callback) {
  var source = 'https://' + lang + '.wikipedia.org/wiki/' + title
  var req = https.request('https://' + lang +'.wikipedia.org/w/api.php?action=query&format=json&export=true&titles=' + title, function (res) {
     res.setEncoding('utf-8')
     var responseString = ''

     res.on('data', function(data) {
       responseString += data
     })

     res.on('end', function () {
       try {
         var response = JSON.parse(responseString)
         var found = false
         for (var i in response.query.pages) {
           if (i != '-1') {
             found = true
             break
           }
         }

         if (found) {
           Parsoid.parse(response.query.export['*'], { pdoc: true }).then(function (pdoc) {
             var document = pdoc.document
             fs.writeFileSync('/udd/fmentec/truc.html', document.innerHTML)
             callback('wikipedia import not working atm', null)
           }).catch(function (err) {
             console.error(err)
             callback(err, null)
           })


           /*(Promise.async(function*() {
             try {
             	var pdoc = yield Parsoid.parse(response.query.export['*'], { pdoc: true });
             	var document = pdoc.document
              fs.writeFileSync('/udd/fmentec/truc.html', document.innerHTML)
              var pcms = []
             	var tables = document.getElementsByTagName('table')
             	for (var i = 0; i < tables.length; i++) {
                var table = tables[i]
                if (table.getElementsByTagName('table').length === 0) { // care to tableception
                  // search title div
                  var el = table.previousElementSibling
                  while (el != null && !el.tagName.match(/^h\d$/i)) {
                    el = el.previousElementSibling
                  }

                  // create pcm
                  var pcm = {
                    name: el != null
                      ? el.textContent
                      : response.query.normalized[0].to,
                    license: 'CC BY-SA',
                    source: el != null
                      ? source + '#' + el.id
                      : source,
                    author: 'Wikipedia',
                    features: [],
                    products: []
                  }

               		var featuresFound = false
               		var rows = table.getElementsByTagName('tr')
                  var featureRow = null
                  var numCellsOccurence = {}
                  var averageNumCell = -1

                  for (var r = 0; r < rows.length; r++) {
                    var row = rows[r]
                    row._numTh = row.getElementsByTagName('th').length
                    row._cells = row.querySelectorAll('th,td')

                    if (featureRow == null || row._numTh > featureRow._numTh) {
                      featureRow = row
                    }

                    if (numCellsOccurence[row._cells.length]) numCellsOccurence[row._cells.length]++
                    else numCellsOccurence[row._cells.length] = 1

                    if (averageNumCell == -1 || numCellsOccurence[row._cells.length] > numCellsOccurence[averageNumCell]) {
                      averageNumCell = row._cells.length
                    }
                  }

                  // detect anomaly
                  for (var r = 0; r < rows.length; r++) {
                    var row = rows[r]
                    if (row != featureRow && row._numCell < averageNumCell) {
                      if (r > 0 && rows[r - 1]._cells.length >= averageNumCell) {
                        for (var c = 0; c < rows[r - 1]._cells.length; c++) {
                          var rowspan
                          if (rows[r - 1]._cells[c].getAttribute('rowspan')
                          && (rowspan = parseFloat(/\d+/.exec(rows[r - 1]._cells[c].getAttribute('rowspan'))[0])) > 1) {

                          }
                        }
                      }
                    }
                  }

               		for (var j = 0; j < rows.length; j++) {
                    var cells = rows[j].querySelectorAll('th,td')
               			if (featuresFound) { // Products
                      var product = {
                        id: 'P' + pcm.products.length,
                        cells: []
                      }
                      var n = 0
                      for (var k = 0; k < pcm.features.length; k++) {
                        if (pcm.products.length > 0 && pcm.products[pcm.products.length - 1].cells[k].rowSpan > 1) {
                          product.cells.push({
                            id: 'C' + k,
                            featureId: 'F' + k,
                            value: pcm.products[pcm.products.length - 1].cells[k].value,
                            rowSpan: pcm.products[pcm.products.length - 1].cells[k].rowSpan - 1
                          })
                        } else {
                          //console.log('table '+i+' '+n+'/'+cells.length+' '+pcm.features.length)
                          product.cells.push({
                            id: 'C' + k,
                            featureId: 'F' + k,
                            value: cells[n].textContent.replace(/<\/?br\/?>/g, ' ').replace(/(^\s+|\s+$)/g, '').replace(/\s+/g, ' '),
                            rowSpan: cells[n].getAttribute('rowspan') != null
                              ? parseFloat(/\d+/.exec(cells[n].getAttribute('rowspan'))[0])
                              : 1
                          })
                          n++
                        }
                 			}
                      if (product.cells.length < pcm.features.length) console.log(product.cells.length)
                      pcm.products.push(product)
               			} else { // Features
                      var n = 0
                      for (var k = 0; k < cells.length; k++) {
                        var colspan = cells[k].getAttribute('colspan')
                          ? parseFloat(/\d+/.exec(cells[k].getAttribute('colspan'))[0])
                          : 1
                        while (colspan-- > 0) {
                   				pcm.features.push({
                            id: 'F' + n++,
                            name: cells[k].textContent.replace(/(^\s+|\s+$)/g, '')
                          })
                        }
                 			}
               				featuresFound = true
                      //console.log(pcm.features)
               			}
               		}
                  if (pcm.features.length > 1 && pcm.products.length > 1) {
               		   pcms.push(new PCM(pcm))
                  }
                }
             	}
              callback(null, pcms, source)
            } catch (err) {
              console.error(err)
              callback(err, null)
            }
          }))()
         } else {
           callback('article ' + title + ' not found on wikipedia', null)
         }
       } catch (err) {
         console.error(err)
         callback(err, null)
       }
     })
   })

   req.end()
}*/
