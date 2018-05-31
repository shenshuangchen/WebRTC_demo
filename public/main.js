const socket = io('http://localhost:3000')
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

var peerconnection1;
var peerconnection2;
var ifbeingcalled = false;
var ifcandidatebeingcreated=false;


// var peerconnection1 = null;
start();
function start() {
  console.log("这是第一次的client")
  peerconnection1 = new RTCPeerConnection(servers);
  peerconnection2 = new RTCPeerConnection(servers);

  peerconnection1.onnegotiationneeded = async ()=>{
    if(ifbeingcalled){
      return
    }
    ifbeingcalled=true;
    try{
      console.log("check createoffer被call了几次")
      await peerconnection1.setLocalDescription(await peerconnection1.createOffer())
      socket.emit('offer', {
        type:'offer',
        sdp: peerconnection1.localDescription,
        room:roomToken
      })
    }catch(err){
      console.log(err)
    }
  }

  // 當有任何 ICE candidates 可用時，
  // 透過 signalingChannel 將 candidate 傳送給對方
  peerconnection1.onicecandidate = evt => {
    if(ifcandidatebeingcreated){
      return
    }
    ifcandidatebeingcreated=true
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
  peerconnection2.onaddstream = function (evt) {
    // remoteView.src = URL.createObjectURL(evt.stream);
    console.log("remote video added here");
    remoteVideo.src = URL.createObjectURL(evt.stream);
  };

  // get a local stream, show it in a self-view and add it to be sent
  navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
    // selfView.src = URL.createObjectURL(stream);
    localVideo.src = URL.createObjectURL(stream);
    peerconnection1.addStream(stream);
    // peerconnection1.onaddstream(stream);
  }, logError);

  socket.on('offer', data =>{
    console.log("找到A的sdp, setremotesdp", data)
    // peerconnection1 = new RTCpeerconnection1(servers);
    const desc = new RTCSessionDescription(data)
    // const a = new RTCpeerconnection1(servers)
    peerconnection2.setRemoteDescription(desc)
    .then(() => {
      peerconnection2.createAnswer(desc => {
        peerconnection2.setLocalDescription(desc);
        console.log("要sdfsdf开始send answer之后",desc)
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
    console.log("candidate收到了")
    var candidate= new RTCIceCandidate({
      type: 'candidate',
      label: data.candidate.sdpMLineIndex,
      candidate: data.candidate
    })
    if(!peerconnection1 || !peerconnection1.remoteDescription.type){
      peerconnection1 = new RTCPeerConnection(servers);
      peerconnection1.addIceCandidate(candidate).catch(err=>{
        console.log(err)
      })
    }else{
      console.log("这里是有东西的")
      peerconnection1.addIceCandidate(candidate).catch(err=>{
        console.log(err)
      })

    }
  })

  socket.on('answer', data=>{
    console.log("set remote description");
    console.log(data);
    const desc = new RTCSessionDescription(data)
    peerconnection1.setRemoteDescription(desc, err=>{
      console.log(err+"this is how I debug")
    });
    // peerconnection1.setRemoteDescription(new RTCSessionDescription(data.desc))
  })
}

function setLocalAnswer(desc){
  console.log("ready to send answer")
  peerconnection1.setRemoteDescription(desc, function (){
    socket.emit('answer', {
      type:'answer',
      sdp: desc,
      room: roomToken
    })

  }, logError);
}


function logError(error) {
  console.log(error.name + ": " + error.message);
}