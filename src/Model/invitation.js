/**
 * Created by Pedro on 06/01/2017.
 */

function Invitation(playlist, from,playlistHref, permissions){
    return{
        playlist : playlist,
        from: from,
        playlistHref:playlistHref,
        permissions: permissions
    }
}

module.exports.Invitation = Invitation;