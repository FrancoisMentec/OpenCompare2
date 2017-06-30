var PCM = require('../public/js/pcm.js')
var User = require('./user.js')

module.exports = function (db) { return new EditSessionManager(db) }

class EditSessionManager {
  constructor (db) {
    this.db = db
    this.users = []
    this.editSessionByPcmId = {}
  }

  newUser (socket) {
    this.users.push(new User(socket, this))
  }

  addUser (user, pcmId) {
    if (!this.editSessionByPcmId[pcmId]) this.editSessionByPcmId[pcmId] = new EditSession(pcmId, this.db)
    this.editSessionByPcmId[pcmId].addUser(user)
  }
}

class EditSession {
  constructor (pcmId, db) {
    var self = this

    this.pcmId = pcmId
    this.db = db
    this.pcm = null
    this.db.getPCM(this.pcmId, function (err, pcm) {
      if (err) console.log('EditSession error: ' + err)
      else {
        self.pcm = new PCM(pcm, true)
      }
    })
    this.users = []
  }

  addUser (user) {
    var self = this

    this.users.push(user)

    user.socket.on('disconnect', function () {
      self.users.splice(self.users.indexOf(user), 1)
      self.updateUsersList()
    })

    user.socket.on('packets', function (packets) {
      var updatePCMCallbacks = []
      //console.log('received ' + packets.length + ' packets')

      for (var p = 0, lp = packets.length; p < lp; p++) {
        (function (action, data) {
          if (action == 'message') {
            self.broadcast('message', {
              pseudo: user.pseudo,
              message: data
            })
          } else if (action == 'editCell') {
            var cell = self.pcm.productsById[data.productId].cellsByFeatureId[data.featureId]
            cell.value = data.value
            cell.feature.computeData()
            var obj = cell.export()
            obj.productId = cell.product.id
            updatePCMCallbacks.push(function (err) {
              if (err) user.emit('err', err)
              else self.broadcast('editCell', obj)
            })
          } else if (action == 'addProduct') {
            var product = self.pcm.addProduct().export()
            updatePCMCallbacks.push(function (err) {
              if (err) user.emit('err', err)
              else self.broadcast('addProduct', product)
            })
          } else if (action == 'renameFeature') {
            var feature = self.pcm.featuresById[data.featureId]
            if (feature) {
              if (typeof data.name === 'string') {
                feature.name = data.name
                updatePCMCallbacks.push(function (err) {
                  if (err) user.emit('err', err)
                  else self.broadcast('renameFeature', data)
                })
              } else {
                user.emit('err', 'Feature name isn\'t a string')
              }
            } else {
              user.emit('err', 'Can\'t find the specified feature')
            }
          } else if (action == 'addFeature') {
            var res = self.pcm.addFeature(data)
            updatePCMCallbacks.push(function (err) {
              if (err) user.emit('err', err)
              else {
                res.feature = res.feature.export()
                for (var i in res.cellsByProductId) {
                  res.cellsByProductId[i] = res.cellsByProductId[i].export()
                }
                self.broadcast('addFeature', res)
              }
            })
          } else if (action == 'removeFeature') {
            try {
              self.pcm.removeFeature(data)
              updatePCMCallbacks.push(function (err) {
                if (err) user.emit('err', err)
                else {
                  self.broadcast('removeFeature', data)
                }
              })
            } catch (err) {
              user.emit('err', err)
            }
          } else if (action == 'editPCM') {
            if (typeof data.name !== 'string' || data.name.length === 0) user.emit('error', 'PCM name can\'t be null or empty')
            else {
              self.pcm.name = data.name
              self.pcm.source = data.source
              self.pcm.author = data.author
              self.pcm.license = data.license
              self.pcm.description = data.description
              updatePCMCallbacks.push(function (err) {
                if (err) user.emit('err', err)
                else self.broadcast('editPCM', data)
              })
            }
          } else {
            user.emit('err', 'Unknow action : ' + action)
          }
        })(packets[p].action, packets[p].data)
      }

      if (updatePCMCallbacks.length > 0) {
        self.updatePCM(function (err) {
          for (var c = 0, lc = updatePCMCallbacks.length; c < lc; c++) {
            updatePCMCallbacks[c](err)
          }
        })
      }
    })

    this.updateUsersList()
  }

  /**
   * Handle a packet
   * @param {User} user - the user who sent the packet
   * @param {string} action - the action of the packet
   * @param {} data - data associated to the packet
   */
  handlePacket (user, action, data) {
    var self = this


  }

  broadcast (action, data) {
    for (var u = 0, lu = this.users.length; u < lu; u++) {
      this.users[u].emit(action, data)
    }
  }

  updatePCM (callback) {
    var self = this
    this.db.updatePCM(this.pcm, function (err, res) {
      if (err) console.error(err)
      callback(err)
    })
  }

  updateUsersList () {
    var list = []
    for (var u = 0, lu = this.users.length; u < lu; u++) {
      list.push({
        _id: this.users[u]._id,
        pseudo: this.users[u].pseudo
      })
    }
    this.broadcast('updateUsersList', list)
  }
}
