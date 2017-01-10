var numberFormat = d3.format(",.0f");
var dateFormat = d3.time.format("%Y-%m");

var usChart = dc.geoChoroplethChart("#uk-chart");
//var crimesTimelineChart = dc.lineChart("#crimes-timeline-chart");
var crimeTypesChart = dc.rowChart("#crime-types-chart");
var crimeByMonth = dc.lineChart("#crime-by-month");

function queryInitialData(cb) { 
  dateFormat = d3.time.format("%b-%y");
   
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
    .attr("class", "brexitLine")
    .attr("x1", x(brexitDate))  
    .attr("y1", 0)
    .attr("x2", x(brexitDate))  
    .attr("y2", height);

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

$(document).ready(function() {

  queryInitialData(function (data){
    initLineChart("crime_svg", data);
  });

});





d3.csv("data/crimedata3.csv", function (data) {
    data.forEach(function(d) {
        d.county = d.county.toUpperCase();
        d.month = dateFormat.parse(d.month);
        d.count = +d.count;
    });

    //var data = crossfilter(data.slice(0,1000));
    var ndx = crossfilter(data);

    var monthDimension = ndx.dimension(function(d) {return d.month;});
    // Filter values for the period 02/2016 - 12/2016 (5 months before BRexit and 5 months after)
    monthDimension.filterRange([new Date('2016-2'), new Date('2016-12')]);

    var counties = ndx.dimension(function (d) { return d["county"]; });

    var countyCrimesSum = counties.group().reduceSum(function (d) { return d["count"]; });
    var countyCrimesDiff = counties.group().reduce(
      function (p, v) {
        if(v.month > new Date('2016-6')){ return p + v.count; }
        else{ return p - v.count; }
      },

      function (p, v) {
        if(v.month > new Date('2016-6')){ return p - v.count; }
        else{ return p + v.count; }
      },

      function () {
        return 0;
      }
    );

    var crimeTypes = ndx.dimension(function(d) {
        return d["crimeType"];
    });
    var crimeIncidentByType = crimeTypes.group().reduceSum(
        function(d) {
            return d["count"];
        }
    );



    var crimeSumGroup = monthDimension.group().reduce(function(p, v) {
          p[v.crimeType] = (p[v.crimeType] || 0) + v.count;
          return p;
      }, function(p, v) {
          p[v.crimeType] = (p[v.crimeType] || 0) - v.count;
          return p;
      }, function() {
          return {};
      });

    projection = d3.geo.mercator()
        .center([1, 54])
        .scale(4000);
        //.translate([990 / 2, 500 / 2]);

    d3.json("geo/e_w_adm2.geojson", function (statesJson) {

        //var legend = chart.legend(dc.legend().x(10).y(10).itemHeight(13).gap(5));
        //legend.legendText(dc.pluck('name'))

        usChart.width(550)
            .height(754)//720
            .dimension(counties)
            .group(countyCrimesDiff)
            //.colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
            // .colorDomain([-100000,100000])
            // .colors(["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fff", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"])
            // .linearColors(["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fff", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"])
            // .colors(d3.scale.linear().range(["blue","white", "red"]))
            .colors(d3.scale.quantize().range(["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]))

            // .colors(d3.scale.quantize().range(["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"]))

            // .colorDomain(d3.extent(usChart.data(), usChart.valueAccessor()))
            .colorCalculator(function (d) { return d ? usChart.colors()(d) : '#ccc'; })
            // .colorAccessor(function(d, i){ console.log(d); return d; })
            .overlayGeoJson(statesJson.features, "state", function (d) {
                return d.properties.NAME_2.toUpperCase();
            })
            .projection(projection)
            .title(function (d) {
                var incidents = "NA";
                if (d.value) incidents = numberFormat(d.value);
                return "State: " + d.key + "\nTotal Crime Incidents: " + incidents; //+"M";
            })
			      .controlsUseVisibility(true)
            //.legend(dc.legend().x(10).y(10).itemHeight(13).gap(5))
			       ;

      var abs_min_max = function(chart){
        var min_max = d3.extent(chart.data(), chart.valueAccessor());
        var value = Math.max(Math.abs(min_max[0]),Math.abs(min_max[1]));
        return [-value,0,value];
      };

        usChart.on("preRender", function(chart) {
            chart.colorDomain(abs_min_max(chart));
        });
        usChart.on("preRedraw", function(chart) {
            chart.colorDomain(abs_min_max(chart));
        });
        usChart.on("postRedraw", function(chart) {
            createLegend(d3.extent(chart.data(), chart.valueAccessor()));
        });

        crimeTypesChart
            .width(550)
            .height(395)
            .margins({top: 10, right: 10, bottom: 35, left: 10})
            .dimension(crimeTypes)
            .group(crimeIncidentByType)
            .elasticX(true)
            .controlsUseVisibility(true)
            .colors(d3.scale.category20c())
            ;

        crimeTypesChart.addFilterHandler(function (filters, filter) {
            filters.length = 0; // empty the array
            filters.push(filter);
            return filters;
        });

        crimeTypesChart.on("postRender", function(chart) {
            // Create X Label
            d3.select("#crime-types-chart svg g.axis")
              .append("text")
              .attr("style","font-size: 14px;")
              .text("Number of incidents")
              .style("text-anchor", "middle")
              .attr("x",536/2)
              .attr("y",33);
        });


        var types = [ "Anti-social behaviour",
                      "Bicycle theft",
                      "Burglary",
                      "Criminal damage and arson",
                      "Drugs",
                      "Other crime",
                      "Other theft",
                      "Possession of weapons",
                      "Public order",
                      "Robbery",
                      "Shoplifting",
                      "Theft from the person",
                      "Vehicle crime",
                      "Violence and sexual offences"];

        function sel_stack(type) {
          return function(d) {
              return d.value[type];
          };
        }

        var minDate = monthDimension.bottom(1)[0]["month"];
        var maxDate = monthDimension.top(1)[0]["month"];

        var width = 550,
            height = 300;

        crimeByMonth
          .width(width)
          .height(height)
          .transitionDuration(750)
          .x(d3.time.scale().domain([minDate, maxDate]))
          .round(d3.time.month.round)
          .xUnits(d3.time.months)
          .margins({left: 50, top: 10, right: 10, bottom: 30})
          .renderArea(true)
          .brushOn(false)
          .renderDataPoints(false)
          .clipPadding(10)
          .xAxisLabel("Month")
          .yAxisLabel("Number of incidents")
          .dimension(monthDimension)
          .group(crimeSumGroup, "Anti-social behaviour", sel_stack("Anti-social behaviour"))
          .elasticY(true)
          .colors(d3.scale.category20c())
          .title(function (d) {
                //console.log(crimeTypesChart.filter());
                //console.log(d);
                var format = d3.time.format("%Y-%b");
                var type = crimeTypesChart.filter();
                if (type){
                    var incidents = numberFormat(d.value[type]);
                    return "Month: " + format(d.key)
                        + "\nCrime type: " + crimeTypesChart.filter()
                        + "\nIncidents: " + incidents;
                }else{
                    var sum = 0;
                    $.each(d.value, function(key, row) {
                        //console.log(key);
                        //console.log(row);
                        sum += row;
                    });

                    var incidents = numberFormat(sum);
                    return "Month: " + format(d.key)
                        + "\nTolal # of incidents: " + incidents;
                    }
            })
          ;

        for(var i = 1; i<14; ++i)
          crimeByMonth.stack(crimeSumGroup, i, sel_stack(types[i]));

        //crimeByMonth.render();

      crimeByMonth.on("postRender", function(chart) {      

        // Plot vertical line for BREXIT
        var brexitDate = new Date("2016-06-23");
        //var brexitDate = new Date("2016-04-01");
        //console.log(brexitDate);

        var x = d3.time.scale()
            .domain([minDate, maxDate])
            .range([-13, width-66]); //800-66


        var svg = d3.select("#crime-by-month svg g.chart-body");
        //console.log(svg);

        svg.append("line")
            .attr("class", "brexitLine")
            .attr("x1", x(brexitDate))  
            .attr("y1", 0)
            .attr("x2", x(brexitDate))
            .attr("y2", height-50) //500-30

        svg.append("text")
          .attr("dy", ".35em")
          .attr("transform", "translate(375,125)rotate(-90)")
          .style("text-anchor", "middle")
          .text("BREXIT Referendum")
          ;
      
      });

        dc.renderAll();


    });
});
