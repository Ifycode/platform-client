module.exports = ActivityTimeChart;

function ActivityTimeChart() {
    return {
        restrict: 'E',
        scope: {
            filters: '='
        },
        controller: ActivityTimeChartController,
        template: require('./time-chart.html')
    };
}

ActivityTimeChartController.$inject = ['$scope', '$translate', 'PostEndpoint', 'd3', 'moment', 'Chartist', 'frappe', '_', 'PostFilters'];
function ActivityTimeChartController($scope, $translate, PostEndpoint, d3, moment, Chartist, frappe, _, PostFilters) {
    $scope.frappeData = {
        labels: ['13 Oct 2020', '6 Jan 2021', '5 Mar 2021', '1 Jun 2021'],
        datasets: [
            {
                name: 'Draft', type: 'line',
                values: [2, 3, 5, 7]
            },
            {
                name: 'Published', type: 'line',
                values: [1, 2]
            }
        ]
    }

    const chart = new frappe.Chart('#chart', {  // or a DOM element,
                                                // new Chart() in case of ES6 module with above usage
        title: 'My Awesome Chart',
        data: $scope.frappeData,
        type: 'axis-mixed', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
        height: 350,
        lineOptions: {
            dotSize: 6 // default: 4
        },
        colors: ['#7cd6fd', '#743ee2']
    });

    /*
    $scope.frappeData = {
        labels: ["12am-3am", "3am-6pm", "6am-9am", "9am-12am",
            "12pm-3pm", "3pm-6pm", "6pm-9pm", "9am-12am"
        ],
        datasets: [
            {
                name: "Some Data", type: "bar",
                values: [25, 40, 30, 35, 8, 52, 17, -4]
            },
            {
                name: "Another Set", type: "line",
                values: [25, 50, -10, 15, 18, 32, 27, 14]
            }
        ]
    }

    const chart = new frappe.Chart("#chart", {  // or a DOM element,
                                                // new Chart() in case of ES6 module with above usage
        title: "My Awesome Chart",
        data: $scope.frappeData,
        type: 'axis-mixed', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
        height: 250,
        colors: ['#7cd6fd', '#743ee2']
    });

    //==========================================================

    $scope.chartistData = {
        series: [
            {
              name: 'series-1',
              data: [
                {x: new Date(143134652600), y: 53},
                {x: new Date(143234652600), y: 40},
                {x: new Date(143340052600), y: 45},
                {x: new Date(143366652600), y: 40},
                {x: new Date(143410652600), y: 20},
                {x: new Date(143508652600), y: 32},
                {x: new Date(143569652600), y: 18},
                {x: new Date(143579652600), y: 11}
              ]
            },
            {
              name: 'series-2',
              data: [
                {x: new Date(143134652600), y: 53},
                {x: new Date(143234652600), y: 35},
                {x: new Date(143334652600), y: 30},
                {x: new Date(143384652600), y: 30},
                {x: new Date(143568652600), y: 10}
              ]
            }
          ]
        }, {
          axisX: {
            type: Chartist.FixedScaleAxis,
            divisor: 5,
            labelInterpolationFnc: function(value) {
              return moment(value).format('MMM D');
            }
          }
        /*\// A labels array that can contain any sort of values
        labels: ['13 Oct 2020', '6 Jan 2021', '1 Jun 2021'],
        // Our series array that contains series objects or in this case series data arrays
        series: [
          [4, 2, 3]
        ]*\/
      };*/

      $scope.chartistOptions = {
        width: 300,
        height: 400
      };

      // Create a new line chart object where as first parameter we pass in a selector
      // that is resolving to our chart container element. The Second parameter
      // is the actual data object.
      new Chartist.Line('.ct-chart', $scope.chartistData, $scope.chartistOptions);

      //==========================================================


    var yAxisLabelCumulative = $translate.instant('graph.cumulative_post_count'),
        yAxisLabel = $translate.instant('graph.new_post_count'),
        xAxisLabel = $translate.instant('graph.post_date');

    console.log(yAxisLabelCumulative);
    console.log(yAxisLabel);
    console.log(xAxisLabel);

    $scope.showCumulative = true;
    $scope.isLoading = true;
    $scope.timelineAttribute = 'created';

    $scope.data = [{
        values: []
    }];

    $scope.groupByOptions = {
        '' : 'graph.all_posts',
        'tags' : 'nav.categories',
        'form' : 'app.surveys',
        'status' : 'post.status'
    };

    $scope.groupBy = {
        value: ''
    };

    $scope.options = {
        chart: {
            type: 'lineChart',
            height: 450,
            margin: {
                top: 0,
                right: 65,
                bottom: 40,
                left: 65
            },
            showControls: false,
            x: function (d) {
                return new Date(parseInt(d.label) * 1000);
            },
            y: function (d) {
                return d[$scope.showCumulative ? 'cumulative_total' : 'total'];
            },
            transitionDuration: 500,
            xAxis: {
                axisLabel: xAxisLabel,
                tickFormat: function (d) {
                    //uses unambiguous time format ex: 8 Sep 2014
                    return d3.time.format('%e %b %Y')(new Date(d));
                }
            },
            yAxis: {
                axisLabel: yAxisLabel,
                tickFormat: d3.format('d')
            },
            forceY: 0,
            tooltip : {
                contentGenerator: function (data) {
                    return '<h3>' + data.series[0].key + '</h3>' +
                        '<p>' +  data.point.y + ' posts at ' + d3.time.format('%e %b %Y')(new Date(data.point.x)) + '</p>';
                }
            },
            noData: $translate.instant('graph.no_data')
        }
    };

    console.log($scope.options);

    $scope.reload = getPostStats;

    activate();

    function activate() {
        // whenever filters change, reload
        $scope.$watch('filters', function () {
            getPostStats();
        }, true);
        $scope.$watch('showCumulative', updateAxisLabel);
        PostFilters.setMode('activity');
    }

    function getPostStats(query) {
        query = query || PostFilters.getQueryParams($scope.filters);
        var postQuery = _.extend({}, query, {
            'timeline' : 1,
            'timeline_attribute' : $scope.timelineAttribute,
            'group_by' : $scope.groupBy.value,
            'ignore403': '@ignore403'
        });

        $scope.isLoading = true;
        PostEndpoint.stats(postQuery).$promise.then(function (results) {
            if (!results.totals.length || _.chain(results.totals).pluck('values').pluck('length').max().value() < 3) {
                // Don't render a time chart with less than 3 points
                $scope.data = [{
                    values: []
                }];
            } else {
                $scope.data = results.totals;
            }
            $scope.isLoading = false;
        });
    }

    function updateAxisLabel(cumulative) {
        if (cumulative) {
            $scope.options.chart.yAxis.axisLabel = yAxisLabelCumulative;
        } else {
            $scope.options.chart.yAxis.axisLabel = yAxisLabel;
        }
    }
}
