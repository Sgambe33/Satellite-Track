const express = require(`express`);
const http = require(`http`);
const path = require('path');


const SETTINGS = {
	port: 3000,
	host: `0.0.0.0`
};

const app = express();

const fs = require(`fs`);
const cors = require(`cors`);

var module_files = fs.readdirSync(path.resolve(__dirname, `routes`), {
    withFileTypes: true,
});
module_files.forEach((file) => {
    if (!file.name.endsWith(`.js`)) {
        return;
    }
    let handler_file = require(path.join(__dirname, `routes`, file.name).replace(`.js`, ``));
    let route = handler_file.base_route;
	console.log(handler_file)
    let handler = handler_file.handler();

    app.use(`/api${route}`, cors(), handler);
});

app.use(express.static(path.join(__dirname, `public`)));

app.use('/leaflet', express.static(`./node_modules/leaflet/dist`));
app.use('/leaflet-easybutton', express.static(`./node_modules/leaflet-easybutton/src/`));
app.use('/tle', express.static(`./node_modules/tle.js/dist`));
app.use('/leaflet-dialog', express.static(`./node_modules/leaflet-dialog`))

app.use(`/get-tle`, (req, res) => {
	try {
		//const { tle, timestamp } = req.body;
		return res.status(200);

	} catch (error) {
		console.log(error)
		return res.status(400).json({
			message: `Invalid TLE`
		});
	}
});

const http_server = http.createServer(app);

http_server.listen(SETTINGS.port, SETTINGS.host, () => {
	console.log(`Server on at http://localhost:${SETTINGS.port}`);
});
