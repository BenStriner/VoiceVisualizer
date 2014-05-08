
var Spectrogram = function(id, context){
    // get the context from the canvas to draw on
	var ctx = $(id).get()[0].getContext("2d");
	
    // create a temp canvas we use for copying
    var tempCanvas = document.createElement("canvas"),
    tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width=800;
    tempCanvas.height=512;
	
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
    this.analyser.fftSize = 1024;
	var analyser = this.analyser;
	
	// create a buffer source node
    this.sourceNode = context.createBufferSource();
    this.sourceNode.connect(this.analyser);
	var sourceNode = this.sourceNode;
	
	// setup a javascript node
    var javascriptNode = context.createScriptProcessor(2048, 1, 1);
	javascriptNode.onaudioprocess = function () {

        // get the average for the first channel
        var array = new Uint8Array( analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // draw the spectrogram
        if (sourceNode.playbackState == sourceNode.PLAYING_STATE) {
			console.log("playing");
            drawSpectrogram(array);
        }else{
			console.log("not playing");
		}
    }
	
    // connect to destination, else it isn't called
    javascriptNode.connect(context.destination);


    this.analyser.connect(javascriptNode);

    this.sourceNode.connect(context.destination);
	
	// when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume

    function drawSpectrogram(array) {
		console.log("Drawing");
        // copy the current canvas onto the temp canvas
        var canvas = document.getElementById("canvas");

        tempCtx.drawImage(canvas, 0, 0, 800, 512);

        // iterate over the elements from the array
        for (var i = 0; i < array.length; i++) {
            // draw each pixel with the specific color
            var value = array[i];
            ctx.fillStyle = hot.getColor(value).hex();

            // draw the line at the right side of the canvas
            ctx.fillRect(800 - 1, 512 - i, 1, 1);
        }

        // set translate on the canvas
        ctx.translate(-1, 0);
        // draw the copied image
        ctx.drawImage(tempCanvas, 0, 0, 800, 512, 0, 0, 800, 512);

        // reset the transformation matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
};

    var audioBuffer;
    var sourceNode;
    var analyser;
    var javascriptNode;
	var context;
	var spec;

var documentReady = function(){
    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }

    context = new AudioContext();
	spec = new Spectrogram("#canvas", context);
	



		
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
        spec.sourceNode.loop = true;
    }

    // log if an error occurs
    function onError(e) {
        console.log(e);
    }


};
	
$(document).ready(documentReady);
