var DomStream = require("./dom_stream");
var PassThrough = require("stream").PassThrough;

function DomFactory(file_resolver){
	this.file_resolver = file_resolver;
	this.expressions = {
		transformation_template: /\.js$/
	};
}

DomFactory.prototype.createDocument = function(template, view_data, options){
	options = options || {};
	var self = this;

	var template_stream = self.file_resolver.read(template,{cacheable: options.cacheable});
	return new DomStream.DocumentStream(template_stream, function($, view_data, options){
		$.root().html(options.markup);	
	}, view_data, options);
};

DomFactory.prototype.createTransformation = function(transformation, view_data, options){
	options = options || {};

	if ('function' == typeof transformation) {	
		return new DomStream.DomStream(transformation, view_data, options); 
	}

	if (this.expressions.transformation_template.test(transformation)) {
		var self = this;
		var transform_stream = self.file_resolver.read(transformation, {type: "transform", cacheable: options.cacheable});
		options.transformation_name = transformation;
		return new DomStream.ManipulateStream(transform_stream, view_data, options);
	}

	return new DomStream.ErrorStream(new Error("transformation must be a js file: "+transformation), view_data, options);
};

DomFactory.prototype.createPartial = function(template, transformation, view_data, options){
	options = options || {};
	var self = this;
	var template_stream =  self.file_resolver.read(template,{cacheable: options.cacheable});

	if ('function' == typeof transformation) {	
		return new DomStream.DocumentStream(template_stream, transformation, view_data, options);
	}

	if (this.expressions.transformation_template.test(transformation)) {
		var self = this;
		var transform_stream =  self.file_resolver.read(transformation, {type: "transform", cacheable: options.cacheable});
		options.template_name = template;
		options.transformation_name = transformation;
		return new DomStream.PartialStream(template_stream, transform_stream, view_data, options);
	}

	return new DomStream.DocumentStream(template_stream, function($, view_data, opt){
		$(transformation).append(opt.markup);
	}, view_data, options);
};

DomFactory.prototype.createDomFinisher = function(){
	return new DomStream.DomFinisher();
};

DomFactory.prototype.createDomListener = function(dom){
	return new DomStream.DomListener(dom);
};

module.exports = DomFactory;