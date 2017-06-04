const Playlist = require('./playlistFactory');

function createUser(username,password){
    return {
        username: username,
        password: password,
        playlists: [],
        shared: [],
        messageBox: []
    }
}

module.exports.createUser = createUser;