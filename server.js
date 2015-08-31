#!/usr/bin/env node

var express = require('express');

// TODO: describe configuration in README
var port = process.env.PORT || 3000;
var app = express();

app.use(express.static(__dirname));
console.log("Listening... Get to http://localhost:" + port);
app.listen(port);

