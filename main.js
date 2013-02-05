#!/usr/bin/env node

var redis = require('redis'),
    url = require('url'),
    vm = require('vm'),
    async = require('async'),
    _ = require('underscore');

var client = redis.createClient();

function get(urlSource, callback)
{
    var urlinfo = url.parse(urlSource);
    var protocol = urlinfo.protocol.split(/:/)[0];
    require(protocol).get({
        host: urlinfo.hostname,
        port: urlinfo.port,
        path: urlinfo.pathname
    }, function (res) {
        var buf = new Buffer(0);
        res.on('data', function(chunk) {
            buf = Buffer.concat([buf, chunk]);
        });
        res.on('end', function() {
            var global = {
                module: {
                    exports: {}
                }
            };
            global.exports = global.module.exports;
            vm.runInNewContext(buf.toString('utf8'), global);
            callback(global.module.exports);
        });
    });
}

function getToDb(options, callback)
{
    get(options.url, function(data) {
        var items = data[options.propertyName];
        var names = [];
        _.each(Object.keys(items), function(name) {
            var item = items[name];
            client.hset("pokemon-db:" + options.hName, name, JSON.stringify(item));
            names.push(name);
        });
        names.sort();
        callback(items, names);
    });
}

function getPokedex(callback)
{
    getToDb({
        url: 'https://raw.github.com/Zarel/Pokemon-Showdown/master/data/pokedex.js',
        propertyName: 'BattlePokedex',
        hName: 'pokedex'
    }, function(items, names) {
        console.log(names.length + " pokemons saved.");
        callback(null, names);
    });
}

function getMovedex(callback)
{
    getToDb({
        url: 'https://raw.github.com/Zarel/Pokemon-Showdown/master/data/moves.js',
        propertyName: 'BattleMovedex',
        hName: 'movedex'
    }, function(items, names) {
        console.log(names.length + " moves saved.");
        callback(null, names);
    });
}

function getAbilities(callback)
{
    getToDb({
        url: 'https://raw.github.com/Zarel/Pokemon-Showdown/master/data/abilities.js',
        propertyName: 'BattleAbilities',
        hName: 'abilities'
    }, function(items, names) {
        console.log(names.length + " abilities saved.");
        callback(null, names);
    });
}

function getItems(callback)
{
    getToDb({
        url: 'https://raw.github.com/Zarel/Pokemon-Showdown/master/data/items.js',
        propertyName: 'BattleItems',
        hName: 'items'
    }, function(items, names) {
        console.log(names.length + " items saved.");
        callback(null, names);
    });
}

function getFormatsData(callback)
{
    getToDb({
        url: 'https://raw.github.com/Zarel/Pokemon-Showdown/master/data/formats-data.js',
        propertyName: 'BattleFormatsData',
        hName: 'formats-data'
    }, function(items, names) {
        console.log(names.length + " formats data saved.");
        callback(null, names);
    });
}

function getTypeChart(callback)
{
    getToDb({
        url: 'https://raw.github.com/Zarel/Pokemon-Showdown/master/data/typechart.js',
        propertyName: 'BattleTypeChart',
        hName: 'typechart'
    }, function(items, names) {
        console.log(names.length + " typecharts saved.");
        callback(null, names);
    });
}

async.parallel([
    getPokedex,
    getMovedex,
    getAbilities,
    getItems,
    getFormatsData,
    getTypeChart
], function (err, results) {
    client.quit();
});
