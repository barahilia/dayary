#!/usr/bin/env node

var express = require('express'),
    bodyParser = require('body-parser'),
    _ = require('underscore')
    recordsApi = require('./records-api').recordsApi;

// TODO: describe configuration in README
// TODO: move data file config here too
// TODO: accept config from the command line
var port = process.env.PORT || 3000;

var app = express();

app.use('/api/records', recordsApi);
app.use(
    '/bower_components',
    express['static'](__dirname + '/../bower_components')
);
app.use(
    express['static'](__dirname + '/../www')
);

console.log("Listening... Get to http://localhost:" + port);
app.listen(port);


