var fs = require('fs'),
	Readable = require('stream').Readable,
	Transform = require('stream').Transform,
	util = require('util');

util.inherits(CacheStream, Readable);

function FileResolver(path, cache){
	this._cache = cache;
	this.folder = path;
	this.expressions = {
		html: /\.html$/,
		js: /\.js$/,
		css: /\.css$/,
		transformation: /\.t$/,
		log: /\.log$/
	};
}

FileResolver.prototype.read = function(path, opts){
	opts = opts || {};
	var encoding = opts.encoding ? opts.encoding : 'utf8';
	var override = (typeof opts.cacheable !== "undefined") ? opts.cacheable : true;
	var stream = this.cached(path,encoding,override);
	if (!stream) {
		stream = fs.createReadStream(this.resolve(path,opts), {encoding: encoding});
		return this.cache(path, stream, override);
	}
	return stream;
};

FileResolver.prototype.write = function(path, opts){
	opts = opts || {};
	var encoding = opts.encoding ? opts.encoding : 'utf8';
	return fs.createWriteStream(this.resolve(path,opts), {encoding: encoding, flags: 'r'});
}

FileResolver.prototype.cached = function(path, encoding, override){
	if (this._cache && override && this._cache["file://"+path]) {
		return new CacheStream(this._cache["file://"+path], encoding);
	}
	return null;
}

FileResolver.prototype.cache = function(path, stream, override){
	if (this._cache && override && !this._cache["file://"+path]) {
		var self = this, data = "";
		var updateCache = new Transform();
		var data = "";
		updateCache._transform = function(chunk, encoding, done){
			data += chunk;
			this.push(chunk);
			done();
		};
		updateCache._flush = function(done){
			self._cache["file://"+path] = data;
			done();
		};
		return stream.pipe(updateCache);
	}
	return stream;
}

FileResolver.prototype.resolve = function(path, opts){
	var result;
	switch(true){
		case this.expressions.html.test(path):
			result = this.html(path,opts);
			break;
		case this.expressions.js.test(path):
			result = this.js(path,opts);
			break;
		case this.expressions.css.test(path):
			result = this.css(path,opts);
			break;
		case this.expressions.log.test(path):
			result = this.log(path,opts);
			break;
	}

	return result;
};

FileResolver.prototype.html = function(path, opts){
	return this.folder+"html/"+path;
};

FileResolver.prototype.js = function(path, opts){
	var type = opts.type ? opts.type : "";
	switch(type){
		case 'page':
			return path;
		case 'transform':
			return this.folder+"transforms/"+path;
			break;
		default:
			return this.folder+"js/"+path;
			break;
	}
	return null;
};

FileResolver.prototype.css = function(path, opts){
	return this.folder+"css/"+path;
};

FileResolver.prototype.tramsformation = function(path, opts){
	return this.folder+"transforms/"+path;
};

FileResolver.prototype.log = function(path, opts){
	return this.folder+path;
};

function CacheStream(content, encoding){
	Readable.call(this);
	this.content = content;
	this.encoding = encoding;
}

CacheStream.prototype._read = function(size){
	this.push(this.content,this.encoding);
	this.push(null);
}

module.exports = FileResolver;