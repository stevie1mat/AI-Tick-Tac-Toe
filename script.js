// ------------------------
// CONFIGURATION
// ------------------------

var Config = {
  outerMargin: 48,
  innerMargin: 4,
  backColor: "rgb(64,208,192)",
  squareColor: "rgb(255,255,255)",
  penColor: "rgb(48,48,48)",
  penHoverColor: "rgb(208,208,208)",
  penWinColor: "rgba(255,48,48,0.6)",
  penWidth: 8,
  penWinWidth: 12,
};



// ------------------------
// GLOBAL VARS
// ------------------------

var cvs,
    ctx,
    pageW,
    pageH,
    boardSize,
    boardL,
    boardT,
    sqSize,
    sqOffset,
    squares,
    playerTurn,
    playerFirst = 0,
    mousedIndex,
    gameStatus;



// ------------------------
// SETUP / INITIALIZATION
// ------------------------

function CreateCanvas(){
  var body = document.getElementsByTagName('body')[0];
  
  cvs = document.createElement('canvas');
  cvs.style.position = 'absolute';
  cvs.style.top = cvs.style.left = cvs.style.bottom = cvs.style.right = 0;
  
  ctx = cvs.getContext('2d');
  body.appendChild(cvs);  
}


function SetCanvasSize(){
  pageW = cvs.width = window.innerWidth;
  pageH = cvs.height = window.innerHeight;
  
  boardSize = Math.min(pageW, pageH) - 2*Config.outerMargin;
  sqSize = Math.floor((boardSize - 2*Config.innerMargin)/3);
  sqOffset = sqSize+Config.innerMargin;
  
  boardSize = 3*sqSize + 2*Config.innerMargin;
  boardL = Math.floor(pageW/2 - boardSize/2);
  boardT = Math.floor(pageH/2 - boardSize/2);
}


function Init(){
  var i;
  
  squares = [];
  for(i = 0; i < 9; i++){
    squares[i] = null;
  }
  
  gameStatus = { winner:null }; 
  playerTurn = 1 - playerFirst;
  playerFirst = 1 - playerFirst;
  mousedIndex = -1;

  ChangeTurn();
}



// ------------------------
// CORE FUNCTIONS
// ------------------------

function AddMove(index,player){
  squares[index] = player;
  gameStatus = GetOutcomes(squares);
  ChangeTurn();
}


function ChangeTurn(){
  if (gameStatus.winner === null){
    playerTurn = 1 - playerTurn;
    if (playerTurn === 1){      
      AIMove(squares,playerTurn);
    }
  }
  mousedIndex = -1;
  Draw();
}


function CheckMousePos(mX,mY,click){
  var left,
      top,
      index = -1,
      i,
      j;
  
  for(i = 0; i < 3; i++){
    for(j = 0; j < 3; j++){
      left = boardL + i*sqOffset;
      top = boardT + j*sqOffset;     
      if (squares[CoordsToIndex(i,j)] === null && 
          PointInRect(mX, mY, left, top, sqSize, sqSize)){        
        index = CoordsToIndex(i,j);
      }
    }
  }
  
  cvs.style.cursor = (index > -1)? 'pointer' : 'default';
  if (mousedIndex !== index){
    mousedIndex = index;
    Draw();
  }
  
  if (click && squares[index]===null){
    AddMove(index, playerTurn);
  }  
}


function FindMoves(board){
  var moves = [],
      i;
  
  for(i = 0; i < 9; i++){
    if (board[i] === null){
      moves.push(i);
    }
  }  
  return (moves.length > 0)? moves : null;
}


function GetOutcomes(board){
  var i,
      openSquares;
  
  // check for win condition along horizontal and vertical rows
  for(i = 0; i < 3; i++){
    if (board[CoordsToIndex(i,0)] !== null && 
        board[CoordsToIndex(i,0)] === board[CoordsToIndex(i,1)] &&
        board[CoordsToIndex(i,0)] === board[CoordsToIndex(i,2)]){
      return {
        winner: board[CoordsToIndex(i,0)], 
        squares: [ {x:i,y:0}, {x:i,y:1}, {x:i,y:2} ]
      };
    }
    if (board[CoordsToIndex(0,i)] !== null && 
        board[CoordsToIndex(0,i)] === board[CoordsToIndex(1,i)] &&
        board[CoordsToIndex(0,i)] === board[CoordsToIndex(2,i)]){
      return {
        winner: board[CoordsToIndex(0,i)], 
        squares: [ {x:0,y:i}, {x:1,y:i}, {x:2,y:i} ]
      };
    }
  }
  
  // check for win condition along diagonals
  if (board[CoordsToIndex(0,0)] !== null &&
      board[CoordsToIndex(0,0)] === board[CoordsToIndex(1,1)] &&
      board[CoordsToIndex(0,0)] === board[CoordsToIndex(2,2)]){
    return {
      winner: board[CoordsToIndex(0,0)], 
      squares: [ {x:0,y:0}, {x:1,y:1}, {x:2,y:2} ]
    };
  }
  if (board[CoordsToIndex(0,2)] !== null &&
      board[CoordsToIndex(0,2)] === board[CoordsToIndex(1,1)] &&
      board[CoordsToIndex(0,2)] === board[CoordsToIndex(2,0)]){
    return {
      winner: board[CoordsToIndex(0,2)], 
      squares: [ {x:0,y:2}, {x:1,y:1}, {x:2,y:0} ]
    };
  }
  
  // if no winner found, check for tie
  openSquares = FindMoves(board);
  
  // if moves found, game is not tied
  if (openSquares){
    return {
      winner: null,
      squares: openSquares
    };
  }
  else{
    return { 
      winner: -1,
      squares: null
    };
  }
}



// ------------------------
// AI FUNCTIONS/OBJECTS
// ------------------------

function AIMove(board, player){
  var outcomes = GetOutcomes(board),
      bestMove,
      bestAlphaBeta = -2,
      testAlphaBeta,
      testBoard,
      i;

  for(i = 0; i < outcomes.squares.length; i++){      
    testBoard = board.slice(0);
    testBoard[outcomes.squares[i]] = player;
    testAlphaBeta = AlphaBeta(testBoard, -999, 999, player, false);

    if (testAlphaBeta > bestAlphaBeta){
      bestMove = outcomes.squares[i];
      bestAlphaBeta = testAlphaBeta;
    }
  }

  AddMove(bestMove,player);
};

function AlphaBeta(board, a, b, player, maximizingPlayer){
  var i,
      outcome = GetOutcomes(board),
      childBoard;

  if (outcome.winner !== null){
    if (outcome.winner === player){ return 1; }
    else if (outcome.winner === 1-player){ return -1; }
    else{ return 0; }
  }

  if (maximizingPlayer){
    for(i = 0; i < outcome.squares.length; i++){
      childBoard = board.slice(0);
      childBoard[outcome.squares[i]] = player;
      a = Math.max(a, AlphaBeta(childBoard, a, b, player, false));
      if(b <= a){
        break; //b cut off
      }
    }
    return a;   
  }
  else{
    for(i = 0; i < outcome.squares.length; i++){
      childBoard = board.slice(0);
      childBoard[outcome.squares[i]] = 1-player;
      b = Math.min(b, AlphaBeta(childBoard, a, b, player, true));
      if (b <= a){
        break; //a cut off
      }
    }
    return b;
  }
};



// ------------------------
// DRAW FUNCTIONS
// ------------------------

function Draw(){
  var left,
      top,
      isHover,
      i,
      j,
      index;
  
  ctx.fillStyle = Config.backColor;
  ctx.fillRect(0, 0, pageW, pageH);  
  
  for(i = 0; i < 3; i++){
    for(j = 0; j < 3; j++){
      left = boardL + i*sqOffset;
      top = boardT + j*sqOffset;
      index = CoordsToIndex(i,j);
      isHover = (index === mousedIndex);      
      
      DrawSquare(squares[index], left, top, sqSize, isHover);
    }
  }
  
  if (gameStatus.winner === 0 || gameStatus.winner === 1){ DrawWinnerLine(); }
}


function DrawSquare(player, left, top, size, isMoused){
  ctx.fillStyle = Config.squareColor;
  ctx.fillRect(left, top, sqSize, sqSize);
  
  if (player === 0 || (playerTurn === 0 && isMoused)){
    DrawX(left, top, size);
  }
  else if (player === 1 || (playerTurn === 1 && isMoused)){
    DrawO(left, top, size);
  }
  else {
    return;
  }
  ctx.lineWidth = (sqSize/100) * Config.penWidth;
  ctx.strokeStyle = (isMoused && player===null)? Config.penHoverColor : Config.penColor;
  ctx.stroke();
}


function DrawX(left, top, size){
  var x1 = left + 0.2*size,
      x2 = left + 0.8*size,
      y1 = top + 0.2*size,
      y2 = top + 0.8*size;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.moveTo(x1, y2);
  ctx.lineTo(x2, y1);
}


function DrawO(left, top, size){
  var x = left + 0.5*size,
      y = top + 0.5*size,
      rad = 0.3*size;
  
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, 2*Math.PI, false);
}


function DrawWinnerLine(){
  var x1 = boardL + gameStatus.squares[0].x*sqOffset + 0.5*sqSize,      
      x2 = boardL + gameStatus.squares[2].x*sqOffset + 0.5*sqSize,      
      y1 = boardT + gameStatus.squares[0].y*sqOffset + 0.5*sqSize,
      y2 = boardT + gameStatus.squares[2].y*sqOffset + 0.5*sqSize,
      xMod = 0.2*(x2-x1),
      yMod = 0.2*(y2-y1);
  
  x1 -= xMod;
  x2 += xMod;
  
  y1 -= yMod;
  y2 += yMod;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  
  ctx.lineWidth = (sqSize/100) * Config.penWinWidth;
  ctx.strokeStyle = Config.penWinColor;
  ctx.stroke();
}



// ------------------------
// HELPER FUNCTIONS
// ------------------------

function PointInRect(pX, pY, rL, rT, rW, rH){
  return (pX>rL && pX<rL+rW && pY>rT && pY<rT+rW);
}


function CoordsToIndex(x,y){
  return x + 3*y;
}



// ------------------------
// EVENT HANDLERS/LISTENERS
// ------------------------

function OnLoad(){
  CreateCanvas();
  SetCanvasSize();
  Init();
}

function OnResize(){
  SetCanvasSize();
  Draw();
}

function OnMouseMove(e){
  if (playerTurn === 0){
    CheckMousePos(e.clientX, e.clientY);
  }
}

function OnMouseDown(e){
  if (gameStatus.winner !== null){
    Init();
  }
  else if (playerTurn === 0){
    CheckMousePos(e.clientX, e.clientY, true);
  }
}

function OnKeyDown(e){
  var key = event.keyCode || event.which;
  switch (key){
    case 27:
    case 82: Init(); break;
    default: break;
  }
}


window.addEventListener('load',OnLoad,false);
window.addEventListener('resize',OnResize,false);
window.addEventListener('mousemove',OnMouseMove,false);
window.addEventListener('mousedown',OnMouseDown,false);
window.addEventListener('keydown',OnKeyDown,false);