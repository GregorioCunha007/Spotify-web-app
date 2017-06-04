const Artist = require('./artist.js');
const Album = require('./album.js')

function DetailedArtist(artist, albData, offset){
    this.artist = artist;
    this.albums = [];
    this.offsetForward = Number(offset) + 20;
    this.offsetBackwards = Number(offset) - 20;
    this.next = true;
    if(albData.offset + albData.limit >= albData.total){
        this.next = false;
    }
    this.back = true;
    if(albData.offset - albData.limit < 0) {
        this.back = false;
    }

    this.first = 0;
    this.last = albData.total - albData.limit;
    this.total = albData.total;
    albData.items.forEach((albParam) => this.albums.push(new Album(albParam)));
}

module.exports = DetailedArtist;
