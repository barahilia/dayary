#!/usr/bin/env node

var express = require('express');

var app = express();
var port = process.env.PORT || 3000;

var records = [
    {
        date: "2014-09-23",
        text: "Lorem Ipsum is simply dummy text of the printing and " +
            "typesetting industry. Lorem Ipsum has been the industry's " +
            "standard dummy text ever since the 1500s"
    },
    {
        date: "2014-10-27",
        text: "second"
    },
    {
        date: "2014-12-31",
        text: "third"
    }
];

app.get('/api/records', function (req, res) {
    res.send(records);
});

app.post('/api/records', function (req, res) {
    var record = { date: "2015-01-02", text: "" };
    records.push(record);
    res.send(record);
});

app.put('/api/records', function (req, res) {
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


