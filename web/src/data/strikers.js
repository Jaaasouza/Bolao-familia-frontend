// Curated Golden Boot candidates for the 2026 pick. Names are written to match
// football-data.org's `scorer.player.name` so the bonus can be awarded
// automatically by comparing against the synced scorers list. `team` is just for
// the dropdown label / flag. Keep this list to well-known goal-scorers.
export const STRIKERS = [
  { name: 'Kylian Mbappé', team: 'France' },
  { name: 'Erling Haaland', team: 'Norway' },
  { name: 'Harry Kane', team: 'England' },
  { name: 'Vinicius Junior', team: 'Brazil' },
  { name: 'Lionel Messi', team: 'Argentina' },
  { name: 'Julián Álvarez', team: 'Argentina' },
  { name: 'Lautaro Martínez', team: 'Argentina' },
  { name: 'Rodrygo', team: 'Brazil' },
  { name: 'Raphinha', team: 'Brazil' },
  { name: 'Cristiano Ronaldo', team: 'Portugal' },
  { name: 'Rafael Leão', team: 'Portugal' },
  { name: 'Gonçalo Ramos', team: 'Portugal' },
  { name: 'Lamine Yamal', team: 'Spain' },
  { name: 'Álvaro Morata', team: 'Spain' },
  { name: 'Nico Williams', team: 'Spain' },
  { name: 'Memphis Depay', team: 'Netherlands' },
  { name: 'Cody Gakpo', team: 'Netherlands' },
  { name: 'Romelu Lukaku', team: 'Belgium' },
  { name: 'Kevin De Bruyne', team: 'Belgium' },
  { name: 'Jamal Musiala', team: 'Germany' },
  { name: 'Kai Havertz', team: 'Germany' },
  { name: 'Florian Wirtz', team: 'Germany' },
  { name: 'Dušan Vlahović', team: 'Croatia' },
  { name: 'Christian Pulisic', team: 'USA' },
  { name: 'Folarin Balogun', team: 'USA' },
  { name: 'Hirving Lozano', team: 'Mexico' },
  { name: 'Santiago Giménez', team: 'Mexico' },
  { name: 'Son Heung-min', team: 'South Korea' },
  { name: 'Mohamed Salah', team: 'Egypt' },
  { name: 'Darwin Núñez', team: 'Uruguay' },
  { name: 'Federico Valverde', team: 'Uruguay' },
  { name: 'Breel Embolo', team: 'Switzerland' },
  { name: 'Sadio Mané', team: 'Senegal' },
  { name: 'Nicolas Jackson', team: 'Senegal' },
  { name: 'Ousmane Dembélé', team: 'France' },
  { name: 'Marcus Rashford', team: 'England' },
  { name: 'Bukayo Saka', team: 'England' },
  { name: 'Jude Bellingham', team: 'England' },
];

export const STRIKER_NAMES = STRIKERS.map((s) => s.name);

// Loose match between a picked striker name and an official scorer name
// (accent/case-insensitive) so small spelling differences still count.
export function normalizeName(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}
