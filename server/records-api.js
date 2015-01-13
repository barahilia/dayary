
var fs = require('fs')
    express = require('express'),
    bodyParser = require('body-parser'),
    _ = require('underscore');

var datafile = __dirname + "/../data/records.json";

var loadRecords = function () {
    var data;

    try {
        data = fs.readFileSync(datafile);
        return JSON.parse(data);
    }
    catch (e) {
        if (e.errno === 34 && e.code === 'ENOENT') {
            // File doesn't exist yet - it's OK
            return [];
        }
        else {
            console.log("FATAL ERROR: unable to open the data file");
            console.log(e);
            process.exit(1);
        }
    }
};

var saveRecords = function (data) {
    // Can throw an error, to be caught at the upper level
    fs.writeFileSync(datafile, JSON.stringify(data));
};

// TODO: currently it's [ { }, ... ]. Make it { id: { }, ... }
var records = loadRecords();

var recordsApi = express.Router();

recordsApi.get('/', function (req, res) {
    // Diary can become quite large, so don't send text here
    res.send(
        _.map(records, function (record) {
            var metadata = _.clone(record);
            metadata.text = undefined;
            return metadata;
        })
    );
});

recordsApi.get('/:id', function (req, res) {
    var id = +req.params.id;

    var record = _.find(records, function (rec) {
        return rec.id === id;
    });

    if (record) {
        res.send(record);
    }
    else {
        res.status(404).end();
    }
});

recordsApi.post('/', function (req, res) {
    var maxId = _.chain(records)
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

    records.push(record);

    try {
        saveRecords(records);
        res.send(record);
    }
    catch (e) {
        console.log("ERROR: unable to save to the data file");
        console.log(e);
        res.status(500).end();
    }
});

recordsApi.use('/:id', bodyParser.text({type: "application/json"}));
recordsApi.put('/:id', function (req, res) {
    var id = +req.params.id;
    var body = req.body;

    var record = _.find(records, function (rec) {
        return rec.id === id;
    });

    if (record) {
        record.text = body;
        record.updated = new Date();

        try {
            saveRecords(records);
            res.status(204).end();
        }
        catch (e) {
            console.log("ERROR: unable to save to the data file");
            console.log(e);
            res.status(500).end();
        }
    }
    else {
        res.status(404).end();
    }
});


exports.recordsApi = recordsApi;

