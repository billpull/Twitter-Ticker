var $tt = jQuery.noConflict();

var pos_tmpl = "\
	<a class='yahooLink' target='_blank' href='<%= link %>'>\
		<span class='symWrap up'><%= symbol %>\
			<span class='symInfo up'>\
				<span class='regTxt'><%= quote %></span> (<%= change %>)\
			</span>\
		</span>\
	</a>";
var neg_tmpl = "\
	<a class='yahooLink' target='_blank' href='<%= link %>'>\
		<span class='symWrap down'><%= symbol %>\
			<span class='symInfo down'>\
				<span class='regTxt'><%= quote %></span> (<%= change %>)\
			</span>\
		</span>\
	</a>";
var neu_tmpl = "\
	<a class='yahooLink' target='_blank' href='<%= link %>'>\
		<span class='symWrap nochange'><%= symbol %>\
			<span class='symInfo nochange'>\
				<span class='regTxt'><%= quote %></span> (<%= change %>)\
			</span>\
		</span>\
	</a>";

$tt(function(){
    replaceStockSymbols();

   $tt('.new-tweets-bar').click(function(){
	setTimeout(replaeStockSymbols, 500);
   });
});

function replaceStockSymbols(){
	if( $tt('.js-tweet-text').html() ){
		var tweets = $tt('.js-tweet-text');
		var symbol_pat = /(\$)([a-z]+\b)/gi;
		var twitter_html = $tt('body').html();
		var symbols = twitter_html.match(symbol_pat);
		
		if ( symbols ){
		  queryYahooFinance(symbols, function(data){
			var quotes = data.query.results.quote;
			var parsed_quotes = {};

			for( var i = 0; i < quotes.length; i++ ){
			  var quote = quotes[i];
			  var change = quote.Change;
			  var finance_pg = "http://finance.yahoo.com/q?s="+quote.Symbol.toLowerCase()+"&ql=1";
			  var html_str = null;

			  var quote_dict = {
				'link':finance_pg,
				'symbol':quote.Symbol,
				'quote':quote.LastTradePriceOnly,
				'change':quote.ChangeinPercent
			  };

			    if( change.indexOf("+") != -1 ){
				html_str = _.template(pos_tmpl, quote_dict);
			    }else if( change.indexOf("-") != -1 ){
				html_str = _.template(neg_tmpl, quote_dict);
			    }else{
				html_str = _.template(neu_tmpl, quote_dict);
			    }
 
			  parsed_quotes[quote.Symbol] = html_str;
			}
		     
                       $tt.each(tweets,function(){
			  var that = this;
			  var tweet_html = $tt(that).html();
			  tweet_html = tweet_html.replace(symbol_pat,function(){
			    var sym_match = arguments[2];
			    if( _.has(parsed_quotes, sym_match) ){
				console.log("replace this");
				tweet_html = tweet_html.replace(arguments[0],parsed_quotes[sym_match]);
				$tt(that).html(tweet_html);
			    }
			  });
		       });
		  });
		}
	}else{
	   setTimeout( replaceStockSymbols, 200 );
	}
}

function queryYahooFinance(symbols, callback){
	symbols = _.uniq(symbols);
	var symbol_str = "";
	for(i = 0; i < symbols.length; i++){
	  var symbol = symbols[i];
	  symbol = symbol.toString().replace('$','');
	  if ( i != (symbols.length -1) ){
	  	symbol_str+="'"+symbol+"',";
	  }else{ symbol_str +="'"+symbol+"'"; }
	}
	var YAHOO_API_URL = 'http://query.yahooapis.com/v1/public/yql'
	var format = 'json'
	var query = 'select * from yahoo.finance.quotes where symbol in ("'+symbol_str+'")';
	var env = "store://datatables.org/alltableswithkeys";

	$tt.ajax({
	  'url':YAHOO_API_URL,
	  'async':false,
	  'method':'GET',
	  'data': {
	    'format':format,
	    'q':query,
	    'env':env
	  },
	  success:callback
	});
}
