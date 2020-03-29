const Store = {
	canvas: {
		height: 500,
		width: 1000
	},
	bird: {
		translateDistance: 5,
		dirDrift: 3,
		size: 10,
		neighbourRadius: 50
	},
	totalBirds: 200,
	alignmentFactor: 0.1,
	cohesionFactor: 0.001
};

class Bird {
	constructor (x, y, direction) {
		this.x = x;
		this.y = y;
		this.direction = direction;
	}


	move (distance, direction) {
		[this.x, this.y] = moveInBearing(this.x, this.y, distance, direction);
	}

	getNeighbours (birds) {
		return birds.filter(bird => {
			const distance = getDistance([this.x, this.y], [bird.x, bird.y]);
			
			return distance < Store.bird.neighbourRadius;
		});
	}

	render (ctx) {
		const firstPoint = moveInBearing(this.x, this.y, Store.bird.size*0.385, this.direction+degToRad(90));
		const secondPoint = moveInBearing(...firstPoint, Store.bird.size, this.direction+degToRad(-22.5));
		const thirdPoint = moveInBearing(...secondPoint, Store.bird.size, this.direction+degToRad(-157.5));
		const fourthPoint = moveInBearing(...thirdPoint, Store.bird.size*0.385, this.direction+degToRad(90));

		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(...firstPoint);
		ctx.lineTo(...secondPoint);
		ctx.lineTo(...thirdPoint);
		ctx.lineTo(...fourthPoint)
		ctx.fill();		
	}
}

const $canvas = document.querySelector('canvas');
$canvas.setAttribute('height', Store.canvas.height);
$canvas.setAttribute('width', Store.canvas.width);

const ctx = $canvas.getContext('2d');


const birds = [];
for (let i = 0; i < Store.totalBirds; i++) {
	const bird = new Bird(
		rand(0, Store.canvas.width),
		rand(0, Store.canvas.height),
		rand(0, 2*Math.PI)
	);
	
	birds.push(bird);
}

setInterval(function () {
	ctx.clearRect(0, 0, Store.canvas.width, Store.canvas.height);

	birds.forEach(bird => {
		const neighbours = bird.getNeighbours(birds);
		if (!neighbours.length) return;
		
		const meanDir = neighbours.reduce((acc, curr) => acc + curr.direction, 0) / neighbours.length;
		const meanX = neighbours.reduce((acc, curr) => acc + curr.x, 0) / neighbours.length;
		const meanY = neighbours.reduce((acc, curr) => acc + curr.y, 0) / neighbours.length;

		bird.direction += Store.alignmentFactor * (meanDir-bird.direction);
		bird.x += Store.cohesionFactor * (meanX-bird.x);
		bird.y += Store.cohesionFactor * (meanY-bird.y);
	});
	birds.forEach(bird => {
		const dir = bird.direction;
		const minEdgeDist = Math.min(bird.x, Store.canvas.width - bird.x, bird.y, Store.canvas.height - bird.y);

		if (minEdgeDist < Store.canvas.width*0.05 || minEdgeDist < Store.canvas.height*0.05) {
			bird.direction = rand(dir-degToRad(Store.bird.dirDrift), dir+degToRad(Store.bird.dirDrift*5));
		} else {
			bird.direction = rand(dir-degToRad(Store.bird.dirDrift), dir+degToRad(Store.bird.dirDrift));
		}


		bird.move(Store.bird.translateDistance, bird.direction);
		bird.render(ctx);
	});
}, 50);


function getDistance (vec1, vec2) {
	if (vec1.length !== vec2.length) {
		throw new Error("Vectors must have same length");
	}

	const sumOfSquares = vec1.reduce((acc, vec1Cur, idx) => {
		return acc + (vec1Cur - vec2[idx])**2;
	}, 0);

	return Math.sqrt(sumOfSquares);
}

function rand (min, max) {
	return Math.random() * (max-min) + min;
}

function degToRad (deg) {
	return deg * Math.PI / 180;
}

function moveInBearing (x, y, l, bearing) {
	// So bearing ranges 0-2Pi radians
	bearing = bearing % (2*Math.PI);

	//Convert bearing into theta value for trig formulae
	//Adjusting x and y values so in correct direction for angle
	if (bearing < Math.PI/2) {
		theta = bearing;
		xSign = 1;
		ySign = 1;
	} else if (bearing >= Math.PI/2 && bearing < 2*Math.PI) {
		theta = Math.PI - bearing;
		xSign = 1;
		ySign = -1;
	} else if (bearing >= 2*Math.PI && bearing < 3*Math.PI/2) {
		theta = Math.PI - bearing;
		xSign = -1;
		ySign = -1;
	} else {
		theta = 2*Math.PI - bearing;
		xSign = -1;
		ySign = 1;
	}

	return [x + Math.sin(theta)*l*xSign, y + Math.cos(theta)*l*ySign];
}
