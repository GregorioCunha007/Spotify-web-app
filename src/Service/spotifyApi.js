const https = require('https');
const uri = 'https://api.spotify.com';
const v1 = '/v1';
const artistEndpoint = '/artists/';
const albumEndpoint = '/albums';
const trackEndpoint = '/tracks';
const searchPath = '/search?';
const typeArtist = '&type=artist';
const offsetPart = 'offset=';
const limitPart = 'limit=';
const SearchObject = require('./../Model/searchObject.js');
const Artist = require('./../Model/artist.js');
const DetailedArtist = require('./../Model/detailedArtist.js');
const DetailAlbum = require('./../Model/detailedAlbum.js');

function encondeText (q){
    return 'q=' + encodeURIComponent(q);
}

// Searches for Artists
function searchQuery(query, cb){
    var args = parseQuery(query);
    const path = uri + v1 + searchPath + encondeText(query.name) + '&' + offsetPart + args.offset + '&' + limitPart + args.limit + typeArtist;
    
    getJsonResp(path, (err, jsonObj) => {
        if(err) throw err;
        else
        {
            cb(null, new SearchObject(jsonObj, args.name, args.offset));
        }
    })
}

function searchArtistById(query, cb){
    var args = parseQuery(query);
    const path = uri + v1 + artistEndpoint + query.id;
    getJsonResp(path, (err, jsonObj) => {
        if(err) throw err;
        else
        {
            const artist = new Artist(jsonObj)
            searchAlbumList(artist, args.offset, args.limit, cb);
        }
    })
}
    
function searchAlbumList(artist, offset, limit, cb) {
    const path = uri + v1 + artistEndpoint + artist.id + albumEndpoint + '?' + offsetPart + offset + '&' + limitPart + limit;
    getJsonResp(path, (err, albData) => {
        if(err) throw err;
        else
            cb(null, new DetailedArtist(artist, albData, offset))
    });
}

function getTracksFromAlbum(albumId, cb){
    const path = uri + v1 + albumEndpoint + '/' + albumId + trackEndpoint;
    console.log(path);
    getJsonResp(path,(err,tracksData) => {
        if(err) throw err;
        else
            cb(null, new DetailAlbum(tracksData));
    });
}

function getJsonResp(path, cb) {
    https.get(path,function(response){
        var res = '';
        response.on('error',(err)=>callback(err,null));
        response.on('data', chunk => res += chunk.toString());
        response.on('end',()=>{
            if(res != ''){ // Why I need this ? (Toze) dar throw a excepçoes do genero 404 prolly
                cb(null,JSON.parse(res));
            }
        });
    });
}

function parseQuery(query){
    var offset = 0;
    var limit = 20;
    if(typeof query.offset !== 'undefined'){
        offset = query.offset;
    }
    if(typeof query.limit !== 'undefined'){
        if(query.limit > 20){
            limit = 20;
        }else{
            limit = query.limit;
        }
    }
    return {
        offset : offset,
        limit : limit
    }
}

module.exports.searchQuery = searchQuery;
module.exports.searchArtistById = searchArtistById;
module.exports.searchAlbumList = searchAlbumList;
module.exports.searchAlbum = getTracksFromAlbum;