/**
 * Created by Pedro on 05/12/2016.
 */
const request = require('request');

var url = 'http://127.0.0.1:5984';

// Save a document
function save(db, doc, done) {
    request.put({
        url: url + '/' + db + '/' + doc._id,
        body: doc,
        json: true,
    }, function(err, resp, body) {
        if (err) return done('Unable to connect CouchDB');
        if (body.ok) {
            doc._rev = body.rev;
            return done(null,doc);
        }
        done('Unable to save the document')
    });
}

function find(db, username, done) {
    request.get({
        url: url + '/' + db + '/' + username,
        json: true
    }, function(err,res,body){
        if(err) done(err);
        else done(null,body);
    });
}

exports.findPlaylist = function(db,username,playlist,done){
    let callback = (err,body)=>{
        if (err)console.log(err);
        else {
            let playlistFound = body.user_obj.playlists.find(item => item.name == playlist);
            if(playlistFound != null){
                // Found
                done(null,playlistFound);
            }else{
                // Not found
                done(err,null);
            }
        }
    }
    find(db,username,callback);
}

exports.updateUserPlaylists = function(db, username, playlist, done){

    let callback = (err,body)=>{
        var playlists;
        if (err)console.log(err);
        else {
            playlists = body.user_obj.playlists;
            playlists.push(playlist);
            save(db,body,done);
        }
    }
    request.get({
        url: url + '/' + db + '/' + username,
        json: true
    }, function(err,res,body){
        if(err) callback(err);
        else callback(null,body);
    });
}

// Get all documents with the built-in 'All' view
exports.all = function(db, done) {
    request({
        url: url + '/' + db + '/_all_docs?include_docs=true',
        json: true
    }, function(err, res, body) {
        if (err) return done('Unable to connect to CouchDB');
        done(null, body);
    });
}

function updatePlaylist(db,username,playlistName,track,done){

    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            // Push a track
            let playlists = body.user_obj.playlists.find((item)=>item.name == playlistName);
            let shared = body.user_obj.shared.find((item)=>item.playlist == playlistName);
            if(playlists != null){
                playlists.tracks.push(track);
                save(db,body,done);
            }
            else if(shared != null){
                // We call the same method but for the user that owns the playlist
                // This is necessary cause the shared playlist doesn't hold the track information
                let owner = shared.owner;
                updatePlaylist(db,owner,playlistName,track,done);
            }
        }
    }
    request.get({
        url: url + '/' + db + '/' + username,
        json: true
    }, function(err,res,body){
        console.log(body);
        if(err) callback(err);
        else callback(null,body);
    });
}

exports.deleteFromPlaylist = function(db,username,playlistName,trackId,done){
    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            var tracks = body.user_obj.playlists.find((item)=>item.name == playlistName).tracks;
            // Remove desired track
            body.user_obj.playlists.find((item)=>item.name == playlistName).tracks = tracks.filter((t) => t.id != trackId);
            body.user_obj.shared.find((item)=>item.name == playlistName).tracks = tracks.filter((t) => t.id != trackId);

            save(db,body,done);
        }
    }
    request.get({
        url: url + '/' + db + '/' + username,
        json: true
    }, function(err,res,body){
        if(err) callback(err);
        else callback(null,body);
    });
}

function deleteFromPlaylist(db,username,playlistName,trackId,done){
    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            let playlists = body.user_obj.playlists.find((item)=>item.name == playlistName);
            let shared = body.user_obj.shared.find((item)=>item.playlist == playlistName);

            if(playlists != null){
                var tracks = body.user_obj.playlists.find((item)=>item.name == playlistName).tracks;
                body.user_obj.playlists.find((item)=>item.name == playlistName).tracks = tracks.filter((t) => t.id != trackId);
                save(db,body,done);
            }
            else if(shared != null){
                let owner = shared.owner;
                deleteFromPlaylist(db,owner,playlistName,trackId,done);
            }
        }
    }
    request.get({
        url: url + '/' + db + '/' + username,
        json: true
    }, function(err,res,body){
        if(err) callback(err);
        else callback(null,body);
    });
}

exports.sendMessage = function(db,username,invite,done){
    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            var messageBox = body.user_obj.messageBox;
            messageBox.push(invite);
            save(db,body,done);
        }
    }
    find(db,username,callback);
}

exports.updateShared = function(db,username,playlist,done){
    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            var message = body.user_obj.messageBox.find(t => t.playlist == playlist);
            body.user_obj.shared.push({
                owner: message.from,
                playlist: message.playlist,
                playlistHref: message.playlistHref,
                permission: message.permissions
            });
            save(db,body,done);
        }
    }
    find(db,username,callback)
}

exports.updateSharing = function(db,username,playlist,userToShare,permissions,done){
    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            body.user_obj.playlists
                .find(t => t.name == playlist)
                .sharing
                .push({
                    user: userToShare,
                    write: permissions
                });
            save(db,body,done);
        }
    };
    find(db,username,callback)
}

exports.deleteInvitation = function (db, username, playlist, done) {
    let callback = (err,body)=>{
        if(err)console.log(err);
        else{
            const messages = body.user_obj.messageBox;
            body.user_obj.messageBox = messages.filter((t) => t.playlist != playlist);
            save(db,body,done);
        }
    };
    find(db,username,callback);
}

exports.save = save;
exports.find = find;
exports.updatePlaylist = updatePlaylist;
exports.deleteFromPlaylist = deleteFromPlaylist;