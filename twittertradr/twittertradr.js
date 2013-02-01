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
var iframe_tmpl = "<iframe src='<%= yahooURL %>' id='tweetTraderFrame' style='display:none;' />";

var initalCashTagTweets = $tt('.twitter-cashtag');

function repeatReplaceStocks () {
  var currentCashTagTweets = $tt('.twitter-cashtag');

  if (currentCashTagTweets.length > initalCashTagTweets.length) {
    replaceStockSymbols(currentCashTagTweets);
  }
}

$tt(function(){
    replaceStockSymbols(initalCashTagTweets);
    window.setInterval(function(){repeatReplaceStocks()}, 200);
});

function replaceStockSymbols(tweets){
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

          if (!change){
            change = "0";
          }
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

        if (!change){
            change = "0";
        }
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
     for (var i=0; i < tweets.length; i++) {
        var cashtag = $tt(tweets[i]);
        var quote = cashtag.text().replace("$", "");
        if (parsed_quotes[quote])
          cashtag.replaceWith(parsed_quotes[quote]);
      }
    });
  }

}

function queryYahooFinance(symbols, callback){
  //Format symbols to be unique and in comma
  //separted string.
  uniq_symbols = _.uniq(symbols);
  cleaned_symbols = _.map(uniq_symbols, function (sym) { return '"' + sym.replace("$", "") + '"'; });
  var symbol_str = cleaned_symbols.join(",");

  var urlSymbolStr = encodeURIComponent(symbol_str);
  var yahooJSONUrl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(" + urlSymbolStr + ")%0A%09%09&format=json&diagnostics=true&env=http%3A%2F%2Fdatatables.org%2Falltables.env";

  $tt.ajax({
    url : yahooJSONUrl,
    type : 'GET',
    success: callback
  });
}

