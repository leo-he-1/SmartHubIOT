
'use strict';

// Object for holding RTCPeerConnection objects. Stored as key:value pairs.
// Key is the socket id, value is the RTCPeerConnection object.
const videoPeerConnections = {};
const audioPeerConnections = {};
const videoSocket = io.connect(window.location.origin + "/video");
const audioSocket = io.connect(window.location.origin + "/audio");

window.onunload = window.onbeforeunload = () => {
	videoSocket.close();
	audioSocket.close();
};

const localVideo = document.getElementById("localVideo");
const localAudio = document.getElementById("localAudio");
const remoteAudio = document.getElementById("remoteAudio");

let mediaRecorder;
let faceRegInterval = null;

const canvas = document.getElementById("canvas");

// ----------------------------------------------------- Start of Configuration Options. -----------------------------------------------------

/*
 * Configuration for RTC peer connections. STUN and TURN servers.
 * STUN for identifying public ip address.
 * TURN for NAT traversal (getting pass firewalls).
 * Currently uses google's public STUN servers.
 * The WebRTC connection here is on localhost, no HTTPS required for device permissions.
 */
const config = {
	iceServers: [
		{
			urls: 'stun:stun.l.google.com:19302',
		},
		{
			urls: 'stun:stun1.l.google.com:19302',
		},
		{
			urls: 'stun:stun2.l.google.com:19302',
		},
	]
};

let width = 320;
let height = 320;

// ------------------------------------------------------ End of Configuration Options. ------------------------------------------------------



// ==============================================================================================================================================
//											                                          VIDEO STREAM
// ==============================================================================================================================================

// --------------------------- VIDEO RTC EVENTS ---------------------------

videoSocket.on("watcher", id => {

	const peerConnection = new RTCPeerConnection(config);
	videoPeerConnections[id] = peerConnection;

	if(localVideo.srcObject) {
		let stream = localVideo.srcObject;
		stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
	}

	peerConnection.onicecandidate = event => {
		if (event.candidate) {
			videoSocket.emit("candidate", id, event.candidate);
		}
	};

	peerConnection.createOffer()
		.then(sdp => peerConnection.setLocalDescription(sdp))
		.then(() => {
			videoSocket.emit("offer", id, peerConnection.localDescription);
		});

});

videoSocket.on("answer", (id, description) => {
	videoPeerConnections[id].setRemoteDescription(description);
});

videoSocket.on("candidate", (id, candidate) => {
	videoPeerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

videoSocket.on("disconnect_peer", id => {
	videoPeerConnections[id].close();
	delete videoPeerConnections[id];
});

// --------------------------- RECORDING EVENTS ---------------------------

videoSocket.on("start_recording", id => {
	startRecording();
});

videoSocket.on("stop_recording", id => {
	stopRecording();
});

// --------------------------- TAKE IMAGE EVENT ---------------------------

videoSocket.on("take_image", () => {
	takeImage();
});

// --------------------------- FACIAL RECOGNITION EVENTS ---------------------------

videoSocket.on("stop_face_reg", async () => {
	await stopFaceReg();
});

videoSocket.on("start_face_reg", async () => {
	await startFaceReg();
});

// --------------------------- MOTION DETECTION EVENTS ---------------------------

videoSocket.on("start_motion_detection", async () => {
	await startMotionDetection();
});

videoSocket.on("stop_motion_detection", async () => {
	await stopMotionDetection();
});

// --------------------------- VIDEO STREAM EVENTS ---------------------------

videoSocket.on("start_video_stream", () => {
	startLocalVideoStream();
});

videoSocket.on("stop_video_stream", () => {
	stopLocalVideoStream();
});

videoSocket.on("get_video_stream_status", () => {
	if(localVideo.srcObject) {
		videoSocket.emit("video_stream_status", true);
	} else {
		videoSocket.emit("video_stream_status", false);
	}
});

function startLocalVideoStream() {

	const constraints = { video: { width: 320, height: 320 } };

	return navigator.mediaDevices
		.getUserMedia(constraints)
		.then( (stream) => {
			// Change src of video element to the stream object.
			localVideo.srcObject = stream;
			// Emit to all sockets that a broadcaster is ready.
			videoSocket.emit("broadcaster");
		})
		.catch( (error) => {
			console.error("Error: ", error);
		});
}

function stopLocalVideoStream() {
	if(localVideo.srcObject) {
		localVideo.srcObject.getTracks()[0].stop();
		localVideo.srcObject = null;
	}
}

// ----------------------------------------- Face Recognition Functions ---------------------------------------

// Starts face reg.
async function startFaceReg() {

  const videoCanvas = document.createElement("canvas");
  videoCanvas.width = 320;
  videoCanvas.height = 320;

  if(!faceRegInterval) {
      console.log("Face Reg Started!");
      faceRegInterval = setInterval( async () => {
          const context = videoCanvas.getContext("2d");
          context.drawImage(localVideo, 0, 0);
          videoSocket.emit("face_image", videoCanvas.toDataURL());
      }, 5000);
  }
}

// Stops face reg.
async function stopFaceReg() {
	console.log("Face Reg Stopped!");
	clearInterval(faceRegInterval);
        faceRegInterval = null;
}

// ----------------------------------------- Image Taking Function ---------------------------------------

// take image from canvas
function takeImage() {
	//create canvas
	const context = canvas.getContext('2d');
	//set canvas props
	canvas.width = width;
	canvas.height = height;
	//draw image of the video on the canvas
	context.drawImage(localVideo, 0, 0, width, height);
	//create image from canvas
	const imgURL = canvas.toDataURL('image/png');
	handleImage(imgURL);
}

function handleImage(data) {
	videoSocket.emit("taken_image", data);
}

// ----------------------------------------- Video Recording Functions ---------------------------------------

// Starts recording with the video device.
function startRecording() {

	// Recording options for media recorder, which includes mime type.
	let options = { mimeType: 'video/webm;codecs=vp9,opus' };
	// Determine the type that is supported for this browser.
	if (!MediaRecorder.isTypeSupported(options.mimeType)) {
		console.error(`${options.mimeType} is not supported`);
		options = { mimeType: 'video/webm;codecs=vp8,opus' };
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			console.error(`${options.mimeType} is not supported`);
			options = { mimeType: 'video/webm' };
			if (!MediaRecorder.isTypeSupported(options.mimeType)) {
				console.error(`${options.mimeType} is not supported`);
				options = { mimeType: '' };
			}
		}
	}

	// Create the new media recorder.
	try {
		mediaRecorder = new MediaRecorder(localVideo.srcObject, options);
	}
	catch (e) {
		console.error('Exception while creating MediaRecorder:', e);
		return;
	}

	mediaRecorder.onstop = (event) => {
		console.log('Recorder stopped: ', event);
	};

	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.start(1000);
}

// Handles the recording data generated from mediaRecorder.
function handleDataAvailable(event) {
	console.log('handleDataAvailable', event);
	if (event.data && event.data.size > 0) {
		videoSocket.emit("receive_recording", event.data);
	}
}

// Stops the mediaRecorder.
function stopRecording() {
	mediaRecorder.stop();
}


// ==============================================================================================================================================
//											                                          AUDIO STREAM
// ==============================================================================================================================================

audioSocket.on("audio_join", id => {

  const peerConnection = new RTCPeerConnection(config);
 	audioPeerConnections[id] = peerConnection;

	if(localAudio.srcObject) {
		let stream = localAudio.srcObject;
		stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
	}

  peerConnection.ontrack = event => {
    remoteAudio.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      audioSocket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      audioSocket.emit("offer", id, peerConnection.localDescription);
    });
});

audioSocket.on("answer", (id, description) => {
  audioPeerConnections[id].setRemoteDescription(description);
});

audioSocket.on("candidate", (id, candidate) => {
  audioPeerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

audioSocket.on("disconnect_peer", id => {
  audioPeerConnections[id].close();
  delete audioPeerConnections[id];
});

audioSocket.on("start_audio_stream", id => {
	startLocalAudioStream();
});

audioSocket.on("stop_audio_stream", () => {
	stopAudioStream();
});

audioSocket.on("get_audio_stream_status", () => {
	if(localAudio.srcObject) {
		audioSocket.emit("audio_stream_status", true);
	} else {
		audioSocket.emit("audio_stream_status", false);
	}
});

function startLocalAudioStream() {
  const constraints = { audio : true };
  navigator.mediaDevices.getUserMedia(constraints)
    .then( function (stream) {

      localAudio.srcObject = stream;

      audioSocket.emit("audio_origin");

    }).catch( function (err)  {
      console.log(err);
    });
}

function stopAudioStream() {
	if(localAudio.srcObject) {
		localAudio.srcObject.getTracks()[0].stop();
		localAudio.srcObject = null;
	}
	if(remoteAudio.srcObject) {
		remoteAudio.srcObject.getTracks()[0].stop();
		remoteAudio.srcObject = null;
	}
}

// -------------------------------------------------------------

videoSocket.emit("broadcaster");
audioSocket.emit("audio_origin");
