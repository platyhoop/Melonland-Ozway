const settings = require('./settings.json');
// This Script Generates the Melonking.Net RSS newsfeed.
const fs = require('fs');
const got = require('got');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let rss = {};
rss.newsURL = 'https://melonking.net/home.html';
rss.cache = {"articles" : []};

// Load the saved cache file
fs.readFile(settings.rssPath, (err, data) => {
	if(err) { console.log(err); return; }
	rss.cache = JSON.parse(data);
});

function getNewsArticles()
{	
	got(rss.newsURL).then(response => 
	{
		let newArticles = [];
		const dom = new JSDOM(response.body);
		const news = dom.window.document.getElementById('newsblock').querySelectorAll('div.artcile');
		
		for( let i=0 ; i<news.length ; i++ )
		{
			let newsEntry = news[i];
			let article = {};
			article.title = newsEntry.querySelector('h1').textContent;
			article.uri = 'https://melonking.net/home.html#'+newsEntry.id;
			article.link = article.uri;
			article.description = newsEntry.querySelector('p').textContent;
			
			//Extra Link setter
			let link = newsEntry.querySelector('a');
			if( link != undefined )
			{
				article.link = 'https://melonking.net/'+link.getAttribute('href');
			}
			
			newArticles.push(article);
		}
		
		rss.cache.articles = newArticles;
		fs.writeFile(settings.rssPath, JSON.stringify(rss.cache), function (err) {});
		console.log('RSS Refresh: found '+rss.cache.articles.length+' articles, latest: '+rss.cache.articles[0].title);
		
	}).catch(err => 
	{
		console.log('RSS Error: '+err);
	});
}

function generateRSS()
{
	getNewsArticles();
	var txt = '<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">';
	txt += '<channel><title>Melon\'s Lil RSS Feed</title><atom:link href="https://brain.melonking.net/rss" rel="self" type="application/rss+xml" />';
	txt += '<link>https://melonking.net</link><description>News from Melonland!</description>';
	txt += '<category>Homepage</category><language>en-us</language>';
	txt += '<image><url>https://melonking.net/images/home.png</url><title>Melon\'s Lil RSS Feed</title><link>https://melonking.net</link></image>';
	for( let i=0 ; i<rss.cache.articles.length ; i++ )
	{
		let article = rss.cache.articles[i];
		txt += '<item>';
		txt += '<guid>' + article.uri + '</guid>';
		txt += '<title>' + article.title + '</title>';
		txt += '<link>' + article.link + '</link>';
		txt += '<description>' + article.description + '</description>';
		txt += '</item>';
	}
	txt += '</channel></rss>';
	return txt;
}

module.exports = {
	generate: function() {
		return generateRSS();
	}
}