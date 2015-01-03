#!/usr/bin/env node

var express = require('express');

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

app.get('/api/records', function (req, res) {
    res.send(records);
});

app.post('/api/records', function (req, res) {
    // TODO: set correct record data
    var record = { id: 4, date: "2015-01-02", text: "" };
    records.push(record);
    res.send(record);
});

app.put('/api/records/1', function (req, res) {
    res.status(204).end();
    // TODO: save an updated record
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


