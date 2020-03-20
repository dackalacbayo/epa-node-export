const Pool = require('pg').Pool;
const _ = require('lodash');
const getUrls = require('get-urls');
const parse = require('node-html-parser').parse;
const fs = require('fs');
const cheerio = require('cheerio');
const categObj = require('./categ');
const volumeObj = require('./volumecateg');
const {
	stripIAMMWWW,
	stripMMOld,
	stripDETL,
	stripIAMM,
	stripMM,
	stripUrl,
	stripInfoAidURL,
	stripMedia,
	getCount,
	SFInsert,
	SFInsertPhotoHolder,
	SFInsertPhotoCarousel,
} = require('./utils');

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'epa',
	password: '0123',
	port: 5432,
});

const getVolumes = (request, response) => {
	pool.query('SELECT * FROM epa.tbl_volumes', (error, results) => {
		if (error) {
			throw error;
		}
		response.status(200).json(results.rows);
	});
};

const updateShortMedia = (request, response) => {
	pool.query(
		`SELECT * FROM epa.public.tbl_timeline_literature where COALESCE(media_url, '') <> ''`,
		(error, results) => {
			if (error) {
				throw error;
			}
			results.rows
				.map(row => {
					const url = stripIAMMWWW(
						stripMMOld(stripDETL(stripIAMM(stripMM(row.media_url))))
					).split('.jpg');
					return {
						url: url[0],
						timeline_id: row.timeline_id,
					};
				})
				.forEach(obj => {
					console.log(obj);
					pool.query(
						'UPDATE epa.public.tbl_timeline_literature SET shorte 	n_media=$1 where timeline_id = $2 ',
						[obj.url, obj.timeline_id],
						(err, data) => {
							if (err) console.log(err);

							console.log(data);
						}
					);
				});
		}
	);
};

const getTimeline = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		`SELECT distinct a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description, a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, a.display_name, b.wagtail_id FROM epa.public.tbl_timeline_literature as a
		join epa.public.tbl_article_photo as b on b.photo = a.shorten_media WHERE a.category = $1`,
		//'SELECT distinct a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description, a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_year, a.category, a.media_url, a.shorten_media, a.display_name FROM epa.public.tbl_timeline_literature as a WHERE a.category = $1 ',
		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					photo_id: row.wagtail_id,
					//photo_id: row.timeline_id,
					url: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					category,
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});
			fs.writeFile(
				`./files/timeline/${category}.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineWithImages = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		`SELECT distinct on (a.timeline_id) c.id, a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description,
		a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, a.display_name
		FROM epa.public.tbl_timeline_literature as a
		join dblink('dbname=ccp port=5432 host=localhost user=postgres password=0123', 'Select title, id from wagtailimages_image')
		as c(title char(255), id int) on c.title = a.shorten_media WHERE a.category =  $1 and timeline_id is not null`,

		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			console.log('rows.rowslength', results.rows.length);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				// console.log('roelength', results.rows.length);
				return {
					...row,
					photo_id: row.id,
					//photo_id: row.timeline_id,
					url: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					// category,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-COMPLETE.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineIsNull = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		// `select timeline_id, media_caption, show_caption, media_credit, show_credit, text_headline, article_title, text_description, category,
		// start_month, start_day, start_year, end_month, end_day, end_year,
		// media_url, shorten_media, display_name
		// from epa.public.tbl_timeline_literature
		// where timeline_id is null AND category =  $1`,

		`select timeline_id, media_caption, show_caption, media_credit, show_credit, text_headline, article_title, text_description, category,
		start_month, start_day, start_year, end_month, end_day, end_year,
		media_url, shorten_media, display_name
		from epa.public.tbl_timeline_literature
		where media_url is null and shorten_media is null and timeline_id is not null
		and category =  $1`,

		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					// 	photo_id: row.id,
					// photo_id: row.timeline_id,
					photo_id: null,
					url:
						row.timeline_id == null
							? ''
							: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					// category,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-ISNull.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineWithShortenNoURLWithWGTImage = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		`SELECT distinct on (a.timeline_id) c.id, a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description,
		a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, a.display_name
		FROM epa.public.tbl_timeline_literature as a
		join dblink('dbname=ccp port=5432 host=localhost user=postgres password=0123', 'Select title, id from wagtailimages_image')
		as c(title char(255), id int) on c.title = a.shorten_media
		where shorten_media is NOT null and media_url IS null and timeline_id is not null
		and a.category = $1`,
		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					photo_id: row.id,
					// photo_id: row.timeline_id,
					url:
						row.timeline_id == null
							? ''
							: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-WithShortenNoURLWithWTGImages.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineWithShortenNoURLWithNoWGTImage = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		`SELECT distinct on (a.timeline_id) c.id, a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description,
		a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, a.display_name
		FROM epa.public.tbl_timeline_literature as a
		join dblink('dbname=ccp port=5432 host=localhost user=postgres password=0123', 'Select title, id from wagtailimages_image')
		as c(title char(255), id int) on c.title != a.shorten_media where a.shorten_media is NOT null and a.media_url IS null
		and a.timeline_id is not null
		and a.category = $1`,
		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					// photo_id: row.id,
					photo_id: null,
					// photo_id: row.timeline_id,
					url:
						row.timeline_id == null
							? ''
							: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-WithShortenNoURLWithNoWTGImages.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineMissingEntry = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		`SELECT a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description,
		a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, a.display_name
		FROM epa.public.tbl_timeline_literature as a where a.media_url is not null and timeline_id is not null
		except
		SELECT distinct on (a.timeline_id) a.timeline_id, a.media_caption, a.show_caption, a.media_credit, a.show_credit, a.text_headline, a.article_title, a.text_description,
		a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, a.display_name
		FROM epa.public.tbl_timeline_literature as a
		join dblink('dbname=ccp port=5432 host=localhost user=postgres password=0123', 'Select title, id from wagtailimages_image')
		as c(title char(255), id int) on a.shorten_media = c.title where category =  $1`,

		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					// 	photo_id: row.id,
					// photo_id: row.timeline_id,
					photo_id: null,
					url:
						row.timeline_id == null
							? ''
							: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					// category,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-MissingEntry.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineWithNoId = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		`select timeline_id, media_caption, show_caption, media_credit, show_credit, text_headline, article_title, text_description, category,
		start_month, start_day, start_year, end_month, end_day, end_year,
		media_url, shorten_media, display_name from epa.public.tbl_timeline_literature where timeline_id is null and category =  $1`,

		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					// 	photo_id: row.id,
					// photo_id: row.timeline_id,
					photo_id: null,
					url:
						row.timeline_id == null
							? ''
							: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					// category,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-NoTimelineId.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getTimelineWithShortenNoURL = (request, response) => {
	const category = request.query.category;
	console.log('$1', category);
	pool.query(
		// `select timeline_id, media_caption, show_caption, media_credit, show_credit, text_headline, article_title, text_description, category,
		// start_month, start_day, start_year, end_month, end_day, end_year,
		// media_url, shorten_media, display_name from epa.public.tbl_timeline_literature where timeline_id is null and category =  $1`,

		`select timeline_id, media_caption, show_caption, media_credit, show_credit, text_headline, article_title, text_description, category,
			start_month, start_day, start_year, end_month, end_day, end_year,
			media_url, shorten_media, display_name
			from epa.public.tbl_timeline_literature
			where shorten_media is NOT null and media_url IS null and timeline_id is not null
			and category = $1`,

		[category],
		(error, results) => {
			if (error) console.log(error);

			console.log('rows', results);
			console.log('rows.rows', results.rows);
			var bar = [];

			console.log('rows.rows123');
			const rows = results.rows.map(row => {
				const startDate = {
					type: 'start_date',
					value: {
						month: row.start_month,
						day: row.start_day,
						year: row.start_year
							? parseInt(row.start_year)
							: parseInt(row.start_year_char),
					},
				};

				console.log('startDate', startDate);

				const endDate = {
					type: 'end_date',
					value: {
						month: row.end_month,
						day: row.end_day,
						year: row.end_year
							? parseInt(row.end_year)
							: parseInt(row.end_year_char),
					},
				};

				console.log('endDate', endDate);
				console.log('row.media_url', row.media_url);

				//const url = stripMedia(row.media_url).split('.');
				// console.log("url", url)
				return {
					...row,
					// 	photo_id: row.id,
					photo_id: row.timeline_id,
					url:
						row.timeline_id == null
							? ''
							: row.timeline_id.toString(),
					article_id: row.timeline_id,
					//article_title: row.text_description,
					category: categObj[category],
					// photo_name: url[0],
					photo_name: row.shorten_media,
					dates: [startDate, endDate],
				};
			});

			var arr = [
				{
					rowLength: rows.length,
					list: rows,
				},
			];
			console.log('rowLength', rows.length);
			fs.writeFile(
				`./files/timeline/${category}-WithShortenNoURL.json`,
				JSON.stringify(rows),
				function (err) {
					if (err) console.log(err);
					response.status(200).json(rows);
				}
			);
		}
	);
};

const getArticles = (request, response) => {
	const id = parseInt(request.query.volume);
	const subId = parseInt(request.query.subcat);

	pool.query(
		`SELECT article.article_id, article.subsection_id, article.article_title, article.publish_year, subsec.subsection_id, subsec.subsection_name, subsec.description, vol.volume_id, vol.volume_name, text.text, photo.photo, photo.description as photodesc, photo.orientation, photo.type as phototype, photo.wagtail_id as wagtail_id, video.video, video.type
        FROM epa.public.tbl_article_title as article
        INNER JOIN epa.public.tbl_subsection as subsec
            ON  subsec.subsection_id = article.subsection_id
        INNER JOIN epa.public.tbl_volumes as vol
            ON subsec.volume_id = vol.volume_id
        INNER JOIN epa.public.tbl_article_text as text
            ON text.article_id = article.article_id
        LEFT OUTER JOIN epa.public.tbl_article_photo as photo
            ON photo.article_id = article.article_id
        LEFT OUTER JOIN epa.public.tbl_article_videos as video
            ON video.article_id = article.article_id
		WHERE subsec.volume_id = $1
		AND subsec.subsection_id = $2


        ORDER BY article.article_id ASC;`,
		[id, subId],
		(error, results) => {
			if (error) {
				throw error;
			}

			// console.log('resulllts', results.rows);
			const data = _(results.rows)
				.groupBy(x => x.article_id)
				.map((value, key) => {
					const {
						article_title,
						publish_year,
						description,
						volume_name,
						subsection_name,
						text,
						volume_id,
						subsection_id,
					} = value[0];

					var newStr = stripInfoAidURL(stripUrl(text));
					const $ = cheerio.load(newStr, {
						normalizeWhitespace: true,
					});

					//console.log('newStr', newStr);

					const h2s = $('h2')
						// .children()
						.toArray()
						.map(function (h2) {
							//console.log('h1ssplitHTML123---', $(h2).html());
							var x = "<a id='hello'> hi </a>";
							//console.log('h2---', $(h2).html());
							var y = $(h2)
								.html()
								.split('id=');
							var o = y[1] == undefined ? '' : y[1].split('');
							var arr = o == '' ? [] : o;
							arr.splice(1, 0, '#');
							var str = arr.join('');
							var z = `${y[0]}href=${str}`;
							//console.log('z', z);

							var remove1 = z.split('<strong>');
							var removeJoin1 = remove1.join('');
							var remove2 = removeJoin1.split('</strong>');
							var removeJoin2 = remove2.join('');

							var splitX = removeJoin2.split('</a>');
							var splitXJoin = splitX.join('');
							var splitXJoin2 = splitXJoin.split();
							var splitY = splitXJoin2 + '</a>';
							return splitY;
						});

					// console.log('samp123---', h2s);

					const h2sOld = $('h2')
						.children()
						.toArray()
						.map(h2 => {
							var split = $(h2)
								.html()
								.split('</a>');
							// console.log('h1ssplitHTML', $(h2).html());
							// console.log('h1ssplit', split);
							return split.join('') + '</a>';
						});
					// console.log('h1s', h2s);

					//console.log($('body').not('.src').children().toArray())

					// const photos = value.map(pic => {
					// 	console.log('photodesc', pic.photodesc);
					// 	console.log(
					// 		'photodes1c',
					// 		pic.photodesc == null
					// 			? null
					// 			: pic.photodesc.replace(
					// 					/<br\s*\/?>/gi,
					// 					'<br />'
					// 			  )
					// 	);
					// });

					const photos = value.map(pic => ({
						photo: pic.wagtail_id,
						desc:
							pic.photodesc == null
								? null
								: pic.photodesc.replace(
										/<br\s*\/?>/gi,
										'<br />'
								  ),
						// photo: pic.photo,
						// photodesc: pic.photodesc,
						// type: pic.phototype,
						// orientation: pic.orientation,
						// wagtail_id: pic.wagtail_id
					}));

					let author = $('.icon-epa-sun')
						.nextAll()
						.html();

					const boo = $('body')
						.not('.src')
						.children()
						.toArray()
						.reduce((a, b) => {
							// console.log('aaaa', a);
							const isVideoHolder =
								$(b).is('#video_holder_1') ||
								$(b).is('#video_holder_2') ||
								$(b).is('#video_holder_3') ||
								$(b).is('#video_holder_4') ||
								$(b).is('#video_holder_5') ||
								$(b).is('#video_holder_6') ||
								$(b).is('#video_holder_7') ||
								$(b).is('#video_holder_8') ||
								$(b).is('#video_holder_9');
							const isPhotoHolder =
								$(b).is('#photo_holder_1') ||
								$(b).is('#photo_holder_2') ||
								$(b).is('#photo_holder_3') ||
								$(b).is('#photo_holder_4') ||
								$(b).is('#photo_holder_5') ||
								$(b).is('#photo_holder_6') ||
								$(b).is('#photo_holder_7') ||
								$(b).is('#photo_holder_8') ||
								$(b).is('#photo_holder_9');
							const isCarouselHolder =
								$(b).is('#carousel_holder_1') ||
								$(b).is('#carousel_holder_2') ||
								$(b).is('#carousel_holder_3') ||
								$(b).is('#carousel_holder_4') ||
								$(b).is('#carousel_holder_5') ||
								$(b).is('#carousel_holder_6') ||
								$(b).is('#carousel_holder_7') ||
								$(b).is('#carousel_holder_8') ||
								$(b).is('#carousel_holder_9');
							const isVerse = $(b).is('.verse');
							const author = $('.icon-epa-sun')
								.nextAll()
								.html();
							$('.icon-epa-sun')
								.nextAll()
								.remove();
							const isSeeAlso =
								$(b).is('.section') ||
								$(b).text() === 'See also';
							const isSrc =
								$(b).is('.src') || $(b).text() === '&#xA0';
							const isHeading = $(b).is('h2');

							//console.log('headingx', isHeading);
							if (isVideoHolder) {
								const SFObj = {
									type: 'video_holder',
									value: [],
								};
								a.push(SFObj);
							} else if (isPhotoHolder) {
								const SFObj = {
									type: 'photo_holder',
									value: [],
								};
								a.push(SFObj);
							} else if (isVerse) {
								const SFObj = {
									type: 'verse',
									value: $(b)
										.html()
										.replace(/<br\s*\/?>/gi, '<br />'),
								};
								a.push(SFObj);
							} else if (isCarouselHolder) {
								// will duplicate carousels if there is more than one #carousel_holder
								const SFObj = {
									type: 'carousel',
									value: photos,
								};
								a.push(SFObj);
							} else if (isHeading) {
								const SFObj = { type: 'heading', value: '' };
								a.push(SFObj);
							} else if (author !== null) {
								// const SFObj = { type: 'author', value: author };
								// console.log(SFObj);
								// a.push(SFObj);
							} else if (isSeeAlso) {
								//
							} else if (isSrc) {
								//
							} else {
								$('.icon-epa-sun')
									.removeClass()
									.html();
								if (
									$(b).html() === '&#xA0;' ||
									$(b).text() === 'Sources' ||
									$(b).text() === 'See Also'
								) {
									return a;
								}
								const redFruit = $('<p> </p>');
								// const author = $('.icon-epa-sun').nextAll();
								//console.log('html--', $(b).html());

								const splitLi = $(b)
									.html()
									.split('<li>');
								//console.log('html--', splitLi);
								const joinLi = splitLi.join('');
								//console.log('htmljoinLi--', joinLi);
								const splitEndLi = joinLi.split('</li>');
								//console.log('splitEndLi--', splitEndLi);
								const joinEndLi = splitEndLi.join('');
								//console.log('joinEndLi--', joinEndLi);

								const SFObj = {
									type: 'paragraph',
									// value: $(b)
									// 	.wrap(redFruit)
									// 	.html(),
									value: joinEndLi.replace(
										/<br\s*\/?>/gi,
										'<br />'
									),
								};
								a.push(SFObj);
							}
							// console.log()
							return a;
						}, []);

					const SFphotoCount = getCount('photo_holder', boo);
					const SFCarouselCount = getCount('carousel', boo);
					//console.log('SFphotoCount', SFphotoCount);
					const SFh2Count = getCount('heading', boo);
					console.log('photos', photos);
					console.log('photoslength', photos.length);
					SFInsertPhotoHolder(
						boo,
						photos,
						SFphotoCount,
						'photo_holder'
					);
					SFInsertPhotoCarousel(
						boo,
						photos,
						SFCarouselCount,
						'carousel'
					);
					SFInsert(boo, h2s, SFh2Count, 'heading');

					// console.log('boo', boo);
					// console.log(
					// 	'SFInsert',
					// 	SFInsert(boo, h2s, SFh2Count, 'heading')
					// );
					// console.log(bar);

					// see also
					//const seeAlso = $('p > strong:contains(See Also)').next().hasClass('section')
					// const author = $('.icon-epa-sun')
					// 	.children()
					// 	.toArray()
					// 	.map(function(i, el) {
					// 		// console.log(i)
					// 		return {
					// 			// type: 'text',
					// 			link: $(i).html(),
					// 		};
					// 	});
					//const author = $('.icon-epa-sun').nextAll();
					// console.log('auuthor', author);
					// const Author = {
					// 	type: 'author',
					// 	value: author.html(),
					// };

					//console.log('satuthott', author);
					const Author = {
						type: 'author',
						value: author,
					};

					const seeA = $('.section')
						.children()
						.toArray()
						.map(function (i, el) {
							// console.log('seeeeeeeeeeeeeeeeee', i);
							// console.log(i)
							return {
								// type: 'text',
								link: $(i)
									.html()
									.replace(/<br\s*\/?>/gi, '<br />'),
							};
						});
					const SFseeAlso = {
						type: 'see_also',
						value: seeA,
					};
					//console.log(SFseeAlso)
					// sources
					const src = $('.src')
						.children()
						.toArray()
						.map(function (i, el) {
							// console.log('i--------', $(i).html());
							return {
								// type: 'text',
								source: $(i)
									.html()
									.replace(/<br\s*\/?>/gi, '<br />'),
							};
						});

					console.log('src', src);
					//const replaceBr = src.replace(/<br\s*\/?>/gi, '<br />');

					const SFsrc = { type: 'sources', value: src };
					// console.log(SFsrc)

					const SFObj = [
						...boo,
						{ ...Author },
						{ ...SFseeAlso },
						{ ...SFsrc },
					];
					// console.log(SFObj)

					//console.log(photos)
					const vids = _.filter(value, v => v.video !== null).map(
						vid => ({
							video: vid.video,
							type: vid.type,
						})
					);

					const url = `${volume_id}/${subsection_id}/${key}`;
					const links = getUrls(text);
					//console.log(text)

					return {
						article_id: key,
						url,
						article_title,
						publish_year,
						description,
						volume_name,
						subsection_name,
						photos,
						vids,
						// internalLinks: [...links],
						text: text.replace(/<br\s*\/?>/gi, '<br />'),
						category: volumeObj[volume_name],
						article: SFObj,
						// rawText: root.text,
					};
				});
			//console.log(data)
			// console.log(data.length);
			fs.writeFile(
				`./files/0320articles/${id}-${subId}.json`,
				JSON.stringify(data),
				function (err) {
					if (err) console.log(err);
					response.status(200).json('ok');
				}
			);
		}
	);
};

module.exports = {
	getVolumes,
	getArticles,
	getTimeline,
	updateShortMedia,
	getTimelineWithImages,
	getTimelineIsNull,
	getTimelineMissingEntry,
	getTimelineWithNoId,
	getTimelineWithShortenNoURL,
	getTimelineWithShortenNoURLWithWGTImage,
	getTimelineWithShortenNoURLWithNoWGTImage,
};
