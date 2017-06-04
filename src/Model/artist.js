const IMAGE_SIZE = 2;

function Artist(data){
    this.name = data.name;
    this.id = data.id;
    // Check if there are any images for display
    if(data.images.length > 0){
    	this.image = data.images[IMAGE_SIZE].url;
    }
}

module.exports = Artist;