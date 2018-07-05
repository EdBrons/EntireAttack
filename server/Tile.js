var Tile = function(position){
	this.position = position;
	this.factionId = null;
	this.capital = false;
	this.points = 0;
	this.connection = null;
}

// Tile.prototype.click = function(factionId, points){
// 	points = Math.floor(points);
// 	if (factionId == this.factionId){
// 		this.points += points;
// 	}
// 	else{
// 		if (points > this.points){
// 			if (this.capital){
// 				this.capital = false;
// 			}
// 			this.factionId = factionId;
// 			this.points = points - this.points;
// 		}
// 		else{
// 			this.points -= points;
// 		}
// 	}
// }

module.exports = Tile;