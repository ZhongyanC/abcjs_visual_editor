interface MusicGlyphProps {
  symbol: string
  size?: number
}

export function MusicGlyph({ symbol, size = 20 }: MusicGlyphProps) {
  return (
    <span
      style={{
        fontFamily: "'Leland', serif",
        fontSize: `${size || 20}px`,
        lineHeight: 1,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      {symbol}
    </span>
  )
}
