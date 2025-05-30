import React from 'react';
import styles from './index.module.css';

interface PromotionModalProps {
  isWhite: boolean;
  onSelect: (piece: number) => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ isWhite, onSelect, onCancel }) => {
  const pieces = [
    { type: 'queen', value: isWhite ? 5 : 11, icon: isWhite ? '/src/assets/pieces/white-queen.svg' : '/src/assets/pieces/black-queen.svg' },
    { type: 'rook', value: isWhite ? 4 : 10, icon: isWhite ? '/src/assets/pieces/white-rook.svg' : '/src/assets/pieces/black-rook.svg' },
    { type: 'bishop', value: isWhite ? 3 : 9, icon: isWhite ? '/src/assets/pieces/white-bishop.svg' : '/src/assets/pieces/black-bishop.svg' },
    { type: 'knight', value: isWhite ? 2 : 8, icon: isWhite ? '/src/assets/pieces/white-knight.svg' : '/src/assets/pieces/black-knight.svg' },
  ];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Choose promotion piece</h3>
        <div className={styles.pieces}>
          {pieces.map((piece) => (
            <button
              key={piece.type}
              className={styles.pieceButton}
              onClick={() => onSelect(piece.value)}
              aria-label={`Promote to ${piece.type}`}
            >
              <img src={piece.icon} alt={piece.type} className={styles.pieceIcon} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};