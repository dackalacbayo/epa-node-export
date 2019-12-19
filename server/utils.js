//dev-epa.info-aid.net/multimedia/photo/1/2/2366_History_1.jpg

https: module.exports = {
	stripUrl: function (str) {
		return str.replace(
			/http(s?):\/\/dev-epa\.info-aid\.net\/index\.php\/Sys_controllers\/articlePage/g,
			''
		);
	},
	stripMM: function (str) {
		return str.replace(
			/http(s?):\/\/dev-epa\.info-aid\.net\/multimedia\/photo\/\d+\/\d+\//g,
			''
		);
	},
	stripMMOld: function (str) {
		return str.replace(
			/http(s?):\/\/dev-epa\.info-aid\.net\/multimedia\/photo_old\/\d+\/\d+\//g,
			''
		);
	},
	stripDETL: function (str) {
		return str.replace(
			/http(s?):\/\/dev-epa\.info-aid\.net\/timeline\/timeline-img\//g,
			''
		);
	},
	stripIAMM: function (str) {
		//return str.replace(/http(s?):\/\/dev-epa\.info-aid\.net\/multimedia\/photo\/\d+\/\d+\//g, "");
		return str.replace(
			/http(s?):\/\/info-aid\.net\/dev-epa\/multimedia\/photo\/\d+\/\d+\//g,
			''
		);
	},
	stripIAMMWWW: function (str) {
		//return str.replace(/http(s?):\/\/dev-epa\.info-aid\.net\/multimedia\/photo\/\d+\/\d+\//g, "");
		return str.replace(
			/http(s?):\/\/www\.info-aid\.net\/dev-epa\/multimedia\/photo\/\d+\/\d+\//g,
			''
		);
	},
	stripInfoAidURL: function (str) {
		return str.replace(
			/http(s?):\/\/www\.info-aid\.net\/dev-epa\/index\.php\/Sys_controllers\/articlePage/g,
			''
		);
	},
	stripMedia: function (str) {
		return str.replace(
			/http(s?):\/\/dev-epa\.info-aid\.net\/multimedia\/photo\/\d+\/\d+\//g,
			''
		);
	},
	getCount: function (type, arr) {
		return arr.reduce((a, b) => {
			if (b.type === type) {
				a++;
			}
			return a;
		}, 0);
	},
	SFInsert: function (arr, contentArr, count, sfType) {
		// mutative be careful
		// highly dependent on count and oldmarkup.length matching
		var i = 0;
		for (let j of arr) {
			if (j['type'] === sfType) {
				while (count > i) {
					//console.log(contentArr[i])
					if (typeof j['value'] === 'string')
						j['value'] = contentArr[i];
					else j['value'].push(contentArr[i]);

					i++;
					break;
				}
			}
		}
	},
};

function compressParagraphs () {
	var holder = [];
	const bar = boo.reduce((a, b, c) => {
		// console.log(holder)
		if (holder.includes(c)) {
			// console.log(c)
			return a;
		}
		// console.log(b.type)
		if (b.type !== 'paragraph') {
			a.push(b);
			// console.log(a)
			return a;
		} else if (b.type === 'paragraph') {
			let i = c + 1;
			while (i < boo.length - 1 && boo[i]['type'] === 'paragraph') {
				b.value += `</br> ${boo[i]['value']}`;
				holder.push(i);
				i++;
			}
			a.push(b);
			return a;
			// }
		} else {
			a.push(b);
			return a;
		}
	}, []);
}
