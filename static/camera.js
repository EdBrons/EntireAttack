var Camera = {};

Camera.position = {
	x : 0,
	y : 0
};

Camera.width = window.innerWidth;
Camera.height = window.innerHeight

Camera.scrollSpeed = 8;

canvas.width = Camera.width;
canvas.height = Camera.height

Camera.move = function(velocity){
	if (tileMap.width * tileSize < this.width){
		velocity.x = 0;
	}
	if (tileMap.height * tileSize < this.height){
		velocity.y = 0;
	}

	this.position.x += velocity.x;

	this.position.y += velocity.y;

	this.makeInBounds();

	draw();
}

Camera.makeInBounds = function(){
	if (this.position.x > tileMap.width * tileSize - this.width){
		this.position.x = tileMap.width * tileSize - this.width;
	}
	else if (this.position.x < 0){
		this.position.x = 0;
	}

	if (this.position.y > tileMap.height * tileSize - this.height){
		this.position.y = tileMap.height * tileSize - this.height;
	}
	else if (this.position.y < 0){
		this.position.y = 0;
	}
}

Camera.centerOn = function(position){
	// this.move({x : position.x / 2 - Camera.position.x,y : position.y / 2 - Camera.position.y});

	// this.position.x = position.x - Camera.width / 2;
	// this.position.y = position.y - Camera.height / 2;

	// this.makeInBounds();

	// console.log(Camera.position)
}

setInterval(function(){
	if (Input.keysDown[37]){
		Camera.move({x : -Camera.scrollSpeed, y : 0});
	}
	if (Input.keysDown[38]){
		Camera.move({x : 0, y : -Camera.scrollSpeed});
	}
	if (Input.keysDown[39]){
		Camera.move({x : Camera.scrollSpeed, y : 0});
	}
	if (Input.keysDown[40]){
		Camera.move({x : 0, y : Camera.scrollSpeed});
	}
}, 1000 / 20);