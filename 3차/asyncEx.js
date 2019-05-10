const async = require('async');

const tasks = [
    function(callback) {
        setTimeout(() => {
            console.log('task1');
            callback(null, '1-1', '1-2');
        }, 200);
    },
    function(callback) {
        setTimeout(() => {
            console.log('task2');
            callback(null, '2-1');
        }, 100);
    }
]

async.series(tasks, (err, results) => {
    console.log(results);
});

const tasks2 = [
    function(callback) {
        setTimeout(() => {
            console.log('task1');
            callback(null, 4, 27);
        }, 200);
    },
    function(num1, num2, callback) {
        setTimeout(() => {
            console.log('task2');
            callback(null, num1 + num2);
        }, 100);
    },
    function(data, callback) {
        console.log(data);
    }
]

async.waterfall(tasks2, (err, result) => {
    console.log(result);
});

var timestamp = new Date().getTime();

async.parallel([
    function(callback) {
        setTimeout(function() {
            console.log('one');
            callback(null, 'one');
        }, 2000);
    },
    function(callback) {
        setTimeout(function() {
            console.log('two');
            callback(new Error("Error!"), 'two');
        }, 1000);
    },
    function(callback) {
        setTimeout(function() {
            console.log('three');
            callback(null, 'three');
        }, 3000);
    }
], function(err, results) {
    console.log(results);
    console.log(new Date().getTime() - timestamp, 'ms');
});