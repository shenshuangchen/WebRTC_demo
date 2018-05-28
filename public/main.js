const socket = io('http://localhost:3000')
// const localVideo = document.querySelector("video.local");
// const localMediaStream = null;
// const localmediaURL= null;


var servers = {
  'iceServers': [{
    'url': 'stun:stun.services.mozilla.com'
  },
  {
    'url': 'stun:stun.l.google.com:19302'
  }]
};

var localVideo = document.querySelector("video.local");
var localMediaStream = null;
var localmediaURL= null;

var remoteVideo =document.querySelector("video.remote");
var remoteMediaStream = null;
var remotemediaURL= null;

const roomToken =1;

var peerconnection = null;
start();
var isnegotiated = false;
var isnegotiated2 =false;
var isnegotiated3 = false;
var isnegotiated4 = false;
function start() {
  console.log("这是第一次的client")
  peerconnection = new RTCPeerConnection(servers);
  // let the "negotiationneeded" event trigger offer generation
  // onnegotiationneeded 等待onCreateSuccess
  // SDP 拿去setLocalSdp
  peerconnection.onnegotiationneeded = function () {
    peerconnection.createOffer(setLocalOffer, err => {
      console.info('createOffer:', err)
    });
  }

  // 當有任何 ICE candidates 可用時，
  // 透過 signalingChannel 將 candidate 傳送給對方
  peerconnection.onicecandidate = evt => {
    if (evt.candidate){
      console.log("candidate is ready to send")
      socket.emit('candidate', {
        type: 'candidate',
        label: evt.candidate.sdpMLineIndex,
        candidate: evt.candidate,
      })
      // socket.emit('stream',JSON.stringify({ "candidate": evt.candidate }));
    }
    
  }


  // once remote stream arrives, show it in the remote video element
  peerconnection.onaddstream = function (evt) {
    // remoteView.src = URL.createObjectURL(evt.stream);
    console.log("remote video added here");
    remoteVideo.src = URL.createObjectURL(evt);
  };

  // get a local stream, show it in a self-view and add it to be sent
  navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
    // selfView.src = URL.createObjectURL(stream);
    localVideo.src = URL.createObjectURL(stream);
    console.log("本地视频出来啦")
    peerconnection.addStream(stream);
    // peerconnection.onaddstream(stream);
  }, logError);

  socket.on('offer', data =>{
    console.log("找到A的sdp, setremotesdp", data)
    // peerconnection = new RTCPeerConnection(servers);
    const desc = new RTCSessionDescription(data)
    const a = new RTCPeerConnection(servers)
    a.setRemoteDescription(desc)
    .then(() => {
      a.createAnswer(desc => {
        console.log("要sdfsdf开始send answer之后")
        socket.emit('answer',{
          type:'answer',
          sdp: desc,
          room:roomToken
        })
      }, err => {
        console.log("要开始send answer之后", err)
      })
    })
    .catch(err => console.log(err+"没有办法set remote description"))
  })

  socket.on('candidate', data=>{
    var candidate= new RTCIceCandidate({
      sdpMLineIndex: data.sdpMLineIndex,
      candidate: data.candidate
    })
    if(!peerconnection || !peerconnection.remoteDescription.type){
      console.log("peerconnection没有initialize addicecandidate")
      peerconnection = new RTCPeerConnection(servers);
      peerconnection.addIceCandidate(candidate).catch(err=>{
        console.log(err)
      })
    }else{
      peerconnection.addIceCandidate(candidate).catch(err=>{
        console.log(err)
      })

    }
    // if(data.sdp){
    //   console.log("收到sdp了")
    //   peerconnection.addIceCandidate(candidate)

    // }else{


    // }
    
    
  })

  socket.on('answer', data=>{
    console.log("set remote description");
    console.log(data);
    const desc = new RTCSessionDescription(data)
    peerconnection = new RTCPeerConnection(servers);
    peerconnection.setRemoteDescription(desc, err=>{
      console.log(err+"this is how I debug")
    });
    // peerconnection.setRemoteDescription(new RTCSessionDescription(data.desc))
  })
}

function setLocalOffer(desc) {
  // peerconnection.setLocalDescription(desc, function () {
  //   socket.emit('stream',JSON.stringify({ "sdp": peerconnection.localDescription }));
  //   // socket.emit('stream', roomToken, {
  //   //   'sdp': desc
  //   // });
  // }, logError);
  console.log("setlocaloffer")
  peerconnection.setLocalDescription(desc)
  .then(() => {
    socket.emit('offer', {
      type:'offer',
      sdp: desc,
      room: roomToken
    })
  })
  .catch(err => {
    console.info('emitOffer', err)
  })
}

function setLocalAnswer(desc){
  console.log("ready to send answer")
  peerconnection.setRemoteDescription(desc, function (){
    socket.emit('answer', {
      type:'answer',
      sdp: desc,
      room: roomToken
    })

  }, logError);
  

  // peerconnection.setRemoteDescription(desc, function () {
  //   socket.emit('answer', {
  //     type:'answer',
  //     sdp: desc,
  //     room: roomToken
  //   })
  // }, logError);
}

// socket.on('stream', function (evt) {
//   if (!peerconnection)
//     start();
//   var timestamp = Number(new Date());
//   console.log(timestamp,"这是第第二次")
//   var message = JSON.parse(evt.data);
//   if (message.sdp) {
//     peerconnection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
//       // 當接收到 offer 時，要回應一個 answer
//       if (peerconnection.remoteDescription.type == "offer")
//         peerconnection.createAnswer(setLocalOffer, logError);
//     }, logError);
//   } else {
//     // 接收對方的 candidate 並加入自己的 RTCPeerConnection
//     peerconnection.addIceCandidate(new RTCIceCandidate(message.candidate));
//   }
// })



function logError(error) {
  console.log(error.name + ": " + error.message);
}

// socket.on('connect', data => {
//   var localVideo = document.querySelector("video.local");
//   var localMediaStream = null;
//   var localmediaURL= null;

//   var remoteVideo =document.querySelector("video.remote");
//   var remoteMediaStream = null;
//   var remotemediaURL= null;

  // navigator.getUserMedia({
  //   'audio': true,
  //   'video': true
  // }, function (stream) {
  //   localMediaStream = stream;
  //   console.log(localMediaStream)
  //   localVideo.src = localmediaURL = URL.createObjectURL(localMediaStream);
  // }, logError);
  // socket.emit('login', data);
  // socket.on('userJoin',string=>{
  //   console.log(string);
  // })

  // navigator.getUserMedia({
  //   'audio': true,
  //   'video': true
  // }, success, err => {
  //   console.log(err)
  // })

  // function success(e){
  //   localMediaStream = e;
  //   localVideo.src = localmediaURL = URL.createObjectURL(localMediaStream);
  //   // remoteMediaStream = e;
  //   // remoteVideo.src = remotemediaURL = URL.createObjectURL(remoteMediaStream);
  //   console.log(e)
  //   socket.emit('stream', JSON.stringify(e))
  // }
  // socket.on('stream', data =>{
  //   console.log(data)
  //   for (i in data) {
  //     console.log(i)
  //   }
  //   remoteMediaStream = data;
  //   remoteVideo.src = remotemediaURL = URL.createObjectURL(remoteMediaStream);
  // })
  

//   if (!navigator.getUserMedia) {
//     navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
//         navigator.mozGetUserMedia || navigator.msGetUserMedia;
//   }

//   if (navigator.getUserMedia) {
//       navigator.getUserMedia({
//         video: true,
//         audio: true
//       }, success, function(e) {
//           alert('Error capturing audio.');
//       });
//   } else {
//       alert('getUserMedia not supported in this browser.');
//   }

//   var recording = true;
//   function success(e) {
//     audioContext = window.AudioContext || window.webkitAudioContext;
//     context = new audioContext();

//     // the sample rate is in context.sampleRate
//     audioInput = context.createMediaStreamSource(e);

//     var bufferSize = 2048;
//     recorder = context.createScriptProcessor(bufferSize, 1, 1);

//     // define callback
//     recorder.onaudioprocess = function(e) {
//         if (!recording) return;
//         var left = e.inputBuffer.getChannelData(0);

//         // emit the data converted to the server
//         socket.emit('streaming', {
//             stream: convertoFloat32ToInt16(left)
//         });
//     };

//     audioInput.connect(recorder);
//     recorder.connect(context.destination);
// }
  
   



// })

// function convertoFloat32ToInt16(buffer) {
//   var l = buffer.length;
//   var buf = new Int16Array(l);

//   while (l--) {
//       buf[l] = buffer[l] * 0xFFFF; //convert to 16 bit
//   }
//   return buf.buffer;
// }



// function logError(error) {
//   log(error.name + ': ' + error.message);
// }


// socket.on('connect',data =>{
//   navigator.getUserMedia({video:true, audio:true}, function(stream){
//     localMediaStream = stream;
//     socket.emit('userjoin');
//   })
// })
// socket.on('userjoin', function(data){
//   console.log(data);
// })

// socket.on('userjoin', data => {
//   navigator.getUserMedia({
//     'audio': true,
//     'video': true
//   }, function (stream) {
//     localMediaStream = stream;
//     localVideo.src = localmediaURL = URL.createObjectURL(localMediaStream);
//   }, logError);
//   socket.emit('myotherevent', 'sdsd');


// })
