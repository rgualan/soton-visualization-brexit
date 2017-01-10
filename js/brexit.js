var numberFormat = d3.format(",.0f");
var dateFormat = d3.time.format("%Y-%m");

var ukChart = dc.geoChoroplethChart("#uk-chart");
var crimeTypesChart = dc.rowChart("#crime-types-chart");
var crimeByMonth = dc.lineChart("#crime-by-month");
var crimeByMonth2 = dc.compositeChart("#crime-by-month-2");

function queryInitialData(cb) {
  var dateFormat2 = d3.time.format("%b-%y");

  d3.csv('data/crimeRates.csv', function(data) {
    data.forEach( function(d) {
      d.date = dateFormat2.parse(d.date);
      d.crimes = +d.crimes;
    });

    if (data.length == 0){ console.log("No items returned!"); return; }

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

  svg.append("text")
    .attr("fill", "#000")
    .attr("y", 76)
    .attr("x", 825)
    .attr("dy", "0.71em")
    .style("text-anchor", "end")
    .text("BREXIT");

  var defs = svg.append("defs")

  defs.append("marker")
      .attr({
        "id":"arrow",
        "viewBox":"0 -5 10 10",
        "refX":5,
        "refY":0,
        "markerWidth":4,
        "markerHeight":4,
        "orient":"auto"
      })
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class","arrowHead");
}

$(document).ready(function() {

  queryInitialData(function (data){
    initLineChart("crime_svg", data);
  });

  var cbLabels = ["Show comparison","Show time line"];
  $("#changePlotsButton").click(function() {
    if ( $("#changePlotsButton").text() === cbLabels[0] ){
      $("#crime-by-month").hide();
      $("#crime-by-month-2").show();
      $("#changePlotsButton").text(cbLabels[1]);
    }else{
      $("#crime-by-month").show();
      $("#crime-by-month-2").hide();
      $("#changePlotsButton").text(cbLabels[0]);
    }
  });

  $("#changePlotsButton").text(cbLabels[1]);
  $("#crime-by-month").hide();

});


d3.csv("data/crimedata3.csv", function (data) {
    data.forEach(function(d) {
        d.county = d.county.toUpperCase();
        d.yearNumber = d.month.split("-")[0]; //d3.time.format("%y").parse(d.month.split("-")[1]);
        d.monthNumber = d3.time.format("%m").parse(d.month.split("-")[1]);
        d.month = dateFormat.parse(d.month);
        d.count = +d.count;
    });

    var ndx = crossfilter(data);

    var monthDimension = ndx.dimension(function(d) {return d.month;});
    var monthDimension2 = ndx.dimension(function(d) {return d.monthNumber;});

    var counties = ndx.dimension(function (d) { return d["county"]; });

    var countyCrimesSum = counties.group().reduceSum(function (d) { return d["count"]; });
    var countyCrimesDiff = counties.group().reduce(
      function (p, v) {
        if ((v.month > new Date('2016-1')) && (v.month < new Date('2016-12'))){
          if(v.month > new Date('2016-6')){ return p + v.count; }
          else{ return p - v.count; }
        }else{ return p }
      },

      function (p, v) {
        if ((v.month > new Date('2016-1')) && (v.month < new Date('2016-12'))){
          if(v.month > new Date('2016-6')){ return p - v.count; }
          else{ return p + v.count; }
        }else{ return p }
      },

      function () {
        return 0;
      }
    );

    // For the composite chart
    function isyear2015(v) {
      return v.yearNumber === "2015" ;
    }
    function isyear2016(v) {
      return v.yearNumber === "2016" ;
    }
    var crimeSumGroupin2016 = monthDimension2.group().reduce(
      function(p, v) {
        if (isyear2016(v)) {
          p.totalCrimeCount +=  +v.count;
        }
        return p;
      },
      function(p, v) {
        if (isyear2016(v)) {
          p.totalCrimeCount -=  +v.count;
        }
        return p;},
      function() {
        return {totalCrimeCount:0};
      }
    );

    var crimeSumGroupin2015 = monthDimension2.group().reduce(
      function(p, v) {
        if (isyear2015(v)) {
          p.totalCrimeCount +=  +v.count;
        }
        return p;
      },
      function(p, v) {
        if (isyear2015(v)) {
          p.totalCrimeCount -=  +v.count;
        }
        return p;
      },
      function() {
        return {totalCrimeCount:0};
      }
    );

    // Crime types
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

    d3.json("geo/e_w_adm2.geojson", function (statesJson) {

        ukChart.width(550)
            .height(754)//720
            .dimension(counties)
            .group(countyCrimesDiff)
            .colors(d3.scale.quantize().range(["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"]))
            .colorCalculator(function (d) { return d ? ukChart.colors()(d) : '#ccc'; })
            .overlayGeoJson(statesJson.features, "state", function (d) {
                return d.properties.NAME_2.toUpperCase();
            })
            .projection(projection)
            .title(function (d) {
                var incidents = "NA";
                if (d.value) incidents = numberFormat(d.value);
                return "State: " + d.key + "\nChange in crime incidents: " + incidents; //+"M";
            })
			      .controlsUseVisibility(true);

        var abs_min_max = function(chart){
          var min_max = d3.extent(chart.data(), chart.valueAccessor());
          var value = Math.max(Math.abs(min_max[0]),Math.abs(min_max[1]));
          return [-value,0,value];
        };

        ukChart.on("preRender", function(chart) {
            chart.colorDomain(abs_min_max(chart));
        });
        ukChart.on("preRedraw", function(chart) {
            chart.colorDomain(abs_min_max(chart));
        });
        ukChart.on("postRender", function(chart) {
            createLegend(chart.colorDomain());
        });
        ukChart.on("postRedraw", function(chart) {
            createLegend(chart.colorDomain());
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

        crimeByMonth.on("postRender", function(chart) {

          // Plot vertical line for BREXIT
          var brexitDate = new Date("2016-06-23");

          var x = d3.time.scale()
              .domain([minDate, maxDate])
              .range([-13, width-66]); //800-66


          var svg = d3.select("#crime-by-month svg g.chart-body");

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


        var width = 550, height = 300;
        var minDate2 = monthDimension2.bottom(1)[0]["monthNumber"];
        var maxDate2 = d3.time.format("%m").parse("11");

        crimeByMonth2
          .width(width)
          .height(height)
          .transitionDuration(750)
          .x(d3.time.scale().domain([minDate2, maxDate2]))
          .round(d3.time.month.round)
          .xUnits(d3.time.months)
          .margins({left: 50, top: 10, right: 10, bottom: 30})
          .brushOn(false)
          .clipPadding(10)
          .legend(dc.legend().x(80).y(180).itemHeight(13).gap(5))
          .xAxisLabel("Month")
          .yAxisLabel("Number of incidents")
          .compose([
            dc.lineChart(crimeByMonth2)
                .dimension(monthDimension2)
                .colors('red')
                .group(crimeSumGroupin2016, "Year 2016")
                .valueAccessor(function(d) {
                  return d.value.totalCrimeCount;
                })
                .title(function (d) {
                  console.log(d);
                  var incidents = numberFormat(d.value.totalCrimeCount);
                  return "Month: " + d3.time.format("%m")(d.key)
                      +  "\nIncidents: " + incidents;
                 })
                .dashStyle([2,2]),
            dc.lineChart(crimeByMonth2)
                .dimension(monthDimension2)
                .colors('blue')
                .group(crimeSumGroupin2015, "Year 2015")
                .valueAccessor(function(d) {
                  return d.value.totalCrimeCount;
                })
                .title(function (d) {
                  var incidents = numberFormat(d.value.totalCrimeCount);
                  return "Month: " + d3.time.format("%m")(d.key)
                      +  "\nIncidents: " + incidents;
                })
                .dashStyle([5,5])
          ])
          .elasticY(true)
          .colors(d3.scale.category20c())
          ;

        crimeByMonth2.on("postRender", function(chart) {

          // Plot vertical line for BREXIT
          var brexitDate = new Date("1900-06-23");

          var x = d3.time.scale()
              .domain([minDate2, maxDate2])
              .range([0, width-71]); //800-66

          var svg = d3.select("#crime-by-month-2 svg g.chart-body");

          svg.append("line")
              .attr("class", "brexitLine")
              .attr("x1", x(brexitDate))
              .attr("y1", 0)
              .attr("x2", x(brexitDate))
              .attr("y2", height-50)

          svg.append("text")
            .attr("dy", ".35em")
            .attr("transform", "translate("+(x(brexitDate)-10)+",125)rotate(-90)")
            .style("text-anchor", "middle")
            .text("BREXIT Referendum (2016)")
            ;

          // Trick for hiding the year 1900
          svg = d3.select("#crime-by-month-2 svg g.axis.x");
          svg.append("rect")
            .attr("x", -15)
            .attr("y", 7)
            .attr("width", 30)
            .attr("height", 10)
            .attr("fill", "white");

        });

        dc.renderAll();


    });
});


// Inspired on http://bl.ocks.org/mbostock/4060606
function createLegend(domainArray){
  //console.log(domainArray);
  var formatSi = d3.format(".3s");

  var color = d3.scale.quantize()
    .domain(domainArray)
    .range(["#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b"])

  // Create a legend for the map
  var x = d3.scale.linear()
      .domain(domainArray)
      .range([600, 860]);

  var svg = d3.select("#uk-chart svg");

  var legendAxis = d3.svg.axis()
  .scale(x)
  .tickSize(13)
  .tickFormat(function(x, i) { return formatSi(x); })
  .ticks(3);


  if ( svg.select(".key").empty() ) {

    var g = svg.append("g")
      .attr("class", "key")
      .attr("transform", "translate(-350,690)");
    g.selectAll("rect")
      .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return color(d[0]); })
        .attr("stroke", "white");
    g.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Legend");

    g.call(legendAxis);
    g.select(".domain").remove();
  }else{

    svg.transition().select(".key")
      .duration(300)
      .call(legendAxis);

    svg.select(".key").select(".domain").remove();
  }

}
