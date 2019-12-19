const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./queries');
const port = 3000;

app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.get('/', (request, response) => {
	response.json({ info: 'Node.js, Express, and Postgres API' });
});

app.get('/volumes', db.getVolumes);
app.get('/articles', db.getArticles);
app.get('/timeline', db.getTimeline);
app.put('/shortenurl', db.updateShortMedia);

app.listen(port, () => {
	console.log(`App running on port ${port}.`);
});
