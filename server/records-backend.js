var fs = require('fs')
    _ = require('underscore');

var datafile = __dirname + "/../data/records.json";

var records = [];

var loadRecords = function () {
    var data;

    try {
        data = fs.readFileSync(datafile);
        records = JSON.parse(data);
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

var saveRecords = function () {
    try {
        fs.writeFileSync(datafile, JSON.stringify(records));
    }
    catch (e) {
        console.log("ERROR: unable to save to the data file");
        console.log(e);
        throw "Data file save failure";
    }
};

// Initialization
loadRecords();


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
    records = _.without(records, record);
    saveRecords();
};

