const IMAGE_SIZE = 2;

function Album(data){
    this.name = data.name;
    this.id = data.id;
    if(data.images.length > 0){
        this.image = data.images[IMAGE_SIZE].url;
    }
}

module.exports = Album;
