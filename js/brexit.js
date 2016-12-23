function initLineChart(svgName, data){
	// Set the basic properties of the plot
	var margin = { top: 30, right: 20, bottom: 30, left: 100 };
	var width = 1000 - margin.left - margin.right;
	var height = 400 - margin.top - margin.bottom;

	// Scales
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain(d3.extent(data, function(d) { return d.value; }));

	// Axes
	var xAxis = d3.svg.axis().scale(x).orient("bottom");//.ticks(5);
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

	// Define the line
	var line = d3.svg.line()
	 	//.interpolate("basis")
	    .x(function(d) { return x(d.date); })
	    .y(function(d) { return y(d.value); });


	// Adds the svg canvas
	var svg = d3.select("#"+svgName)
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("path")
	  .datum(data)
	  .attr("class", "line")
	  .attr("d", line);

	brexitDate = new Date("2016-05-23");
	svg.append("line")
		.attr("x1", x(brexitDate))  
		.attr("y1", 0)
		.attr("x2", x(brexitDate))  
		.attr("y2", height)
		.style("stroke-width", 2)
		.style("stroke", "red")
		.style("fill", "none");

	svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
	  .attr("class", "axis axis--y")
	  .call(yAxis);

	svg.append("text")
	  .attr("fill", "#000")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", "0.71em")
	  .style("text-anchor", "end")
	  .text("Hate crimes");

}


//dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
dateFormat = d3.time.format("%b-%y");

function queryInitialData(cb) { 
   
	d3.csv('data/crimeRates.csv', function(data) { 
		data.forEach( function(d) {
			d.date = dateFormat.parse(d.date); 
			d.crimes = +d.crimes; 
		}); 

		if (data.length == 0){ console.log("No items returned!"); return; } 
		//console.log(data);
	 	
		cb(data);		
	}); 
}

$(document).ready(function() {

	queryInitialData(function (data){
		initLineChart("crime_svg", data);
	});

});
