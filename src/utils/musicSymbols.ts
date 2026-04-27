// SMuFL Unicode codepoints for Leland music font.
// Complete note glyphs include stem+flags; rests and accidentals are standalone.
export const MS = {
  // Complete note glyphs (notehead + stem, stem up)
  noteWhole:    '\uE1D2',
  noteHalf:     '\uE1D3',
  noteQuarter:  '\uE1D5',
  note8th:      '\uE1D7',
  note16th:     '\uE1D9',
  note32nd:     '\uE1DB',
  note64th:     '\uE1DD',
  // Rests
  restWhole:    '\uE4E3',
  restHalf:     '\uE4E4',
  restQuarter:  '\uE4E5',
  rest8th:      '\uE4E6',
  rest16th:     '\uE4E7',
  rest32nd:     '\uE4E8',
  rest64th:     '\uE4E9',
  // Augmentation dot
  augDot:       '\uE1E7',
  // Accidentals
  dblFlat:      '\uE264',
  flat:         '\uE260',
  natural:      '\uE261',
  sharp:        '\uE262',
  dblSharp:     '\uE263',
  // Articulations
  accent:       '\uE4A0',
  staccato:     '\uE4A2',
  tenuto:       '\uE4A4',
  marcato:      '\uE4AC',
  fermata:      '\uE4C0',
  fermataDown:  '\uE4C1',
  breath:       '\uE4CE',
  downBow:      '\uE610',
  upBow:        '\uE612',
  snapPizz:     '\uE631',
  // Ornaments
  trill:        '\uE566',
  turn:         '\uE567',
  turnSlash:    '\uE568',
  upperMordent: '\uE56B',
  lowerMordent: '\uE56C',
} as const
