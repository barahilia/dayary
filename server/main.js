#!/usr/bin/env node

var express = require('express'),
    backend = require('./sqlite-backend'),
    recordsApi = require('./records-api'),
    settingsApi = require('./settings-api');

// TODO: describe configuration in README
// TODO: accept config from the command line
var port = process.env.PORT || 3000;
var dbFile = process.env.DBFILE || __dirname + "/../data/records.sqlite";

var app = express();

backend.openDb(dbFile);

app.use('/api/records', recordsApi);
app.use('/api/settings', settingsApi);

app.use(
    '/bower_components',
    express.static(__dirname + '/../bower_components')
);
app.use(
    '/node_modules',
    express.static(__dirname + '/../node_modules')
);
app.use(
    express.static(__dirname + '/../www')
);

console.log("Listening... Get to http://localhost:" + port);
app.listen(port);
