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
			console.log("name submitted");
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

			console.log("before word mongo");
			// Update new player about the current word state
			mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
				if (err) throw err;
				var dbo = db.db("mydb");
				dbo.collection("words").find({}).toArray(function(err, res) {
					if (err) throw err;
					socket.emit('wordState', res);
					console.log(res);
					db.close();
				});
			});

			console.log("awaiting callback??");
		} else {
			console.log("no name submitted");
			socket.emit('nullName');
		}
	});

    // Receive a message submission from a player
	socket.on('message', function(data) {
		if ((data.size == 20 || data.size == 30 || data.size == 40) && (data.string)) {

			// Add the word to the 'words' database
			mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
			    if (err) throw err;
			    var dbo = db.db("mydb");
			    dbo.collection("words").insertOne(data, function(err) {
					if (err) throw err;
					console.log("Word = [" + data.string + "] added to 'words' collection");
					dbo.collection("words").countDocuments({}, function(err, totalDocs) {
						if (err) throw err;
						console.log("Received a legit message = " + data.string + " ------------- word's database size = " + totalDocs);
						db.close()
					});
				});
			});

			// Update all players about the new word state
			mongoClient.connect(dbURL, {useNewUrlParser: true}, function(err, db) {
				if (err) throw err;
				var dbo = db.db("mydb");
				dbo.collection("words").find({}).toArray(function(err, res) {
					if (err) throw err;
					io.sockets.emit('wordState', res);
					db.close();
				});
			});
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
				dbo.collection("players").deleteOne({id: socket.id}, function(err) {
					if (err) throw err;
					console.log(res.name + " with id [" + socket.id + "] DISCONNECTED!!! ---- removed from database");
					db.close();
				});
			});
		});

		// Tell other players to update their player counts
		io.sockets.emit('playerNum');
	});
});



/*
Current bugs:
1. the cross looking weird at the beginning

2. if player connected from before leave fresh server, causes -1 in number
*/