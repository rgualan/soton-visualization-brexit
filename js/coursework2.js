var numberFormat = d3.format(",.0f");
var dateFormat = d3.time.format("%Y-%m");

var usChart = dc.geoChoroplethChart("#uk-chart");
//var crimesTimelineChart = dc.lineChart("#crimes-timeline-chart");
var crimeTypesChart = dc.rowChart("#crime-types-chart");
var crimeByMonth = dc.lineChart("#crime-by-month");



d3.csv("data/crimedata3.csv", function (data) {
    data.forEach(function(d) {
        d.county = d.county.toUpperCase();            
        d.month = dateFormat.parse(d.month);
        d.count = +d.count; 
    });

    //var data = crossfilter(data.slice(0,1000));
    var ndx = crossfilter(data);

    var counties = ndx.dimension(function (d) { return d["county"]; });
    var countyCrimesSum = counties.group().reduceSum(function (d) { return d["count"]; });

    var crimeTypes = ndx.dimension(function(d) {
        return d["crimeType"];
    });
    var crimeIncidentByType = crimeTypes.group().reduceSum(
        function(d) {
            return d["count"];
        }
    );

    var monthDimension = ndx.dimension(function(d) {return d.month;});
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

        usChart.width(550)
            .height(720)
            .dimension(counties)
            .group(countyCrimesSum)
            //.colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
            .colors(d3.scale.quantize().range(["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"]))
            //.colorDomain([0, 500000])
            //.colorDomain(d3.extent(chart.data(), chart.valueAccessor()))
            .colorCalculator(function (d) { return d ? usChart.colors()(d) : '#ccc'; })
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
			;

        usChart.on("preRender", function(chart) {
            //console.log(d3.extent(chart.data(), chart.valueAccessor()));
            chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()));
        });
        usChart.on("preRedraw", function(chart) {
            //console.log(d3.extent(chart.data(), chart.valueAccessor()));
            chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()));
        });

        crimeTypesChart
            .width(550)
            .height(350)
            .margins({top: 10, right: 10, bottom: 20, left: 10})
            .dimension(crimeTypes)
            //.dimension(counties)
            .group(crimeIncidentByType)
            //.xAxisLabel("Number of incidents")
            //.yAxisLabel("Type of crime")
            //.y(d3.scale.ordinal())
            //.yUnits(dc.units.ordinal)
            //.group(countyCrimesSum)
            .elasticX(true)
            //.brushOn(false)
            //.xAxis().ticks(5).tickFormat(d3.format("d"));
            .controlsUseVisibility(true)
            .colors(d3.scale.category20c())
            ;

        crimeTypesChart.addFilterHandler(function (filters, filter) {
            filters.length = 0; // empty the array
            filters.push(filter);
            return filters;
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
          //.x(d3.scale.linear().domain([1,20]))
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

        dc.renderAll();


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
            .attr("x1", x(brexitDate))  
            .attr("y1", 0)
            .attr("x2", x(brexitDate))  
            .attr("y2", height-50) //500-30
            .style("stroke-width", 2)
            .style("stroke-dasharray","5,5")//dashed array for line
            .style("stroke", "grey")
            .style("fill", "none");

    });
});

