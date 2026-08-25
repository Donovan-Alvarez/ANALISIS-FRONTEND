

const PALETA = [
  '#6c69e0', '#0891b2', '#059669', '#d97706',
  '#c026d3', '#e11d48', '#14b8a6', '#8b5cf6',
  '#f97316', '#2563eb', '#db2777', '#65a30d',
];

export function colorParaTexto(texto: string): string {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETA[Math.abs(hash) % PALETA.length];
}