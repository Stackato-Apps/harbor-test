/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    net = require('net'),
    dgram = require('dgram');

var app = express();

app.configure(function() {
    app.set('port', process.env.VCAP_APP_PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});

function createUDPServer(port) {
    var server = dgram.createSocket('udp4');

    server.on('message', function(message, rinfo) {
        console.log('server got UDP message: %s from %s:%d',
            message,
            rinfo.address,
            rinfo.port);
        server.send(message, 0, message.length, rinfo.port, rinfo.address);
    });

    server.on('listening', function() {
        console.log("UDP echo service listening on " + port);
    });

    server.on('error', function(err) {
        console.log(err)
    });

    server.bind(port);
}

function createTCPServer(port) {

    var server = net.createServer(function(conn) {
        console.log("TCP connection from " + conn.remoteAddress + " on port " + conn.remotePort);
        conn.setEncoding("utf8");
        var buffer = "";

        conn.on("data", function(data) {
            for (var i = 0; i <= data.length; i++) {
                var char = data.charAt(i);
                buffer += char;
                if (char == "\n") {
                    conn.write(buffer);
                    buffer = "";
                }
            }
        });
    });

    server.listen(port, "0.0.0.0");
    console.log("TCP echo server listening on port: " + port);
}

if (!process.env.VCAP_APP_PORT) {
    console.error("This app is not running a Stackato environment")
} else {
    if (!process.env.STACKATO_SERVICES) {
        console.error("No services are bound to this app")
    } else {
        services = JSON.parse(process.env.STACKATO_SERVICES);
        for (s in services) {
            if (s.lastIndexOf("udp", 0) === 0) {
                createUDPServer(services[s].int_port);
            } else if (s.lastIndexOf("both", 0) === 0) {
                createUDPServer(services[s].int_port);
                createTCPServer(services[s].int_port);
            } else {
                createTCPServer(services[s].int_port);
            }
        }
    }

}
