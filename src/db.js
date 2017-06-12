var crypto = require('crypto')
var bcrypt = require('bcrypt')
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID

const SALT_ROUNDS = 10
const TOKEN_LENGTH = 64
const DEFAULT_URL = 'mongodb://localhost:27017/OpenCompare2'

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
        self.userCollection = self.db.collection('user')
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

    try {
      id = ObjectId(id)
      this.exec(function (err) {
        if (err) {
          callback(err, null)
        } else {
          self.pcmCollection.findOne({_id: id}, function (err, pcm) {
            callback(err, pcm)
          })
        }
      })
    } catch (err) {
      callback(err, null)
    }
  }

  searchPCM (query, callback) {
    var self = this

    this.exec(function (err) {
      if (err) {
        callback(err, null)
      } else {
        if (query == null || query === '*') query = {}
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

    if (pcm._id != null) {
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

  updatePCM (pcm, callback) {
    var self = this

    this.exec(function (err) {
      if (err) callback(err)
      else {
        self.pcmCollection.updateOne({_id: pcm._id}, pcm.export(), function (err, res) {
          callback(err, res)
        })
      }
    })
  }

  newUser (mail, pseudo, password, callback) {
    var self = this

    this.exec(function (err) {
      if (err) callback(err)
      else {
        self.userCollection.findOne({mail: mail}, function (err, user) {
          if (err) callback(err)
          else if (user) callback('Mail already taken')
          else {
            self.userCollection.insertOne({
              mail: mail,
              pseudo: pseudo,
              password: bcrypt.hashSync(password, SALT_ROUNDS)
            }, function (err, res) {
              if (err) callback(err)
              else {
                callback(null)
              }
            })
          }
        })
      }
    })
  }

  connectUser (mail, password, callback) {
    var self = this

    this.exec(function (err) {
      if (err) callback(err)
      else {
        self.userCollection.findOne({mail: mail}, function (err, user) { // find user
          if (err) callback(err)
          else if (!user) callback('There is no account using this mail')
          else if (!bcrypt.compareSync(password, user.password)) callback('Invalid password') // check password
          else {
            crypto.randomBytes(TOKEN_LENGTH, function(err, buffer) { // generate token
              var token = buffer.toString('hex')
              self.userCollection.findOne({token: token}, function (err, user2) { // check that token is avaible
                if (err) callback(err)
                else if (user2) callback('Unlucky token collision (devs suck), try to login again')
                else {
                  self.userCollection.updateOne({_id: ObjectId(user._id)}, {$set: {token: token}}, function (err, res) { // set user token
                    if (err) callback(err)
                    else {
                      callback(null, token) // return token
                    }
                  })
                }
              })
            })
          }
        })
      }
    })
  }

  getUser (token, callback) {
    var self = this

    this.exec(function (err) {
      if (err) callback(err)
      else {
        self.userCollection.findOne({token: token}, {mail: true, pseudo: true}, function (err, user) {
          callback(err, user)
        })
      }
    })
  }
}

module.exports = new DB()
