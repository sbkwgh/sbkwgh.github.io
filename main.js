//Settings
const settings = {
	height: 500,
	width: 1000,
	n_points: 100,
	size: 0.5,
	translate_dist: 2,
	bearing_rand_deviation: degToRad(180),
	sin_half_period: 5,
	tick_duration: 10,
	clear_on_draw: false,
	reset_seconds: 5,
	mouse_control: false,

	_mouseLocation: null
};

//Event handlers
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

$('body').addEventListener('mousemove', function (e) {
	settings._mouseLocation = new Point(e.pageX, e.pageY, []);
});
$('#settings').addEventListener('click', function () {
	const settingsNames = [
		'size',
		'n_points',
		'bearing_rand_deviation',
		'sin_half_period',
		'clear_on_draw',
		'reset_seconds',
		'mouse_control'
	];
	for (key of settingsNames) {
		let val = settings[key];
		let $input = $(`input[name=${key}]`);

		if (typeof val === 'boolean') {
			$input.checked = val;
		} else if (key === 'bearing_rand_deviation') {
			$input.value = radToDeg(val);
		} else {
			$input.value = val;
		}
	}

	$('#modal_container').classList.toggle('hidden');
});
$('#modal_container').addEventListener('click', function (e) {
	if (e.target === this) {
		this.classList.toggle('hidden');
	}
});
$('form').addEventListener('submit', function (e) {
	e.preventDefault();

	const $inputs = $$('form input');
	for (let $input of $inputs) {
		const name = $input.name;
		const value = +$input.value;
		
		if($input.type === 'checkbox') {
			settings[name] = $input.checked;
		} else if (name === 'bearing_rand_deviation') {
			settings[name] = degToRad(value);
		} else {
			settings[name] = value;
		}

		if (name === 'n_points') {
			createPoints();
		}
	}
	
	clearCanvas();
	
	$('#modal_container').classList.toggle('hidden');
});
$('#reset').addEventListener('click', function () {
	location.href = location.href;
});

//Utility functions
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
function radToDeg (rad) {
	return 180 * rad/Math.PI;
}

//Point mutation function
function mutate (_point, tick) {
	const point = new Point(
		_point.x,
		_point.y,
		_point.collection
	);

	const nearest = point.getNNearest(settings.n_points).map(p => [p.x, p.y]);
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

	const magnitude =
		settings.translate_dist *
		Math.sin((tick*Math.PI) /(1000/settings.tick_duration*settings.sin_half_period));
	const randDeviation = rand(0, settings.bearing_rand_deviation);

	if (settings._mouseLocation && settings.mouse_control) {
		const mouseBearing = point.getBearing(settings._mouseLocation);
		const finalBearing = (averageBearing + mouseBearing) / 2; 

		point.translateInDir(magnitude, finalBearing + randDeviation);
	} else {
		point.translateInDir(magnitude, averageBearing + randDeviation);
	}

	return point;
}

//Class definitions
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

//Main
const $canvas = $('canvas');
$canvas.setAttribute('height', settings.height);
$canvas.setAttribute('width', settings.width);

const ctx = $canvas.getContext('2d');
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, settings.width, settings.height);

function clearCanvas () {
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, settings.width, settings.height);
}

let points;
function createPoints () {
	points = [];

	for (let i = 0; i < settings.n_points; i++) {
		const point = new Point(
			rand(0, settings.width), rand(0, settings.height), points
		);
		points.push(point);
	}
}

let tick = 0;
function main () {
	tick++;
	
	if (
		settings.clear_on_draw ||
		tick % (settings.reset_seconds * 1000/settings.tick_duration) === 0
	) {
		clearCanvas();
	}
	
	let mutatedPoints = [];
	for(const point of points) {
		let mutatedPoint = mutate(point, tick);
		mutatedPoints.push(mutatedPoint);
		
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.arc(mutatedPoint.x, mutatedPoint.y, settings.size, 0, Math.PI*2);
		ctx.fill();
	}

	points = mutatedPoints;
}

createPoints();
setInterval(main, settings.tick_duration);