var Config = (function () {
    function Config() {
    }
    return Config;
})();
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

var Tile = (function (_super) {
    __extends(Tile, _super);
    function Tile(tileId) {
        _super.call(this, 0, 0, Tile.width, Tile.width);
        this.tileId = tileId;

        this.anchor.setTo(0, 0);
        this.color = ex.Color.fromHex("#dddddd");
    }
    Tile.prototype.clone = function () {
        return TileFactory.tiles[this.tileId]();
    };
    Tile.width = 80;
    return Tile;
})(ex.Actor);

var TileA = (function (_super) {
    __extends(TileA, _super);
    function TileA(tileId) {
        _super.call(this, tileId);
        this.tileId = tileId;

        this.color = ex.Color.fromHex("#b9392f");
    }
    return TileA;
})(Tile);

var TileB = (function (_super) {
    __extends(TileB, _super);
    function TileB(tileId) {
        _super.call(this, tileId);
        this.tileId = tileId;

        this.color = ex.Color.fromHex("#1f91ad");
    }
    return TileB;
})(Tile);

var TileC = (function (_super) {
    __extends(TileC, _super);
    function TileC(tileId) {
        _super.call(this, tileId);
        this.tileId = tileId;

        this.color = ex.Color.fromHex("#5fa725");
    }
    return TileC;
})(Tile);

var TileD = (function (_super) {
    __extends(TileD, _super);
    function TileD(tileId) {
        _super.call(this, tileId);
        this.tileId = tileId;

        this.color = ex.Color.fromHex("#752cc0");
    }
    return TileD;
})(Tile);
var Grid = (function (_super) {
    __extends(Grid, _super);
    function Grid() {
        _super.call(this, 0, 0, 500, 500);

        this.anchor.setTo(0, 0);

        this.selectedCells = [];
        this.cells = new Array(Grid.size * Grid.size);

        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i] = new GridCell(i % Grid.size, Math.floor(i / Grid.size));
        }
    }
    Grid.prototype.onInitialize = function (engine) {
        var _this = this;
        _super.prototype.onInitialize.call(this, engine);

        this.on("click", function (e) {
            var cell = _this.getCellByPos(e.x, e.y);

            if (cell !== null) {
                ex.Logger.getInstance().info("[grid] cell click", e.x, e.y, cell.col, cell.row);

                // select cell
                _this.selectedCells.push(cell);

                if (_this.selectedCells.length === 2) {
                    // perform swap
                    _this.swap(_this.selectedCells[0].col, _this.selectedCells[0].row, _this.selectedCells[1].col, _this.selectedCells[1].row);

                    // reset selection
                    _this.selectedCells.length = 0;
                }
            }
        });
    };

    Grid.prototype.getCell = function (x, y) {
        if (x < 0 || x > Grid.size)
            return null;
        if (y < 0 || y > Grid.size)
            return null;

        return this.cells[(x + y * Grid.size)];
    };

    Grid.prototype.getCellByPos = function (x, y) {
        for (var i = 0; i < this.cells.length; i++) {
            var b = this.cells[i].getBounds();

            if (b.contains(new ex.Point(x, y))) {
                return this.cells[i];
            }
        }

        return null;
    };

    Grid.prototype.fill = function () {
        var i, j, s, availableSet, randTileId, randTile, cell;

        for (i = 0; i < Grid.size; i++) {
            for (j = 0; j < Grid.size; j++) {
                if ((cell = this.getCell(j, i)).isEmpty()) {
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

                    randTileId = availableSet[Math.floor(Math.random() * availableSet.length)];
                    randTile = TileFactory.tiles[randTileId]();

                    cell.fillTile(randTile, Grid.tileDropAnimationSpeedFast);

                    ex.Logger.getInstance().debug("[fill]", "x", j, "y", i, "tile", randTileId, randTile);
                }
            }
        }
    };

    Grid.prototype.update = function (engine, delta) {
        var _this = this;
        _super.prototype.update.call(this, engine, delta);

        this.cells.forEach(function (c) {
            if (_this.selectedCells.indexOf(c) > -1) {
                c.selected = true;
            } else {
                c.selected = false;
            }

            c.update(engine, delta);
        });
    };

    Grid.prototype.draw = function (ctx, delta) {
        _super.prototype.draw.call(this, ctx, delta);

        var i, j;

        for (i = 0; i < Grid.size; i++) {
            for (j = 0; j < Grid.size; j++) {
                this.getCell(j, i).draw(ctx, delta);
            }
        }

        for (i = 0; i < Grid.size; i++) {
            for (j = 0; j < Grid.size; j++) {
                if (!this.getCell(j, i).isEmpty()) {
                    this.getCell(j, i).getTile().draw(ctx, delta);
                }
            }
        }
    };

    Grid.prototype.swap = function (x1, y1, x2, y2) {
        var _this = this;
        var cell1 = this.getCell(x1, y1);
        var cell2 = this.getCell(x2, y2);

        if (cell1 === null || cell2 === null) {
            return;
        }

        if (cell1.isNeighboring(cell2)) {
            var previewBoard = this.clone();

            previewBoard.getCell(cell1.col, cell1.row).setTile(cell2.getTile().clone());
            previewBoard.getCell(cell2.col, cell2.row).setTile(cell1.getTile().clone());

            var previewMatches = Grid.findAllMatches(previewBoard);

            if (previewMatches.length) {
                ex.Logger.getInstance().info("Begin swap");

                // swap
                cell1.swapTile(cell2).then(function () {
                    // resolve matches
                    _this.resolveMatches(new Chain()).then(_this.beginChain.bind(_this)).then(function (chain) {
                        ex.Logger.getInstance().info("Finished chain with", chain.totalMatches, "total matches and a", chain.chain, "chain length");
                    });
                });
            }
        }
    };

    Grid.prototype.beginChain = function (chain) {
        var _this = this;
        ex.Logger.getInstance().info("Match chain", chain.chain);

        chain.chain++;

        // shift all empty cells down
        // start from bottom row and move up
        return this.shiftColumns(chain).then(this.fill.bind(this)).then(this.resolveMatches.bind(this)).then(function (c2) {
            if (c2.lastMatches > 0) {
                return _this.beginChain(chain);
            } else {
                return ex.Promise.wrap(chain);
            }
        });
    };

    Grid.prototype.resolveMatches = function (chain) {
        var _this = this;
        var matches = Grid.findAllMatches(this);

        matches.forEach(function (match) {
            ex.Logger.getInstance().info("Match sequence resolved", match);

            match.forEach(function (cell) {
                _this.getCell(cell.col, cell.row).setTile(null);
            });
        });

        chain.totalMatches += matches.length;
        chain.lastMatches = matches.length;

        return ex.Promise.wrap(chain);
    };

    Grid.prototype.shiftColumns = function (chain) {
        var _this = this;
        var row, col, peekRow;
        var tilesToShift = [];
        var p = new ex.Promise();
        for (row = Grid.size - 1; row > 0; row--) {
            for (col = 0; col < Grid.size; col++) {
                if (this.getCell(col, row).isEmpty() || tilesToShift.filter(function (x) {
                    return x.from[0] === col && x.from[1] === row;
                }).length > 0) {
                    // shift the first tile above this row
                    peekRow = row - 1;
                    while (peekRow > -1) {
                        if (!this.getCell(col, peekRow).isEmpty() && tilesToShift.filter(function (x) {
                            return x.from[0] === col && x.from[1] === peekRow;
                        }).length === 0) {
                            tilesToShift.push({ from: [col, peekRow], to: [col, row] });
                            peekRow = -1;
                        } else {
                            peekRow--;
                        }
                    }
                }
            }
        }

        ex.Logger.getInstance().info("Shifting", tilesToShift.length, "tiles downward");

        var pair, from, to, q = _.clone(tilesToShift), complete = [];
        var c = function () {
            complete.push(q.shift());

            if (q.length === 0) {
                complete.forEach(function (pair2) {
                    _this.getCell(pair2.to[0], pair2.to[1]).setTile(_this.getCell(pair2.from[0], pair2.from[1]).getTile());
                    _this.getCell(pair2.from[0], pair2.from[1]).setTile(null);
                });
                p.resolve(chain);
            }
        };

        if (tilesToShift.length === 0) {
            p.resolve(chain);
        } else {
            while (tilesToShift.length > 0) {
                pair = tilesToShift.shift();

                ex.Logger.getInstance().info("Shifting", pair, "downward");

                from = this.getCell(pair.from[0], pair.from[1]);
                to = this.getCell(pair.to[0], pair.to[1]);

                from.getTile().delay(Grid.tileShiftDelaySpeed).moveTo(to.x, to.y, Grid.tileDropAnimationSpeedFast).callMethod(c);
            }
        }
        return p;
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
        var newGrid = new Grid(), tile;

        for (var i = 0; i < newGrid.cells.length; i++) {
            tile = this.cells[i].getTile();

            if (tile) {
                newGrid.cells[i].setTile(tile.clone());
            }
        }

        return newGrid;
    };
    Grid.size = 5;
    Grid.tileDropAnimationSpeed = 150;
    Grid.tileDropAnimationSpeedFast = 500;
    Grid.tileDropDelaySpeed = 50;
    Grid.tileDisappearSpeed = 100;
    Grid.tileShiftDelaySpeed = 250;
    Grid.tileSwapSpeed = 300;
    return Grid;
})(ex.Actor);

var GridCell = (function (_super) {
    __extends(GridCell, _super);
    function GridCell(col, row) {
        _super.call(this, 0, 0, GridCell.width, GridCell.width, ex.Color.fromHex("#dddddd"));
        this.col = col;
        this.row = row;
        this.tile = null;
        this.selected = false;

        this.anchor.setTo(0, 0);
        this.x = col * GridCell.width + (col * GridCell.margin);
        this.y = row * GridCell.width + (row * GridCell.margin);
    }
    GridCell.prototype.update = function (engine, delta) {
        _super.prototype.update.call(this, engine, delta);

        if (this.tile !== null) {
            this.tile.update(engine, delta);
        }
    };

    GridCell.prototype.draw = function (ctx, delta) {
        _super.prototype.draw.call(this, ctx, delta);

        if (this.selected) {
            ctx.strokeStyle = ex.Color.fromHex("#ffffff").toString();
            ctx.strokeRect(this.x, this.y, this.getWidth(), this.getHeight());
        }
    };

    GridCell.prototype.isEmpty = function () {
        return this.tile === null;
    };

    GridCell.prototype.getTile = function () {
        return this.tile;
    };

    GridCell.prototype.setTile = function (tile) {
        if (tile) {
            tile.x = this.x;
            tile.y = this.y;
        }
        this.tile = tile;
    };

    GridCell.prototype.fillTile = function (tile, speed) {
        if (tile) {
            tile.x = this.x;
            tile.y = -GridCell.width * (Grid.size - this.row);
            tile.moveTo(this.x, this.y, speed);
        }
        this.tile = tile;
    };

    GridCell.prototype.swapTile = function (other) {
        var _this = this;
        var otherTile = other.getTile();
        var thisTile = this.getTile();
        var p = new ex.Promise();
        var q = [0, 0];
        var c = function () {
            q.shift();

            if (q.length === 0) {
                other.setTile(thisTile);
                _this.setTile(otherTile);
                p.resolve(true);
            }
        };
        otherTile.moveTo(this.x, this.y, Grid.tileSwapSpeed).callMethod(c);
        thisTile.moveTo(other.x, other.y, Grid.tileSwapSpeed).callMethod(c);

        return p;
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

var Chain = (function () {
    function Chain() {
        this.totalMatches = 0;
        this.chain = 0;
        this.lastMatches = 0;
    }
    return Chain;
})();
/// <reference path="tiles.ts"/>
/// <reference path="grid.ts"/>
ex.Logger.getInstance().defaultLevel = 0 /* Debug */;

var engine = new ex.Engine(720, 600);
var board = new Grid();

board.fill();

engine.add(board);

engine.start();
//# sourceMappingURL=app.js.map
