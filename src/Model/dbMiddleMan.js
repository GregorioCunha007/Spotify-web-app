/**
 * Created by Pedro on 05/12/2016.
 */
const db = require('./db'), DATABASE = 'users', userModel = require('./userFactory');

exports.submit = function(user,done) {
    var data = {
        _id: user.username,
        user_obj: user
    };
    db.save(DATABASE, data, function(err, doc) {
        if (err) return done('Unable to connect to CouchDB');
        if (doc.error) return done('Unable to save the comment');
        done(null, doc);
    });
}

exports.find = function(username,cb){
    db.find(DATABASE,username,cb);
}

exports.findPlaylist = function(username,playlist,cb){
    db.findPlaylist(DATABASE,username,playlist,cb);
}

exports.updateUserPlaylists = function(username, playlist, cb){
    db.findPlaylist(DATABASE,username,playlist.name,(err,resp)=>{
        // Resp is null when its safe to enter playlist name
        if(resp == null){
            db.updateUserPlaylists(DATABASE,username,playlist,cb);
        }else{
            cb('Error playlist alreadyFound',null);
        }
    });
}

exports.updatePlaylist = function(username,playlistName,track,cb){
    db.updatePlaylist(DATABASE,username,playlistName,track,cb);
}

exports.deleteFromPlaylist = function(username,playlistName,trackId,cb){
    db.deleteFromPlaylist(DATABASE,username,playlistName,trackId,cb);
}

exports.deletePlaylist = function(username,playlistName,cb){
    db.deletePlaylist(DATABASE,username,playlistName,cb)
}

exports.sendMessage = function(username,invite,cb){
    db.sendMessage(DATABASE,username,invite,cb);
}

exports.updateShared = function(username,playlist,cb){
    db.updateShared(DATABASE,username,playlist,cb);
}

exports.updateSharing = function(username,playlist,userToShare,permissions,cb){
    db.updateSharing(DATABASE,username,playlist,userToShare,permissions,cb);
}

exports.deleteInvitation = function(username,playlist,cb){
    db.deleteInvitation(DATABASE,username,playlist,cb);
}

exports.all = function(cb){
    db.all(DATABASE,cb);
}