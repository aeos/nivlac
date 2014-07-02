nivlac
======

An express.js Template language that uses dom manipulation instead of a markup language

# express.js configuration

```js
var	express = require('express'),
	app = express(),
	nivlac = require('../lib/nivlac');

//setup the engine to automatically load js templates using the nivlac engine.
app.engine('js', nivlac.__express);
// enable/disable view caching. Disabling it allows you to immediately see your changes.
app.disable('view cache');
// further configurations of the view engine
app.set('view engine','js');
// you must provide express.js the template directory.
app.set('views', './pages/');
// you must additionally provide nivlac with the directory to all html partials, transforms, css and js embedded into templates.
app.set('fragments', './content/');
// a quick example of how you can define local variables which are later used in the view_data object within a template.
app.get('/', function(req, res){
	res.locals.link_base = "https://github.com";
	res.locals.link_uri = "/aeos/nivlac/";
	res.render('index');
});
//normal app loading.
app.listen(8000);
console.log("done");
```

# nivlac template

A nivlac template contains a chain of transformations that will operate on the dom model. Most transformation are stored in files called fragments and refered to using their filename. Every template must use the _transforms_ object and then only contain chains of _next_ calls. Do not use any arbitrary javascript code in your template.

A quick example of a template is as follows:
```js
transforms.next(document('foo.html'))
.next(partial('bar.html','body')
```

The above example must be placed in the express.js _views_ folder.

# fragments

A fragment is either a piece of content, or a transformation that will be applied to the dom object. Content Fragments can include HTML, CSS or JavaScript which will become embedded in the dom object. Transformations are operations using jQuery like syntax which can access the __view_data__ (express.js locals) or options provided by the template (in some cases this includes the markup from a content fragment).

nivlac use a file resolver to access the fragments which expects the following folder structure:
```
.content/ (which is configured in the application config for express)
  html/ (which contains html fragments ending with .html)
  css/ (which contains css fragments ending with .css)
  js/ (which contiains javascript fragments ending with .js)
  transforms/ (which contains javascript transforms ending with .js)
```

## Content Fragments

Content fragments consist of static HTML, CSS or JavaScript that you wish to include in a template. These files should not include JavaScript or CSS that will be requested as a stylesheet or external javascript file. It only includes markup that is embedded in a HTML tempalte.

## Transformation Fragments

A Transformation fragment is a block of javascript that will operate on the dom object. the fragment has access to 3 variables: 
- $ (which exposes jQuery like syntax for manipulating the dom object)
- view_data (which exposes the express.js locals)
- options (includes the html fragment when using the partial transform, or additional options passed into the transformation).

There are 3 transformation available:
- document
- partial
- manipulation

### Document Fragment

```js
document("layout.html" [options])
```
The document transformation sets the default markup for the dom object. The dom object is initialized using:
```html
<html>
  <head></head>
  <body></body>
</html>
```
The document transformation will replace the intialized markup with a template fragment. You cannot alter where the document transformation places the tempalte fragment, it simply replaces the dom object with the markup from the fragment.

### Partial Fragment

```js
partial("partial.html", "body.css-selector", [options])
partial("partial.html", "transformation.js", [options])
partial("partial.html", function($, view_data, options){}, [opions])
```

The partial transformation allows you to embed a content fragment inside the dom object. Unlike the document tranformation, partial provides you 3 ways of defining where you would like to place the content. You can provide it with a css selector which will cause the partial to append the template fragment as a child of the provided selector. You can provide it with a transformation fragment file name, which will be given the template fragment markup as part of the options. Finally, you can provide it with a transformation function which will be called to add the partial to the dom object.

The content found in the template fragment will be provided to the transformation through the _options.markup_ value.

### Manipulate Fragment

```js
manipulate("transformation.js",[options])
manipulate(function($, view_data, options){}, [options])
```
The manipulate transformation allows you to perform a manipulation on the dom object. Unlike partial, you cannot provide a template to manipulate. 

## Options

- cacheable: If caching is turned on globally (through the express.js application variable) then you can disable the caching of a specific template by passing in the option cacheable = false.
- markup: Used internally by the Partial transformation to store the markup retrieved from a content fragment.
