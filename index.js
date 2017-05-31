var express = require('express')
var app = express()
var http = require('http').Server(app)
var gaikan = require('gaikan')

var db = require('./src/db.js')
var importer = require('./src/importer.js')

const PORT = 9009

// app settings
app.set('views', './views')
app.engine('html', gaikan)
app.set('view engine', '.html')
app.use(express.static(__dirname + '/public'))

// Routing
app.get('/', function (req, res) {
	res.render('index', {test: 'hello'})
})

app.get('/search', function (req, res) {
	res.redirect('/search/*')
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
			res.send(JSON.stringify({error: err}))
		} else {
			res.send(JSON.stringify(pcm))
		}
	})
})

app.get('/pcm/:id', function (req, res) {
	res.render('editor', {id: req.params.id})
})

app.get('/import', function (req, res) {
	res.render('index')
})

app.get('/import/:src', function (req, res) {
	importer(req.params.src, function (err, pcm) {
		if (err) {
			res.render('error', {error: err})
		} else {
			db.savePCM(pcm, function (err, res2) {
				if (err) {
					res.render('error', {error: err})
				} else {
					res.redirect('/pcm/' + res2.insertedId)
				}
			})
		}
	})
})

app.get('*', function (req, res) {
	res.status(404)
	res.render('404', {url: req.url})
})

// start server
http.listen(PORT, function () {
    console.log('Started OpenCompare2 on port ' + PORT)
})
