var http = require('http');
var io = require('socket.io');
var zeromq = require('zeromq');

// create the zeromq socket
var events = zeromq.createSocket('pull');
events.connect("tcp://localhost:6000", function (e) {
    if (e === undefined) { 
        console.log("created a zmq socket...");
    } else {
        console.log("could not create a zmq socket....");
    }
});

events.on('message', function (msg) {
    console.log('recieved ' + msg);
});

events.on('error', function (e) {
    console.log("error: " + e);
});


//
var server = http.createServer(function(request, result) {
    result.writeHead(200, {'Content-Type' : 'text/html'});
    result.end('enter the live server!');

});

server.listen(7000);

var socket = io.listen(server);
socket.on('connection', function(client) {
    //new client is here!
    client.on('message', function() { console.log('got a message!'); });
    client.on('disconnect', function() { console.log('got a disconnect!'); });
});

