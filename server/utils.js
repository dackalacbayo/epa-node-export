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
		console.log('strr', str);
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
	chunkArray: function (myArray, chunk_size) {
		var index = 0;
		var arrayLength = myArray.length;
		var tempArray = [];
		//var samp = [];
		for (index = 0; index < arrayLength; index += chunk_size) {
			//console.log("indexx", index)
			myChunk = myArray.slice(index, index + chunk_size);
			// Do something if you want with the group
			//console.log("myChunk", myChunk)
			tempArray.push(myChunk);
		}
		var lastArr = tempArray[tempArray.length - 2].concat(
			tempArray[tempArray.length - 1]
		);
		//console.log('lastArr',lastArr)

		var samp = tempArray.map((item, index) => {
			if (index == chunk_size - 1) {
				//item = lastArr
				tempArray[index] = lastArr;
			}
		});
		//console.log("tempArraytempArray1", tempArray)

		return tempArray;
	},
	SFInsert: function (arr, contentArr, count, sfType) {
		// console.log('arr--', arr);
		// console.log('contentArr--', contentArr);
		// console.log('count--', count);
		// console.log('sfType--', sfType);
		// mutative be careful
		// highly dependent on count and oldmarkup.length matching
		var i = 0;
		for (let j of arr) {
			if (j['type'] === sfType) {
				//console.log('array j', j);
				while (count > i) {
					if (typeof j['value'] === 'string') {
						j['value'] =
							contentArr[i] == undefined ? '' : contentArr[i];
					} else if (contentArr.length === 0) {
						j['value'] = '';
						// console.log('contentArr.length === 0', j);
					} else j['value'].push(contentArr);

					i++;
					break;
				}
			}
		}

		return arr;
	},
	SFInsertPhotoHolder: function (arr, contentArr, count, sfType) {
		// mutative be careful
		// highly dependent on count and oldmarkup.length matching
		var i = 0;
		for (let j of arr) {
			if (j['type'] === sfType) {
				console.log('array j', j);
				while (count > i) {
					if (typeof j['value'] === 'string') {
						console.log('ifff');
						j['value'] =
							contentArr[i] == undefined ? '' : contentArr[i];
					} else if (contentArr.length === 0) {
						console.log('elseifff');
						j['value'] = '';
						// console.log('contentArr.length === 0', j);
					} else if (contentArr[0].photo == null) {
						//console.log('elseifnull')
						//console.log('elseifnullcontentArr',contentArr)
						j['value'] = contentArr;
					} else j['value'].push(contentArr[i]);

					i++;
					break;
				}
			}
		}

		return arr;
	},
	SFInsertPhotoCarousel: function (arr, contentArr, count, sfType) {
		// mutative be careful
		// highly dependent on count and oldmarkup.length matching
		var i = 0;
		for (let j of arr) {
			if (j['type'] === sfType) {
				//console.log('array j', j);
				//console.log('contentArr--', contentArr.length);
				while (count > i) {
					if (typeof j['value'] === 'string') {
						j['value'] =
							contentArr[i] == undefined ? '' : contentArr[i];
					} else if (contentArr.length === 0) {
						j['value'] = '';
					} else if (contentArr[0].photo == null) {
						j['value'] = contentArr;
					} else {
						var samp = chunkArray(contentArr, count);
						//console.log('resulttt', samp);
						j['value'] = samp[i];
					}

					i++;
					break;
				}
			}
		}

		return arr;
	},
};

function chunkArray (myArray, chunk_size) {
	var index = 0;
	var arrayLength = myArray.length;
	var tempArray = [];
	//var samp = [];
	for (index = 0; index < arrayLength; index += chunk_size) {
		myChunk = myArray.slice(index, index + chunk_size);
		// Do something if you want with the group
		tempArray.push(myChunk);
	}
	var lastArr = tempArray[tempArray.length - 2].concat(
		tempArray[tempArray.length - 1]
	);
	//console.log('lastArr',lastArr)

	var samp = tempArray.map((item, index) => {
		if (index == chunk_size - 1) {
			//item = lastArr
			tempArray[index] = lastArr;
		}
	});

	return tempArray;
}

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
