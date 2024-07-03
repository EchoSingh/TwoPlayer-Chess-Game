document.addEventListener("DOMContentLoaded", () => {
    const chessboard = document.getElementById('chessboard');
    const board = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];

    let selectedSquare = null;
    let selectedPiece = null;
    let enPassantSquare = null;

    function renderBoard() {
        chessboard.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
                square.dataset.row = i;
                square.dataset.col = j;
                square.innerHTML = board[i][j];
                square.addEventListener('click', handleSquareClick);
                chessboard.appendChild(square);
            }
        }
    }

    function handleSquareClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);

        if (selectedSquare) {
            if (isValidMove(selectedSquare, [row, col])) {
                // Move piece
                const [selectedRow, selectedCol] = selectedSquare;
                board[row][col] = selectedPiece;
                board[selectedRow][selectedCol] = '';

                // Handle en passant
                if (enPassantSquare && row === enPassantSquare[0] && col === enPassantSquare[1]) {
                    const direction = selectedPiece === '♙' ? -1 : 1;
                    board[row + direction][col] = '';
                }

                // Handle pawn promotion
                if (selectedPiece === '♙' && row === 0) {
                    board[row][col] = '♕';
                } else if (selectedPiece === '♟' && row === 7) {
                    board[row][col] = '♛';
                }

                selectedSquare = null;
                selectedPiece = null;
                enPassantSquare = null;
                renderBoard();
                setTimeout(makeBestMove, 250);
            } else {
                selectedSquare = null;
                selectedPiece = null;
            }
        } else {
            // Select piece
            selectedSquare = [row, col];
            selectedPiece = board[row][col];
        }
    }

    function isValidMove(from, to) {
        const [fromRow, fromCol] = from;
        const [toRow, toCol] = to;
        const piece = board[fromRow][fromCol].toLowerCase();

        if (piece === '♟' || piece === '♙') {
            // Pawn movement
            const direction = piece === '♙' ? -1 : 1;
            const startRow = piece === '♙' ? 6 : 1;
            if (fromCol === toCol && board[toRow][toCol] === '' && ((toRow === fromRow + direction) || (fromRow === startRow && toRow === fromRow + 2 * direction))) {
                if (toRow === fromRow + 2 * direction) {
                    enPassantSquare = [toRow - direction, toCol];
                }
                return true;
            }
            if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && (board[toRow][toCol] !== '' || (enPassantSquare && toRow === enPassantSquare[0] && toCol === enPassantSquare[1])) && isOpponentPiece(from, to)) {
                return true;
            }
        } else if (piece === '♞' || piece === '♘') {
            // Knight movement
            const knightMoves = [
                [fromRow + 2, fromCol + 1], [fromRow + 2, fromCol - 1],
                [fromRow - 2, fromCol + 1], [fromRow - 2, fromCol - 1],
                [fromRow + 1, fromCol + 2], [fromRow + 1, fromCol - 2],
                [fromRow - 1, fromCol + 2], [fromRow - 1, fromCol - 2]
            ];
            return knightMoves.some(move => move[0] === toRow && move[1] === toCol && (!board[toRow][toCol] || isOpponentPiece(from, to)));
        } else if (piece === '♝' || piece === '♗') {
            // Bishop movement
            if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
                const rowStep = (toRow - fromRow) / Math.abs(toRow - fromRow);
                const colStep = (toCol - fromCol) / Math.abs(toCol - fromCol);
                for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                    if (board[fromRow + i * rowStep][fromCol + i * colStep]) {
                        return false;
                    }
                }
                return !board[toRow][toCol] || isOpponentPiece(from, to);
            }
        } else if (piece === '♜' || piece === '♖') {
            // Rook movement
            if (fromRow === toRow || fromCol === toCol) {
                const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
                const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
                for (let i = 1; i < Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol)); i++) {
                    if (board[fromRow + i * rowStep][fromCol + i * colStep]) {
                        return false;
                    }
                }
                return !board[toRow][toCol] || isOpponentPiece(from, to);
            }
        } else if (piece === '♛' || piece === '♕') {
            // Queen movement (combination of rook and bishop)
            if (fromRow === toRow || fromCol === toCol || Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
                const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
                const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
                for (let i = 1; i < Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol)); i++) {
                    if (board[fromRow + i * rowStep][fromCol + i * colStep]) {
                        return false;
                    }
                }
                return !board[toRow][toCol] || isOpponentPiece(from, to);
            }
        } else if (piece === '♚' || piece === '♔') {
            // King movement and castling
            if (Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1) {
                return !board[toRow][toCol] || isOpponentPiece(from, to);
            }
            if (fromRow === 7 && toRow === 7 && (toCol === 2 || toCol === 6) && !selectedSquare.hasMoved) {
                // Castling
                if (toCol === 2 && board[7][0] === '♖' && !board[7][1] && !board[7][2] && !board[7][3]) {
                    board[7][3] = '♖';
                    board[7][0] = '';
                    return true;
                }
                if (toCol === 6 && board[7][7] === '♖' && !board[7][5] && !board[7][6]) {
                    board[7][5] = '♖';
                    board[7][7] = '';
                    return true;
                }
            }
            if (fromRow === 0 && toRow === 0 && (toCol === 2 || toCol === 6) && !selectedSquare.hasMoved) {
                if (toCol === 2 && board[0][0] === '♜' && !board[0][1] && !board[0][2] && !board[0][3]) {
                    board[0][3] = '♜';
                    board[0][0] = '';
                    return true;
                }
                if (toCol === 6 && board[0][7] === '♜' && !board[0][5] && !board[0][6]) {
                    board[0][5] = '♜';
                    board[0][7] = '';
                    return true;
                }
            }
        }

        return false;
    }

    function isOpponentPiece(from, to) {
        const fromPiece = board[from[0]][from[1]];
        const toPiece = board[to[0]][to[1]];
        return (fromPiece.toUpperCase() === fromPiece && toPiece.toLowerCase() === toPiece) ||
               (fromPiece.toLowerCase() === fromPiece && toPiece.toUpperCase() === toPiece);
    }

    function makeBestMove() {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] !== '' && board[i][j].toLowerCase() !== board[i][j]) {
                    const from = [i, j];
                    for (let x = 0; x < 8; x++) {
                        for (let y = 0; y < 8; y++) {
                            const to = [x, y];
                            if (isValidMove(from, to)) {
                                moves.push({ from, to });
                            }
                        }
                    }
                }
            }
        }

        if (moves.length === 0) return;

        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const [fromRow, fromCol] = randomMove.from;
        const [toRow, toCol] = randomMove.to;

        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = '';
        renderBoard();
    }

    renderBoard();
});
