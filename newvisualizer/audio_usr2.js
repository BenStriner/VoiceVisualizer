var width_usr = 800;
var height_usr = 512;

    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }

    var context_usr = new AudioContext();
    var audioBuffer_usr;
    var sourceNode_usr;
    var source_usr;
    var analyser_usr;
    var javascriptNode_usr;
    var startOffset_usr = 0;
    var startTime_usr = 0;


    // get the context from the canvas to draw on
    var ctx_usr = $("#canvas_usr").get()[0].getContext("2d");

    var tempCanvas_usr = document.createElement("canvas"),
        tempCtx_usr = tempCanvas_usr.getContext("2d");
    tempCanvas_usr.width=width_usr;
    tempCanvas_usr.height=height_usr;

    // used for color distribution
    var hot_usr = new chroma.ColorScale({
        colors:['#000000', '#ff0000', '#ffff00', '#ffffff'],
        positions:[0, .25, .75, 1],
        mode:'rgb',
        limits:[0, 1000]
    });

    // load the sound
    setupAudioNodes_usr();


//var url_usr = "DamrauLakmeIntro.mp3";
//var url = "file:///Users/lunyang/VoiceVisualizer/CallasLakmeIntro.mp3";
    //loadSound_usr(url_usr);


    function setupAudioNodes_usr() {

       // setup a javascript node
        javascriptNode_usr = context_usr.createScriptProcessor(2048, 1, 1);
        // connect to destination, else it isn't called
        javascriptNode_usr.connect(context_usr.destination);


        // setup a analyzer
        analyser_usr = context_usr.createAnalyser();
        analyser_usr.smoothingTimeConstant = 0;
        analyser_usr.fftSize = 2048;

        // create a buffer source node
        sourceNode_usr = context_usr.createBufferSource();
        sourceNode_usr.connect(analyser_usr);
        analyser_usr.connect(javascriptNode_usr);

        sourceNode_usr.connect(context_usr.destination);
    }

    // load the specified sound
    function loadSound_usr(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function () {

            // decode the data
            context_usr.decodeAudioData(request.response, function (buffer) {
                // when the audio is decoded play the sound
                //playSound(buffer);

        audioBuffer_usr = buffer;
        var buttons = document.querySelectorAll('button');
        buttons[3].disabled = false;
        buttons[4].disabled = false;
        buttons[5].disabled = false;
        alert("complete init usr sound");
            }, onError);
        }
        request.send();
    }


 function play_usr() {
        startTime_usr = context_usr.currentTime;
        alert("start time:"+ startTime_usr);
        alert("startoff time:"+ startOffset_usr);

        if(startOffset_usr == 0)
        {
            sourceNode_usr.buffer = audioBuffer_usr;
            sourceNode_usr.loop = true;
            // Start playback, but make sure we stay in bound of the buffer.
            sourceNode_usr.start(0);
        }
        if(startOffset_usr ==-1)
        {
          //setupAudioNodes(source);
          source_usr = context_usr.createBufferSource();
          source_usr.buffer = audioBuffer_usr;
          source_usr.loop = false;
          source_usr.connect(context_usr.destination);
          source_usr.start(0);
        }
        else
        {
          //setupAudioNodes(source);
          source_usr = context_usr.createBufferSource();
          source_usr.buffer = audioBuffer_usr;
          source_usr.loop = false;
          source_usr.connect(context_usr.destination);
          source_usr.start(0, startOffset_usr % audioBuffer_usr.duration); // Play immediately.

        }
        

    }

    function pause_usr() {
        
        if(sourceNode_usr)
            {sourceNode_usr.stop();
            }
        if(source_usr)
            {
                source_usr.stop();
            }
          // Measure how much time passed since the last pause.
          startOffset_usr += context_usr.currentTime - startTime;
          alert("startoffset:"+ startOffset_usr);
    }


    function stop_usr() {
        
        //sourceNode.buffer = audioBuffer;
        if(sourceNode_usr){
        sourceNode_usr.noteOff(0);
        }
        if(source_usr){
            source_usr.noteOff(0);
        }
        startOffset_usr = -1;


    }

    // log if an error occurs
    function onError(e) {
        console.log(e);
    }

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode_usr.onaudioprocess = function () {

        // get the average for the first channel
        var array_usr = new Uint8Array(analyser_usr.frequencyBinCount);
        analyser_usr.getByteFrequencyData(array_usr);

        // draw the spectrogram
        if (sourceNode_usr.playbackState == sourceNode_usr.PLAYING_STATE) {
            drawSpectrogram_usr(array_usr);
        }


    }

    function drawSpectrogram_usr(array) {

        // copy the current canvas onto the temp canvas
        var canvas_usr = document.getElementById("canvas_usr");

        tempCtx_usr.drawImage(canvas_usr, 0, 0, width_usr, height_usr);

        // iterate over the elements from the array
        for (var i = 0; i < array.length; i++) {
            // draw each pixel with the specific color
            var value = array[i];
            ctx_usr.fillStyle = hot_usr.getColor(value).hex();

            // draw the line at the right side of the canvas
            ctx_usr.fillRect(width_usr - 1, height_usr - i, 1, 1);
        }

        // set translate on the canvas
        ctx_usr.translate(-1, 0);
        // draw the copied image
        ctx_usr.drawImage(tempCanvas_usr, 0, 0, width_usr, height_usr, 0, 0, width_usr, height_usr);

        // reset the transformation matrix
        ctx_usr.setTransform(1, 0, 0, 1, 0, 0);

    }
