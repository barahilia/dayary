var backend = require('./sqlite-backend');


console.log("Hi");
backend.setSettings({ d: 18, b: "ba", a: 7, ku: 4}, function () {
    backend.getSettings(function (s) {
        console.log(s);
    });
});
