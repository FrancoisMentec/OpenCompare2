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
    user.socket.on('editCell', function (data) {
      var cell = self.pcm.productsById[data.productId].cellsById[data.cellId]
      cell.value = data.value
      var obj = cell.export()
      obj.productId = cell.product.id
      self.updatePCM()
      self.broadcast('editCell', obj)
    })
  }

  broadcast (action, data) {
    for (var u = 0, lu = this.users.length; u < lu; u++) {
      this.users[u].emit(action, data)
    }
  }

  updatePCM () {
    var self = this
    this.db.updatePCM(this.pcm, function (err, res) {
      if (err) self.broadcast('error', err)
    })
  }
}
