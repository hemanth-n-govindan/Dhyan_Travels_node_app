var express = require('express')
var app = express()
var bodyparser = require('body-parser');
var cors = require('cors');
var business = require('./business');
var config = require('./config.json');

var allowedOrigins = config.AppSetting.AllowedOrgins;
var corsOptions = {
    origin: function (origin, callback) {
        var originIsWhitelisted = allowedOrigins.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    },
    maxAge:1800,
    credentials: true
};

app.use(cors(corsOptions));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
	extended: true
}));

app.post('/', function (req, res) {
    console.log(req.body);
    res.send('Empty Route!');
})
app.get('/', function (req, res) {
    res.send('Empty Route!!')
})


app.get('/ReadApplicationContentFile', function (req, res) { business.readApplicationContentFileCallback(req, res, config) });
app.post('/NotifyCustomer', function (req, res) { business.notifyCustomerCallback(req, res, config) });

app.listen(8080, function () {
    console.log('Example app listening on port 8080!!')
});
