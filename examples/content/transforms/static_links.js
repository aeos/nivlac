function process(node, attr){
	var url = $(node).attr(attr);
	if (url && !/^http/.test(url)) {
		if (/^[^\/]/.test(url)) {
			$(node).attr(attr,view_data.link_base+view_data.link_uri+url);
		} else {
			$(node).attr(attr,view_data.link_base+url);
		}		
	}
}

$('a').each(function(){
	process(this, 'href');
});
$('link').each(function(){
	process(this, 'href');
});


