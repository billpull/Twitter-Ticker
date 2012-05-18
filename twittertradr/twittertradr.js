$(function(){
    console.log('Twitter Ticker init');
    replaceStockSymbols();

   $('.new-tweets-bar').click(function(){
	setTimeout(replaeStockSymbols, 500);
   });
});

function replaceStockSymbols(){
	if( $('.js-tweet-text').html() ){
		console.log('Twitter Stream Loaded');
		var tweets = $('.js-tweet-text');
		var symbol_pat = /(\$)([a-z]+\b)/gi;
		$.each(tweets, function(){
		   var that = this;
		   var tweet_html = $(that).html();
           tweet_html = tweet_html.replace(symbol_pat,function(){
			   var replace_args = arguments;
			   var symbol = replace_args[2];
			   var YAHOO_API_URL = 'http://query.yahooapis.com/v1/public/yql'
			   var format = 'json'
			   var query = 'select * from yahoo.finance.quotes where symbol in ("'+symbol+'")';
			   var env = "store://datatables.org/alltableswithkeys";
			   var finance_pg = "http://finance.yahoo.com/q?s="+symbol.toLowerCase()+"&ql=1";

			   $.ajax({
				'url':YAHOO_API_URL,
				'async':false,
				'method':'GET',
				'data': {
				'format':format,
				'q':query,
				'env':env
				},
				success: function(data){
				var quote = data.query.results.quote;
				console.log(quote);
				if ( quote ){
					var change = quote.Change;
					var change_pct = quote.ChangeinPercent;
					var quote_price = quote.LastTradePriceOnly;
					var html_str = "";

					var symbol = replace_args[0].replace('$','');

					if (quote_price){
					  console.log(replace_args[0],quote_price,change);

					  if( change.indexOf("+") != -1 ){
						tooltip_str = '<span class="symInfo up"><span class="regTxt">'+quote_price+'</span> ('+change_pct+')</span>';
						html_str = '<span class="symWrap up">'+symbol+tooltip_str+'</span>';
						html_str = '<a class="yahooLink" target="_blank" href="'+finance_pg+'">'+html_str+'</a>';
					  }else{
						tooltip_str = '<span class="symInfo down"><span class="regTxt">'+quote_price+'</span> ('+change_pct+')</span>';
						html_str = '<span class="symWrap down">'+symbol+tooltip_str+'</span>';
						html_str = '<a class="yahooLink" target="_blank" href="'+finance_pg+'">'+html_str+'</a>';
					  }
					}

					tweet_html = tweet_html.replace(symbol_pat,html_str);
					$(that).html(tweet_html);
				}
			}
		   });
		  });
		});
	}else{
	   setTimeout( replaceStockSymbols, 200 );
	}
}
