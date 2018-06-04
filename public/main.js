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
      identity: undefined
    }
  },
  methods: {
    identityA: async function () {
      this.identity = 'A'
      navigator.getUserMedia({ audio: true, video: true }, stream => {
        this.$refs.local.src =  URL.createObjectURL(stream)
        this.peerconnectionA.addStream(stream)
      }, err => log(err))

      this.peerconnectionA
      .onnegotiationneeded = async() => {
        const desc = await this.peerconnectionA.createOffer()
        await this.peerconnectionA.setLocalDescription(desc)
        this.socket.emit('offer', {
          type:'offer',
          sdp: this.peerconnectionA.localDescription
        })
      }
      this.socket.on('answer', data => {
        this.peerconnectionA.setRemoteDescription(new RTCSessionDescription(data))
      })

      this.peerconnectionA.onicecandidate = data => {
        if (data.candidate) {
          this.socket.emit('candidate', {
            type: 'candidate',
            label: data.candidate.sdpMLineIndex,
            candidate: data.candidate,
          })
        }
      }

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