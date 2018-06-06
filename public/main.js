//a list of stun/turn servers
const servers = {
  iceServers: [{
    url: 'stun:stun.services.mozilla.com'
  },
  {
    url: 'stun:stun.l.google.com:19302'
  },
  {
    url: 'turn:numb.viagenie.ca',
    credential: 'muazkh',
    username: 'webrtc@live.com'
  },
  {
    url: 'turn:192.158.29.39:3478?transport=tcp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username:'28224511:1379330808'
  }]
}

const log = console.info

const vm = new Vue({
  el: '#vue',
  data() {
    return {
      peerconnectionA: new RTCPeerConnection(servers),
      peerconnectionB: new RTCPeerConnection(servers),
      socket: io('http://localhost:3000'),
      identity: undefined,
    }
  },
  methods: {
    identityA: async function () {
      this.identity = 'A'
      
      //发起请求得到本地摄像头和麦克风获取的音视频流
      //加入A端的媒体流中
      navigator.getUserMedia({ audio: true, video: true }, stream => {
        this.$refs.local.src =  URL.createObjectURL(stream)
        this.peerconnectionA.addStream(stream)
      }, err => log(err))

      this.peerconnectionA
      .onnegotiationneeded = async() => {
        //发起createoffer请求, 形成本端sdp
        //设置本端sdp
        const desc = await this.peerconnectionA.createOffer()
        await this.peerconnectionA.setLocalDescription(desc)
        //发送sdp到服务器
        this.socket.emit('offer', {
          type:'offer',
          sdp: this.peerconnectionA.localDescription
        })
      }

      //接收远程端传输的answer
      //本地设置远端sdp
      this.socket.on('answer', data => {
        this.peerconnectionA.setRemoteDescription(new RTCSessionDescription(data))
      })

      //当Offer/Answer交流完成,onicecandidate被触发
      //从通讯发起端发送candidate对象给服务器
      this.peerconnectionA.onicecandidate = data => {
        if (data.candidate) {
          this.socket.emit('candidate', {
            type: 'candidate',
            label: data.candidate.sdpMLineIndex,
            candidate: data.candidate,
          })
        }
      }

      //当一端接收到媒体流, onaddstream被触发
      //将音视频流显示
      this.peerconnectionA.onaddstream = evt => {
        this.$refs.remote.src =  URL.createObjectURL(evt.stream)
      }
    },
    identityB: function () {
      this.identity = 'B'
      navigator.getUserMedia({ audio: true, video: true }, stream => {
        this.$refs.local.src =  URL.createObjectURL(stream)
        this.peerconnectionB.addStream(stream)
      }, err => log(err))

      this.socket
      .on('offer', async data => {
        const desc = await this.peerconnectionB.setRemoteDescription(new RTCSessionDescription(data))
        const anwser = await this.peerconnectionB.createAnswer()
        this.peerconnectionB.setLocalDescription(anwser)

        this.socket.emit('answer', {
          type: 'answer',
          sdp: anwser
        })
      })
      .on('candidate', data => {
        const candidate= new RTCIceCandidate({
          type: 'candidate',
          label: data.candidate.sdpMLineIndex,
          candidate: data.candidate
        })
        this.peerconnectionB.addIceCandidate(candidate)
      })

        this.peerconnectionB.onaddstream = evt => {
          this.$refs.remote.src =  URL.createObjectURL(evt.stream)
        }
      }

      
  }
})