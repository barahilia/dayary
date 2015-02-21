var express = require('express'),
    bodyParser = require('body-parser'),
    backend = require('./sqlite-backend');

var recordsApi = express.Router();

// TODO: check if this function is still needed
var processRecord = function (req, res, processor) {
    backend.getRecord(+req.params.id, function (err, record) {
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
            return;
        }

        if (record) {
            processor(record);
        }
        else {
            res.status(404).end();
        }
    });
};


recordsApi.get('/', function (req, res) {
    backend.getRecordsMetadata(function (err, records) {
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
            return;
        }

        res.send(records);
    });
});

recordsApi.get('/:id', function (req, res) {
    processRecord(req, res, function (record) {
        res.send(record);
    });
});

recordsApi.post('/', function (req, res) {
    // TODO: replace 'new Date()' with moment
    var now = new Date();

    var record = {
        created: now,
        updated: now,
        text: ""
    };

    backend.addRecord(record, function (err, added) {
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
            return;
        }

        res.send(added);
    });
});

//recordsApi.use('/:id', bodyParser.text( { type: "application/json" } ));
recordsApi.put('/:id', function (req, res) {
    var record = req.body;

    if (+req.params.id !== record.id) {
        res.status(404).end();
    }

    // TODO: update the client side to send entire record with set updated field
    backend.updateRecord(req.body, function (err) {
        // TODO: handle the case of non-existing id - it's 404, not 500
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
            return;
        }

        res.status(204).end();
    });
});

recordsApi.delete('/:id', function (req, res) {
    backend.deleteRecord(+req.params.id, function (err) {
        // TODO: handle the case of non-existing id - it's 404, not 500
        if (err) {
            console.log("ERROR: " + err);
            res.status(500).end();
            return;
        }

        res.status(200).end();
    });
});

exports.recordsApi = recordsApi;

exports.init = function (dbFile) {
    backend.openDb(dbFile);
};
