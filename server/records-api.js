var express = require('express'),
    bodyParser = require('body-parser'),
    backend = require('./records-backend');

var recordsApi = express.Router();

recordsApi.get('/', function (req, res) {
    // Diary can become quite large, so don't send text here
    res.send(backend.getRecordsMetadata());
});

recordsApi.get('/:id', function (req, res) {
    var record = backend.getRecord(+req.params.id);

    if (record) {
        res.send(record);
    }
    else {
        res.status(404).end();
    }
});

recordsApi.post('/', function (req, res) {
    var maxId = backend.maxId();
    var now = new Date();

    var record = {
        id: maxId < 1 ? 1 : maxId + 1,
        created: now,
        updated: now,
        text: ""
    };

    try {
        backend.addRecord(record);
        res.send(record);
    }
    catch (e) {
        res.status(500).end();
    }
});

recordsApi.use('/:id', bodyParser.text({type: "application/json"}));
recordsApi.put('/:id', function (req, res) {
    var body = req.body;
    var record = backend.getRecord(+req.params.id);

    if (record) {
        record.text = body;
        record.updated = new Date();

        try {
            backend.updateRecord(record);
            res.status(204).end();
        }
        catch (e) {
            res.status(500).end();
        }
    }
    else {
        res.status(404).end();
    }
});

exports.recordsApi = recordsApi;

