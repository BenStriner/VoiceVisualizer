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