// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(request, response){
  response.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT || 3000, function(){
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

var players = {};

var TileMap = require("./server/Tilemap");

var tileMap = new TileMap(100, 100);

var colors = [
	"#FF5733",
	"#FFBD33",
	"#DBFF33",
	"#75FF33",
	"#33FFBD",
	"#641E16"
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

io.on('connection', function(socket){
	console.log(socket.id + " connected");

	// var capital = getSpawnLocation();
	// if (capital == null){
	// 	//no free spots available
	// 	socket.emit("noFreeSpots");
	// }

	players[socket.id] = {
		color : getColor(),
		capital : false,
		points : 0,
		income : 100
	};

	io.emit("MapUpdate", {
		tileMap : tileMap,
		players : players
	});

	socket.on("disconnect", function(){
		console.log(socket.id + " disconnected");
		colors.push(players[socket.id].color);
		delete players[socket.id];

		//remove player
		for (var x = 0; x < tileMap.width; x++){
			for (var y = 0; y < tileMap.height; y++){
				var tile = tileMap.tile({x : x, y : y});
				if (tile.factionId == socket.id){
					change({x : x, y : y}, "factionId", null);
					change({x : x, y : y}, "points", 0);
				}
			}
		}

		console.log("Player disconnected")

		io.emit("MapUpdate", {
			tileMap : tileMap,
			players : players
		});
	});

	socket.on("click", function(position){
		if (tileMap.isInBounds(position) == false || !players[socket.id].capital){
			//not valid position
			return;
		}

		var tile = tileMap.tile(position);

		if (players[socket.id].capital == false){
			//player has not yet chosen a capital
			if (tile.factionId != null){
				//cannot set capital to an occupied tile
				return;
			}

			players[socket.id].capital = tile;
			tile.capital = true;
			change(position, "capital", true);
			// tile.factionId = socket.id;
			change(position, "factionId", socket.id);
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
			if (adjacents[i].factionId == socket.id){
				hasNeighbors = true;
				neighbors++;
			}
		}


		if (!hasNeighbors && (tile.factionId != socket.id)){
			return;
		}


		var points = Math.floor(players[socket.id].points)

		//the click is valid, calculate result
		if (tile.factionId == socket.id){
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

					console.log("yes")

					change(position, "capital", false);

					players[socket.id].capital = false;

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
						change(t.position, "factionId", socket.id);
					})
				}
				// tile.factionId = socket.id;
				change(position, "factionId", socket.id);
				// tile.points = points - tile.points;
				change(position, "points", points - tile.points);
			}
			else{
				// tile.points -= points;
				change(position, "points", tile.points - points);
			}
		}

		players[socket.id].points -= points;
	});
});

// //things that are continuisly(?) update
// var lastUpdateTime = (new Date()).getTime();
// setInterval(function(){
// 	var currentTime = (new Date()).getTime();
// 	var deltaTime = currentTime - lastUpdateTime;
// 	//how many ticks have gone by
// 	var p = deltaTime / 1000;

// 	//points go up
// 	for (var i in players){
// 		players[i].points += players[i].income * p;
// 	}
// }, 1000 / 20); //20 times / second


// //sends tiles that have been changed to clients
// setInterval(function(){
// 	if (changedPositions.length <= 0){
// 		return;
// 	}
// 	var tiles = [];
// 	changedPositions.forEach((position) => {
// 		tiles.push(tileMap.tile(position));
// 	});
// 	io.emit("tilesUpdate", tiles);
// 	changedPositions = [];
// }, 1000 / 20) //20 times / second

// //sends entire map to make sure everyone is in sync

// //exact points will only be known on the server,
// //clients will run their own simulations which will be updated at full updates
// //and when the tile dies or when points are spent
// //maybe sync points but tile points cannot be synced because it would slow everything too much
// setInterval(function(){
// 	io.emit("fullUpdate", {
// 		tileMap : tileMap,
// 		players : players
// 	});
// }, 5000); //1 / 5 mintues

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
		points.push({
			factionId : i,
			points : Math.floor(player.points)
		});
	}

	io.emit("Points", points);
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