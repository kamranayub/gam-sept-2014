class TileFactory {

   public static tiles: Array<() => Tile> = [
      () => new TileA(0),
      () => new TileB(1),
      () => new TileC(2),
      () => new TileD(3)
   ];

}

class Tile extends ex.Actor {
   public static width = 80;

   constructor(public tileId: number) {
      super(0, 0, Tile.width, Tile.width);

      this.anchor.setTo(0, 0);
      this.color = ex.Color.fromHex("#dddddd");
   }

   public clone(): Tile {
      return TileFactory.tiles[this.tileId]();
   }
}

class TileA extends Tile {
   constructor(public tileId: number) {
      super(tileId);
      
      this.color = ex.Color.fromHex("#b9392f");
   }
}

class TileB extends Tile {
   constructor(public tileId: number) {
      super(tileId);

      this.color = ex.Color.fromHex("#1f91ad");
   }
}

class TileC extends Tile {
   constructor(public tileId: number) {
      super(tileId);

      this.color = ex.Color.fromHex("#5fa725");
   }
}

class TileD extends Tile {
   constructor(public tileId: number) {
      super(tileId);

      this.color = ex.Color.fromHex("#752cc0");
   }
}