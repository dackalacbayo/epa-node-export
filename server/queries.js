const Pool = require('pg').Pool;
const _ = require('lodash');
const getUrls = require('get-urls');
const parse = require('node-html-parser').parse;
const fs = require('fs');
const cheerio = require('cheerio');
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
} = require('./utils');

const pool = new Pool({
	user: 'michaeljantzencu',
	host: 'localhost',
	database: 'epa-sept',
	password: '',
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
		`SELECT * FROM epa.tbl_timeline where COALESCE(media_url, '') <> ''`,
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
						'UPDATE epa.tbl_timeline SET shorten_media=$1 where timeline_id = $2 ',
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
	pool.query(
		`SELECT distinct a.timeline_id, a.media_caption, a.media_credit, a.text_headline, a.text_description, a.category, a.start_month, a.start_day, a.start_year, a.end_day, a.end_month, a.end_month, a.category, a.media_url, a.shorten_media, b.wagtail_id FROM epa.tbl_timeline as a
	join epa.tbl_article_photo as b on b.photo = a.shorten_media WHERE a.category = $1`,
		[category],
		(error, results) => {
			if (error) console.log(error);

			//console.log(results.rows)
			var bar = [];
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

				const url = stripMedia(row.media_url).split('.');
				return {
					...row,
					photo_id: row.wagtail_id,
					url: row.timeline_id.toString(),
					article_id: row.timeline_id,
					article_title: row.media_caption,
					category,
					photo_name: url[0],
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

const getArticles = (request, response) => {
	const id = parseInt(request.query.volume);
	const subId = parseInt(request.query.subcat);

	pool.query(
		`SELECT article.article_id, article.subsection_id, article.article_title, article.publish_year, subsec.subsection_id, subsec.subsection_name, subsec.description, vol.volume_id, vol.volume_name, text.text, photo.photo, photo.description as photodesc, photo.orientation, photo.type as phototype, photo.wagtail_id as wagtail_id, video.video, video.type
        FROM epa.tbl_article_title as article
        INNER JOIN epa.tbl_subsection as subsec
            ON  subsec.subsection_id = article.subsection_id
        INNER JOIN epa.tbl_volumes as vol
            ON subsec.volume_id = vol.volume_id
        INNER JOIN epa.tbl_article_text as text
            ON text.article_id = article.article_id
        LEFT OUTER JOIN epa.tbl_article_photo as photo
            ON photo.article_id = article.article_id
        LEFT OUTER JOIN epa.tbl_article_videos as video
            ON video.article_id = article.article_id
		WHERE subsec.volume_id = $1
		AND subsec.subsection_id = $2
		
		
        ORDER BY article.article_id ASC;`,
		[id, subId],
		(error, results) => {
			if (error) {
				throw error;
			}

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
					const $ = cheerio.load(newStr);
					const h2s = $('h2')
						.children()
						.toArray()
						.map(h2 => $(h2).html());
					//console.log($('body').not('.src').children().toArray())
					const photos = value.map(pic => ({
						photo: pic.wagtail_id,
						desc: pic.photodesc,
						// photo: pic.photo,
						// photodesc: pic.photodesc,
						// type: pic.phototype,
						// orientation: pic.orientation,
						// wagtail_id: pic.wagtail_id
					}));

					const boo = $('body')
						.not('.src')
						.children()
						.toArray()
						.reduce((a, b) => {
							const isVideoHolder =
								$(b).is('#video_holder_1') ||
								$(b).is('#video_holder_2') ||
								$(b).is('#video_holder_3');
							const isPhotoHolder =
								$(b).is('#photo_holder_1') ||
								$(b).is('#photo_holder_2') ||
								$(b).is('#photo_holder_3');
							const isCarouselHolder =
								$(b).is('#carousel_holder_1') ||
								$(b).is('#carousel_holder_2') ||
								$(b).is('#carousel_holder_3');
							const isVerse = $(b).is('.verse');
							const isSeeAlso =
								$(b).is('.section') ||
								$(b).text() === 'See also';
							const isSrc =
								$(b).is('.src') || $(b).text() === '&#xA0';
							const isHeading = $(b).is('h2');

							// console.log(b)
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
									value: $(b).html(),
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
							} else if (isSeeAlso) {
								//
							} else if (isSrc) {
								//
							} else {
								// console.log($(b).html())
								if (
									$(b).html() === '&#xA0;' ||
									$(b).text() === 'Sources' ||
									$(b).text() === 'See Also'
								) {
									return a;
								}
								const redFruit = $('<p> </p>');
								const SFObj = {
									type: 'paragraph',
									value: $(b)
										.wrap(redFruit)
										.html(),
								};
								a.push(SFObj);
							}
							// console.log()
							return a;
						}, []);

					const SFphotoCount = getCount('photo_holder', boo);
					const SFh2Count = getCount('heading', boo);

					SFInsert(boo, photos, SFphotoCount, 'photo_holder');
					SFInsert(boo, h2s, SFh2Count, 'heading');
					// console.log(boo)

					// console.log(bar)

					// see also
					//const seeAlso = $('p > strong:contains(See Also)').next().hasClass('section')
					const seeA = $('.section')
						.children()
						.toArray()
						.map(function (i, el) {
							// console.log(i)
							return {
								// type: 'text',
								link: $(i).html(),
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
							// console.log(i)
							return {
								// type: 'text',
								source: $(i).html(),
							};
						});

					const SFsrc = { type: 'sources', value: src };
					// console.log(SFsrc)

					const SFObj = [...boo, { ...SFseeAlso }, { ...SFsrc }];
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
						text,
						article: SFObj,
						// rawText: root.text,
					};
				});
			//console.log(data)
			// console.log(data.length);
			fs.writeFile(
				`./files/${id}-${subId}.json`,
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
};
