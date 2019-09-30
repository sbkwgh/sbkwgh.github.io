const HEIGHT = 500;
const WIDTH = 1000;
const N_POINTS = 10;
const SIZE = 0.5;

const TRANSLATE_DIST = 2;
const BEARING_RAND_DEVIATION = degToRad(180);
const SIN_HALF_PERIOD = 5;

const TICK_DURATION = 10;
const CLEAR_ON_DRAW = false;
const RESET_SECONDS = 5;
const MOUSE_CONTROL = false;

const $canvas = document.querySelector('canvas');
const ctx = $canvas.getContext('2d');

$canvas.setAttribute('height', HEIGHT);
$canvas.setAttribute('width', WIDTH);

ctx.fillStyle = '#000';
ctx.fillRect(0, 0, WIDTH, HEIGHT);

function rand (min, max, round) {
	let a = min + Math.random() * (max-min);

	return round ? Math.round(a) : a;
}

function randSign () {
	return rand(0, 1, true) ? -1 : 1;
}

function degToRad (deg) {
	return Math.PI * deg/180;
}

let mouseLocation = null;
document.body.addEventListener('mousemove', e => {
	mouseLocation = new Point(e.pageX, e.pageY, []);
});

function mutate (_point, tick) {
	const point = new Point(
		_point.x,
		_point.y,
		_point.collection
	);

	const nearest = point.getNNearest(N_POINTS).map(p => [p.x, p.y]);
	const summedCoords = nearest.reduce((acc, c) => {
		acc[0] += c[0];
		acc[1] += c[1];

		return acc;
	});
	const averageCoord = {
		x: summedCoords[0] / nearest.length,
		y: summedCoords[1] / nearest.length
	};
	const averageBearing = point.getBearing(averageCoord);

	const magnitude = TRANSLATE_DIST * Math.sin((tick*Math.PI) / (1000/TICK_DURATION*SIN_HALF_PERIOD));
	const randDeviation = rand(0, BEARING_RAND_DEVIATION);

	if (mouseLocation && MOUSE_CONTROL) {
		const mouseBearing = point.getBearing(mouseLocation);
		const finalBearing = (averageBearing + mouseBearing) / 2; 

		point.translateInDir(magnitude, finalBearing + randDeviation);
	} else {
		point.translateInDir(magnitude, averageBearing + randDeviation);
	}

	return point;
}

class Point {
	constructor (x, y, collection) {
		this.x = x;
		this.y = y;
		this.collection = collection;
	}

	translate (x, y) {
		this.x += x;
		this.y += y;
	}

	getBearing (point) {
		let x = point.x - this.x;
		let y = point.y - this.y;

		let theta = Math.atan(x / y);

		if (x > 0 && y > 0) {
			return theta;
		} else if (x < 0 && y > 0) {
			return 2*Math.PI + theta;
		} else {
			return Math.PI + theta;
		}
	}

	translateInDir (dir, bearing) {
		let x = dir * Math.sin(bearing);
		let y = dir * Math.cos(bearing);

		this.translate(x, y);
	}

	getDistance (point) {
		return Math.sqrt(
			(this.x - point.x)**2 +
			(this.y - point.y)**2
		);
	}

	getNNearest (n) {
		let distances = this.collection.map(point => {
			return {
				point,
				distance: point.getDistance(this)
			};
		});

		let sorted = distances.sort((a, b) => {
			return a.distance - b.distance;
		});

		//First will always be 0 (this)
		return sorted.slice(1, n+1).map(i => i.point);
	}
}


let points = [];
for (let i = 0; i < N_POINTS; i++) {
	const point = new Point(
		rand(0, WIDTH), rand(0, HEIGHT), points
	);
	points.push(point);
}

let tick = 0;
function main () {
	tick++;
	
	if (CLEAR_ON_DRAW || tick % (RESET_SECONDS * 1000/TICK_DURATION) === 0) {
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);
	}
	
	let mutatedPoints = [];
	for(const point of points) {
		let mutatedPoint = mutate(point, tick);
		mutatedPoints.push(mutatedPoint);
		
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.arc(mutatedPoint.x, mutatedPoint.y, SIZE, 0, Math.PI*2);
		ctx.fill();
	}

	points = mutatedPoints;
}
setInterval(main, TICK_DURATION);