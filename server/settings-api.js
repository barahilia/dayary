var express = require('express'),
    bodyParser = require('body-parser'),
    backend = require('./sqlite-backend');

var settingsApi = express.Router();

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

settingsApi.use('/hash', bodyParser.text({type: "application/json"}));
settingsApi.put('/hash', function (req, res) {
    var hash = req.body;

    backend.setHash(hash, function (err) {
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
        }
        else {
            res.status(204).end();
        }
    });
});

// Must be defined after use('/hash')
settingsApi.use('/', bodyParser.json());
settingsApi.put('/', function (req, res) {
    var settings = req.body;

    backend.setSettings(settings, function (err) {
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
        }
        else {
            res.status(204).end();
        }
    });
});

module.exports = settingsApi;
