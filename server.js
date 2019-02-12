// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', (process.env.PORT || 8080));
console.log("test port = " + app.get('port'))
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server
server.listen(app.get('port'), function() {
  console.log(`Starting server on port ${app.get('port')}`);
});

// Add the WebSocket handlers 
io.on('connection', function(socket) {

});

// Player and word database
var wordArray = []
var players = {};

io.on('connection', function(socket) {

	// Add new player to the database
	socket.on('new player', function(data) {

        // Check if there is even a name
		if (data) {
			players[socket.id] = {
				name: data
			};
			console.log("[" + players[socket.id].name + "] joined -------------- Players online = " + Object.keys(players).length);

			// Send current word state to new player
			socket.emit('wordState', wordArray);

			// Send updated player count
			io.sockets.emit('playerNum', Object.keys(players).length);
		} else {
			socket.emit('nullName');
		}
	});

    // Receive a message submission from a player
	socket.on('message', function(data) {
		if ((data.size == 20 || data.size == 30 || data.size == 40) && (data.string)) {
			wordArray.push(data);
			console.log("Received a legit message = " + data.string + " ------------- wordArray size = " + wordArray.length); 	
		    io.sockets.emit('wordState', wordArray);
		    socket.emit('clearInput');

	    // Invalid string or illegal font
		} else {
			console.log("Invalid string or illegal font");
		}
	});

	// Disconnect player and remove from data
	socket.on('disconnect', function() {
		console.log("Player["+socket.id+"] PRESSED DISCONNECT!!! ------------- Players online = " + Object.keys(players).length);
		delete players[socket.id];
		io.sockets.emit('playerNum', Object.keys(players).length);
	});
});



/*
Current bugs:
1. the cross looking weird at the beginning

2. if player connected from before leave fresh server, causes -1 in number
*/