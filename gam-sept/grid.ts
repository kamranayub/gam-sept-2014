class Grid extends ex.Actor {
   
   public static size: number = 5;
   private static tileDropAnimationSpeed = 150;
   private static tileDropAnimationSpeedFast = 500;
   private static tileDropDelaySpeed = 50;
   private static tileDisappearSpeed = 100;
   private static tileShiftDelaySpeed = 250;
   private static tileSwapSpeed = 300;

   private cells: GridCell[];
   private selectedCells: GridCell[];

   constructor() {
      super(0, 0, 500, 500);

      this.anchor.setTo(0, 0);

      this.selectedCells = [];
      this.cells = new Array(Grid.size * Grid.size);

      for (var i = 0; i < this.cells.length; i++) {
         this.cells[i] = new GridCell(i % Grid.size, Math.floor(i / Grid.size));
      }
   }

   public onInitialize(engine: ex.Engine): void {
      super.onInitialize(engine);

      this.on("click", (e?: ex.ClickEvent) => {

         var cell = this.getCellByPos(e.x, e.y);

         if (cell !== null) {
            ex.Logger.getInstance().info("[grid] cell click", e.x, e.y, cell.col, cell.row);

            // select cell
            this.selectedCells.push(cell);

            if (this.selectedCells.length === 2) {

               // perform swap
               this.swap(this.selectedCells[0].col, this.selectedCells[0].row,
                  this.selectedCells[1].col, this.selectedCells[1].row);

               // reset selection
               this.selectedCells.length = 0;
            }
         }
      });
   }

   public getCell(x: number, y: number): GridCell {
      if (x < 0 || x > Grid.size) return null;
      if (y < 0 || y > Grid.size) return null;

      return this.cells[(x + y * Grid.size)];
   }

   public getCellByPos(x: number, y: number): GridCell {
      for (var i = 0; i < this.cells.length; i++) {
         var b = this.cells[i].getBounds();

         if (b.contains(new ex.Point(x, y))) {
            return this.cells[i];
         }
      }

      return null;
   }

   public fill() {
      var i, j, s, availableSet, randTileId, randTile, cell;

      for (i = 0; i < Grid.size; i++) {
         for (j = 0; j < Grid.size; j++) {
            if ((cell = this.getCell(j, i)).isEmpty()) {

               // full set available
               availableSet = [];

               // foreach in set
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
   }

   public update(engine: ex.Engine, delta: number): void {
      super.update(engine, delta);

      this.cells.forEach((c) => {
         if (this.selectedCells.indexOf(c) > -1) {
            c.selected = true;
         } else {
            c.selected = false;
         }

         c.update(engine, delta);
      });
   }

   public draw(ctx: CanvasRenderingContext2D, delta: number): void {
      super.draw(ctx, delta);

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
   }

   public swap(x1: number, y1: number, x2: number, y2: number): void {
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
            cell1.swapTile(cell2).then(() => {
               // resolve matches

               this.resolveMatches(new Chain()).then(this.beginChain.bind(this)).then((chain: Chain) => {
                  ex.Logger.getInstance().info("Finished chain with", chain.totalMatches, "total matches and a", chain.chain, "chain length");
               });
               
            });            
         }
      }

   }

   private beginChain(chain: Chain): ex.Promise<Chain> {
      ex.Logger.getInstance().info("Match chain", chain.chain);

      chain.chain++;

      // shift all empty cells down
      // start from bottom row and move up
      return this.shiftColumns(chain).then(this.fill.bind(this)).then(this.resolveMatches.bind(this)).then((c2) => {
         if (c2.lastMatches > 0) {
            return this.beginChain(chain);
         } else {
            return ex.Promise.wrap(chain);
         }
      });
   }

   private resolveMatches(chain: Chain): ex.Promise<Chain> {

      var matches = Grid.findAllMatches(this);

      matches.forEach(match => {

         ex.Logger.getInstance().info("Match sequence resolved", match);

         match.forEach(cell => {

            this.getCell(cell.col, cell.row).setTile(null);

         });

      });

      chain.totalMatches += matches.length;
      chain.lastMatches = matches.length;

      return ex.Promise.wrap(chain);
   }

   private shiftColumns(chain: Chain): ex.Promise<Chain> {
      var row, col, peekRow;
      var tilesToShift = [];
      var p = new ex.Promise();
      for (row = Grid.size - 1; row > 0; row--) {
         for (col = 0; col < Grid.size; col++) {

            if (this.getCell(col, row).isEmpty() || tilesToShift.filter((x) => x.from[0] === col && x.from[1] === row).length > 0) {

               // shift the first tile above this row
               peekRow = row - 1;
               while (peekRow > -1) {
                  if (!this.getCell(col, peekRow).isEmpty() && tilesToShift.filter((x) => x.from[0] === col && x.from[1] === peekRow).length === 0) {
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
      var c = () => {
         complete.push(q.shift());

         if (q.length === 0) {
            complete.forEach(pair2 => {
               this.getCell(pair2.to[0], pair2.to[1]).setTile(this.getCell(pair2.from[0], pair2.from[1]).getTile());
               this.getCell(pair2.from[0], pair2.from[1]).setTile(null);
            });
            p.resolve(chain);
         }
      }

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
   }

   public static findAllMatches(grid: Grid): GridCell[][] {
   
      var matches: GridCell[][][] = [];

      for (var ty = 0; ty < Grid.size; ty++) {
         for (var tx = 0; tx < Grid.size; tx++) {
            matches.push(Grid.findMatches(tx, ty, grid));
         }
      }

      return _.flatten<GridCell[]>(matches, true);         
   }

   public static findMatches(tx: number, ty: number, grid: Grid): GridCell[][] {
      var matches: GridCell[][] = [], i;

      // explore horizontal/vertical matches
      var e = Grid.peek(tx, ty, Grid.size, 1, 0, grid); // e
      var w = Grid.peek(tx, ty, Grid.size, -1, 0, grid); // w                  
      var n = Grid.peek(tx, ty, Grid.size, 0, -1, grid); // n
      var s = Grid.peek(tx, ty, Grid.size, 0, 1, grid); // s

      var horizontal = Grid.getSequences(tx, ty, w, e, grid);
      var vertical = Grid.getSequences(tx, ty, n, s, grid);

      for (i = 0; i < horizontal.length; i++) {
         matches.push(horizontal[i]);
      }
      for (i = 0; i < vertical.length; i++) {
         matches.push(vertical[i]);
      }

      return matches;
   }

   private static peek(x: number, y: number, length: number, dx: number, dy: number, grid: Grid): GridCell[] {
      var cells = [], tile, tx, ty;

      for (var i = 1; i <= length; i++) {
         tx = dx === 0 ? x : x + (i * dx);
         ty = dy === 0 ? y : y + (i * dy);

         if (ty >= 0 && ty < Grid.size &&
            tx >= 0 && tx < Grid.size) {
            tile = grid.getCell(tx, ty);
            cells.push(tile);
         }
      }

      return cells;
   }

   private static getSequences(cx: number, cy: number, left: GridCell[], right: GridCell[], grid: Grid): GridCell[][] {
      // horizontal sequence
      var results: GridCell[][] = [],
         match: GridCell[],
         i,
         sequence: GridCell[] = [];

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

      return results.filter((m) => {
         return m.length >= 3;
      });
   }

   private clone(): Grid {
      var newGrid = new Grid(), tile;

      for (var i = 0; i < newGrid.cells.length; i++) {
         tile = this.cells[i].getTile();

         if (tile) {
            newGrid.cells[i].setTile(tile.clone());
         }
      }

      return newGrid;
   }
} 

class GridCell extends ex.Actor {
   public static width = 80;
   private static margin = 1;

   private tile: Tile = null;   
  
   public selected: boolean = false;   

   constructor(public col: number, public row: number) {
      super(0, 0, GridCell.width, GridCell.width, ex.Color.fromHex("#dddddd"));

      this.anchor.setTo(0, 0);
      this.x = col * GridCell.width + (col * GridCell.margin);
      this.y = row * GridCell.width + (row * GridCell.margin);                
   }

   public update(engine: ex.Engine, delta: number): void {
      super.update(engine, delta);

      if (this.tile !== null) {
         this.tile.update(engine, delta);
      }
      
   }

   public draw(ctx: CanvasRenderingContext2D, delta: number): void {
      super.draw(ctx, delta);           

      if (this.selected) {        
         ctx.strokeStyle = ex.Color.fromHex("#ffffff").toString();
         ctx.strokeRect(this.x, this.y, this.getWidth(), this.getHeight());
      }
   }

   public isEmpty(): boolean {
      return this.tile === null;
   }

   public getTile(): Tile {
      return this.tile;
   }

   public setTile(tile: Tile): void {      
      if (tile) {
         tile.x = this.x;
         tile.y = this.y;
      }
      this.tile = tile;
   }

   public fillTile(tile: Tile, speed: number): void {
      if (tile) {
         tile.x = this.x;
         tile.y = -GridCell.width * (Grid.size - this.row);
         tile.moveTo(this.x, this.y, speed);
      }
      this.tile = tile;
   }

   public swapTile(other: GridCell): ex.Promise<boolean> {

      var otherTile = other.getTile();
      var thisTile = this.getTile();
      var p = new ex.Promise<boolean>();
      var q = [0, 0];
      var c = () => {
         q.shift();

         if (q.length === 0) {
            other.setTile(thisTile);
            this.setTile(otherTile);
            p.resolve(true);
         }
      }
      otherTile.moveTo(this.x, this.y, Grid.tileSwapSpeed).callMethod(c);
      thisTile.moveTo(other.x, other.y, Grid.tileSwapSpeed).callMethod(c);           

      return p;
   }

   public getTileId(): number {
      if (!this.isEmpty()) {
         return this.tile.tileId;
      } else {
         return -1;
      }
   }

   public isNeighboring(cell: GridCell): boolean {

      var left = { x: this.col - 1, y: this.row },
         right = { x: this.col + 1, y: this.row },
         top = { x: this.col, y: this.row - 1 },
         bottom = { x: this.col, y: this.row + 1 };

      return (left.x === cell.col && left.y === cell.row) ||
         (right.x === cell.col && right.y === cell.row) ||
         (top.x === cell.col && top.y === cell.row) ||
         (bottom.x === cell.col && bottom.y === cell.row);
   }
}

class Chain {
   public totalMatches: number = 0;
   public chain: number = 0;
   public lastMatches: number = 0;
}