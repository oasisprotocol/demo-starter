// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.25;

import {Sapphire} from "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract BattleChess {
    // ───── public constants ────────────────────────────────────────────────────
    uint8 public constant BOARD_SIZE = 64; // 0…63 squares
    uint8 public constant BLUR_WHITE = 99;  // Unknown white piece
    uint8 public constant BLUR_BLACK = 100; // Unknown black piece

    // Piece encoding: 0=empty, 1-6 white, 7-12 black  (P,N,B,R,Q,K order)
    enum Phase {
        Commit,
        Reveal
    }

    struct Game {
        address white;
        address black;
        bool turnWhite;
        Phase phase;
        bytes32 pendingHash; // hash of *next* move for side-to-move
        bytes32 whiteFirstHash; // white's initial move hash
        bytes32 blackFirstHash; // black's initial move hash
        uint256 moveDeadline; // deadline for current move
        bytes32 randSeed; // TODO: use for fog variation or side randomization
        uint8[64] board; // whole board kept **confidential**
    }

    mapping(uint256 => Game) private games;
    uint256 public nextId;
    
    // Hash-reuse prevention: tracks all used move hashes per game
    mapping(uint256 => mapping(bytes32 => bool)) private usedHash;

    // ───── events (tiny, to avoid leaks) ──────────────────────────────────────
    event GameCreated(uint256 indexed id, address indexed white);
    event Joined(uint256 indexed id, address indexed black);
    event Commit(uint256 indexed id, address indexed player, uint256 deadline);
    event Reveal(uint256 indexed id, uint8 toSq);
    event GameEnded(uint256 indexed id, address indexed winner, string reason);

    // ───── game lifecycle ─────────────────────────────────────────────────────
    // Phase logic: Both players commit their first move when creating/joining
    // This ensures confidentiality from the start, but requires dummy hashes
    // if players don't know their first move yet
    function create(bytes32 firstMoveHash, bool wantRandom) external returns (uint256 id) {
        if (wantRandom) {
            // Generate a properly formatted random first move hash with salt padding
            bytes32 salt = bytes32(Sapphire.randomBytes(32, abi.encodePacked(msg.sender, block.number)));
            firstMoveHash = keccak256(abi.encodePacked(uint8(0), uint8(0), uint8(0), salt));
        } else {
            require(firstMoveHash != bytes32(0), "empty hash");
        }
        id = nextId++;
        Game storage g = games[id];
        g.white = msg.sender;
        g.turnWhite = true;
        g.phase = Phase.Reveal; // white must reveal firstMoveHash after black joins
        g.whiteFirstHash = firstMoveHash;
        g.pendingHash = firstMoveHash; // white will reveal first
        g.randSeed = bytes32(Sapphire.randomBytes(32, abi.encodePacked(id)));
        // Mark first hash as used
        usedHash[id][firstMoveHash] = true;
        _setupBoard(g.board);
        emit GameCreated(id, msg.sender);
    }

    function join(uint256 id, bytes32 firstMoveHash, bool wantRandom) external {
        Game storage g = games[id];
        require(g.white != address(0), "game not created");
        require(g.black == address(0), "taken");
        require(msg.sender != g.white, "already white");
        if (wantRandom) {
            // Generate a properly formatted random first move hash with salt padding
            bytes32 salt = bytes32(Sapphire.randomBytes(32, abi.encodePacked(msg.sender, block.number)));
            firstMoveHash = keccak256(abi.encodePacked(uint8(0), uint8(0), uint8(0), salt));
        } else {
            require(firstMoveHash != 0, "empty hash");
        }
        g.black = msg.sender;
        g.blackFirstHash = firstMoveHash;
        g.moveDeadline = block.number + 300;
        // Mark black's first hash as used
        usedHash[id][firstMoveHash] = true;
        // pendingHash remains white's first move hash
        g.phase = Phase.Reveal; // white reveals first
        emit Joined(id, msg.sender);
    }

    // ───── commit / reveal -----------------------------------------------------
    function commit(uint256 id, bytes32 moveHash) external {
        Game storage g = games[id];
        _authTurn(g);
        require(g.phase == Phase.Commit, "bad phase");
        require(moveHash != 0, "empty hash");
        g.pendingHash = moveHash;
        g.phase = Phase.Reveal;
        g.moveDeadline = block.number + 300; // ~1 hour at 12s/block
        emit Commit(id, msg.sender, g.moveDeadline);
    }

    function reveal(uint256 id, uint8 fromSq, uint8 toSq, uint8 promo, bytes32 salt) external {
        Game storage g = games[id];
        _authTurn(g);
        require(g.phase == Phase.Reveal, "bad phase");

        // Validate square ranges
        require(fromSq < 64 && toSq < 64, "invalid square");

        bytes32 expected = keccak256(abi.encodePacked(fromSq, toSq, promo, salt));
        require(expected == g.pendingHash, "hash mismatch");
        
        // Prevent hash reuse across any turn
        require(!usedHash[id][expected], "hash already used");
        usedHash[id][expected] = true;

        uint8 moving = g.board[fromSq];
        require(moving != 0, "empty");
        require(isWhite(moving) == g.turnWhite, "not your piece");

        // **For demo only**: skip deep legality checks, just move & capture.
        // TODO: Add time-based liveness guarantees to prevent griefing
        // (e.g., per-move timeouts, surrender/claim-win mechanics)
        g.board[fromSq] = 0;
        
        // Handle pawn promotion
        if (moving == 1 || moving == 7) {
            // Check if pawn reaches the opposite end
            uint8 row = toSq / 8;
            if ((moving == 1 && row == 7) || (moving == 7 && row == 0)) {
                // Default to queen if no promotion specified
                if (promo == 0) {
                    promo = moving == 1 ? 5 : 11; // Default to queen
                }
                // Validate promotion piece
                if (moving == 1) {
                    require(promo >= 2 && promo <= 5, "invalid white promo");
                    g.board[toSq] = promo;
                } else {
                    require(promo >= 8 && promo <= 11, "invalid black promo");
                    g.board[toSq] = promo;
                }
            } else {
                // Pawn not promoting, promo must be zero
                require(promo == 0, "promo only at last rank");
                g.board[toSq] = moving;
            }
        } else {
            // If the moving piece is not a pawn, promo must be zero
            require(promo == 0, "promo only for pawns");
            g.board[toSq] = moving;
        }

        // Check if this is a first-move hash before we clear it
        bool wasWhiteFirst = (g.pendingHash == g.whiteFirstHash);
        bool wasBlackFirst = (g.pendingHash == g.blackFirstHash);
        
        g.turnWhite = !g.turnWhite;
        
        // Emit only square index; hide what piece landed there.
        emit Reveal(id, toSq);

        // First-move hashes are single-use
        if (wasWhiteFirst) g.whiteFirstHash = bytes32(0);
        if (wasBlackFirst) g.blackFirstHash = bytes32(0);

        // After first two reveals, set up next pending hash
        if (!g.turnWhite && wasWhiteFirst) {
            // Just revealed white's first move, now set black's
            g.pendingHash = g.blackFirstHash;
            g.phase = Phase.Reveal; // Black reveals next
            g.moveDeadline = block.number + 300;
        } else {
            g.phase = Phase.Commit; // Normal flow
            g.moveDeadline = block.number + 300; // Set deadline for next move
        }
    }

    // ───── timeout claim -------------------------------------------------------
    function claimTimeout(uint256 id) external {
        Game storage g = games[id];
        // Allow timeout claims in both Commit and Reveal phases
        require(g.phase == Phase.Commit || g.phase == Phase.Reveal, "invalid phase");
        require(block.number > g.moveDeadline && g.moveDeadline != 0, "deadline not passed");
        require(
            (g.turnWhite && msg.sender == g.black) || (!g.turnWhite && msg.sender == g.white),
            "not opponent"
        );
        // Award game to claimer by clearing opponent's pieces
        _clearColorPieces(g, g.turnWhite);
        
        // Update turn to winner
        g.turnWhite = (msg.sender == g.white);
        g.phase = Phase.Commit; // Reset to allow continuing if desired
        g.moveDeadline = 0; // Reset deadline to prevent immediate re-claim
        emit GameEnded(id, msg.sender, "timeout");
    }

    // ───── fog-aware view ------------------------------------------------------
    function viewBoard(uint256 id) external view returns (uint8[64] memory vis) {
        Game storage g = games[id];
        bool isWhitePlayer = msg.sender == g.white;
        bool isBlack = msg.sender == g.black;
        require(isWhitePlayer || isBlack, "not a player");
        _maskBoard(g.board, isWhitePlayer, vis);
    }

    // ───── internal helpers (stripped-down) -----------------------------------
    function _authTurn(Game storage g) private view {
        require(
            (g.turnWhite && msg.sender == g.white) || (!g.turnWhite && msg.sender == g.black),
            "not your turn"
        );
    }

    function _setupBoard(uint8[64] storage b) private {
        // White pieces (1-6: P,N,B,R,Q,K)
        // Back rank
        b[0] = 4;  // Rook
        b[1] = 2;  // Knight
        b[2] = 3;  // Bishop
        b[3] = 5;  // Queen
        b[4] = 6;  // King
        b[5] = 3;  // Bishop
        b[6] = 2;  // Knight
        b[7] = 4;  // Rook
        // Pawns
        for (uint8 i = 8; i < 16; ) {
            b[i] = 1;
            unchecked { ++i; }
        }
        
        // Black pieces (7-12: P,N,B,R,Q,K)
        // Pawns
        for (uint8 i = 48; i < 56; ) {
            b[i] = 7;
            unchecked { ++i; }
        }
        // Back rank
        b[56] = 10; // Rook
        b[57] = 8;  // Knight
        b[58] = 9;  // Bishop
        b[59] = 11; // Queen
        b[60] = 12; // King
        b[61] = 9;  // Bishop
        b[62] = 8;  // Knight
        b[63] = 10; // Rook
    }

    function _maskBoard(
        uint8[64] storage full,
        bool isWhitePlayer,
        uint8[64] memory out
    ) private view {
        // show own pieces
        // NOTE: Simplified vision - only reveals pawn & king move squares
        // Full chess line-of-sight (rooks, bishops, queens) not implemented
        uint8 low = isWhitePlayer ? 1 : 7;
        uint8 high = low + 5;
        for (uint8 i = 0; i < 64; ) {
            uint8 p = full[i];
            bool own = p >= low && p <= high;
            if (own) {
                out[i] = p;
                _ray(full, i, out, isWhitePlayer);
            }
            unchecked { ++i; }
        }
    }

    function _ray(uint8[64] storage full, uint8 src, uint8[64] memory out, bool isWhitePlayer) private view {
        int8[8] memory delta = [int8(-8), 8, -1, 1, -9, -7, 9, 7];
        uint8 p = full[src];
        uint8 pieceType = (p - 1) % 6 + 1; // Normalize to 1-6
        
        // Simplified vision for all pieces
        if (pieceType == 1) {
            // Pawn - can see forward and diagonally
            int8 d = isWhite(p) ? int8(8) : -8;
            _spot(src, d, full, out, isWhitePlayer);
            _spot(src, d - 1, full, out, isWhitePlayer); // Diagonal left
            _spot(src, d + 1, full, out, isWhitePlayer); // Diagonal right
            // Pawns can also see 2 squares forward from starting position
            uint8 row = src / 8;
            if ((isWhite(p) && row == 1) || (!isWhite(p) && row == 6)) {
                _spot(src, d * 2, full, out, isWhitePlayer);
            }
        } else if (pieceType == 2) {
            // Knight moves
            int8[8] memory knightMoves = [int8(-17), -15, -10, -6, 6, 10, 15, 17];
            for (uint8 k = 0; k < 8; ) {
                _spot(src, knightMoves[k], full, out, isWhitePlayer);
                unchecked { ++k; }
            }
        } else {
            // For other pieces (B,R,Q,K), just show adjacent squares for simplicity
            for (uint8 k = 0; k < 8; ) {
                _spot(src, delta[k], full, out, isWhitePlayer);
                unchecked { ++k; }
            }
        }
    }

    function _spot(uint8 s, int8 d, uint8[64] storage full, uint8[64] memory out, bool isWhitePlayer) private view {
        int16 t = int16(int8(s)) + int16(d);
        if (t >= 0 && t < 64) {
            uint8 q = full[uint8(uint16(t))];
            // Use constants for blur codes
            out[uint8(uint16(t))] = (q == 0 || isWhite(q) == isWhitePlayer) ? q : (isWhite(q) ? BLUR_WHITE : BLUR_BLACK);
        }
    }

    function gameState(uint256 id)
        external
        view
        returns (Phase phase, bool turnWhite, address white, address black)
    {
        Game storage g = games[id];
        return (g.phase, g.turnWhite, g.white, g.black);
    }

    function isWhite(uint8 p) private pure returns (bool) {
        return p >= 1 && p <= 6;
    }
    
    function _clearColorPieces(Game storage g, bool clearWhite) private {
        for (uint8 i = 0; i < 64; ) {
            uint8 piece = g.board[i];
            if (piece != 0 && isWhite(piece) == clearWhite) {
                g.board[i] = 0;
            }
            unchecked { ++i; }
        }
    }
}
