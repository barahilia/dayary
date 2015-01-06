#!/usr/bin/env node

var express = require('express'),
    bodyParser = require('body-parser'),
    _ = require('underscore');

var app = express();

var port = process.env.PORT || 3000;

// TODO: load from a JSON file
var records = [
    {
        id: 1,
        date: "2014-09-23",
        text: "Lorem Ipsum is simply dummy text of the printing and " +
            "typesetting industry. Lorem Ipsum has been the industry's " +
            "standard dummy text ever since the 1500s"
    },
    {
        id: 2,
        date: "2014-10-27",
        text: "second"
    },
    {
        id: 3,
        date: "2014-12-31",
        text: "third"
    }
];

// TODO: attempt using router for /api/records
app.get('/api/records', function (req, res) {
    res.send(records);
});

app.post('/api/records', function (req, res) {
    // TODO: set correct record data
    var record = { id: 4, date: "2015-01-02", text: "" };
    records.push(record);
    res.send(record);
});

app.use('/api/records/:id', bodyParser.text({type: "application/json"}));
app.put('/api/records/:id', function (req, res) {
    var id = +req.params.id;
    var body = req.body;

    var record = _.find(records, function (rec) {
        return rec.id === id;
    });
    
    if (record) {
        records.text = body;
        res.status(204).end();
    }
    else {
        res.status(404).end();
    }
});


// TODO: decide if to continue with __dirname
app.use(
    '/bower_components',
    express.static(__dirname + '/../bower_components')
);

app.use(
    express.static(__dirname + '/../www')
);


console.log("Listening... Get to http://localhost:" + port);
app.listen(port);


