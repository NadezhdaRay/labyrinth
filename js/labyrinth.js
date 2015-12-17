Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var Labyrinth = function(doc, elemId) {
  this.canvas = doc.getElementById(elemId);
  this.ctx = this.canvas.getContext('2d');

  this.cells = [];
  this.removedEdges = [];

  this.cellStack = [];

  var self = this;

  self.ctx.strokeStyle = "rgb(0, 0, 0)";
  self.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

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

   this.solve = function() {
    var closedSet = [];
    var startCell = this.getCellAt(this.width - 1, 0);
    var targetCell = this.getCellAt(0, this.height - 1);
    var openSet = [startCell];
    var searchCell = startCell;

    while(openSet.length > 0) {
      var neighbors = this.cellDisconnectedNeighbors(searchCell);
      for(var i = 0; i < neighbors.length; i ++) {
        var neighbor = neighbors[i];
        if(neighbor == targetCell) {
          neighbor.parent = searchCell;
          this.path = neighbor.pathToOrigin();
          openSet = [];
          return;
        }
        if(!_.include(closedSet, neighbor)) {
          if(!_.include(openSet, neighbor)) {
            openSet.push(neighbor);
            neighbor.parent = searchCell;
            neighbor.heuristic = neighbor.score() + this.getCellDistance(neighbor, targetCell);
          }
        }
      }
      closedSet.push(searchCell);
      openSet.remove(_.indexOf(openSet, searchCell));
      searchCell = null;

      _.each(openSet, function(cell) {
        if(!searchCell) {
          searchCell = cell;
        }
        else if(searchCell.heuristic > cell.heuristic) {
          searchCell = cell;
        }
      });
    }
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

  this.getCellDistance = function (cell1, cell2) {
    var xDist = Math.abs(cell1.x - cell2.x);
    var yDist = Math.abs(cell1.y - cell2.y);
    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
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

  this.draw = function() {
      this.drawLine(0, 0, self.canvas.width - self.width, 0);
      this.drawLine(self.canvas.width, 0, self.canvas.width, self.canvas.height);
      this.drawLine(self.canvas.width, self.canvas.height, self.width, self.canvas.height);
      this.drawLine(0, self.canvas.height, 0, 0);

      var drawnEdges = [];

      var edgeAlreadyDrawn = function(cell1, cell2) {
        return _.detect(drawnEdges, function(edge) {
          return _.include(edge, cell1) && _.include(edge, cell2);
        }) != undefined;
      };

      for(var i = 0; i < this.width; i++) {
        for(var j = 0; j < this.height; j++) {
          var cell = this.cells[i][j];
          var topCell = this.getCellAt(cell.x, cell.y - 1);
          var leftCell = this.getCellAt(cell.x - 1, cell.y);
          var rightCell = this.getCellAt(cell.x + 1, cell.y);
          var bottomCell = this.getCellAt(cell.x, cell.y + 1);

          if(!edgeAlreadyDrawn(cell, topCell) && this.areConnected(cell, topCell)) {
            var x1 = cell.x * this.width;
            var y1 = cell.y * this.height;
            var x2 = x1 + this.width;
            var y2 = y1;

            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, topCell]);
          }

          if(!edgeAlreadyDrawn(cell, leftCell) && this.areConnected(cell, leftCell)) {
            var x2 = x1;
            var y2 = y1 + this.height;

            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, leftCell]);
          }

          if(!edgeAlreadyDrawn(cell, rightCell) && this.areConnected(cell, rightCell)) {
            var x1 = (cell.x * this.width) + this.height;
            var y1 = cell.y * this.height;
            var x2 = x1;
            var y2 = y1 + this.height;

            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, rightCell]);
          }

          if(!edgeAlreadyDrawn(cell, bottomCell) && this.areConnected(cell, bottomCell)) {
            var x1 = cell.x * this.width;
            var y1 = (cell.y * this.height) + this.height;
            var x2 = x1 + this.width;
            var y2 = y1;

            this.drawLine(x1, y1, x2, y2);
            drawnEdges.push([cell, bottomCell]);
          }
        }
      }
  };

  this.drawSolution = function() {
      var path = this.path;

      for(var i = 0; i < path.length; i++) {
          var cell = path[i];
          var x = cell.x * this.width;
          var y = cell.y * this.height;
            this.ctx.fillRect(x, y, this.width, this.height);
      }
    };

  this.drawLine = function(x1, y1, x2, y2) {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
  }



};
