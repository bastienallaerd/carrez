//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );


//makes the server respond to the '/' route and serving the 'home.ejs' template in the 'views' directory
app.get( '/', function ( req, res ) {
    res.render( 'home', {
        message: 'The Home Page!'
    });
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});

app.get('/process', function(req, res) {
	const url = req.query.lbcUrl;

	if(url) {
		getLBCData(url, res, getMAEstimation)
	}
	else {
		res.render('home', {
			error: 'Url is empty'
		});
	}
});

function getLBCData (lbcUrl, routeResponse, callback)
{
	request(lbcUrl, function(error, response, html)
	{	
		if(!error){
			
			let $ = cheerio.load(html); //module pour parser le document html
			
			const lbcData = parseLBCData(html)
			
			if(lbcData){
				console.log('LBC DATA:', lbcData) //affiche dans la console
				callback(lbcData, routeResponse)
			}
			
			else{
				routeResponse.render('pages/index', {
					error: 'No Data Found'
				});
			}
		}
		else{
			routeResponse.render('pages/index', {
			error: 'Error loading the given URL'
			});
		}	
		
	});
}

function parseLBCData(html) {
	const $ = cheerio.load(html)
	const lbcDataArray = $('section.properties span.value')
	return lbcData = {
		price: parseInt($(lbcDataArray.get(0)).text().replace(/\s/g,''), 10),
		city: $(lbcDataArray.get(1)).text().trim().toLowerCase().replace(/\_|s/g,'').replace(/\-\d+/,''),
		postalCode: $(lbcDataArray.get(1)).text().trim().toLowerCase().replace(/\D|\-/g,''),
		type: $(lbcDataArray.get(2)).text().trim().toLowerCase(),
		surface: parseInt($(lbcDataArray.get(4)).text().replace(/\s/g,''), 10)				
	}
}

function getMAEstimation(lbcData, routeResponse) {
	
	
	if (lbcData.city
		& lbcData.postalCode
		& lbcData.surface
		& lbcData.price) {
		 const url = 'https://www.meilleursagents.com/prix-immobilier/{city}-{postalCode}/'
		 .replace( '{city}', lbcData.city.replace( /\_/g, '-' ) )
		 .replace( '{postalCode}', lbcData.postalCode );

        console.log( 'MA URL:', url )
        console.log( 'MA URL:', url )
		console.log('MA URL:', url)

		request(url, function(error, response, html)
		{
			if(!error)
			{
				let $ = cheerio.load(html);
				console.log( $('meta[name=description]').get()); 
				console.log( $('meta[name=description]').get()[0].attribs); 
				console.log( $('meta[name=description]').get()[0].attribs.content); 
				
				
				if ($('meta[name=description]').get().length === 1 && $('meta[name=description]').get()[0].attribs && $('meta[name=description]').get()[0].attribs.content)
				{
					const maData = parseMADATA ($('meta[name=description]').get()[0].attribs.content);
					console.log( 'MA Data:' , maData)
					
					if ( maData.priceAppart && maData.priceHouse)
					{
						routeResponse.render('home',{
							data: {
								ldcData,
								maData,
								deal: {
								good: isgooddeal( lbcData, maData)
								}
							}
						})
					}	
				}
			}	
		})  

	}
}


function isGoodDeal (lbcData, maData) {
	const adPricePerSqM = Math.round(lbcData.price / lbcData.surface)
	const maPrice = lbcData.type ===
	'appartement' ? maData.priceAppart : maData.priceHouse
	return adPricePerSqM < maPrice
}

/*function parseMADATA(html) {
	const priceAppartRegex = /\bappartement\b :(\d+) €/
	const priceHouseRegex = /\bmaison\b : (\d+) €/mi 
	if(html){
		const priceAppart = priceAppartRegex.exec(html)
		priceAppartRegex.exec(html).length*/