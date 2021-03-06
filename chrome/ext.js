/* 
   @start: api stuff
   @author: Andrew Liu
*/
var URL = "http://cywoods.wynd07.com/work/";

function api(url, data, callb) {
  $.ajax({
    type: 'GET',
    url: url,
    async: true,
    cache: false,
    dataType: 'json',
    data: (data != "" && data != null ? data : ""),
    success: function(data, textStatus, jqXHR) {
      if (typeof data === "undefined" || data == null) {
        callb(null);
        alert("Request failed");
        return;
      }
      callb(data);
    }
  });
}

var stocks = [];
var usaTODAY;

$(document).ready(function() {
  //api tests
  api(URL + "list.json", null, function(data) {
    stocks = data;
    loadBloomberg();
  })
     $.getJSON('http://api.usatoday.com/open/articles/topnews/money?count=3&days=0&page=0&encoding=json&api_key=mfp848fncedqnnfzhc2drx3y', function( data ) {
         usaTODAY = data;
        
          });
});


/*
@end: api stuff
*/


function sanitize(name) {
  if (name[name.length - 2] === ' ') {
    name = name.substring(0, name.length - 2);
  }
  if (name[name.length - 1] === '.' || name.lastIndexOf('Co') === name.length - 2 || name.lastIndexOf('Corp') === name.length - 4 || name.lastIndexOf('Inc') === name.length - 3) {
    name = name.substring(0, name.lastIndexOf(' '));
  }
  return name;
}

var myStocks = {};

function loadBloomberg() {

  $(document).mousemove(updateBoxes);
  var names = [];
  for (var i = 0; i < stocks.length; i++) {
    var name = sanitize(stocks[i].name);
    myStocks[name] = stocks[i];
    names.push(name);
  }
  $('p').highlight(names, {
    caseSensitive: true,
    className: 'bloomberg'
  });

  var counter = 0;
  $('.bloomberg').each(function() {
    counter++;
    var $this = $(this);
    var stock = myStocks[$this.text()];
    if (!stock.detailedOnce) {
      $this.html('<strong>' + $this.html() + '</strong>').append(' (NYSE: ' + stock.symbol + ')');
      stock.detailedOnce = true;
    }
    this.stock = stock;
    this.counter = counter;


    $this.hover(popshow);

    var abc = this;

    api(URL + stock.symbol + ".json", null, function(data) {
      var overviewContent = $('<div class="overviewContent"></div>').append('<div class="graph" id="graph' + abc.counter + '"></div>');

      var volume = formatNumber(data.values.VOLUME_AVG_30D);
      var open = formatNumber(data.values.PX_OPEN);
      var high = formatNumber(data.values.PX_HIGH);
      var low = formatNumber(data.values.PX_LOW);
      var yhigh = formatNumber(data.values.HIGH_52WEEK);
      var ylow = formatNumber(data.values.LOW_52WEEK);
      var close = formatNumber(data.values.PX_CLOSE);
      var mktCap = formatNumber(data.values.CUR_MKT_CAP);
      var peRatio = formatNumber(data.values.PE_RATIO);
      var divYield = formatNumber(data.values.DIVIDEND_YIELD);
      var netChange = formatNumber(data.values.CHG_NET_1D);
      var percentChange = formatNumber(data.values.CHG_PCT_1D);
      var eps = formatNumber(data.values.TRAIL_12M_EPS);

      var divdata = $('<div></div>');
      divdata.append([
        '<table class="table table-bordered">',
        '<tr><td><b>Open:</b> ' + open + '</td>',
        '<td><b>Close:</b> ' + close + '</td></tr>',
        '<tr><td><b>Range:</b> ' + low + ' - ' + high + '</td>',
        '<td><b>52 Week:</b> ' + ylow + ' - ' + yhigh + '</tr>',
        '</td></tr></table>'
      ].join(''));
      overviewContent.append(divdata);
      setTimeout(function() {
        overviewContent.append('<h6> From USA Today </h6>')
         $.each (usaTODAY.stories, function (key, val) {
            overviewContent.append(
              "<li class='usaToday' id='" + key + "'><a href='" + val.guid[0].value + "'>" + val.description.substring(0, Math.min(70, val.description.length - 1)) + "..." + "</a></li>");
          });
      }, 1000);

      var liveviewContent = $('<div class="liveviewContent"></div>').append('<div class="graph" id="live' + abc.counter + '"></div>');
      var divdata2 = $('<div></div>');
      divdata2.append([
        '<table class="table table-bordered">',
        '<tr><td><b>Volume:</b> ' + volume + '</td>',
        '<td><b>Market Cap:</b> ' + mktCap + '</td></tr>',
        '<tr><td><b>P/E Ratio:</b> ' + peRatio + '</td>',
        '<td><b>EPS:</b> ' + eps + '</tr>',
        '</td></tr></table>'
      ].join(''));
      liveviewContent.append(divdata2);

      var rand = Math.floor(Math.random() * 100);
      $this.popover({
        animation: true,
        content: $('<div></div>').append(overviewContent).append(liveviewContent),
        html: true,
        placement: "bottom",
        trigger: "none",
        title: '<div class="btn-group"><a class="btn btn-default" id="overBtn' + abc.counter + '">Overview</a>' +
          '<a class="btn btn-default" id="liveBtn' + abc.counter + '">Live View</a><a href="http://cywoods.wynd07.com/rift.php?stock='+stock.symbol+'" target="_blank" class="btn btn-default">Rift View</a></div>'
      });

      abc.titleHtml = '<b>' + stock.symbol + ' ' + close + '</b>' +
        '<span style="color:' + (netChange > 0 ? 'green"> +' : 'red"> ') + netChange + ' (' + percentChange + '%)</span>';

      var gdata = [];
      var g = data.graph;
      for (var i = 0; i < g.length; i++)
        gdata.push([g[i].date - 1000 * 60 * 60 * 4, g[i].value]);
      abc.gdata = gdata;

    });
  });

}

var wtfffff;
var curstock;
var curLive;



function show_Live(stock, num, openn) {
  wtfffff = true;
  curstock = stock.symbol;
  $.ajax(URL+ "classes/live.php?val=" + stock.symbol )
                .done(function(data) {
                  var currentt = parseFloat(data);
  $('#live' + num).highcharts({
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function() {
    
                        // set up the updating of the chart each second
                        var series = this.series[0];
                        var abccc = function() {
                            
                            $.ajax(URL+ "classes/live.php?val=" + stock.symbol )
                .done(function(data) {
                  var x = (new Date()).getTime(), // current time
                                y = parseFloat(data);
                                console.log(data);
                                if( data != 0.0)
                            series.addPoint([x, y], true, true);
                          if( wtfffff)
                            abccc();
                });
                        }
                        abccc();
                    }
                }
            },
            title: {
                text: 'Realtime '+ stock.symbol
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: "Price"
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                formatter: function() {
                        return '<b>'+ this.series.name +'</b><br/>'+
                        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: stock.symbol,
                data: (function() {
                                    // generate an array of random data
                                    var data = []
                                    for (i = -49; i <= 0; i++) {
                                        data.push({
                                            x: (new Date()).getTime()+i*1000,
                                            y: parseFloat(currentt)
                                        });
                                    }
                                    return data;
                                })()
            }]
        });
});
  $('.overviewContent').hide();
  $('.liveviewContent').show();
}

function show_Over(stock) {
  wtfffff = false;
  $('.overviewContent').show(0);
  $('.liveviewContent').hide(0);
}

function popshow() {
  $this = $(this);
  $this.unbind('mouseenter mouseleave');
  $this.popover('show');
  var ct = this.counter;
  var abc = this;
  show_Over(abc.stock);
  $("#overBtn" + ct).click(function() {
    show_Over(abc.stock);
  });
  $("#liveBtn" + ct).click(function() {
    show_Live(abc.stock, ct, abc.open);
  });

  $('#graph' + this.counter).highcharts('StockChart', {

    rangeSelector: {
      enabled: false
    },

    title: {
      text: this.titleHtml
    },

    series: [{
      name: this.stock.symbol,
      data: this.gdata,
      type: 'spline',
      tooltip: {
        valueDecimals: 2
      }
    }],
    scrollbar: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    navigator: {
      enabled: false
    }
  });

}

var percent = 0.1;

function updateBoxes(ev) {
  $(".popover").each(function(k, b) {
    b = $(b)
    var ow = b.outerWidth();
    var oh = b.outerHeight() + 20;
    var off = b.offset();
    var top = off.top - oh * percent;
    var left = off.left - ow * percent;
    ow *= 1 + percent * 2;
    oh *= 1 + percent * 2;
    //console.log((ev.pageX < left)+ " " +( ev.pageY < top )+ " " +( ev.pageX > left+ow )+ " " +( ev.pageY > top + oh));
    if (ev.pageX < left || ev.pageY < top || ev.pageX > left + ow || ev.pageY > top + oh) {
      $('.bloomberg').popover('hide');
      $('.bloomberg').unbind('mouseenter mouseleave');
      $('.bloomberg').hover(popshow);
      wtfffff = false;
    }
  });
}

//pls use this, thank you
function formatNumber(x) {
  x = parseFloat(x);
  if (x > 1e9) return numberWithCommas((x / 1e9).toFixed(2)) + "B";
  if (x > 1e6) return numberWithCommas((x / 1e6).toFixed(2)) + "M";
  return numberWithCommas(x.toFixed(2))
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
