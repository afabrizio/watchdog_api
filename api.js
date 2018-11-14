const http = require('http');
const pug = require('pug');
const url = require('url');

const HOSTNAME = '127.0.0.1';
const PORT = 3000;

const compiledPugFunctions = {
	'not_found': pug.compileFile('views/404.content.pug'),
};

const bodyParser = (req) => {
	return new Promise( (resolve, reject) => {
		try {
			let data = [];
			switch (req.headers['content-type']) {
				case 'application/json':
				case 'application/json; charset=utf-8;':
					req.on('data', (chunk) => data += chunk );
					req.on('end', () => {
						const body = JSON.parse(
							data.toString('utf8')
						);
						return resolve(body);
					} );
					break;
				default:
					return resolve({});
			}
		} catch (e) {
			return reject(e);
		}
	} );
};

const urlParser = (req) => {
	try {
		const { protocol, url:urlStr } = req;
		const { pathname, query, hash } = url.parse(urlStr, true);
		req.pathname = pathname;
		req.query = query;
		req.hash = hash;
	} catch (e) {
		console.log(e)
	} finally {
		return req;
	}
};

const server = http.createServer( async (req, res) => {
	if (req.method === 'OPTIONS') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		return res.end('ok');
	} else if (req.method !== 'GET') {
		try {
			req.body = await bodyParser(req);
		} catch (e) {
			req.body = {};
		}
	}
	urlParser(req);
	const { body = {}, method, pathname, query } = req;
	switch (pathname) {
		case '/heartbeat':
			switch (method) {
				case 'GET':
					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/plain');
					res.end('beat\n');
					return;
			}
		case '/regurgitate':
			switch (method) {
				case 'POST':
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(body))
					return;
			}
		default:
			res.statusCode = 404;
			res.setHeader('Content-Type', 'application/html');
			const { not_found } = compiledPugFunctions;
			const html = not_found({
				title: 'WatchDog',
				statusCode: 404,
				message: 'Not Found'
			});
			res.writeHead(404, { 'Content-Type': 'text/html' });
			res.write(html);
			return res.end();
	}
} );

server.listen(
	PORT,
	HOSTNAME,
	() => console.log(`Server running at http://${HOSTNAME}:${PORT}`)
);
