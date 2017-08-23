var mongo = require("mongoose");
var Schema = mongo.Schema;

var userSchema = Schema({
    id: String,
    username: String,
    password: String,
    email: String
});

var User = mongo.model("user", userSchema);

exports.export = {
    User: User,
    UserSchema: userSchema
};
