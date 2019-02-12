var socket = io();
var wordArray = [];
var playerNum = 0;
var playerName = "";
var xPos = -100;
var yPos = -100;
var size = 20;
document.getElementById('userInput').focus();

//trying to understand canvas.width versus style 

// Initialising the canvas variable
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
canvas.width = 3000;
canvas.height = 2000;
console.log("canvas width = " + document.getElementById('hud').value + "---- canvas height = " + canvas.style.height);
context.font = size + "px Arial";

// New word from the server, update canvas
socket.on('wordState', function(data) {

	// Remove login form if it's still there
	if (document.getElementById('login').style.display != "none") {
		document.getElementById('login').style.display = "none";
		document.getElementById('hud').style.display = "block";
		document.getElementById('playerNum').style.display = "block";
		document.getElementById('playerName').style.display = "block";
	}

	wordArray = data;
	updateCanvas(); 
});

// Player number updated
socket.on('playerNum', function(data) {
    playerNum = data;
    document.getElementById('playerNum').innerHTML = "Players online: " + playerNum;
    console.log("got the num packet =" + data);
});

document.addEventListener('click', function(event) {

});

// Update the player's pointer position
document.getElementById('canvas').addEventListener('click', function(event) {
    console.log("lolsers");
	// Only allow click once player has submitted name
	if (playerName) {
		xPos = event.offsetX;
		yPos = event.offsetY;
		console.log("xPos = " + xPos + "  yPos = " + yPos);

	    // Redraw whole canvas to update the cross
	    updateCanvas();

		// Focus message box
		document.getElementById('message').focus();
    } 
    /*
    else {
    	document.getElementById('userInput').focus();
    }
    */
});

// Submitting a message to the server
function sendMessage() {
	if (document.getElementById('message').value) {
	    var data = {
	    	string: document.getElementById('message').value,
	    	x: xPos,
	    	y: yPos,
	    	size: size
	    };

	    socket.emit('message', data);
	    console.log("Send a message ["+data.string+"] ["+data.x+","+data.y+"] size=["+data.size+"] packet to server...");   
    } 
}

// Clear message input box if message is sent and focus
socket.on('clearInput', function() {
	document.getElementById('message').value = "";
	document.getElementById("message").focus() 
});

// User didn't enter a name
socket.on('nullName', function() {
	var toChange = document.getElementById('login').childNodes[0];
	toChange.nodeValue = 'Enter your name: User must not be null'
    document.getElementById('userInput').focus();
});

// Set username from login prompt
function setName() {
    playerName = document.getElementById('userInput').value;
    console.log("user's name = " + playerName);

    document.getElementById('playerName').innerHTML = playerName;

    // Notify server to setup new player
	socket.emit('new player', playerName);
}

// Disconnect from the server
function disconnect() {
	console.log("Requesting to disconnect...");
	socket.disconnect();
}

// Pressing enter to submit a string
window.addEventListener('keydown', function(event) {
	console.log("key pressedd = " + event.keyCode);
    switch (event.keyCode) {
    	case 13:
    		sendMessage();
    		console.log("enter pressed")
    		break;
    }
});

// Submit username via enter key
document.getElementById('userInput').onkeypress = function(event) {
	console.log("enter pressed yee the boiz");
    switch (event.keyCode) {
    	case 13:
    	    setName();
    	    break;
    }
};

// Update the whole canvas locally
function updateCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawCoords();
	drawWords();
	drawMouse();
}

// Draw out the x and y number coords
function drawCoords() {
	/*
	var temp = context.font;
	context.font = "10px Arial";
	var ite = 0
	while (ite < 8) {
	    context.fillText(ite*document.getElementById('canvas').width/8, ite*document.getElementById('canvas').width/8, 10);
	    context.fillText(ite*document.getElementById('canvas').height/8, 0, ite*document.getElementById('canvas').height/8);
	    ite++
	}
	context.font = temp;*/
}

// Draw the words onto the canvas
function drawWords() {
    for (var worder = 0; worder < wordArray.length; worder++) {
    	context.font = wordArray[worder].size + "px Arial";
    	context.fillText(wordArray[worder].string, wordArray[worder].x, wordArray[worder].y)
    }  	
}

// Draw the pointer on the canvas
function drawMouse() {
	mouseX = xPos;
	mouseY = yPos;
    context.beginPath();
    context.moveTo(mouseX-30, mouseY);
    context.lineTo(mouseX+30, mouseY);
    context.moveTo(mouseX, mouseY-30)
    context.lineTo(mouseX, mouseY+30);
    context.stroke();
}