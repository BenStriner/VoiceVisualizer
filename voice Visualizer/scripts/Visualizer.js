
//embedding pdf
function embedPDF(){
var myPDF = new PDFObject({ 
  url: 'Bellsongsheet.pdf'
}).embed('preview'); 
}

window.onload = embedPDF; //Feel free to replace window.onload if needed.


//Drawing Canvas
var img = new Image();
img.src = "staff.png";
img.onload=function(){
    var c=document.getElementById("myCanvas");
  var ctx=c.getContext("2d");
  ctx.drawImage(img,0,0,500,60);
};

var c=document.getElementById('myCanvas');
var ctx=c.getContext('2d');
ctx.fillStyle='#000000';
ctx.fillRect(20,20,10,10);

//code to manipulate table?
$(document).ready(function(){
    var ddd = [
        ['a.mp3','blahblah','tak'],
        ['a.mp3','blahblah','tak'],
        ['a.mp3','blahblah','tak']
    ];
    for(var i=0;i<ddd.length;i++) {
        var d = ddd[i];
        console.log(d);
        var html_tr = "<tr><td>"+d[0]+"</td><td>"+d[1]+"</td><td>"+d[2]+"</td></tr>";
        var tr_element = $("<div></div>");
        $("table#table_files").append(tr_element);
    }
});
