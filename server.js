// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var mongoClient = require('mongodb').MongoClient;

var app = express();
var server = http.Server(app);
var io = socketIO(server);
var dbURL = "mongodb://localhost:27017/";


app.set('port', (process.env.PORT || 8080));
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server
server.listen(app.get('port'), function() {
  console.log(`Starting server on port ${app.get('port')}`);
});


io.on('connection', function(socket) {

	// Add new player to the database
	socket.on('new player', function(data) {

        // Check if there is even a name
		if (data) {

			// Add the player's name to the 'players' database
			mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
			    if (err) throw err;
			    var dbo = db.db("mydb");
			    dbo.collection("players").insertOne({name: data, id: socket.id}, function(err) {
					if (err) throw err;
					dbo.collection("players").countDocuments({}, function(err, playerNum) {
					    if (err) throw err;
					    console.log("[" + data + "] has joined with id [" + socket.id + "] ------------- total players online = " + playerNum);
						io.sockets.emit('playerNum', playerNum);   // Update players on player count
					    db.close();
					});		
				});
			});

			// Update new player about the current word state
			mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
				if (err) throw err;
				var dbo = db.db("mydb");
				dbo.collection("words").find({}).toArray(function(err, res) {
					if (err) throw err;
					socket.emit('wordState', res);
					db.close();
				});
			});
		} else {
			console.log("no name submitted");
			socket.emit('nullName');
		}
	});

    // Receive a message submission from a player
	socket.on('message', function(data) {
		if ((data.size == 20 || data.size == 30 || data.size == 40) && (data.string)) {

			// Initialise connection to mongoDB
			mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
			    if (err) throw err;
			    var dbo = db.db("mydb");

			    // Add the word to the 'words' database
			    dbo.collection("words").insertOne(data, function(err) {
					if (err) throw err;
					console.log("Word = [" + data.string + "] added to 'words' collection");

					// Count the number of words in database
					dbo.collection("words").countDocuments({}, function(err, totalDocs) {
						if (err) throw err;
						console.log("Received a legit message = " + data.string + " ------------- word's database size = " + totalDocs);
					});

					// Update all players about the new word state
					dbo.collection("words").find({}).toArray(function(err, res) {
						if (err) throw err;
						io.sockets.emit('wordState', res);
						db.close();
					});
				});
			});

			// Clear the input of the player submitting the message
			socket.emit('clearInput');

	    // Invalid string or illegal font
		} else {
			console.log("Invalid string or illegal font");
		}
	});

	// Disconnect player and remove from data
	socket.on('disconnect', function() {

		// Remove the player from the 'players' database
		mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
		    if (err) throw err;
		    var dbo = db.db("mydb");
		    dbo.collection("players").findOne({id: socket.id}, function(err, res) {
				if (err) throw err;

				// Remove player ONLY if he is already in database
				if (res) {
					dbo.collection("players").deleteOne({id: socket.id}, function(err) {
						if (err) throw err;
						console.log(res.name + " with id [" + socket.id + "] DISCONNECTED!!! ---- removed from database");

						// Tell other players to update their player counts
						dbo.collection("players").countDocuments({}, function(err, playerNum) {
							if (err) throw err;
							io.sockets.emit('playerNum', playerNum);
							db.close()
						});
					});					
				} else {
					db.close();
				}
			});
		});
	});
});



/*
Current bugs:
1. the cross looking weird at the beginning

2. if player connected from before leave fresh server, causes -1 in number
*/