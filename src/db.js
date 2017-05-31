var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID

const DEFAULT_URL = 'mongodb://localhost:27017/OpenCompareV2'

class DB {
  constructor (url = DEFAULT_URL, autoConnect = true) {
    this.url = url
    this.connected = false
    this.db = null


    if (autoConnect) this.connect(function (err) {
      if (!err) console.log('Connected to the database')
    })
  }

  connect (callback) {
    var self = this

    MongoClient.connect(this.url, function (err, db) {
      if (err) {
    		console.error('Failed to connect to the database at url : ' + self.url + ' !', err)
    	} else {
        //console.log('Connected to the database at url : ' + self.url)
        self.connected = true
        db.on('close', function () {
          //console.error('connection to database closed')
          self.connected = false
        })
        self.db = db
        self.pcmCollection = self.db.collection('pcm')
    	}

      if (typeof callback === 'function') callback(err)
    })
  }

  exec (callback) {
    if (this.connected) callback(false)
    else this.connect(callback)
  }

  getPCM (id, callback) {
    var self = this

    this.exec(function (err) {
      if (err) {
        callback(err, null)
      } else {
        self.pcmCollection.findOne({_id: ObjectId(id)}, function (err, pcm) {
          callback(err, pcm)
        })
      }
    })
  }

  searchPCM (query, callback) {
    var self = this

    this.exec(function (err) {
      if (err) {
        callback(err, null)
      } else {
        if (query === '*') query = {}
        else {
          var regex = new RegExp('.*(' + query.replace(/\ /g, '|') + ').*', 'i')
          query = {$or: [
            {name: {$regex: regex}},
            {description: {$regex: regex}},
            {source: {$regex: regex}},
            {author: {$regex: regex}}
          ]}
        }

        self.pcmCollection.find(query, {_id: true, name: true, description: true, source: true, author: true, license: true})
          .toArray(function (err, pcms) {
            callback(err, pcms)
          })
      }
    })
  }

  savePCM (pcm, callback) {
    var self = this

    if (pcm.id != null) {
      console.log('no way to modify existing pcm atm')
    } else {
      this.exec(function (err) {
        if (err) {
          if (typeof callback === 'function') callback(err, null)
        } else {
          self.pcmCollection.insertOne(pcm.export(true), function (err, res) {
            if (err) {
              console.error('Failed to insert a pcm', err)
            }

            if (typeof callback === 'function') callback(err, res)
          })
        }
      })
    }
  }
}

module.exports = new DB()
