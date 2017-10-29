const WebSocketServer = require('websocket').server;
const WebSocketConnection = require("websocket").connection;
const uuidv4 = require("uuid/v4");
const assert = require("assert");

class WSServer {

    constructor(httpServer, onMessageHandler, onCloseHandler) {
        assert.notEqual(httpServer, null);

        this.wsServer = new WebSocketServer({
            httpServer: httpServer,
            autoAcceptConnections: false,
            closeTimeout: 10000,
            maxReceivedMessageSize: 10000
        });

        // Save handler functions
        this.onMessageHandler = onMessageHandler;
        this.onCloseHandler = onCloseHandler;

        // Connections map
        this.connections = new Map();

        this.wsServer.on("request", (req) => {
            if(originIsAllowed(req.origin) == false) {
                req.reject(404, "origin not specified");
                console.log("\tConnection from origin", req.origin, "rejected");
                return;
            }

            // Open connection
            let openedConnection = this.openConnection(req);
            console.log("\tConenction to " + openedConnection.remoteAddress + " opened (id: " + openedConnection["id"] + "), connections count: " + this.connections.size);
        });
    }

    openConnection(req) {
        let connection = req.accept("chat", req.origin);
        // Set id property on conection with uuidv4
        let id = uuidv4();
        connection["id"] = id;
        // Add this websocket connection to array of all connections
        this.connections.set(id, connection);
        
        var timeNow = new Date(Date.now());
        console.log("\t" + timeNow.toUTCString(), "Connection accepted from", req.origin);
        
        connection.on("message", (message) => {
            if(this.onMessageHandler != null) {
                this.onMessageHandler(connection, message);
            } else {
                // Default message handler
                console.warn("\twarning: no message handler function provided");
                console.log("\tConnection", connection.socket.remoteAddress, "received message:", message);
            }
        });

        connection.on("close", (reasonCode, description) => {
            if(this.onCloseHandler != null) {
                this.onCloseHandler(connection, reasonCode, description);
            } else {
                // Default close handler
                console.warn("\twarning: no close handler function provided");
            }

            // Remove connection from array of connections
            this.connections.delete(connection.id);
            
            console.log("\tPeer", connection.socket.remoteAddress, "disconnected, connections left:", this.connections.size);
        });

        return connection;
    }
}


function originIsAllowed(origin) {
    // Accept only connections from browser with specified origin
    if(origin == null || origin == "*") return false;

    return true;
}

module.exports = exports = {
    WSServer: WSServer
};
