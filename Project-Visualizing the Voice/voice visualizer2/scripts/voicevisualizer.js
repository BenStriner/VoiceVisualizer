/*******************************************************************
Configuration Constants
*******************************************************************/

var fftSize = 2048;
var isLeftToRight = true;
var refurl = "../arpeggio_Good.mp3";

function error() {
    console.log('Stream generation failed.');
}
function onError(e){
	console.log(e);
}

/*******************************************************************
Browser compatibility definitions
*******************************************************************/

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
	

/*******************************************************************
Spectrogram class
*******************************************************************/
var Spectrogram = function(id, context){
	this.id = id;
	this.STOP=0;
	this.PLAY=1;
	this.state=this.STOP;
	this.ltr = isLeftToRight;
//	spec=this;

	/*this.test = function(){
		alert(this.id);
	}*/
	
    // get the context from the canvas to draw on
	this.element = $(id).get(0);
/*	var element = this.element;
	var height = this.element.height;
	var width = this.element.width;
	*/
	this.ctx = this.element.getContext("2d");

    // create a temp canvas we use for copying
    this.tempCanvas = document.createElement("canvas"),
    this.tempCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.width=this.element.width;
    this.tempCanvas.height=this.element.height;
	
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
	
	// setup a javascript node
    this.javascriptNode = context.createScriptProcessor(2048, 1, 1);
	this.javascriptNode.spect = this;
	this.onaudioprocess = function () {
        // get the average for the first channel
        var array = new Uint8Array( this.spect.analyser.frequencyBinCount);
        this.spect.analyser.getByteFrequencyData(array);
        // draw the spectrogram
        if (this.spect.state == this.spect.PLAY) {
			//console.log(spec.id+"PLAY");
            this.spect.drawSpectrogram(array);
        }else{
			//console.log(spec.id+"stop");
		}
    }
	this.javascriptNode.onaudioprocess = this.onaudioprocess;
    // connect to destination, else it isn't called
    this.javascriptNode.connect(context.destination);

    this.analyser.connect(this.javascriptNode);

    //this.sourceNode.connect(context.destination);
	
	// when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
	this.pos = 0;
	this.clear = function(){
		this.pos=0;
		this.ctx.clearRect(0, 0, this.element.width, this.element.height);
	}
	
    this.drawSpectrogram = function(array) {
//		console.log("Drawing");
        // copy the current canvas onto the temp canvas

		if(this.ltr){
			for (var i = 0; i < array.length; i++) {
				// draw each pixel with the specific color
				var value = array[i];
				this.ctx.fillStyle = hot.getColor(value).hex();
				// draw the line at the right side of the canvas
				this.ctx.fillRect(this.pos, this.element.height - i, 1, 1);
			}
			this.pos += 1;
		}else{
		
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
			// set translate on the canvas
			ctx.translate(-1, 0);
			// draw the copied image
			ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, width, height);

			// reset the transformation matrix
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
    }
	return this;
};


/*******************************************************************
Media ready
*******************************************************************/

function mediaReady(stream) {
	// System State
	var STOP = 0;
	var REC = 1;
	var PLAY = 2;
	var PLAYREF = 3;
	var state = STOP;
	
	// Audio Context
    var context = new AudioContext();
	
	// Audio Sources
	var mediaStreamSource = context.createMediaStreamSource(stream); // recording input
	var source = false; // recording output
	var referenceSource = false; // playback output
	
	// Recorder
	var rec = new Recorder(mediaStreamSource);
	
	var hascontent = false;

	// Spectrograms
	var spectRef = new Spectrogram("#canvas_ref", context);
	var spectUsr = new Spectrogram("#canvas_usr", context);
	
	mediaStreamSource.connect(spectUsr.analyser);

	var recordingBuffer = false;
	
	loadSound(refurl);

    // load the specified sound
    function loadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function () {
            // decode the data
            context.decodeAudioData(request.response, function (buffer) {
				recordingBuffer = buffer;
            }, onError);
        }
        request.send();
    }

	function stopPlay(){
		if(source){
			spectUsr.state = spectUsr.STOP;
			source.stop();
			source.disconnect();
			source = false;
		}
	}
	
	function stopRec(){
		spectUsr.state = spectUsr.STOP;
		rec.stop();
	}
	
	function stopPlayRef(){
		if(referenceSource){
			spectRef.state = spectRef.STOP;
			referenceSource.stop();
			referenceSource.disconnect();
			referenceSource = false;
		}
	}
	
	function stopCurrent(){
		console.log("stopping "+state);
		if(state == PLAY){
			stopPlay();
		}else if(state == REC){
			stopRec();
		}else if(state == PLAYREF){
			stopPlayRef();
		}
		state = STOP;
	}
	
	function clickUsrRecord(){
		stopCurrent();
		state = REC;
		spectUsr.clear();
		spectUsr.state = spectUsr.PLAY;
		rec.clear();
		rec.record();
		hascontent=true;
	}

	function clickUsrStop(){
		stopCurrent();
	}
	
	function clickUsrPlay(){
		stopCurrent();
		if(hascontent){
			rec.getBuffer(function (buffers) {
				source = context.createBufferSource();
				source.buffer = context.createBuffer(1, buffers[0].length, 44100);
				source.buffer.getChannelData(0).set(buffers[0]);
				source.buffer.getChannelData(0).set(buffers[1]);
				source.connect(context.destination);
				source.connect(spectUsr.analyser);
				spectUsr.clear();
				spectUsr.state=spectUsr.PLAY;
				//source.noteOn(0);
				source.start();
			});
			state = PLAY;
		}
	}
	
	function clickRefPlay(){
		stopCurrent();
		state = PLAYREF;
		referenceSource = context.createBufferSource()
		spectRef.clear();
		referenceSource.connect(spectRef.analyser);
		spectRef.state = spectRef.PLAY;
		referenceSource.buffer = recordingBuffer;
		referenceSource.connect(context.destination);
		referenceSource.start(0);
        referenceSource.loop = true;
    }
	
	
	function clickRefStop(){
		stopCurrent();
	}
	
	
function selectFunAnalyze(){
	stopCurrent();
    var urlPhoto = "../images/LakmeSpectroAnalyzeScore.png";

    document.getElementById("SpectroScore").src=urlPhoto;

    // alert("two");

    draw_Image_Analyze();
    // alert("three");

 }

var imgExp = new Image();
var imgRef = new Image();

imgRef.src = "images/LakmeSpectro_Analyze_ref.png";
imgExp.src = "images/LakmeSpectro_Analyze_exp.png"; 

function draw_Image_Analyze() {
    var a_canvas = document.getElementById("canvas_usr");
    var a_context = a_canvas.getContext("2d");

    a_context.drawImage(imgExp, 0, 0); //draw new image
    // alert("drawimage1");


    var b_canvas = document.getElementById("canvas_ref");
    var b_context = b_canvas.getContext("2d");

    b_context.drawImage(imgRef, 0, 0); //draw new image
    // alert("drawimage2");

   }
					 
  function selectFunSegment(){
	stopCurrent();
    var urlPhoto= "LakmeSpectroSegmentScore.png"; 

    document.getElementById("SpectroScore").src=urlPhoto;

    draw_Image_Segment();

   };
  
    var imgExp2 = new Image;
    var imgRef2 = new Image;


     imgRef2.src = "LakmeSpectro_Segment_ref.png";
	imgExp2.src = "LakmeSpectro_Segment_exp.png";  

  function draw_Image_Segment() {

    // alert("src new image");


    var a_canvas = document.getElementById("canvas_usr");
    var a_context = a_canvas.getContext("2d");

    a_context.drawImage(imgExp2, 0, 0); //draw new image
    // alert("drawimage1");


    var b_canvas = document.getElementById("canvas_ref");
    var b_context = b_canvas.getContext("2d");

    b_context.drawImage(imgRef2, 0, 0); //draw new image
    // alert("drawimage2");

   }

	$("#usrRecord").click(clickUsrRecord);
	$("#usrStop").click(clickUsrStop);
	$("#usrPlay").click(clickUsrPlay);
	$("#refPlay").click(clickRefPlay);
	$("#refStop").click(clickRefStop);
	$("#btnAnalyze").click(selectFunAnalyze);
	$("#btnSegment").click(selectFunSegment);
	/*
	*/

	//    window.requestAnimationFrame(draw);
}


/*******************************************************************
Document ready
*******************************************************************/


$(document).ready(function(){
	navigator.getMedia({audio:true}, mediaReady, error);
});


					   


