
/**
 * Contains information abut user profile database
 * 
 * @class UserProfileInfo
 */
var UserProfileInfo = class UserProfileInfo {
    constructor() {
        this.countUsers = 0;
    }

    toString() {
        var str = "Users count: " + this.countUsers;
        return str;
    }
}

module.exports.UserProfileInfo = UserProfileInfo;