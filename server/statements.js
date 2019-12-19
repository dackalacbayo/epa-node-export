const getArticles = `SELECT article.article_id, article.subsection_id, article.article_title, article.publish_year, subsec.subsection_id, subsec.subsection_name, subsec.description, vol.volume_id, vol.volume_name, text.text, photo.photo, photo.description as photodesc, photo.orientation, photo.type as phototype, video.video, video.type
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
WHERE subsec.volume_id = 6
ORDER BY article.article_id ASC;`;

module.exports = {
	getAllArticles: getArticles,
};
