const uuidv4 = require("uuid/v4");
var assert = require("assert");

class ChatClient {
    constructor(name) {
        assert.notEqual(name, null);
        assert.notEqual(name.length < 1, true);

        // Generate uuid
        this.id = uuidv4();
        this.name = name;
    }

    toString() {
        return "id: " + this.id + ", name: " + this.name;
    }
}

module.exports = exports = {
    ChatClient: ChatClient
}
