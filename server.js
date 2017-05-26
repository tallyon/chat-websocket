var WebSocketServer = require('websocket').server;
var express = require("express");
var app = express();

const port = 8080;

// For each connection output current time, requesting ip and url to the console
app.all("*", function(req, res, next) {
    var timeNow = new Date(Date.now());
    console.log(timeNow.toUTCString() + ": " + req.ip + " " + req.method + " " + req.url);
    next();
});

var server = app.listen(port, () => {
    console.log("Chat server listening on port", port);
});

var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
    closeTimeout: 10000,
    maxReceivedMessageSize: 10000
});

function originIsAllowed(origin) {
    return true;
}

wsServer.on("request", function(req) {
    if(originIsAllowed(req.origin) == false) {
        req.reject();
        console.log("Connection from origin", req.origin, "rejected");
        return;
    }

    var connection = req.accept("chat", req.origin);
    
    var timeNow = new Date(Date.now());
    console.log(timeNow.toUTCString(), "Connection accepted from", req.origin);
    
    connection.on("message", function(message) {
        if(message.type === "utf8") {
            console.log("Received message:", message.utf8Data);

            // If message was PING send message type ping with no other text
            if(message.utf8Data == "PING") {
                var pingResponse = {
                    type: "PING",
                    data: {
                        timestamp: Math.floor(Date.now() / 1000)
                    }
                }
                connection.sendUTF(JSON.stringify(pingResponse));
            }
            // If message was not ping treat it as chat text
            else {
                var textResponse = {
                    type: "TEXT",
                    data: "This is response from server"
                };
                connection.sendUTF(JSON.stringify(textResponse));
            }
        }
        else if(message.type === "binary") {
            console.log("Received binary message of", message.binaryData.length, "bytes");
            connection.sendBytes(0);
        }
    });
    connection.on("close", function(reasonCode, description) {
        console.log("Peer", connection.remoteAddress, "disconnected");
    });
});
