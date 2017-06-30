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
    this.packets = []
    this.sendPacketsTimeout = null
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
    var self = this

    if (action === 'error') action = 'err'
    try {
      if (this.sendPacketsTimeout) clearTimeout(this.sendPacketsTimeout)

      this.packets.push({
        action: action,
        data: data
      })

      this.sendPacketsTimeout = setTimeout(function () {
        //console.log('send ' + self.packets.length + ' packets (' + JSON.stringify(self.packets).length + ' B)')
        self.socket.emit('packets', self.packets)
        self.packets = []
        self.sendPacketsTimeout = null
      }, 100)
    } catch (err) {
      console.error(err)
    }
  }
}
