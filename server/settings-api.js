var express = require('express'),
    // TODO: move usage in bodyParser to main.js; also from records-api.js
    bodyParser = require('body-parser'),
    backend = require('./sqlite-backend');

var settingsApi = express.Router();
settingsApi.use(bodyParser.json());

settingsApi.get('/', function (req, res) {
    backend.getSettings(function (err, settings) {
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
            return;
        }

        res.send(settings);
    });
});

settingsApi.put('/', function (req, res) {
    var settings = req.body;
    //backend.setSettings();
    throw "Not implemented";
});

// TODO: use here bodyParser.text()
//app.use('/api/hash', bodyParser.text({type: "application/json"}));
settingsApi.put('/hash', function (req, res) {
    var hash = req.body;
    //backend.setHash();
    throw "Not implemented";
});

module.exports = settingsApi;
