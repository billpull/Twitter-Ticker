var $tt = jQuery.noConflict();

var twitterTradr = {

  tmpl : {
    pos : "\
    	<a class='yahooLink' target='_blank' href='http://finance.yahoo.com/q?s=<%= symbol %>&ql=1'>\
    		<span class='symWrap up'><%= symbol %>\
    			<span class='symInfo up'>\
    				<span class='regTxt'><%= quote %></span> (<%= change %>)\
    			</span>\
    		</span>\
    	</a>",

    neg : "\
    	<a class='yahooLink' target='_blank' href='http://finance.yahoo.com/q?s=<%= symbol %>&ql=1'>\
    		<span class='symWrap down'><%= symbol %>\
    			<span class='symInfo down'>\
    				<span class='regTxt'><%= quote %></span> (<%= change %>)\
    			</span>\
    		</span>\
    	</a>",
    
    neu : "\
    	<a class='yahooLink' target='_blank' href='http://finance.yahoo.com/q?s=<%= symbol %>&ql=1'>\
    		<span class='symWrap nochange'><%= symbol %>\
    			<span class='symInfo nochange'>\
    				<span class='regTxt'><%= quote %></span> (<%= change %>)\
    			</span>\
    		</span>\
    	</a>",

    chartList : "\
      <div id='tt-chart-draw'>\
        <ul id='tt-charts'></ul>\
        <div id='tt-handle'></div>\
      </div>",

    chartItem : "\
        <li class='tt-chart-item'>\
          <div class='tt-header'><%= headerHtml %></div>\
          <div class='tt-body'>\
            <img src='http://chart.finance.yahoo.com/t?s=<%= quote %>&lang=en-US&region=US&width=280&height=160' />\
          </div>\
        </li>"
  },

  cachedQuotes : {},

  initalCashTagTweets : $tt('.twitter-cashtag'),

  initCachedQuotes : function () {
    var localStoreQutoes = localStorage.getItem('twitterTradrQuotes');

    if ( localStoreQutoes !== null && localStoreQutoes){
      twitterTradr.cachedQuotes = $tt.parseJSON(localStoreQutoes);
    }
  },

  repeatReplaceStocks : function () {
    var currentCashTagTweets = $tt('.twitter-cashtag');

    if (currentCashTagTweets.length) {
      twitterTradr.replaceStockSymbols(currentCashTagTweets);
    }
  },

  replaceTweetHtml : function (cashtag, quote) {
    if (twitterTradr.cachedQuotes[quote.toUpperCase()]){
      cashtag.replaceWith(twitterTradr.cachedQuotes[quote]);
    }
  },

  queryYahooFinance : function (symbols, callback){
    var badSymbols = ["$bundle", "$components", "$lib"];

    var currentSymbols = [];
    for (var sym in twitterTradr.cachedQuotes) {
      var symStr = sym.toString();
      currentSymbols.push(symStr);
    }

    var clean_symbols = _.chain(symbols)
          .filter(function (sym) { return badSymbols.indexOf(sym) == -1; })
          .filter(function (sym) { return currentSymbols.indexOf(sym) == -1 })
          .map(function (sym) { return '"' + sym.replace("$", "").toUpperCase() + '"'; })
          .uniq()
          .value();

    if (clean_symbols.length > 0) {
      var symbol_str = clean_symbols.join(",");

      var urlSymbolStr = encodeURIComponent(symbol_str);
      var yahooJSONUrl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(" + urlSymbolStr + ")%0A%09%09&format=json&diagnostics=true&env=http%3A%2F%2Fdatatables.org%2Falltables.env";

      $tt.ajax({
        url : yahooJSONUrl,
        type : 'GET',
        success: callback
      });
    }
  },

  replaceStockSymbols : function (tweets){
    //Search Document for $SYMBOL pattern
    var symbol_pat = /(\$)([a-z]+\b)/gi;
    var twitter_html = $tt('body').text();
    var symbols = twitter_html.match(symbol_pat);

    if ( symbols ){
       twitterTradr.queryYahooFinance(symbols, function(data){
        var quotes = data.query.results.quote;

        //Iterate over query results
        for (var i=0; i < quotes.length; i++) {
          var quote = quotes[i];
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
            html_str = _.template(twitterTradr.tmpl.pos, quote_dict);
          }else if( change.indexOf("-") != -1 ){
            html_str = _.template(twitterTradr.tmpl.neg, quote_dict);
          }else{
            html_str = _.template(twitterTradr.tmpl.neu, quote_dict);
          }

          //Create dictionary of symbol:html
          twitterTradr.cachedQuotes[quote.Symbol] = html_str;
        }

        localStorage.setItem('twitterTradrQuotes', JSON.stringify(twitterTradr.cachedQuotes))
      });

      //Iterate over tweets in stream
      for (var k=0; k < tweets.length; k++) {
        var cashtag = $tt(tweets[k]);
        var quote = cashtag.text().replace("$", "");
        twitterTradr.replaceTweetHtml(cashtag, quote);
      }
    }

  },

  initDrawer : function () {
    $tt('body').append(twitterTradr.tmpl.chartList);
  },

  addSymCharts : function () {
    $tt('#tt-charts').html('');
    for (var sym in twitterTradr.cachedQuotes) {
      var tmplDict = {
        quote: sym.toString(),
        headerHtml: twitterTradr.cachedQuotes[sym]
      };  
      var chartItemHtml = _.template(twitterTradr.tmpl.chartItem, tmplDict);
      $tt('#tt-charts').append(chartItemHtml);
    }
  }
};

$tt(function() {
    twitterTradr.initDrawer();
    twitterTradr.initCachedQuotes();
    twitterTradr.replaceStockSymbols(twitterTradr.initalCashTagTweets);
    window.setInterval(function(){twitterTradr.repeatReplaceStocks()}, 200);
    twitterTradr.addSymCharts();
    $tt('.tt-chart-item').on("click", function() {
      $tt(this).children('.tt-body').slideToggle();
    });
    $tt('#tt-handle').on("click", function() {
      $tt('#tt-charts').toggleClass('open');
    });
});

