class TileFactory {

   public static tiles: Array<() => Tile> = [
      () => new TileA(0),
      () => new TileB(1),
      () => new TileC(2),
      () => new TileD(3)
   ];

}

class Tile {
   constructor(public tileId: number) {
      
   }
}

class TileA extends Tile {
   
}

class TileB extends Tile {
   
}

class TileC extends Tile {
   
}

class TileD extends Tile {
   
}