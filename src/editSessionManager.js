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

  addUser (pcmId, user) {
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
        self.pcm = pcm
      }
    })
    this.users = []
  }

  addUser (user) {
    this.users.push(user)
  }
}
