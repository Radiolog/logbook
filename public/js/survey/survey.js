Survey.defaultBootstrapCss.navigationButton = "btn btn-primary";
Survey.Survey.cssType = "bootstrap";



var survey = new Survey.Model({
        surveyId: 'c5f770f9-b9e7-4b9a-bc52-348755857e87',
        surveyPostId: 'd76793b5-960f-4cee-a542-fbc589a5f128'
});

var surveySendResult = function(s, options) {
    if(options.success) {
        s.getResult('7df80807-4073-478d-9925-720f3b534002', 'Linda');
    }
};
var surveyGetResult = function(s, options) {
    if(options.success) {
        showChart(options.dataList);
    }
};
function showChart(chartDataSource) {
    document.getElementById("chartContainer").style.height = "300px";
    document.getElementById("chartText").style.visibility = "visible";    
    $("#chartContainer").dxPieChart({
        dataSource: chartDataSource,
        series: {
            argumentField: 'name',
            valueField: 'value'
        }
    });
}

$("#surveyContainer").Survey({
    model: survey,
    onSendResult: surveySendResult,
    onGetResult: surveyGetResult
});
