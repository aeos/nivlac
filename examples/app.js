var	express = require('express'),
	app = express(),
	nivlac = require('../lib/nivlac');

app.engine('js', nivlac.__express);
app.disable('view cache');
app.set('view engine','js');
app.set('views', './pages/');
app.set('fragments', './content/');

app.get('/', function(req, res){
	res.locals.link_base = "https://github.com";
	res.locals.link_uri = "/aeos/nivlac/";
	res.render('index');
});

app.listen(8000);
console.log("to run the example hit http://localhost:8000/");
