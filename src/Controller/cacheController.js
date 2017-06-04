const fs = require('fs');
const spotifyController = require('./spotifyController.js');
const cache = new Map();
const TWO_HOURS = 7200000 ;                         // SHOULD GET THIS FROM HTTP HEADER!!!!
const handlers = {};

handlers.search = function(query, headers, cb){
	spotifyController.search(query, headers, cb);
};

handlers.artist = function(query, headers, cb){
    var offset = getOffsetFromQuery(query);
    //var maxAge = Number(headers['cache-control'].split('=')[1]) * 1000;
    var fileName = './Cache/'+ query.id + '&' + offset + '.txt';
    getArtist(fileName, query, headers, cb);
};

function getArtist(fileName, query, headers, cb){
    if(!getFromMap(fileName, cb)){
        fs.stat(fileName, (err,data)=>{
            if(!err && (new Date()).getTime() - data.mtime.getTime() <= TWO_HOURS) {
                readFromFile(fileName, cb);
            }
            else{
                getFromAPI(fileName, query, headers, cb);
            }
        });
    }
}

function getFromMap(fileName, cb){
    var view = cache.get(fileName);
    if(view != null) {
        cb(null, view.toString())
        return true;
    }
    return false;
}

function readFromFile(fileName, cb){
    fs.readFile(fileName, (err, info)=> {
                    if (err) throw err;
                    else {
                        var view = info.toString();
                        cache.set(fileName, view);
                        cb(null, view);
                    }
    });
}

function getFromAPI(fileName, query, headers, cb){
    spotifyController.artist(query, headers,
        (err,data) => {
        cache.set(fileName, data);
        fs.writeFile(fileName, data, (err2) => {
                if(err2) throw err2;
        });
        cb(null, data);
    }, query, headers);
}


function getOffsetFromQuery(query){
    var offset = 0;
    if(typeof query.offset !== 'undefined'){
        offset = query.offset;
    }
    return offset;
}

module.exports = handlers;










