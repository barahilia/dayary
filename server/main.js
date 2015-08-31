#!/usr/bin/env node

var express = require('express');

// TODO: describe configuration in README
var port = process.env.PORT || 3000;

var app = express();

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
