const WebSocketServer = require('websocket').server;
const uuidv4 = require("uuid/v4");
const express = require("express");
const app = express();

const port = 8080;

// Array with all registered users
var registeredUsers = [];

// Array with all websocket connections
var socketConnections = [];

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
    // Add this websocket connection to array of all connections
    socketConnections.push(connection);
    
    var timeNow = new Date(Date.now());
    console.log(timeNow.toUTCString(), "Connection accepted from", req.origin);
    
    connection.on("message", function(message) {
        if(message.type === "utf8") {
            // Parse message
            var parsedMessage = null;

            try {
                parsedMessage = JSON.parse(message.utf8Data);
            }
            catch(e) {
                console.log("Could not parse incoming message");
                return;
            }

            console.log("Received message:", parsedMessage);

            var messageType = parsedMessage.type;

            if(messageType == null) {
                console.log("Invalid message type, skip message");
                return;
            }

            switch(messageType.toLowerCase()) {
                case "register":
                    // REGISTER message received from the client
                    registerTransactionHandler(connection, parsedMessage);
                    break;
                case "chat":
                    // CHAT message received from the client
                    chatTransactionHandler(connection, parsedMessage);
                    break;
                default:
                    console.log("Unrecognized message type:", messageType);
                    return;
            }

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

function registerTransactionHandler(connection, message) {
    if(message == null || message.data == null || message.data.username == null) return;

    var username = message.data.username;
    console.log("Received register transaction message from the client to register username", username);

    // Register new user
    var userToken = registerUser(username);

    var responseRegisterMessage = {
        type: "register",
        timestamp: Math.floor(Date.now().valueOf() / 1000),
        data: null
    };

    if(userToken === "") {
        // User has not been registered, add error message to response
        responseRegisterMessage.error = "username taken";
    }
    else {
        // User has been registered, add username and user token to response
        responseRegisterMessage.data = {
            username: username,
            userToken: userToken
        };
    }

    // Send back register transaction message to the user
    connection.sendUTF(JSON.stringify(responseRegisterMessage));

    // Send chat message to broadcast new user entering the chat
    sendChatMessage(socketConnections, username + " has joind the chat!");
}

/**
 * Registers new user in chat. Returns user token string when successfuly added user to chat, empty string otherwise.
 * 
 * @param {string} username Username of new user
 * @return {string}
 */
function registerUser(username) {
    // Check if there is user with this username registered
    var foundUser = registeredUsers.find((user, index) => {
        return user.username == username;
    });

    if(foundUser == null) {
        // This username is not taken
        var newUser = {
            username: username,
            userToken: uuidv4()
        };

        // Add new user to registered users array
        registeredUsers.push(newUser);

        // Return user token of registered user
        return newUser.userToken;
    }
    else {
        // This username is taken
        return "";
    }
}

/**
 * Sends chat transaction message to clients.
 * 
 * @param {connection} connection WebSocket connection object
 * @param {string} body Body text of chat message
 */
function sendChatMessage(connections, body) {
    // Create transaction message with type chat
    var transactionMessage = {
        type: "chat",
        timestamp: Math.floor(Date.now().valueOf() / 1000),
        data: {
            body: body
        }
    };

    console.log("Sending chat transaction message to the clients:", transactionMessage);
    connections.forEach((connection) => {
        connection.sendUTF(JSON.stringify(transactionMessage));
    });
}

function chatTransactionHandler(connection, message) {
    if(message == null || message.data == null || message.data.userToken == null) return;

    console.log("Received chat transaction message from the client to broadcast the message", message);

    var userToken = message.data.userToken;

    // Find username of the user in array of registered users
    var foundUser = registeredUsers.find((user) => {
        return user.userToken == userToken;
    });

    if(foundUser == null) {
        // Could not find user with this token
        return;
    }
    else {
        // Found user with provided token, create chat message body to broadcast
        var chatMessageBody = foundUser.username + ": " + message.data.body;

        // Send chat message
        sendChatMessage(socketConnections, chatMessageBody);
    }
}
