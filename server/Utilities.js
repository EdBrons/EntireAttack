var Utilities = {
	randomColor : function(){
		var chars = "1234567890ABCDEF";
		var color = "#";
		for (var i = 0; i < 6; i++){
			color += chars[Math.floor(Math.random() * chars.length)];
		}
		return color;
	},

	adjacentTiles : function(position, tileMap){
		var adjacentTiles = [];
		for (var x = position.x - 1; x < position.x + 2; x++){
			for (var y = position.y - 1; y < position.y + 2; y++){
				if (x == position.x && y == position.y){
					continue;
				}
				if ((x < 0 || x >= tileMap.width) || (y < 0 || y >= tileMap.height)){
					continue;
				}
				adjacentTiles.push(tileMap.tiles[x][y]);
			}
		}
		return adjacentTiles;
	},
};

module.exports = Utilities;