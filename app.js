var request = require('request'),
jsdom = require('jsdom'),
events = require('events'),
url = 'http://www.indianrail.gov.in/cgi_bin/inet_pnrstat_cgi.cgi';

var request_options = {
	headers: {
		'user-agent': 'Mozilla/5.0'
	},
	form: {
		lccp_pnrno1: process.argv[2]
	}
};

var irctcPnrStatus = function(pnr) {
	this.pnr = pnr;
	this.seat = '';
};

irctcPnrStatus.prototype = new events.EventEmitter;

irctcPnrStatus.prototype.checkPnr = function(){

	var self = this;
	
	setInterval(function(){

		request.post( url, request_options, function (error, response, body) {
		
			if (!error && response.statusCode == 200) {
				//console.log(body);

				jsdom.env({
					html: body,
					scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js']
				}, function(err, window){
					
					var $ = window.jQuery;
					var date = new Date();

					if ( $('#center_table').length != 1 ) {
						console.log('Error occured! <' + date + '>');
					} else {
						var status = $('#center_table tr').eq(1).find('td').eq(2).text();
						var statusArray = status.split(',');
						var status = $.trim(statusArray[0]) + '-' + $.trim(statusArray[1]);
						
						if (status.indexOf('W/L') == -1) {
							
							console.log('Seat Confirmed! <' + date + '>');
							self.seat = status + ' (Coach ' + $.trim($('#center_table tr').eq(1).find('td').eq(3).text()) + ')';
							self.emit('seat-confirmed');

						} else {
							console.log('Still waiting: ' + status + ' <' + date + '>');
						}
					}

				});

			} else {
				console.log(error,response);
			}
		});
	},10000);
};

var checknow = new irctcPnrStatus(process.argv[2]);

checknow.on('seat-confirmed',function(){
	console.log(this.seat);
	process.exit();
});

// Start checking
checknow.checkPnr();

/**
 * Exit on Ctrl + C
 */
process.on( 'SIGINT', function() {
	console.log( "\nExiting! Bbye.." );
	// some other closing procedures go here
	process.exit();
})