var express = require('express'),
    bodyParser = require('body-parser'),
    _ = require('underscore')
    backend = require('./records-backend');

var recordsApi = express.Router();

recordsApi.get('/', function (req, res) {
    // Diary can become quite large, so don't send text here
    res.send(
        _.map(backend.records, function (record) {
            var metadata = _.clone(record);
            metadata.text = undefined;
            return metadata;
        })
    );
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
    var maxId = _.chain(backend.records)
        .map(function (record) { return record.id; })
        .max()
        .value();

    var now = new Date();

    var record = {
        id: maxId < 1 ? 1 : maxId + 1,
        created: now,
        updated: now,
        text: ""
    };

    backend.records.push(record);

    try {
        backend.saveRecords(backend.records);
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
            backend.saveRecords(backend.records);
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

