var width = 800;
var height = 512;

    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }

    var context = new AudioContext();
    var audioBuffer;
    var sourceNode;
    var source;
    var analyser;
    var javascriptNode;
    var startOffset = 0;
    var startTime = 0;


    // get the context from the canvas to draw on
    var ctx = $("#canvas_refe").get()[0].getContext("2d");

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


    setupAudioNodes();

    var fileInput = document.querySelector('input[type="file"]');

    fileInput.addEventListener('change', function(e) {  
      var reader = new FileReader();
      reader.onload = function(e) {
        initSound(this.result);
      };
      reader.readAsArrayBuffer(this.files[0]);
    }, false);


    function setupAudioNodes() {

        // setup a javascript node
        javascriptNode = context.createScriptProcessor(2048, 1, 1);
        // connect to destination, else it isn't called
        javascriptNode.connect(context.destination);


        // setup a analyzer
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0;
        analyser.fftSize = 1024;

        // create a buffer source node
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        analyser.connect(javascriptNode);

        sourceNode.connect(context.destination);
    }

    function initSound(arrayBuffer) {
      context.decodeAudioData(arrayBuffer, function(buffer) {
        // audioBuffer is global to reuse the decoded audio later.
        audioBuffer = buffer;
        var buttons = document.querySelectorAll('button');
        buttons[0].disabled = false;
        buttons[1].disabled = false;
        buttons[2].disabled = false;
        alert("complete init sound");
        //playSound(audioBuffer);
      }, function(e) {
        console.log('Error decoding file', e);
      }); 

    }


    function play() {
        startTime = context.currentTime;
        alert("start time:"+ startTime);
        alert("startoff time:"+ startOffset);

        if(startOffset == 0)
        {
            sourceNode.buffer = audioBuffer;
            sourceNode.loop = true;
            // Start playback, but make sure we stay in bound of the buffer.
            sourceNode.start(0);
        }
        if(startOffset ==-1)
        {
          //setupAudioNodes(source);
          source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = false;
          source.connect(context.destination);
          source.start(0);
        }
        else
        {
          //setupAudioNodes(source);
          source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.loop = false;
          source.connect(context.destination);
          source.start(0, startOffset % audioBuffer.duration); // Play immediately.

        }
        

    }

    function pause() {
        
        if(sourceNode)
            {sourceNode.stop();
            }
        if(source)
            {
                source.stop();
            }
          // Measure how much time passed since the last pause.
          startOffset += context.currentTime - startTime;
          alert("startoffset:"+ startOffset);
    }


    function stop() {
        
        //sourceNode.buffer = audioBuffer;
        if(sourceNode){
        sourceNode.noteOff(0);
        }
        if(source){
            source.noteOff(0);
        }
        startOffset = -1;


    }

    // log if an error occurs
    function onError(e) {
        console.log(e);
    }

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function () {

        // get the average for the first channel
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // draw the spectrogram
        if (sourceNode.playbackState == sourceNode.PLAYING_STATE) {
            drawSpectrogram(array);
        }


    }

    function drawSpectrogram(array) {

        // copy the current canvas onto the temp canvas
        var canvas = document.getElementById("canvas_refe");

        tempCtx.drawImage(canvas, 0, 0, width, height);

        // iterate over the elements from the array
        for (var i = 0; i < array.length; i++) {
            // draw each pixel with the specific color
            var value = array[i];
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
