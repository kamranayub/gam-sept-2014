var config = {
   size: 5,
   types: ['X', 'Y', 'A', 'B']
};
var $board = $("#board"), board;

var game = {
   fill: function () {
      var i, j, s, availableSet;

      for (i = 0; i < board.length; i++) {
         for (j = 0; j < board[i].length; j++) {
            if (board[i][j] === '') {

               // full set available
               availableSet = [];

               // foreach in set
               for (s = 0; s < config.types.length; s++) {

                  // if the given tile will not result in a match, add to
                  // potential set
                  if (!game.findMatches(config.types[s], j, i).length) {
                     availableSet.push(config.types[s]);
                  }
               }

               board[i][j] = availableSet[Math.floor(Math.random() * availableSet.length)];
            }
         }
      }
   },

   findMatches: function (tile, tx, ty) {
      var matches = [], i;

      // explore horizontal/vertical matches
      var e = game.peek(tx, ty, config.size, 1, 0); // e
      var w = game.peek(tx, ty, config.size, -1, 0); // w                  
      var n = game.peek(tx, ty, config.size, 0, -1); // n
      var s = game.peek(tx, ty, config.size, 0, 1); // s

      var horizontal = game.getSequences(tile, tx, ty, w, e);
      var vertical = game.getSequences(tile, tx, ty, n, s);

      for (i = 0; i < horizontal.length; i++) {
         matches.push(horizontal[i]);
      }
      for (i = 0; i < vertical.length; i++) {
         matches.push(vertical[i]);
      }

      return matches;
   },

   getSequences: function (tile, cx, cy, left, right) {
      // horizontal sequence
      var results = [], match, sequence = [];

      for (i = left.length - 1; i >= 0; i--) {
         sequence.push(left[i]);
      }
      sequence.push({ t: tile, x: cx, y: cy });
      for (i = 0; i < right.length; i++) {
         sequence.push(right[i]);
      }

      // longest match sequence
      match = [];
      for (i = 0; i < sequence.length; i++) {
         if (sequence[i].t === tile) {
            match.push([sequence[i].x, sequence[i].y]);
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

      return results.filter(function(m) {
         return m.length >= 3;
      });
   },

   peek: function (x, y, length, dx, dy) {

      var tiles = [], tile, tx, ty;

      for (var i = 1; i <= length; i++) {
         tx = dx === 0 ? x : x + (i * dx);
         ty = dy === 0 ? y : y + (i * dy);

         if (ty >= 0 && ty < board.length &&
             tx >= 0 && tx < board[0].length) {
            tile = { t: board[ty][tx], x: tx, y: ty };
            tiles.push(tile);
         }
      }

      return tiles;
   },

   generateBoard: function () {
      var i, j;

      board = [];

      // Fill blank
      for (i = 0; i < config.size; i++) {
         board.push([]);

         for (j = 0; j < config.size; j++) {
            board[i].push('');
         }
      }

      // Fill
      game.fill();
   },

   swap: function (x1, y1, x2, y2) {

      var dfd = $.Deferred();

      if (game.isNeighboring(x1, y1, x2, y2)) {

         var that = board[y1][x1];
         var other = board[y2][x2];

         // preview swap
         board[y1][x1] = other;
         board[y2][x2] = that;

         var thatMatches = game.findMatches(that, x2, y2, board);
         var otherMatches = game.findMatches(other, x1, y1, board);

         if (thatMatches.length || otherMatches.length) {

            ui.drawBoard();

            // OK!
            var matches = _.union(thatMatches, otherMatches);

            return ui.animateDestroy(matches).then(function() {
               _.forEach(matches, function (sequence) {

                  _.forEach(sequence, function(coord) {
                     board[coord[1]][coord[0]] = '';
                  });                  

               });
            });

         } else {

            board[y1][x1] = that;
            board[y2][x2] = other;

            alert("Invalid move");

            dfd.fail();
         }
      } else {
         console.log(x1, y1, "and", x2, y2, "are not neighbors");

         dfd.fail();
      }

      return dfd;
   },

   isNeighboring: function (x1, y1, x2, y2) {
      var left = { x: x1 - 1, y: y1 },
          right = { x: x1 + 1, y: y1 },
          top = { x: x1, y: y1 - 1 },
          bottom = { x: x1, y: y1 + 1 };

      return (left.x === x2 && left.y === y2) ||
          (right.x === x2 && right.y === y2) ||
          (top.x === x2 && top.y === y2) ||
          (bottom.x === x2 && bottom.y === y2);
   }
};

var ui = {
   initialized: false,

   drawBoard: function () {
      var i, j, $tile;

      if (!ui.initialized) {
         ui.initialized = true;

         for (i = 0; i < board.length; i++) {
            for (j = 0; j < board[i].length; j++) {
               $tile = $("<div class='tile'></div>");
               $tile.text(board[i][j]);
               $tile.data("x", j);
               $tile.data("y", i);
               $board.append($tile);

               if (j === 0) {
                  $tile.css("clear", "left");
               }
            }
         }

         // tile click
         $board.on('click', '.tile', ui.handleTileClick);         
      } else {

         $(".tile").each(function() {
            var $this = $(this),
               x = parseInt($this.data("x"), 10),
               y = parseInt($this.data("y"), 10);

            $this.text(board[y][x]);
         });

      }
      
   },

   handleTileClick: function (e) {
      var $this = $(this);

      $this.toggleClass("active");

      var $activeTiles = $(".tile.active");

      if ($activeTiles.length === 2) {
         $activeTiles.removeClass("active");

         var x1 = parseInt($activeTiles.eq(0).data("x"), 10);
         var y1 = parseInt($activeTiles.eq(0).data("y"), 10);
         var x2 = parseInt($activeTiles.eq(1).data("x"), 10);
         var y2 = parseInt($activeTiles.eq(1).data("y"), 10);

         game.swap(x1, y1, x2, y2).then(function() {
            ui.drawBoard();
         });         
      }
   },

   animateDestroy: function(matches) {

      var dfd = $.Deferred();

      _.forEach(matches, function (sequence) {
         _.forEach(sequence, function(coord) {
            $(".tile").each(function () {
               var $this = $(this);

               if ($this.data("x") == coord[0].toString() && $this.data("y") == coord[1].toString()) {
                  $this.addClass("destroy");
               }
            });
         });         
      });

      $(".tile.destroy").animate({ opacity: 0 }, 1500, 'swing', function() {
         dfd.resolve();
      });

      return dfd;
   }
};

game.generateBoard();

ui.drawBoard();