var https = require('https')
var parse = require('csv-parse')
var fs = require('fs')
var PCM = require('../public/js/pcm.js')

module.exports = function (src, callback) {
  if (typeof src === 'string') {
    if ((src = /([a-z0-9]{24})/g.exec(src)) != null) {
      importFromOpenCompare(src[0], callback)
    } else {
      callback('Unknown import source', null)
    }
  } else if (src.file) {
    if (src.file.mimetype === 'text/csv') {
      importFromCSV(src, callback)
    } else {
      callback('Unsuported file type ' + src.file.mimetype, null)
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

     res.on('end', function() {
       var pcm = JSON.parse(responseString)
       pcm.source = 'https://opencompare.org/pcm/' + id
       callback(null, new PCM(pcm))
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
    console.log(err.message)
  })
  parser.on ('finish', function () {
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
        id: 'F' + f,
        name: output[0][f]
      })
    }
    // add products
    for (var p = 1, lp = output.length; p < lp; p++) {
      var product = {
        id: 'P' + (p - 1),
        cells: []
      }
      for (var f = 0, lf = data.features.length; f < lf; f++) {
        product.cells.push({
          id: 'C' + cellN++,
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
