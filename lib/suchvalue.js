#!/usr/bin/env node

'use strict';

var clc = require('cli-color');
var http = require('http');
var Q = require('q');

var addresses = {};
var args = process.argv.splice(2);
var balance = 0;
var requests = [];
var usd;

var request = function(url, type) {
  var deferred = Q.defer();
  var buffer = '';
  var req = http.request(url, function(res) {
    res.on('data', function (data) { buffer += data.toString(); });
    res.on('end', function() {
      deferred.resolve(type === 'address' ? buffer : JSON.parse(buffer));
    });
  });
  req.end();
  return deferred.promise;
};

requests.push(request('http://dogecoinaverage.com/USD.json', 'usd').then(function(response) {
  usd = response.vwap;
}));

args.forEach(function(val) {
  val = val.split('=');
  requests.push(request('http://dogechain.info/chain/Dogecoin/q/addressbalance/' + val[0]).then(function(response) {
    addresses[val[0]] = parseFloat(response);
    balance += addresses[val[0]];
  }));
});

Q.all(requests).then(function() {
  console.log('');
  console.log(clc.magenta('1 doge in USD'));
  console.log(clc.magenta('-------------'));
  console.log('$' + usd);

  args.forEach(function(val) {
    val = val.split('=');
    console.log('');
    console.log(clc.blue(val[0]) + (val[1] ? clc.blue(' (' + val[1] + ')') : ''));
    console.log(clc.blue('----------------------------------'));
    console.log(addresses[val[0]] + ' doge / $' + (addresses[val[0]] * usd));
  });

  console.log('');
  console.log(clc.green('Total value'));
  console.log(clc.green('-----------'));
  console.log(balance + ' doge / $' + balance * usd);
});
