

var audioBuffer;
var sourceNode;
var analyser;
var javascriptNode;
var context;
var spec;
var mediaStreamSource;

var notes = [
	'A',
	'A#',
	'B',
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#'
];
var a4 = 440.0;
var root2 = Math.pow(2.0, 1.0/12.0);
function noteToFreq(note){
	return a4 * Math.pow(root2, note);
}

function noteToText(note){
	var n = note;
	var oct = 4;
	while(n < 0){
		oct -= 1;
		n += 12;
	}
	while(n > 11){
		oct += 1;
		n -= 12;
	}
//	if(note > 11 || note < 0){
//		alert("Error");
//	}
	//console.log("n: "+n);
	//console.log("oct: "+oct);
	var letter = notes[n];
	//console.log("letter: "+letter);
	var text = letter+oct;
	//console.log("text: "+text);
	return letter+oct;
}
//alert(noteToText(-11));
//alert(freqToNote(421.875));
function freqToNote(freq){
	var note = -48.0;
	var last = 0;
	var cur = noteToFreq(note);
	while(cur < freq){
		note += 1;
		last = cur;
		cur = noteToFreq(note);
	}
	if( (cur - freq) > (freq-last)){
		note -= 1;
	}
	var text = noteToText(note);
//	console.log("Note: "+note);
	/*if(!isNaN(text)){
		console.log("WTF,"+note+","+freq);
	}*/
	return text;
}

function error() {
    console.log('Stream generation failed.');
}

if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = ( function() {

                return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

                        window.setTimeout( callback, 1000 / 60 );

                };
        } )();
}

if( ! navigator.getMedia){
	navigator.getMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

}

if (! window.AudioContext) {
    if (! window.webkitAudioContext) {
        alert('no audiocontext found');
    }
    window.AudioContext = window.webkitAudioContext;
}
	
function gotStream(stream) {

    context = new AudioContext();
	spec = new Spectrogram("#spec-live", context);

	mediaStreamSource = context.createMediaStreamSource(stream);    
    mediaStreamSource.connect(spec.analyser);

//    window.requestAnimationFrame(draw);
}

function initRecord() {
	navigator.getMedia({audio:true}, gotStream, error);
}

var Spectrogram = function(id, context){
    // get the context from the canvas to draw on
	this.element = $(id).get(0);
	var element = this.element;
	var height = this.element.height;
	var width = this.element.width;
	var ctx = this.element.getContext("2d");
	var fftSize = 1024;
    // create a temp canvas we use for copying
    var tempCanvas = document.createElement("canvas"),
    tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width=width;
    tempCanvas.height=height;
	
	// used for color distribution
    var hot = new chroma.ColorScale({
        colors:['#000000', '#ff0000', '#ffff00', '#ffffff'],
        positions:[0, .25, .75, 1],
        mode:'rgb',
        limits:[0, 300]
    });
	
    // setup a analyzer
    this.analyser = context.createAnalyser();
    this.analyser.smoothingTimeConstant = 0;
    this.analyser.fftSize = fftSize;
	var analyser = this.analyser;
	
	/*
	// create a buffer source node
    this.sourceNode = context.createBufferSource();
    this.sourceNode.connect(this.analyser);
	var sourceNode = this.sourceNode;
	*/
	
	// setup a javascript node
    this.javascriptNode = context.createScriptProcessor(2048, 1, 1);
	this.javascriptNode.onaudioprocess = function () {
//		console.log("process");
        // get the average for the first channel
        var array = new Uint8Array( analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // draw the spectrogram
        //if (sourceNode.playbackState == sourceNode.PLAYING_STATE) {
//			console.log("playing");
            drawSpectrogram(array);
        //}else{
//			console.log("not playing");
		//}
    }
	
    // connect to destination, else it isn't called
    this.javascriptNode.connect(context.destination);

    this.analyser.connect(this.javascriptNode);

    //this.sourceNode.connect(context.destination);
	
	// when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume

    function drawSpectrogram(array) {
//		console.log("Drawing");
        // copy the current canvas onto the temp canvas

        tempCtx.drawImage(element, 0, 0, width, height);

        // iterate over the elements from the array
		var maxi = -1;
		var maxval = 0;
        for (var i = 0; i < array.length; i++) {
            // draw each pixel with the specific color
            var value = array[i];
			if(value > maxval){
				maxi=i;
				maxval =value;
			}
            ctx.fillStyle = hot.getColor(value).hex();

            // draw the line at the right side of the canvas
            ctx.fillRect(width - 1, height - i, 1, 1);
        }
		//console.log("Max i: "+maxi);
		//console.log("Max v: "+maxval);
		var pitch = (maxi+1) * context.sampleRate/fftSize;
		//console.log("Pitch: "+(pitch));
		$("#pitch").text(pitch);
		$("#note").text(freqToNote(pitch));
		if($("#note").text()=="NaN"){
			console.log("WTFNAN,"+pitch+","+freqToNote(pitch));
		}
        // set translate on the canvas
        ctx.translate(-1, 0);
        // draw the copied image
        ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, width, height);

        // reset the transformation matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
};

var documentReady = function(){
    // create the audio context (chrome only for now)

	initRecord();

	
	
	
	
	
	/*
	
	console.log("Loading");
    loadSound("wagner-short.ogg");

    // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function () {

            // decode the data
            context.decodeAudioData(request.response, function (buffer) {
                // when the audio is decoded play the sound
                playSound(buffer);
            }, onError);
        }
        request.send();
    }


    function playSound(buffer) {
        spec.sourceNode.buffer = buffer;
        spec.sourceNode.start(0);
        spec.sourceNode.loop = false;
    }

    // log if an error occurs
    function onError(e) {
        console.log(e);
    }
	*/

};
	
$(document).ready(documentReady);
