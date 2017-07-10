# NodeJS chat server running on websockets

## Installation

Install all npm packages

```bash
npm install
```

And you're pretty much good to go.

## Usage with test client

Start server with

```bash
node ./server.js
```

An open file *testclient.html* in browser, connection should be established on port 8080 to the server running and communication working (use console in developer tools to see exactly how message looks like, pings are outputted in html).

## Client - Server transactions

### Quickstart

```javascript
// Load chatClient.js script before code below

// Create instance of Chat class - provide connection url, single protocol and username to register
var chat = new Chat("ws://localhost:8080", "chat", "username");

// Register callback for incoming chat message event - e.g. show messageBody in chat window
chat.registerIncomingChatMessageCallback(function(messageBody) {
    console.log("Got message body:", messageBody);
});

// Send chat message - e.g. after SEND button is pressed take some text field val and pass to method
chat.sendMessage("This is test chat message that will be sent to all connected clients.");
```

### Transaction message type format

All communication between client and server should be happening over JSON payloads sent over WebSocket connection, which will be referred to as transaction messages.

Valid transaction message schema:

```json
{
    "type": "message type",
    "timestamp": 147726346,
    "data": {
        "contains": "any data"
    },
    "error": "optional error message"
}
```

Transaction message has to contain type, which is a string, timestamp, which is number of seconds that passed since epoch and data which is a data object that can contain any data. Optional error string can appear in transaction message.

#### Register user in chat

Registering new user in chat requires client to send transaction message to the server:

```json
{
    "type": "register",
    "timestamp": 147726346,
    "data": {
        "username": "username that the user want to register with"
    }
}
```

If username provided in data.username is not already in use by other users or is not a restricted username (TODO), the server will add this username to the list of users and associate user token that will be sent back in response transaction message:

```json
{
    "type": "register",
    "timestamp": 147726346,
    "data": {
        "username": "username that was granted to the user",
        "token": "&2Hfh37h1f2hH@@873G&g#@#m"
    }
}
```

All users are pinged every 60 seconds after they are registered. If user does not respond to the ping he will be unregistered and his username will be free to use.

#### Send chat message

TODO

#### How to handle PING messages

TODO

#### Sending and receiving UNREGISTER message when user disconnects

TODO
