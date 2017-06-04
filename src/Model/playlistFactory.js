/**
 * Created by Pedro on 06/12/2016.
 */

function Playlist(data){
    this.tracks = [];
    this.sharing = []; // jonh : readOnly, alex: readOnly
    this.owner = data.owner;
    this.href = data.href;
    this.name = data.name;
}

module.exports.Playlist = Playlist;