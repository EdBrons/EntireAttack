function draw(){
	c.clearRect(0, 0, canvas.width, canvas.height);
	if (tileMap == undefined && players != undefined){
		return;
	}

	var base = {
		x : Math.floor(Camera.position.x / tileSize),
		y : Math.floor(Camera.position.y / tileSize)
	};

	for (var x = 0; x < Camera.width / tileSize + 1; x++){
		for (var y = 0; y < Camera.height / tileSize + 1; y++){

			if (tileMap.tiles[base.x + x] == undefined || tileMap.tiles[base.x + x][base.y + y] == undefined){
				continue;
			}

			var tile = tileMap.tiles[base.x + x][base.y + y];

			var drawPosition = {
				x : ((x + base.x) * tileSize) - Camera.position.x,
				y : ((y + base.y) * tileSize) - Camera.position.y
			};

			c.fillStyle = "#000000";
			c.fillRect(drawPosition.x, drawPosition.y, tileSize, tileSize);
			c.clearRect(drawPosition.x + 1, drawPosition.y + 1, tileSize - 2, tileSize - 2);
			if (tile.factionId != null){
				if (players[tile.factionId].color == undefined){
					continue;
				}
				c.fillStyle = players[tile.factionId].color;
				c.fillRect(drawPosition.x + 1, drawPosition.y + 1, tileSize - 2, tileSize - 2);
				c.font = "8px Arial";
				c.fillStyle = "#000000";
				c.fillText(tile.points, drawPosition.x + tileSize / 3, drawPosition.y + tileSize * 5/6);
				if (tile.capital){
					c.font = "14px Arial"
					c.fillText("C", drawPosition.x + tileSize / 3, drawPosition.y + tileSize * 2/5);
				}
			}
		}
	}
}