﻿class Grid extends ex.Actor {
   
   public static size: number = 5;

   private cells: GridCell[];

   constructor() {
      super(0, 0, 500, 500);

      this.anchor.setTo(0, 0);

      this.cells = new Array(Grid.size * Grid.size);

      for (var i = 0; i < this.cells.length; i++) {
         this.cells[i] = new GridCell(i % Grid.size, Math.floor(i / Grid.size));
      }
   }

   public getCell(x: number, y: number): GridCell {
      if (x < 0 || x > Grid.size) return null;
      if (y < 0 || y > Grid.size) return null;

      return this.cells[(x + y * Grid.size)];
   }

   public fill() {
      var i, j, s, availableSet;

      for (i = 0; i < Grid.size; i++) {
         for (j = 0; j < Grid.size; j++) {
            if (this.getCell(j, i).isEmpty()) {

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

               var randTileId = availableSet[Math.floor(Math.random() * availableSet.length)];

               this.getCell(j, i).setTile(TileFactory.tiles[randTileId]());
               ex.Logger.getInstance().debug("[fill]", "x", j, "y", i, "tile", randTileId);
            }
         }
      }
   }

   public draw(ctx: CanvasRenderingContext2D, delta: number): void {
      super.draw(ctx, delta);

      for (var i = 0; i < Grid.size; i++) {
         for (var j = 0; j < Grid.size; j++) {
            this.getCell(j, i).draw(ctx, delta);
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
      var newGrid = new Grid();

      for (var i = 0; i < newGrid.cells.length; i++) {
         newGrid.cells[i].setTile(this.cells[i].getTile());
      }

      return newGrid;
   }
} 

class GridCell extends ex.Actor {
   
   private tile: Tile = null;
   private static width = 80;
   private static margin = 1;
   private label: ex.Label;

   constructor(public col: number, public row: number) {
      super(0, 0, GridCell.width, GridCell.width, ex.Color.fromHex("#dddddd"));

      this.anchor.setTo(0, 0);
      this.x = col * GridCell.width + (col * GridCell.margin);
      this.y = row * GridCell.width + (row * GridCell.margin);

      this.label = new ex.Label(null, 0, 36, "36px Arial");      
      this.addChild(this.label);
   }

   public update(engine: ex.Engine, delta: number): void {
      super.update(engine, delta);

   }

   public isEmpty(): boolean {
      return this.tile === null;
   }

   public getTile(): Tile {
      return this.tile;
   }

   public setTile(tile: Tile): void {
      this.tile = tile;
      if (this.tile !== null) {
         this.label.text = this.tile.tileId.toString();
      }
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