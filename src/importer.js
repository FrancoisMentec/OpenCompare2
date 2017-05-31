var https = require('https')
var PCM = require('../public/js/pcm.js')

module.exports = function (src, callback) {
  if ((src = /([a-z0-9]{24})/g.exec(src)) != null) {
    importFromOpenCompare(src[0], callback)
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
       callback(null, new PCM(pcm, true))
     })
   })

   req.end()
}
