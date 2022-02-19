
var stream;					// stream obtained from webcam
var video;					// shows stream
var captureCanvas;			// internal canvas for capturing full images from video
var captureContext;			// context for capture canvas
var diffCanvas;				// internal canvas for diffing downscaled captures
var diffContext;			// context for diff canvas
var motionCanvas;			// receives processed diff images
var motionContext;			// context for motion canvas

var captureInterval;		// interval for continuous captures
var captureIntervalTime;	// time between captures, in ms
var captureWidth;			// full captured image width
var captureHeight;			// full captured image height
var diffWidth;				// downscaled width for diff/motion
var diffHeight;				// downscaled height for diff/motion
var isReadyToDiff;			// has a previous capture been made to diff against?
var pixelDiffThreshold;		// min for a pixel to be considered significant
var scoreThreshold;			// min for an image to be considered significant
var includeMotionBox;		// flag to calculate and draw motion bounding box
var includeMotionPixels;	// flag to create object denoting pixels with motion

let nextCallTime = new Date(-8640000000000000);

// incoming options with defaults
video =  document.getElementById("localVideo");
motionCanvas = document.createElement("canvas");
//document.getElementById("canvas").appendChild(motionCanvas);

//How often to get a new frame.
captureIntervalTime = 100;

//Width of the actual image capture.
captureWidth =  320;
captureHeight =  320;

//Width of the image diff box. These are good widths for motion detection.
diffWidth =  64;
diffHeight =  48;

//Thresholds.
pixelDiffThreshold =  32;
scoreThreshold =  16;

includeMotionBox =  false;
includeMotionPixels =  false;


// non-configurable
captureCanvas = document.createElement('canvas');
diffCanvas = document.createElement('canvas');
isReadyToDiff = false;

// prep capture canvas
captureCanvas.width = captureWidth;
captureCanvas.height = captureHeight;
captureContext = captureCanvas.getContext('2d');

// prep diff canvas
diffCanvas.width = diffWidth;
diffCanvas.height = diffHeight;
diffContext = diffCanvas.getContext('2d');

// prep motion canvas
motionCanvas.width = diffWidth;
motionCanvas.height = diffHeight;
motionContext = motionCanvas.getContext('2d');

//This is kind of what runs if motion detection should be used. Put this in the broadcast.js obv a lot needs to be changed.
// if(true) {
// 	startMotionDetection();
// }

async function startMotionDetection() {
	//video.removeEventListener('canplay', startComplete);
	captureInterval = setInterval(capture, captureIntervalTime);
}

async function stopMotionDetection() {
	clearInterval(captureInterval);
	motionContext.clearRect(0, 0, diffWidth, diffHeight);
	isReadyToDiff = false;
}

function capture() {

	//Draws video to the canvas context.
	captureContext.drawImage(video, 0, 0, captureWidth, captureHeight);
	//Captures full resolution image data (Completely raw data, not an image.) at every check for motion (Remember this code runs on an interval.)
	var captureImageData = captureContext.getImageData(0, 0, captureWidth, captureHeight);

	// diff current capture over previous capture, leftover from last time
	diffContext.globalCompositeOperation = 'difference';
	diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
	//Captures the image after the image difference overlay was applied.
	var diffImageData = diffContext.getImageData(0, 0, diffWidth, diffHeight);

	if (isReadyToDiff) {

		var diff = processDiff(diffImageData);

		if(diff.score > 500 && diff.score < 2000) {
			//DO SOMETHING HERE BASED ON YOUR CONFIGURATION.

			var currentCallTime = new Date();
            if(currentCallTime >= nextCallTime) {

				//This image is distorted. We just need to maintain aspect ratio / resolution web capturing image data from capture context and canvas.
				var capturedImage = getCaptureUrl(captureImageData);
				videoSocket.emit("motion_detected", capturedImage);

                nextCallTime = new Date(currentCallTime.getTime() + 1 * 5000);
            }

			//Add back if we want motion boxes. This is a stretch goal...
			// if (diff.motionBox) {
			// 	console.log("here");
			// 	motionContext.strokeStyle = '#fff';
			// 	motionContext.strokeRect(
			// 		diff.motionBox.x.min + 0.5,
			// 		diff.motionBox.y.min + 0.5,
			// 		diff.motionBox.x.max - diff.motionBox.x.min,
			// 		diff.motionBox.y.max - diff.motionBox.y.min
			// 	);
			// }

		}

		//Places the diffed image data into the motion canvas context.
		motionContext.putImageData(diffImageData, 0, 0);

	}

	//Replaces the last image with the current diffed image. This prevents some bizzare image trailing that the difference layer applies.
	diffContext.globalCompositeOperation = 'source-over';
	diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
	isReadyToDiff = true;
}

function processDiff(diffImageData) {
	var rgba = diffImageData.data;

	// pixel adjustments are done by reference directly on diffImageData
	var score = 0;
	var motionPixels = includeMotionPixels ? [] : undefined;
	var motionBox = undefined;
	for (var i = 0; i < rgba.length; i += 4) {
		var pixelDiff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
		var normalized = Math.min(255, pixelDiff * (255 / pixelDiffThreshold));
		rgba[i] = normalized;
		rgba[i + 1] = normalized*0.64;
		rgba[i + 2] = 0;

		if (pixelDiff >= pixelDiffThreshold) {
			score++;
			coords = calculateCoordinates(i / 4);

			if (includeMotionBox) {
				motionBox = calculateMotionBox(motionBox, coords.x, coords.y);
			}

			if (includeMotionPixels) {
				motionPixels = calculateMotionPixels(motionPixels, coords.x, coords.y, pixelDiff);
			}

		}
	}

	return {
		score: score,
		motionBox: score > scoreThreshold ? motionBox : undefined,
		motionPixels: motionPixels
	};
}

function calculateCoordinates(pixelIndex) {
	return {
		x: pixelIndex % diffWidth,
		y: Math.floor(pixelIndex / diffWidth)
	};
}

function calculateMotionBox(currentMotionBox, x, y) {
	// init motion box on demand
	var motionBox = currentMotionBox || {
		x: { min: coords.x, max: x },
		y: { min: coords.y, max: y }
	};

	motionBox.x.min = Math.min(motionBox.x.min, x);
	motionBox.x.max = Math.max(motionBox.x.max, x);
	motionBox.y.min = Math.min(motionBox.y.min, y);
	motionBox.y.max = Math.max(motionBox.y.max, y);

	return motionBox;
}

function calculateMotionPixels(motionPixels, x, y, pixelDiff) {
	motionPixels[x] = motionPixels[x] || [];
	motionPixels[x][y] = true;

	return motionPixels;
}

function getCaptureUrl(captureImageData) {
	// may as well borrow captureCanvas
	captureContext.putImageData(captureImageData, 0, 0);
	return captureCanvas.toDataURL();
}

function getPixelDiffThreshold() {
	return pixelDiffThreshold;
}

function setPixelDiffThreshold(val) {
	pixelDiffThreshold = val;
}

function getScoreThreshold() {
	return scoreThreshold;
}

function setScoreThreshold(val) {
	scoreThreshold = val;
}
