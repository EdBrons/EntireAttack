var Input = {};

Input.keysDown = {};

document.addEventListener("keydown", function(e){
	Input.keysDown[e.keyCode] = true;
})

document.addEventListener("keyup", function(e){
	Input.keysDown[e.keyCode] = false;
})

canvas.addEventListener("click", function(e){
	var clickPosition = {
		x : Math.floor((e.offsetX + Camera.position.x) / tileSize),
		y : Math.floor((e.offsetY + Camera.position.y) / tileSize)
	};

	var tile = tileMap.tiles[clickPosition.x][clickPosition.y];

	socket.emit("click", clickPosition);
});

setInterval(function(){
	if (Input.keysDown[72] == true){
		Camera.centerOn({x : players[factionId].capital.x * tileSize, y : players[factionId].capital.y * tileSize});
	}
}, 1000 / 60)