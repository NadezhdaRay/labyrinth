var Labyrinth = function(width, height) {
  this.width = width;
  this = height;
  this.cells = [];

  for(var i = 0; i < this.width; i++) {
    this.cells[i] = [];
    for(var j = 0; j < this.height; j++) {
      var cell = new Cell(i,j);
      this.cells[i].push(cell);
    }
  }

};
