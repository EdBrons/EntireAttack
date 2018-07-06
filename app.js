// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

var PORT = process.env.PORT || 3000;

app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));


app.get('/', function(request, response){
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(PORT, function(){
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// server.listen(5000, function() {
// 	console.log('Starting server on port 5000');
// });

var players = {};

var TileMap = require("./server/Tilemap");

var tileMap = new TileMap(100, 100);

var colors = [
	"#FF5733",
	"#FFBD33",
	"#DBFF33",
	"#75FF33",
	"#33FFBD",
	"#641E16",
	"#F00000",
	"#00F000",
	"#0000F0",
];
function getColor(){
	var i = Math.floor(Math.random() * colors.length);
	var color =  colors.shift(i);
	return color;
}

var spawnLocations = [
	{x : 0, y : 0},
	{x : tileMap.width, y : 0},
	{x : 0, y : tileMap.height},
	{x : tileMap.width, y : tileMap.height},
	{x : Math.floor(tileMap.width / 2), y : 0},
	{x : 0, y : Math.floor(tileMap.height / 2)},
	{x : Math.floor(tileMap.width / 2), y : Math.floor(tileMap.height / 2)},
	{x : Math.floor(tileMap.width / 2), y : tileMap.height},
	{x : tileMap.width, y : Math.floor(tileMap.height / 2)}
];

function getSpawnLocation(){
	for (var i in spawnLocations){
		var position = spawnLocations[i];
		if (tileMap.tile(location).factionId == null){
			return spawnLocations[i];
		}
	}
	return null;
}

var changedPositions = [];

var decayingPositions = [];

function distance(position1, position2){
	return (Math.abs(position1.x - position2.x) + Math.abs(position1.y - position2.y));
}

// function changeOwnership(position, newFactionId){
// 	tileMap.tile(position).factionId = newFactionId;
// 	changedPositions.push(position);
// }

function change(position, property, newValue){
	var tile = tileMap.tile(position);
	if (tile == null){
		//tile is not valied tile
		return;
	}

	if (tile[property] == newValue){
		//not making change therefore no need to update clients
		return;
	}

	tile[property] = newValue;

	changedPositions.push(position);
}

var Users = {};

function isValidPassword(data){
	if (Users[data.username] == undefined){
		return false;
	}
	if (Users[data.username].password == data.password){
		return true;
	}
	else{
		return false;
	}
}

function isValidUsername(data){
	return Users[data.username] === undefined;
}

function addAccount(data){
	Users[data.username] = {
		password : data.password,
	};
}
io.on('connection', function(socket){
	console.log(socket.id + " connected");

	socket.on("signIn", function(data){
		if (isValidPassword(data)){
			socket.emit("signInResponse", {success : true});
			socket.factionId = Users[data.username].factionId;
		}
		else{
			socket.emit("signInResponse", {success : false});
		}
	});

	socket.on("signUp", function(data){
		if (isValidUsername(data)){
			addAccount(data);
			Users[data.username].factionId = socket.id;
			console.log(Users[data.username].factionId);
			console.log(socket.id);
			socket.emit("signUpResponse", {success : true, factionId : Users[data.username].factionId});
		}
		else{
			socket.emit("signUpResponse", {success : false});
		}
	})

	players[socket.id] = {
		color : getColor(),
		capital : false,
		defeated : false,
		points : 0,
		income : 50
	};

	// socket.on("disconnect", function(){
	// 	console.log(socket.id + " disconnected");
	// 	colors.push(players[socket.id].color);
	// 	delete players[socket.id];

	// 	//remove player
	// 	for (var x = 0; x < tileMap.width; x++){
	// 		for (var y = 0; y < tileMap.height; y++){
	// 			var tile = tileMap.tile({x : x, y : y});
	// 			if (tile.factionId == socket.id){
	// 				change({x : x, y : y}, "factionId", null);
	// 				change({x : x, y : y}, "points", 0);
	// 			}
	// 		}
	// 	}

	// 	console.log("Player disconnected");
	// });

	socket.on("click", function(position){
		if (tileMap.isInBounds(position) == false || players[socket.factionId].defeated){
			//not valid position
			return;
		}

		var tile = tileMap.tile(position);

		if (players[socket.factionId].capital == false){
			//player has not yet chosen a capital
			if (tile.factionId != null){
				//cannot set capital to an occupied tile
				return;
			}

			players[socket.factionId].capital = tile;
			tile.capital = true;
			change(position, "capital", true);
			// tile.factionId = socket.id;
			change(position, "factionId", socket.factionId);
			// tile.points = 100;
			change(position, "points", 100);

			socket.emit("capitalPlaced");

			return;
		}

		//check and see if tile is valid
		var adjacents = tileMap.adjacents(position);
		var neighbors = 0;
		var hasNeighbors = false;
		for (var i in adjacents){
			if (adjacents[i].factionId == socket.factionId){
				hasNeighbors = true;
				neighbors++;
			}
		}


		if (!hasNeighbors && (tile.factionId != socket.factionId)){
			return;
		}


		var originalPoints = Math.floor(players[socket.factionId].points);
		var points = originalPoints * neighbors;

		//the click is valid, calculate result
		if (tile.factionId == socket.factionId){
			// tile.points += points;
			change(position, "points", tile.points + points);
		}
		else{
			if (tile.points < points){
				//tile captured
				if (tile.capital){

					if (tile.factionId == null){
						return;
					}

					change(position, "capital", false);

					players[tile.factionId].capital = null;
					players[tile.factionId].defeated = true;

					//someones capital was taken

					var defeated = [];

					for (var x = 0; x < tileMap.width; x++){
						for (var y = 0; y < tileMap.height; y++){
							var t = tileMap.tile({x : x, y : y});
							if (t.factionId == tile.factionId){
								defeated.push(t);
							}
						}
					}

					defeated.forEach((t) => {
						change(t.position, "factionId", socket.factionId);
					})
				}
				// tile.factionId = socket.id;
				change(position, "factionId", socket.factionId);
				// tile.points = points - tile.points;
				change(position, "points", points - tile.points);
			}
			else{
				// tile.points -= points;
				change(position, "points", tile.points - points);
			}
		}

		players[socket.factionId].points -= originalPoints;

		socket.emit("Points", players[socket.factionId].points);
	});
});

var maxPoints = 1000;

function Update(deltaTime){
	updateTimer += deltaTime;
	var p = deltaTime / 1000;

	if (updateTimer >= updateTime){
		updateTimer = 0;
		io.emit("MapUpdate", {
			tileMap : tileMap,
			players : players
		});
	}
	else if (changedPositions.length > 0){
		var tiles = [];
		changedPositions.forEach((position) => {
			tiles.push(tileMap.tile(position));
		});
		io.emit("TileUpdate", tiles);
		changedPositions = [];
	}

	var points = [];

	for (var i in players){
		var player = players[i];
		player.points += player.income * p;
		if (player.points > maxPoints){
			player.points = maxPoints;
		}

		// points.push(Math.floor(player.points));
		// points.push({
		// 	factionId : i,
		// 	points : Math.floor(player.points)
		// });
	}

	// io.emit("Points", points);
}

var update = true;

var updateTimer = 0;
var updateTime  = 10000;

var lastUpdateTime = (new Date()).getTime();
var interval = setTimeout(helper, 1000 / 60);

function helper(){
	var currentTime = (new Date()).getTime();
	Update(currentTime - lastUpdateTime);
	lastUpdateTime = (new Date()).getTime();
	interval = setTimeout(helper, 1000 / 60);
}