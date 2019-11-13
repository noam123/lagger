#!/usr/bin/env node
var spawn = require('child_process').spawn,
    path = require('path'),
    fs = require('fs'),
    args = [path.join(__dirname, '../lib/app.js')];

process.argv.slice(2).forEach(function(arg){
    var flag = arg.split('=')[0];

    switch (flag) {
        case '-f':
        case '-v':
        case '-h':
        case '-p':
        case '--performance-threshold':
        case '--format':
            args.push(arg);
        default:
            break;
    }
});

// console.log(`spawn ${process.execPath}, args: ${args}`)
var proc = spawn(process.execPath, args, { stdio: 'inherit' });
proc.on('exit', function (code, signal) {
    process.on('exit', function(){
        if (signal) {
            process.kill(process.pid, signal);
        } else {
            process.exit(code);
        }
    });
});

// terminate children.
process.on('SIGINT', function () {
    proc.kill('SIGINT'); // calls runner.abort()
    proc.kill('SIGTERM'); // if that didn't work, we're probably in an infinite loop, so make it die.
});
