var async = require('async');
var axios = require('axios');
var volume = 2;
var subcat = [3, 4, 5, 6, 7, 8, 9, 10, 11];
async.forEachOf(
	subcat,
	(value, key, callback) => {
		const url = `http://localhost:4202/articles?volume=${volume}&subcat=${value}`;
		axios
			.get(url)
			.then(res => {
				console.log(res);
				callback();
			})
			.catch(err => {
				console.log(err);
			});
	},
	err => {
		if (err) console.error(err.message);
		// configs is now a map of JSON data
		doSomethingWith(configs);
	}
);
