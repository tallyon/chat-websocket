const uuidv4 = require("uuid/v4");
var assert = require("assert");

class ChatClient {
    constructor(name) {
        assert.notEqual(name, null);
        assert.notEqual(name.length < 1, true);

        // Generate uuid
        this.userToken = uuidv4();
        this.username = name;
    }

    toString() {
        return "user token (id): " + this.userToken + ", username: " + this.username;
    }
}

module.exports = exports = {
    ChatClient: ChatClient
}
