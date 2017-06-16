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

    user.socket.on('message', function (data) {
      self.broadcast('message', {
        pseudo: user.pseudo,
        message: data
      })
    })

    user.socket.on('editCell', function (data) {
      var cell = self.pcm.productsById[data.productId].cellsById[data.cellId]
      cell.value = data.value
      cell.feature.computeData()
      var obj = cell.export()
      obj.productId = cell.product.id
      self.updatePCM()
      self.broadcast('editCell', obj)
    })

    user.socket.on('addProduct', function () {
      var product = self.pcm.addProduct().export()
      self.updatePCM()
      self.broadcast('addProduct', product)
    })

    user.socket.on('addFeature', function (name) {
      if (typeof name !== 'string' || name.length === 0) user.emit('error', 'feature name isn\'t a string')
      else {
        var res = self.pcm.addFeature(name)
        self.updatePCM()
        res.feature = res.feature.export()
        for (var i in res.cellsByProductId) {
          res.cellsByProductId[i] = res.cellsByProductId[i].export()
        }
        self.broadcast('addFeature', res)
      }
    })

    user.socket.on('editPCM', function (data) {
      if (typeof data.name !== 'string' || data.name.length === 0) user.emit('error', 'PCM name can\'t be null or empty')
      else {
        self.pcm.name = data.name
        self.pcm.source = data.source
        self.pcm.author = data.author
        self.pcm.license = data.license
        self.pcm.description = data.description
        self.updatePCM()
        self.broadcast('editPCM', data)
      }
    })

    this.updateUsersList()
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
