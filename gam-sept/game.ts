/// <reference path="tiles.ts"/>
/// <reference path="grid.ts"/>

ex.Logger.getInstance().defaultLevel = ex.LogLevel.Debug;

var engine = new ex.Engine(720, 600);
var board = new Grid();

board.fill();

engine.add(board);

engine.start();