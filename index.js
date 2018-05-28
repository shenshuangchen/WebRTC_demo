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

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;
var desc=null;

io.sockets.on('connection', socket => {
	var timestamp = Number(new Date());
	console.log(timestamp,"这是第一次")
	socket.on('offer', data => {
		console.log("这是第三次");
		socket.broadcast.emit('offer', data.sdp)
	})
	socket.on('candidate', data=>{
		console.log('收到candidate')
		socket.broadcast.emit('candidate', data.candidate)
	})

	socket.on('answer', data=>{
		console.log("收到answer")
		desc = data.sdp;
		socket.broadcast.emit('answer', data.sdp)
	} )



})


// io.on('connect',socket=>{
// 	socket.emit('name', {username: 'litingting ' + new Date()});
// 	socket.on('myotherevent',function(data){
// 		console.log(data + new Date());
// 	})
// })