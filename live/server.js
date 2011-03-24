var http = require('http');
var io = require('socket.io');
var zeromq = require('zeromq');
var sys = require('sys');
//var redis = require('redis');

// create the redis client
//var redis_client = redis.createClient();
//redis_client.select(1);

// globals holding the client list
subscriptions = {'null' : []}; // all in null for now

// create the zeromq socket
var zmq = zeromq.createSocket('pull');
zmq.connect("tcp://localhost:6000", function (e) {
    if (e === undefined) { 
        console.log("created a zmq socket...");
    } else {
        console.log("could not create a zmq socket....");
    }
});

zmq.on('message', function (msg) {
    try {
        update = JSON.parse(msg);
    } catch (SyntaxError) {
        console.log('Invalid JSON: ' + message);
        return false;
    }
    console.log("got update from zeromq: " + msg);
    clients = subscriptions[update.memory_id] || []; 
    console.log("sending to all: " + clients);
    for (var i in clients) {
    //for (var i in subscriptions['null']) {
        //subscriptions['null'][i].send(JSON.stringify({ 'action' : 'update',
        clients[i].send(JSON.stringify({ 'action' : 'update',
                                                               'type' : 'photo',
                                                               '_id' : update.photo_id,
                                                               'thumb' : update.thumb,
                                                               'full' : update.full }));
    }
});

zmq.on('error', function (e) {
    console.log("error: " + e);
});

// create the server
var server = http.createServer(function(request, result) {
    result.writeHead(200, {'Content-Type' : 'text/html'});
    client = "<script src=\"http://localhost:7000/socket.io/socket.io.js\"></script><script>var socket = new io.Socket();socket.options.port = 7000;socket.connect();socket.on('message', function(m) {console.log('got a msg: ' + m);m = JSON.parse(m);switch (m.action) {case \"ping\":socket.send(JSON.stringify({ \"action\" : \"pong\",\"memory\" : \"null\" }));break;}});</script>";
    result.end(client);
});
server.listen(7000);

// set up socket.io
var socket = io.listen(server);
socket.on('connection', function(client) {
    client.on('message', function(message) {
        try {
            request = JSON.parse(message);
        } catch (SyntaxError) {
            console.log('Invalid JSON: ' + message);
            return false;
        }

        console.log('Valid JSON: ' + message);

        switch (request.action) {
            case "pong":
                subscriptions[request.memory] = subscriptions[request.memory] || [];
                subscriptions[request.memory].push(client);
                client.memory = request.memory;
                console.log(request.memory + " is now: " + subscriptions[request.memory]);
            break;
            default:
                console.log("don't know what to do with this message");
        }
    });

    client.on('disconnect', function() {
        //delete global.subscriptions[request.memory].client;
        console.log('got a disconnect!');
        for (var i in subscriptions[client.memory]) {
            if (subscriptions[client.memory][i] === client) {
                console.log("got a match!");
                delete subscriptions[i];
            }
        }
        console.log(client.memory + " is now: " + subscriptions[client.memory]);
    });

    client.send(JSON.stringify({'action' : 'ping'}));
});
