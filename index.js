var fs = require('fs')
var express = require('express')
var app = express()
var http = require('http')
var server = http.Server(app)
var io = require('socket.io')(server)
var gaikan = require('gaikan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var multer  = require('multer')
var upload = multer({dest: 'uploads/'})

var PCM = require('./public/js/pcm.js')
var db = require('./src/db.js')
var importer = require('./src/importer.js')
var isMail = require('./public/js/typeDetection.js').isMail
var editSessionManager = require('./src/editSessionManager.js')(db)

const PORT = 9009
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 14 // cookie expire in 2 weeks

// app settings
app.set('views', './views')
app.engine('html', gaikan)
app.set('view engine', '.html')
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/node_modules/ace-builds'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

// Socket
io.on('connection', function (socket) {
	editSessionManager.newUser(socket)
})

// Routing
app.get('/', function (req, res) {
	res.render('index', {test: 'hello'})
})

app.get('/search', function (req, res) {
	db.searchPCM(null, function (err, pcms) {
		if (err) {
			res.render('error', {error: err})
		} else {
			res.render('search', {search: '', pcms: pcms})
		}
	})
})

app.get('/search/:search', function (req, res) {
	db.searchPCM(req.params.search, function (err, pcms) {
		if (err) {
			res.render('error', {error: err})
		} else {
			res.render('search', {search: req.params.search, pcms: pcms})
		}
	})
})

app.get('/api/:id', function (req, res) {
	db.getPCM(req.params.id, function (err, pcm) {
		res.setHeader('Content-Type', 'application/json')
		if (err) {
			res.send(JSON.stringify({error: typeof err == 'string' ? err : err.message || 'Unknown error'}))
		} else {
			res.send(JSON.stringify(pcm))
		}
	})
})

app.get('/pcm/:id', function (req, res) {
	res.render('editor', {id: req.params.id})
})

app.post('/create', function (req, res) {
	var err = ''
	var pcmData = {
		name: req.body.name,
		source: req.body.source,
		author: req.body.author,
		license: req.body.license,
		description: req.body.description
	}

	if (typeof pcmData.name !== 'string' || pcmData.name.length === 0) err += 'name missing'

	if (err.length > 0) res.send({error: err})
	else {
		db.savePCM(new PCM(pcmData), function (err2, res2) {
			if (err2) {
				res.send({error: err2})
			} else {
				res.send({pcm: res2.insertedId})
			}
		})
	}
})

app.post('/import', upload.single('file'), function (req, res) {
	importer({
		file: req.file,
		name: req.body.name,
		source: req.body.source,
		author: req.body.author,
		license: req.body.license,
		description: req.body.description
	}, function (err, pcm) {
		fs.unlinkSync(req.file.path)
		if (err) {
			res.send({error: typeof err == 'string' ? err : err.message || 'Unknown error'})
		} else {
			db.savePCM(pcm, function (err, res2) {
				if (err) {
					res.send({error: typeof err == 'string' ? err : err.message || 'Unknown error'})
				} else {
					res.send({pcm: res2.insertedId})
				}
			})
		}
	})
})

app.get('/import/:src', function (req, res) {
	importer(req.params.src, function (err, pcm, source) {
		if (err) {
			res.render('error', {error: err})
		} else {
			if (Array.isArray(pcm)) {
				db.savePCM(pcm, function (err, res2) {
					if (err) {
						res.render('error', {error: err})
					} else {
						res.redirect('/search/' + encodeURIComponent(source))
					}
				})
			} else {
				db.savePCM(pcm, function (err, res2) {
					if (err) {
						res.render('error', {error: err})
					} else {
						res.redirect('/pcm/' + res2.insertedId)
					}
				})
			}
		}
	})
})

app.post('/login', function (req, res) {
	var err = ''
	var mail = req.body.mail
	var password = req.body.password

	if (!mail) err += 'mail missing'
	if (!password) err += err.length > 0 ? ', password missing' : 'password missing'

	if (err.length > 0) res.send({error: err})
	else {
		db.connectUser(mail, password, function (err, token) {
			if (!err) res.cookie('token', token, {maxAge: COOKIE_MAX_AGE})
			res.send({error: err})
		})
	}
})

app.get('/logout', function (req, res) {
	if (req.cookies && req.cookies.token) {
		res.clearCookie('token')
	}
	res.send('logout')
})

app.post('/signup', function (req, res) {
	var err = ''
	var mail = req.body.mail
	var pseudo = req.body.pseudo
	var password = req.body.password

	if (!mail || mail.length === 0 || !isMail(mail)) err += 'invalid mail'
	if (!pseudo || pseudo.length < 3 || pseudo.length > 20) err += err.length > 0 ? ', invalid pseudo (3 to 20 characters)' : 'invalid pseudo (3 to 20 characters)'
	if (!password || password.length < 5) err += err.length > 0 ? ', invalid password (min 5 characters)' : 'invalid password (min 5 characters)'

	if (err.length > 0) res.send({error: err})
	else {
		db.newUser(mail, pseudo, password, function (err) {
			res.send({error: err})
		})
	}
})

app.get('/user', function (req, res) {
	if (req.cookies && req.cookies.token) {
		db.getUser(req.cookies.token, function (err, user) {
			res.send({error: err, user: user})
		})
	} else {
		res.send({error: 'not connected', user: null})
	}
})

app.get('*', function (req, res) {
	res.status(404)
	res.render('404', {url: req.url})
})

// start server
server.listen(PORT, function () {
    console.log('Started OpenCompare2 on port ' + PORT)
})
