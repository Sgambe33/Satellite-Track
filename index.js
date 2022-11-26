const express = require(`express`);
const http = require(`http`);
const path = require("path");
const { getLatLngObj } = require("tle.js");

const SETTINGS = {
	port: 80,
	host: `0.0.0.0`

};

const app = express();

app.use(express.static(path.join(__dirname, `src`)));

app.use('/leaflet', express.static(`./node_modules/leaflet/dist`));
app.use('/leaflet-easybutton', express.static(`./node_modules/leaflet-easybutton/src/`));
app.use('/tle', express.static(`./node_modules/tle.js/dist`));


app.use(`/get-tle`, (req, res) => {
	try {
		const { tle, timestamp } = req.body;
		return res.status(200).json(getLatLngObj(tle, timestamp));

	} catch (error) {
		return res.status(400).json({
			message: `Invalid TLE`
		});
	}
});



const http_server = http.createServer(app);

http_server.listen(SETTINGS.port, SETTINGS.host, () => {
	console.log(`Server on at http://localhost:${SETTINGS.port}`);
});