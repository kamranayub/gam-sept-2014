var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TileFactory = (function () {
    function TileFactory() {
    }
    TileFactory.tiles = [
        function () {
            return new TileA(0);
        },
        function () {
            return new TileB(1);
        },
        function () {
            return new TileC(2);
        },
        function () {
            return new TileD(3);
        }
    ];
    return TileFactory;
})();

var Tile = (function () {
    function Tile(tileId) {
        this.tileId = tileId;
    }
    return Tile;
})();

var TileA = (function (_super) {
    __extends(TileA, _super);
    function TileA() {
        _super.apply(this, arguments);
    }
    return TileA;
})(Tile);

var TileB = (function (_super) {
    __extends(TileB, _super);
    function TileB() {
        _super.apply(this, arguments);
    }
    return TileB;
})(Tile);

var TileC = (function (_super) {
    __extends(TileC, _super);
    function TileC() {
        _super.apply(this, arguments);
    }
    return TileC;
})(Tile);

var TileD = (function (_super) {
    __extends(TileD, _super);
    function TileD() {
        _super.apply(this, arguments);
    }
    return TileD;
})(Tile);
var Grid = (function (_super) {
    __extends(Grid, _super);
    function Grid() {
        _super.call(this, 0, 0, 500, 500);

        this.anchor.setTo(0, 0);

        this.cells = new Array(Grid.size * Grid.size);

        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i] = new GridCell(i % Grid.size, Math.floor(i / Grid.size));
        }
    }
    Grid.prototype.getCell = function (x, y) {
        if (x < 0 || x > Grid.size)
            return null;
        if (y < 0 || y > Grid.size)
            return null;

        return this.cells[(x + y * Grid.size)];
    };

    Grid.prototype.fill = function () {
        var i, j, s, availableSet;

        for (i = 0; i < Grid.size; i++) {
            for (j = 0; j < Grid.size; j++) {
                if (this.getCell(j, i).isEmpty()) {
                    // full set available
                    availableSet = [];

                    for (s = 0; s < TileFactory.tiles.length; s++) {
                        // if the given tile will not result in a match, add to
                        // potential set
                        var previewGrid = this.clone();

                        previewGrid.getCell(j, i).setTile(TileFactory.tiles[s]());

                        if (!Grid.findMatches(j, i, previewGrid).length) {
                            availableSet.push(s);
                        }
                    }

                    var randTileId = availableSet[Math.floor(Math.random() * availableSet.length)];

                    this.getCell(j, i).setTile(TileFactory.tiles[randTileId]());
                    ex.Logger.getInstance().debug("[fill]", "x", j, "y", i, "tile", randTileId);
                }
            }
        }
    };

    Grid.prototype.draw = function (ctx, delta) {
        _super.prototype.draw.call(this, ctx, delta);

        for (var i = 0; i < Grid.size; i++) {
            for (var j = 0; j < Grid.size; j++) {
                this.getCell(j, i).draw(ctx, delta);
            }
        }
    };

    Grid.prototype.swap = function (x1, y1, x2, y2) {
        var cell1 = this.getCell(x1, y1);
        var cell2 = this.getCell(x2, y2);

        if (cell1 === null || cell2 === null) {
            return;
        }

        if (cell1.isNeighboring(cell2)) {
            var previewBoard = this.clone();

            previewBoard.getCell(cell1.col, cell1.row).setTile(cell2.getTile());
            previewBoard.getCell(cell2.col, cell2.row).setTile(cell1.getTile());

            var previewMatches = Grid.findAllMatches(previewBoard);

            if (previewMatches.length) {
                // commit changes
                var temp = cell1.getTile();
                this.getCell(cell1.col, cell1.row).setTile(cell2.getTile());
                this.getCell(cell2.col, cell2.row).setTile(temp);
            }
        }
    };

    Grid.findAllMatches = function (grid) {
        var matches = [];

        for (var ty = 0; ty < Grid.size; ty++) {
            for (var tx = 0; tx < Grid.size; tx++) {
                matches.push(Grid.findMatches(tx, ty, grid));
            }
        }

        return _.flatten(matches, true);
    };

    Grid.findMatches = function (tx, ty, grid) {
        var matches = [], i;

        // explore horizontal/vertical matches
        var e = Grid.peek(tx, ty, Grid.size, 1, 0, grid);
        var w = Grid.peek(tx, ty, Grid.size, -1, 0, grid);
        var n = Grid.peek(tx, ty, Grid.size, 0, -1, grid);
        var s = Grid.peek(tx, ty, Grid.size, 0, 1, grid);

        var horizontal = Grid.getSequences(tx, ty, w, e, grid);
        var vertical = Grid.getSequences(tx, ty, n, s, grid);

        for (i = 0; i < horizontal.length; i++) {
            matches.push(horizontal[i]);
        }
        for (i = 0; i < vertical.length; i++) {
            matches.push(vertical[i]);
        }

        return matches;
    };

    Grid.peek = function (x, y, length, dx, dy, grid) {
        var cells = [], tile, tx, ty;

        for (var i = 1; i <= length; i++) {
            tx = dx === 0 ? x : x + (i * dx);
            ty = dy === 0 ? y : y + (i * dy);

            if (ty >= 0 && ty < Grid.size && tx >= 0 && tx < Grid.size) {
                tile = grid.getCell(tx, ty);
                cells.push(tile);
            }
        }

        return cells;
    };

    Grid.getSequences = function (cx, cy, left, right, grid) {
        // horizontal sequence
        var results = [], match, i, sequence = [];

        for (i = left.length - 1; i >= 0; i--) {
            sequence.push(left[i]);
        }
        sequence.push(grid.getCell(cx, cy));
        for (i = 0; i < right.length; i++) {
            sequence.push(right[i]);
        }

        // longest match sequence
        match = [];
        for (i = 0; i < sequence.length; i++) {
            if (sequence[i].getTileId() === grid.getCell(cx, cy).getTileId()) {
                match.push(sequence[i]);
            } else if (match.length > 0) {
                results.push(match);
                match = [];
            } else {
                match = [];
            }
        }

        if (match.length > 0) {
            results.push(match);
        }

        return results.filter(function (m) {
            return m.length >= 3;
        });
    };

    Grid.prototype.clone = function () {
        var newGrid = new Grid();

        for (var i = 0; i < newGrid.cells.length; i++) {
            newGrid.cells[i].setTile(this.cells[i].getTile());
        }

        return newGrid;
    };
    Grid.size = 5;
    return Grid;
})(ex.Actor);

var GridCell = (function (_super) {
    __extends(GridCell, _super);
    function GridCell(col, row) {
        _super.call(this, 0, 0, GridCell.width, GridCell.width, ex.Color.fromHex("#dddddd"));
        this.col = col;
        this.row = row;
        this.tile = null;

        this.anchor.setTo(0, 0);
        this.x = col * GridCell.width + (col * GridCell.margin);
        this.y = row * GridCell.width + (row * GridCell.margin);

        this.label = new ex.Label(null, 0, 36, "36px Arial");
        this.addChild(this.label);
    }
    GridCell.prototype.update = function (engine, delta) {
        _super.prototype.update.call(this, engine, delta);
    };

    GridCell.prototype.isEmpty = function () {
        return this.tile === null;
    };

    GridCell.prototype.getTile = function () {
        return this.tile;
    };

    GridCell.prototype.setTile = function (tile) {
        this.tile = tile;
        if (this.tile !== null) {
            this.label.text = this.tile.tileId.toString();
        }
    };

    GridCell.prototype.getTileId = function () {
        if (!this.isEmpty()) {
            return this.tile.tileId;
        } else {
            return -1;
        }
    };

    GridCell.prototype.isNeighboring = function (cell) {
        var left = { x: this.col - 1, y: this.row }, right = { x: this.col + 1, y: this.row }, top = { x: this.col, y: this.row - 1 }, bottom = { x: this.col, y: this.row + 1 };

        return (left.x === cell.col && left.y === cell.row) || (right.x === cell.col && right.y === cell.row) || (top.x === cell.col && top.y === cell.row) || (bottom.x === cell.col && bottom.y === cell.row);
    };
    GridCell.width = 80;
    GridCell.margin = 1;
    return GridCell;
})(ex.Actor);
/// <reference path="tiles.ts"/>
/// <reference path="grid.ts"/>
ex.Logger.getInstance().defaultLevel = 0 /* Debug */;

var engine = new ex.Engine(720, 600);
var board = new Grid();

board.fill();

engine.add(board);

engine.start();
//# sourceMappingURL=app.js.map
