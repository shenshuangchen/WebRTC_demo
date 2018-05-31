const express = require('express')
const app = express()
const server = require('http').createServer(app)//建立http服务
const io = require('socket.io').listen(server)
const path = require('path');


app.use(express.static(path.join(__dirname,'public')));

const port = 3000
server.listen(port, function () {
	console.log('服务器运行在localhost: %d', port)
})

io.sockets.on('connection', socket => {
	var timestamp = Number(new Date());
	socket.on('offer', data => {
		socket.broadcast.emit('offer', data.sdp)
	})
	socket.on('candidate', data=>{
		socket.broadcast.emit('candidate', data.candidate)
	})

	socket.on('answer', data=>{
		socket.broadcast.emit('answer', data.sdp)
	} )
})