const Artist = require('./artist.js');

function SearchObject(data, querySearched, offset){
    this.artists = [];
    this.offset = offset;
    this.querySearched = querySearched;
    this.offsetForward = Number(offset) + 20;
    this.offsetBackwards = Number(offset) - 20;
    this.next = true;

    if( data.artists.offset + data.artists.limit >= data.total ){
    	this.next = false;
    }

    this.back = true;
    if(data.artists.offset - data.artists.limit < 0){
        this.back = false;
    }

    this.first = 0;
    this.last = data.artists.total - data.artists.limit;
    this.total = data.artists.total;
    data.artists.items.forEach((artistParam) => { this.artists.push(new Artist(artistParam)); });

}

module.exports = SearchObject;

