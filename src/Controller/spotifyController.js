const service = require('./../Service/spotifyApi.js');
const fs = require('fs');
const hbs = require('hbs');
const url = require('url');
const userDb = require('../Model/dbMiddleMan.js');
const userFactory = require('../Model/userFactory.js');
const playlistFactory = require('../Model/playlistFactory.js');
const trackFactory = require('../Model/track.js');
const invitationFactory = require('../Model/invitation');

// Acrescentado view para playlists quando user esta logado
hbs.registerPartial('userAcc', fs.readFileSync('./views/userAccountView.hbs').toString());
hbs.registerPartial('searchForm', fs.readFileSync('./views/searchFormView.hbs').toString());

// Handlers passa a ser uma função de middleware
const handlers = function (request, response, next) {

    // Antes estava no server
    const urlInfo = url.parse(request.url, true);
    var endPoint = urlInfo.pathname;
    endPoint = endPoint.slice(1);

    if (!handlers.hasOwnProperty(endPoint))return next(); // Passa para o proximo middleware
    handlers[endPoint](request,
        (err, content) => {
            if (err) {
                response.writeHead(500);
                response.write(err);
                response.end();
            }
            else {
                response.status(200).render(endPoint, content);
            }
        });
};

handlers.home = function (request, cb) {
    let data = {};
    data.user = request.user;
    cb(null, data);
};

handlers.search = function (request, cb) {
    const query = request.query;
    service.searchQuery(query,
        (err, data)=> {
            if (err != null)throw err;
            else {
                data.user = request.user;
                cb(null, data);
            }
        });
};

handlers.artist = function (request, cb) {
    const query = request.query;
    service.searchArtistById(query,
        (err, data) => {
            if (err) throw err;
            else {
                data.user = request.user;
                cb(null, data);
            }
        });
};

handlers.playlist = function (request, cb) {
    const query = request.query;
    userDb.findPlaylist(query.username, query.playlist, (err, data)=> {
        if (err)console.log(err);
        else {
            if (data.sharing.find(t => t.user == request.user.username) || data.owner == request.user.username) {
                data.user = request.user;
                cb(null, data);
            } else {
                console.log('User is not allowed to access this playlist');
                cb('User is not allowed to access this playlist', null);
            }
        }
    });
};

handlers.album = function (request, cb) {
    const query = request.query;
    service.searchAlbum(query.id, (err, data) => {
        if (err) throw err;
        else {
            data.user = request.user;
            cb(null, data);
        }
    });
};

handlers.displayUsers = function (request, cb) {
    let playlist = request.query.playlist;
    let playlistHref = request.query.playlistHref;
    userDb.all((err, docs)=> {
        if (err)console.log(err);
        else {
            const data = {
                users: docs.rows.filter(t => t.id != request.user.username && (NOR(t.doc,playlist))),
                playlistName: playlist,
                playlistHref: playlistHref
            };
            data.user = request.user;
            cb(null, data);
        }
    });
};

/* LOGIN RELATED FUNCTIONS */

function login(req, res, next, passport) {
    let register = req.body.register;
    if (register !== undefined) {
        req.id = req.body.username;
        createUser(req.body.username, req.body.password, (err, doc)=> {
            if (err)console.log(err);
            else {
                console.log('Prepraring to autheticate');
                passport.authenticate('local', {successRedirect: req.get('referer')})(req, res, next);
            }
        });
    } else {
        console.log('Prepraring to autheticate');
        passport.authenticate('local', {successRedirect: req.get('referer')})(req, res, next);
    }
}

/* DATABASE RELATED FUNCTIONS */

function newPlaylist(username, playlist, redirectCallback) {
    userDb.updateUserPlaylists(username, new playlistFactory.Playlist({
        name: playlist,
        owner: username,
        href: '/playlist?username=' + username + '&playlist=' + playlist
    }), (err, resp)=> {
        if (err) {
            console.log(err);
        }
        redirectCallback();
    });
}

function addToPlaylist(req, res, next) {
    const track = {
        name: req.body.trackName,
        id: req.body.trackId
    }
    if (req.user) {
        updatePlaylist(req.user.username, req.body.playlist, track, ()=> {
            res.redirect(req.get('referer'));
        });
    } else {
        console.log('No user logged');
        next();
    }
}

function updatePlaylist(username, playlistName, trackData, redirectCallback) {
    userDb.updatePlaylist(username, playlistName, new trackFactory.Track(trackData), (err, resp)=> {
        if (err)console.log(err);
        else {
            redirectCallback();
        }
    });
}

function deletePlaylist(username, playlistName, redirectCallback) {
    userDb.deletePlaylist(username, playlistName, (err, resp)=> {
        if (err)console.log(err);
        else {
            redirectCallback();
        }
    });
}

function deleteFromPlaylist(username, playlistName, trackId, redirectCallback) {
    userDb.deleteFromPlaylist(username, playlistName, trackId, (err, resp)=> {
        if (err)console.log(err);
        else {
            redirectCallback();
        }
    });
}

function forwardInvitation(req,response) {
    const data = req.body;
    data.from = req.user.username;
    let invite = invitationFactory.Invitation(data.playlist, data.from, data.playlistHref, data.permissions);
    userDb.sendMessage(data.user, invite, (err, res)=> {
        if (err)console.log(err);
        else {
            console.log('Message received' + res)
            response.status(200).send({ user: data.user });
        }
    });
}

function acceptInvitation(req, response, data) {
    const user = req.user.username;

    userDb.updateShared(user, data.playlist, (err, res)=> {
        if (err)console.log(err);
        else {
            /*
             * To fetch permissions we must use res(document) which is the recent updated doc
             * */
            const permissions = res.user_obj.messageBox.find(t => t.playlist == data.playlist).permissions;
            userDb.updateSharing(data.from, data.playlist, user, permissions, (err, res)=> {
                if (err)console.log(err);
                else {

                    const returnObject = {

                        id: data.playlist, // Message box index to remove
                        // List group item to be added to SharedPlaylist
                        sharedNode: "<li class=\"my-list-group-item clearfix\"><a href=\"" +
                                    "playlist?username=" + data.from + "&playlist=" + data.playlist + "\">"
                                    + data.playlist + "</a> </li>"
                    };
                    console.log(returnObject.index + '\n' + returnObject.sharedNode);
                    userDb.deleteInvitation(user, data.playlist, (err, doc)=> {
                        if (err)console.log(err);
                        else {
                            console.log(data.playlist + ' is now available in your account');
                            response.status(200).send(returnObject);
                        }
                    });
                }
            });
        }
    });
}

function refuseInvitation(req, response, data) {
    const user = req.user.username;
    userDb.deleteInvitation(user, data.playlist, (err, doc)=> {
        if (err)console.log(err);
        else {
            console.log('Invitation refused');
            response.status(200);
            response.send({ id: data.playlist });
        }
    });
}

function createUser(username, password, authenticate) {
    userDb.submit(userFactory.createUser(username, password), authenticate);
}

function NOR(doc,playlist){
    /*
    * If message box is empty or doesnt contain an invite for the given playlist, it means we can send an invite
    * If shared list is empty or doesnt contain a playlist with the given name, it means we can send an invite
    * The combination of this 2 statements tells us, who we can send an invite to.
    * */
    let mb = doc.user_obj.messageBox.length == 0 ? false : doc.user_obj.messageBox.find(t => t.playlist == playlist);
    let shared = doc.user_obj.shared.length == 0 ? false : doc.user_obj.shared.find(t => t.playlist == playlist);
    return !(mb || shared);
}

module.exports.handlers = handlers;
module.exports.createUser = createUser;
module.exports.addToPlaylist = addToPlaylist;
module.exports.newPlaylist = newPlaylist;
module.exports.updatePlaylist = updatePlaylist;
module.exports.deleteFromPlaylist = deleteFromPlaylist;
module.exports.deletePlaylist = deletePlaylist;
module.exports.login = login;
module.exports.forwardInvitation = forwardInvitation;
module.exports.acceptInvitation = acceptInvitation;
module.exports.refuseInvitation = refuseInvitation;
