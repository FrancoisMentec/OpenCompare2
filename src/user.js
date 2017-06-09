module.exports = class User {
  constructor (socket, editSessionManager) {
    var self = this

    this.socket = socket
    this.socket.on('handshake', function (data) {
      self.db.getUser(data.token, function (err, user) {
        if (err) self.emit('error', err)
        else {
          self.user = user
          self.editSessionManager.addUser(self, data.pcmId)
          self.emit('connectedToSession', true)
        }
      })
    })
    this.user = null
    this.editSessionManager = editSessionManager
  }

  get db () {
    return this.editSessionManager.db
  }

  get _id () {
    return this.user
      ? this.user._id
      : null
  }

  get pseudo () {
    return this.user
      ? this.user.pseudo
      : null
  }

  emit (action, data) {
    this.socket.emit(action, data)
  }
}
