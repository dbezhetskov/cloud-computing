// app/index.js

const WebSocket = require('ws');
const wss = new WebSocket(process.argv[2]);

wss.on('open', function() {
	// nothing to do here
});

function Map(col, func, blockSize = 5) {
	let nblocks = (Math.floor(col.length / blockSize) + (col.length % blockSize == 0 ? 0 : 1));
	for (let i = 0; i < nblocks; ++i) {
		let size = col.length - (i + 1) * blockSize > 0 ? blockSize : col.length - i * blockSize;

		let arguments = col.slice().splice(i * blockSize, size);
		arguments = arguments.join('\n');

		let functionText = "function map_iter(a)"
			+ "{ for (let i = " + i * blockSize + "; i < " + (i * blockSize + size) + "; ++i) {"
			+ "(" + func.toString() + ")(a); }}";

		let message = JSON.stringify({
			functionText : functionText,
			functionArgumentsText : arguments
		});
		wss.send(message);
	}
}

function isNumeric(sym) {
    return sym == "0" 
    || sym == "1"
    || sym == "2"
    || sym == "3"
    || sym == "4"
    || sym == "5"
    || sym == "6"
    || sym == "7"
    || sym == "8"
    || sym == "9";
}

function ParseArguments(functionArguments) {
	functionArguments = functionArguments.split('\n');
	console.log(functionArguments);
	functionArguments = functionArguments.map((x) => {
		x = x.trim();
		if (x[0] == "{") {
			return JSON.parse(x);
		} else if (x[0] == "[") {
			return str = x.slice(1, x.length - 1)
			.split(',')
			.map((x) => { return parseInt(x, 10); });
		} else if (isNumeric(x[0])) {
			return parseInt(x);
		}
		return x;
	});
	return functionArguments;
}

wss.on('message', function(data, flags) {
	let obj = null;
	try {
		obj = JSON.parse(data);
	} catch (e) {
		console.log(e);
	}

	let functionText = obj['functionText'];
	let functionArguments = ParseArguments(obj['functionArgumentsText']);

	let fn = eval("() => { return " + functionText + ";}")();
	let packagedFn = (...args) => fn(...functionArguments);

	console.log("Run:", functionText, "Arguments:", functionArguments);

	packagedFn();
});
