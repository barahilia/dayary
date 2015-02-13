var fs = require('fs'),
    path = require('path'),
    _ = require('underscore');

// TODO: get this as a parameter and return a backend object
var datafile = __dirname + "/../data/records.json";

var dataFolderExists = false;

var dataContent = {
    hash: "",
    records: []
};
var records = dataContent.records;

var loadRecords = function () {
    var data;

    try {
        data = fs.readFileSync(datafile);
        data = JSON.parse(data);

        if (_.isArray(data)) {
            // Up to version 0.1.1
            records = dataContent.records = data;
        }
        else if (_.isObject(data) && 'hash' in data && 'records' in data) {
            // Latest versions
            dataContent = data;
            records = dataContent.records;
        }
        else {
            console.log("FATAL ERROR: unable to parse the data file");
            process.exit(1);
        }
    }
    catch (e) {
        if (e.errno === 34 && e.code === 'ENOENT') {
            // File doesn't exist yet - it's OK
        }
        else {
            console.log("FATAL ERROR: unable to open the data file");
            console.log(e);
            process.exit(1);
        }
    }
};

var saveRecords = function () {
    var folder;

    try {
        if (!dataFolderExists) {
            folder = path.dirname(datafile);

            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
                dataFolderExists = true;
            }
        }

        fs.writeFileSync(datafile, JSON.stringify(dataContent));
    }
    catch (e) {
        console.log("ERROR: unable to save to the data file");
        console.log(e);
        throw "data file: save failure";
    }
};

// Initialization
loadRecords();


exports.getHash = function () {
    return dataContent.hash;
};

exports.setHash = function (hash) {
    if (dataContent.hash) {
        if (dataContent.records.length === 0) {
            dataContent.hash = hash;
        }
        else {
            throw "set hash: cannot change hash in diary with existing records";
        }
    }
    else {
        dataContent.hash = hash;
    }

    saveRecords();
};

exports.maxId = function () {
    return _.chain(records)
        .map(function (record) { return record.id; })
        .max()
        .value();
};

exports.getRecord = function (id) {
    return _.find(records, function (rec) {
        return rec.id === id;
    });
};

exports.getRecordsMetadata = function () {
    return _.map(records, function (record) {
        var metadata = _.clone(record);
        metadata.text = undefined;
        return metadata;
    });
};

exports.addRecord = function (record) {
    records.push(record);
    saveRecords();
};

exports.updateRecord = function (record) {
    var internal = exports.getRecord(record.id);
    // Set all the properties of internal (the old record) to record values
    _.extend(internal, record);
    saveRecords();
};

exports.deleteRecord = function (record) {
    dataContent.records = records = _.without(records, record);
    saveRecords();
};
