var Tile = require("./Tile")

var TileMap = function(width, height){
	this.width = width;
	this.height = height;
	this.tiles = [];
	for (var x = 0; x < width; x++){
		this.tiles[x] = [];
		for (var y = 0; y < height; y++){
			var tile = new Tile({x : x, y : y});
			this.tiles[x][y] = tile;
		}
	}
}

TileMap.prototype.tile = function(position){
	if (this.isInBounds(position)){
		return this.tiles[position.x][position.y];
	}
	return null;
}

TileMap.prototype.isInBounds = function(position){
	if (position.x >= 0 && position.x < this.width && position.y >= 0 && position.y < this.height){
		return true;
	}
	return false;
}

TileMap.prototype.removeFaction = function(factionId){
	for (var i in this.tiles){
		for (var j in this.tiles[i]){
			var tile = this.tiles[i][j];
			if (tile.factionId == factionId){
				tile.factionId = null;
				tile.points = 0;
				tile.capital = false;
			}
		}
	}
}

TileMap.prototype.capitalTaken = function(factionId, conquerorId){
	for (var i in this.tiles){
		for (var j in this.tiles[i]){
			var tile = this.tiles[i][j];
			if (tile.factionId == factionId){
				tile.factionId = conquerorId;
				tile.capital = false;
			}
		}
	}
}

TileMap.prototype.adjacents = function(position){
	var adjacents = [];
	adjacents.push(this.tile({x : position.x - 1, y : position.y}));
	adjacents.push(this.tile({x : position.x + 1, y : position.y}));
	adjacents.push(this.tile({x : position.x, y : position.y - 1}));
	adjacents.push(this.tile({x : position.x, y : position.y + 1}));
	for (var i = adjacents.length - 1; i >= 0; i--){
		if (adjacents[i] == null){
			adjacents.splice(i, 1);
		}
	}
	return adjacents;
}

module.exports = TileMap;