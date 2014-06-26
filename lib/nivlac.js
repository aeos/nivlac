var	Cheerio = require('cheerio'),
	DomFactory = require('./dom_factory'),
	FileResolver = require('./file_resolver'),
	Readable = require('stream').Readable,
	cache = {},
	file = new FileResolver("./", cache);

exports.cache = cache;
exports.factory = new DomFactory(file);

exports.compile = function(nivlac){
	fn = [
		"// the following locals provide syntax sugar for the template.",
		"var document = function(template, options){ return factory.createDocument(template, view_data, options, callback); };",
		"var manipulate = function(transform, options){ return factory.createTransformation(transform, view_data, options, callback); };",
		"var partial = function(template, transformation, options){ return factory.createPartial(template, transformation, view_data, options, callback) };",
		"// BELOW IS THE TEMPLATE LOGIC",
		"return "+nivlac+".pipe(factory.createDomFinisher());",
		"// END OF TEMPLATE LOGIC"
	].join("\n");
	return new Function("transforms, factory, $, view_data, callback",fn);
}

exports.render = function(nivlac, options, fn){
	var dom = Cheerio.load("<html></html>");
	var stream = exports.factory.createDomListener(dom);
	stream.on("error",function(error){
		fn(error);
	});
	
	var result = nivlac(stream, exports.factory, dom, options, fn);

	result.on("error",function(error){
		fn(error);
	}); 
	var html = "";
	result.on("data", function(chunk){
		html += chunk;
	});
	result.on("end", function(){
		fn(null, html);
	});
};

exports.renderFile = function(path, options, fn){
	if (options.settings.fragments) {
		file.folder = options.settings.fragments;
	}
	if (options.cache) {
		file._cache = exports.cache;
	} else {
		file._cache = null;
	}
	var stream = file.read(path,{type: 'page'});
	var code = "";
	stream.on("data",function(chunk){
		code += chunk
	});
	stream.on("end", function(){
		exports.render(exports.compile(code), options._locals, fn);
	});
};

exports.__express = exports.renderFile;