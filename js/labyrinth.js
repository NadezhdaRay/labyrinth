var Labyrinth = function(doc, elemId) {
  this.canvas = doc.getElementById(elemId);
  this.ctx = this.canvas.getContext('2d');

  this.cells = [];
  this.removedEdges = [];

  this.cellStack = [];

  var self = this;

  var recurse = function(cell) {
    cell.visit();
    var neighbors = self.cellUnvisitedNeighbors(cell);
    if(neighbors.length > 0) {
      var randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      self.cellStack.push(cell);
      self.removedEdges.push([cell, randomNeighbor]);
      recurse(randomNeighbor);
    } else {
      var waitingCell = self.cellStack.pop();
      if(waitingCell) {
        recurse(waitingCell);
      }
    }
  };

  this.generate = function(width, height) {
    this.width = width;
    this.height = height;

    for(var i = 0; i < this.width; i++) {
      this.cells[i] = [];
      for(var j = 0; j < this.height; j++) {
         var cell = new Cell(i,j);
          this.cells[i].push(cell);
      }
    }

    var initialCell = this.cells[this.width - 1][0];
    recurse(initialCell);
  };

  this.areConnected = function(cell1, cell2) {
    if(!cell1 || !cell2) {
      return false;
    }
    if(Math.abs(cell1.x - cell2.x) > 1 ||
      Math.abs(cell1.y - cell2.y) > 1) {
      return false;
    }

    var removedEdge = _.detect(this.removedEdges, function(edge) {
      return _.include(edge, cell1) && _.include(edge, cell2);
    });

    return removedEdge == undefined;
  };

  this.cellUnvisitedNeighbors = function(cell) {
    return _.select(this.cellConnectedNeighbors(cell), function(c) {
      return !c.visited;
    });
  };

  this.cellConnectedNeighbors = function(cell) {
    return _.select(this.cellNeighbors(cell), function(c) {
      return self.areConnected(cell, c);
    });
  };

  this.cellDisconnectedNeighbors = function (cell) {
    return _.reject(this.cellNeighbors(cell), function(c) {
      return self.areConnected(cell, c);
    });
  };

  this.cellNeighbors = function (cell) {
    var neighbors = [];
    var topCell = this.getCellAt(cell.x, cell.y - 1);
    var rightCell = this.getCellAt(cell.x + 1, cell.y);
    var bottomCell = this.getCellAt(cell.x, cell.y + 1);
    var leftCell = this.getCellAt(cell.x - 1, cell.y);

    if(cell.y > 0 && topCell) {
      neighbors.push(topCell);
    }
    if(cell.x < this.width && rightCell) {
      neighbors.push(rightCell);
    }
    if(cell.y < this.height && bottomCell) {
      neighbors.push(bottomCell);
    }
    if(cell.x > 0 && leftCell) {
      neighbors.push(leftCell);
    }

    return neighbors;
  };

  this.getCellAt = function (x, y) {
  if(x >= this.width || y >= this.height || x < 0 || y < 0) {
      return null;
  }
  if(!this.cells[x]) {
      return null;
  }
    return this.cells[x][y];
  };

};
