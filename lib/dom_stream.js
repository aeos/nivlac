var Transformable = require('stream').Transform;
var Readable = require('stream').Readable;
var util = require('util');
var merge = require('merge');

util.inherits(DomStream, Transformable);
util.inherits(DocumentStream, DomStream);
util.inherits(PartialStream, DocumentStream);
util.inherits(ManipulateStream, DomStream);
util.inherits(ErrorStream, Transformable);
util.inherits(DomListener, Readable);
util.inherits(DomFinisher, Transformable);

function DomStream(transformation, view_data, opt){
	opt = opt || {};
	Transformable.call(this, {objectMode: true});
	this.transformation = transformation;
	this.view_data = view_data;
	this.additional_options = opt;
};

DomStream.prototype._transform = function(dom, encoding, callback){
	this.transformation(dom, this.view_data, this.additional_options);
	this.push(dom);
	callback();
};

DomStream.prototype.next = function(destination, options){
	return this.pipe(destination,options);
};


function DocumentStream(template_stream, transformation, view_data, opt){
	DomStream.call(this, transformation, view_data, opt);
	this.template_stream = template_stream;
	this.markup = "";
};

DocumentStream.prototype._processDocumentStream = function(){
	var self = this;
	this.markup = "";
	this.template_stream.on("data", function(chunk){
		self.markup += chunk;
	});
};

DocumentStream.prototype._transform = function(dom, encoding, callback){
	var self = this;
	this._processDocumentStream();
	this.template_stream.on("end", function(){
		self.transformation(dom, self.view_data, { markup: self.markup });
		self.push(dom);
		callback();
	});
};

function PartialStream(template_stream, transform_stream, view_data, opt){
	DocumentStream.call(this, template_stream, null, view_data, opt);
	this.transform_stream = transform_stream;
	this.transformationMarkup = "";
	this.template_name = opt.template_name;
	this.transform_name = opt.transformation_name;
};

PartialStream.prototype._processTransformationStream = function(){
	var self = this;
	this.transformationMarkup = "";
	this.transform_stream.on("data", function(chunk){
		self.transformationMarkup += chunk;
	});
};

PartialStream.prototype._transform = function(dom, encoding, callback){
	var self = this;
	this._processTransformationStream();
	this.transform_stream.on("end", function(){
		if (!self.transformationMarkup) {			
			self.transformation = function($, view_data, options){};
		}else{
			self.transformation = new Function("$, view_data, options", self.transformationMarkup);
		}
		PartialStream.super_.prototype._transform.call(self,dom,encoding,callback);
	});
};

function ManipulateStream(transform_stream, view_data, opt){
	DomStream.call(this, null, view_data, opt);
	this.transform_stream = transform_stream;
	this.transformationMarkup = "";
	this.transform_name = opt.transformation_name;
};

ManipulateStream.prototype._processTransformationStream = function(){
	var self = this;
	this.transformationMarkup = "";
	this.transform_stream.on("data", function(chunk){
		self.transformationMarkup += chunk;
	});
};

ManipulateStream.prototype._transform = function(dom, encoding, callback){
	var self = this;
	this._processTransformationStream();
	this.transform_stream.on("end", function(){
		if (!self.transformationMarkup) {			
			self.transformation = function($, view_data, options){};
		}else{
			self.transformation = new Function("$, view_data, options", self.transformationMarkup);
		}
		ManipulateStream.super_.prototype._transform.call(self,dom,encoding,callback);
	});
};

function ErrorStream(error, view_data, opt){
	Transformable.call(this, opt);
	this.error = error;
	this.view_data = view_data;
};

ErrorStream.prototype._transform = function(dom, encoding, callback){
	this.emit("error",this.error);
}

function DomListener(dom){
	Readable.call(this, {objectMode: true});
	this.dom = dom;
};

DomListener.prototype._read = function(){
	this.push(this.dom);
	this.push(null);
};

DomListener.prototype.next = function(destination, options){
	return this.pipe(destination,options);
};

function DomFinisher(){
	Transformable.call(this);
	this._writableState.objectMode = true;
	this._readableState.objectMode = false;
};

DomFinisher.prototype._transform = function(dom, encoding, callback){
	this.push(dom.html());
	callback();
};

module.exports = {
	DomStream: DomStream,
	DocumentStream: DocumentStream,
	PartialStream: PartialStream,
	ManipulateStream: ManipulateStream,
	DomListener: DomListener,
	DomFinisher: DomFinisher
};