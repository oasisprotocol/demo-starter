import styles from './index.module.css'

// Import piece SVGs
import whiteKnight from '../../assets/pieces/white-knight.svg'
import whiteBishop from '../../assets/pieces/white-bishop.svg'
import whiteRook from '../../assets/pieces/white-rook.svg'
import whiteQueen from '../../assets/pieces/white-queen.svg'
import blackKnight from '../../assets/pieces/black-knight.svg'
import blackBishop from '../../assets/pieces/black-bishop.svg'
import blackRook from '../../assets/pieces/black-rook.svg'
import blackQueen from '../../assets/pieces/black-queen.svg'

interface PromotionModalProps {
  isWhite: boolean
  onSelect: (promoCode: number) => void
  onCancel: () => void
}

export default function PromotionModal({ isWhite, onSelect, onCancel }: PromotionModalProps) {
  const pieces = isWhite
    ? [
        { code: 5, icon: whiteQueen, name: 'Queen' },
        { code: 4, icon: whiteRook, name: 'Rook' },
        { code: 3, icon: whiteBishop, name: 'Bishop' },
        { code: 2, icon: whiteKnight, name: 'Knight' },
      ]
    : [
        { code: 11, icon: blackQueen, name: 'Queen' },
        { code: 10, icon: blackRook, name: 'Rook' },
        { code: 9, icon: blackBishop, name: 'Bishop' },
        { code: 8, icon: blackKnight, name: 'Knight' },
      ]

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>Choose promotion piece</h3>
        <div className={styles.pieces}>
          {pieces.map(piece => (
            <button
              key={piece.code}
              className={styles.pieceButton}
              onClick={() => onSelect(piece.code)}
              aria-label={`Promote to ${piece.name}`}
            >
              <img src={piece.icon} alt={piece.name} />
            </button>
          ))}
        </div>
        <button className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}