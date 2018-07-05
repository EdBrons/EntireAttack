var socket = io();
var tileMap;
var players;
var factionId;
socket.on('connect', () => {factionId = socket.id});
var canvas = document.getElementById("canvas");
var c = canvas.getContext("2d");
var tileSize = 32;

socket.on("TileUpdate", function(tiles){
	if (tileMap == undefined){
		return;
	}

	tiles.forEach((tile) => {
		tileMap.tiles[tile.position.x][tile.position.y] = tile;
	});

	draw();
});

socket.on("MapUpdate", function(data){
	tileMap = data.tileMap;
	players = data.players;

	draw();
});

socket.on("Points", function(points){
	players[factionId].points = points;
	app.points = points;
});

//local simulation for points and decay
var lastUpdateTime = (new Date).getTime();
var interval = setTimeout(helper, 1000 / 60);
function helper(){
	var currentTime = (new Date).getTime();
	Update(currentTime - lastUpdateTime);
	lastUpdateTime = (new Date).getTime();
	interval = setTimeout(helper, 1000 / 60);
}

var maxPoints = 1000;

function Update(deltaTime){
	var p = deltaTime / 1000;
	for (var i in players){
		var player = players[i];
		player.points += player.income * p;
		if (player.points > maxPoints){
			player.points = maxPoints;
		}
	}
	if (players != undefined){
		app.points = Math.floor(players[factionId].points);
	}
}

var app = new Vue({
	el : "#ui",
	data : {
		points : 0,
		placeCapital : false,
	}
})