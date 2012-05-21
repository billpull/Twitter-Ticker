var $tt = jQuery.noConflict();

/*===Templates===*/
var pos_tmpl = "\
	<a class='yahooLink' target='_blank' href='http://finance.yahoo.com/q?s=<%= symbol %>&ql=1'>\
		<span class='symWrap up'><%= symbol %>\
			<span class='symInfo up'>\
				<span class='regTxt'><%= quote %></span> (<%= change %>)\
			</span>\
		</span>\
	</a>";
var neg_tmpl = "\
	<a class='yahooLink' target='_blank' href='http://finance.yahoo.com/q?s=<%= symbol %>&ql=1'>\
		<span class='symWrap down'><%= symbol %>\
			<span class='symInfo down'>\
				<span class='regTxt'><%= quote %></span> (<%= change %>)\
			</span>\
		</span>\
	</a>";
var neu_tmpl = "\
	<a class='yahooLink' target='_blank' href='http://finance.yahoo.com/q?s=<%= symbol %>&ql=1'>\
		<span class='symWrap nochange'><%= symbol %>\
			<span class='symInfo nochange'>\
				<span class='regTxt'><%= quote %></span> (<%= change %>)\
			</span>\
		</span>\
	</a>";

$tt(function(){
  replaceStockSymbols();
});

function replaceStockSymbols(){
  //Check for tweet text
  if( $tt('.js-tweet-text').html() ){
    var tweets = $tt('.js-tweet-text');

    //Search Document for $SYMBOL pattern
    var symbol_pat = /(\$)([a-z]+\b)/gi;
    var twitter_html = $tt('body').html();
    var symbols = twitter_html.match(symbol_pat);

    if ( symbols ){
      queryYahooFinance(symbols, function(data){
        var quotes = data.query.results.quote;
        var parsed_quotes = {};

        //Iterate over query results
        if( quotes.length !== undefined){
          $tt.each(quotes, function(){
            var quote = this;
            var change = quote.Change;
            var html_str = null;

            if( change === undefined ){ change = '0'; }
            var quote_dict = {
              'symbol':quote.Symbol,
              'quote':quote.LastTradePriceOnly,
              'change':quote.ChangeinPercent
            };

	    //Render template strings
            if( change.indexOf("+") != -1 ){
              html_str = _.template(pos_tmpl, quote_dict);
            }else if( change.indexOf("-") != -1 ){
              html_str = _.template(neg_tmpl, quote_dict);
            }else{
              html_str = _.template(neu_tmpl, quote_dict);
            }

	    //Create dictionary of symbol:html
            parsed_quotes[quote.Symbol] = html_str;
          });
        }else{
          var quote = quotes;
          var change = quote.Change;
          var html_str = null;

          if( change === undefined ){ change = '0'; }
          var quote_dict = {
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

	//Iterate over tweets in stream
        $tt.each(tweets,function(){
          var that = this;
          var tweet_html = $tt(that).html();
          tweet_html = tweet_html.replace(symbol_pat,function(){
            var sym_match = arguments[2];
            //Check if pattern found is in results dictionary
            if( _.has(parsed_quotes, sym_match) ){
	      //Replace HTML
              tweet_html = tweet_html.replace(arguments[0],parsed_quotes[sym_match]);
              $tt(that).html(tweet_html);
            }
          });
        });
      });
    }
  }else{
    //If not tweet text yet check back in 200ms.
    setTimeout( replaceStockSymbols, 200 );
  }
}

function queryYahooFinance(symbols, callback){
  //Format symbols to be unique and in comma
  //separted string.
  symbols = _.uniq(symbols);
  var symbol_str = "";
  for(i = 0; i < symbols.length; i++){
    var symbol = symbols[i];
    symbol = symbol.toString().replace('$','');
    if ( i != (symbols.length -1) ){
      symbol_str+="'"+symbol+"',";
    }else{ symbol_str +="'"+symbol+"'"; }
  }

  //Create values for Yahoo Finance API call.
  var YAHOO_API_URL = 'http://query.yahooapis.com/v1/public/yql'
  var format = 'json'
  var query = 'select * from yahoo.finance.quotes where symbol in ("'+symbol_str+'")';
  var env = "store://datatables.org/alltableswithkeys";

  //Make Yahoo Finance API request.
  $tt.ajax({
    'url':YAHOO_API_URL,
    'method':'GET',
    'data': {
      'format':format,
      'q':query,
      'env':env
    },
    success:callback
  });
}

  jQuery.fn.contentChange = function(callback){
    var elms = jQuery(this);
    elms.each(
      function(i){
        var elm = jQuery(this);
        elm.data("lastContents", elm.html());
        window.watchContentChange = window.watchContentChange ? window.watchContentChange : [];
        window.watchContentChange.push({"element": elm, "callback": callback});
      }
    )
    return elms;
  }
  setInterval(function(){
    if(window.watchContentChange){
      for( i in window.watchContentChange){
        if(window.watchContentChange[i].element.data("lastContents") != window.watchContentChange[i].element.html()){
          window.watchContentChange[i].callback.apply(window.watchContentChange[i].element);
          window.watchContentChange[i].element.data("lastContents", window.watchContentChange[i].element.html())
        };
      }
    }
  },500);

