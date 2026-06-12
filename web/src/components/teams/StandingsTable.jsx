// Full official group tables (points/played/W-D-L/GD) from /standings, synced
// into state.standingsTable as { [group]: { table: [{position,team,played,won,
// draw,lost,points,gf,ga,gd}] } }. Renders nothing until the API has tables.
import Flag from './Flag.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

const ST_TXT = {
  en: { title: 'Group Tables', hint: 'Official standings · points · goal difference', team: 'Team', group: 'Group' },
  es: { title: 'Tablas de Grupos', hint: 'Clasificación oficial · puntos · diferencia de goles', team: 'Equipo', group: 'Grupo' },
};

export default function StandingsTable({ standingsTable }) {
  const { lang } = useLang();
  const T = ST_TXT[lang] || ST_TXT.en;
  if (!standingsTable) return null;
  const groups = Object.keys(standingsTable)
    .filter((g) => standingsTable[g] && (standingsTable[g].table || []).length)
    .sort();
  if (!groups.length) return null;

  return (
    <div className="card">
      <h2>{T.title}</h2>
      <p className="hint">{T.hint}</p>
      <div className="standings-tables">
        {groups.map((g) => (
          <div className="stbl" key={g}>
            <div className="stbl-group">{T.group} {g}</div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>{T.team}</th>
                  <th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standingsTable[g].table.map((r, i) => (
                  <tr key={r.team || i} className={i < 2 ? 'qualify' : ''}>
                    <td>{r.position ?? i + 1}</td>
                    <td className="stbl-team"><Flag team={r.team} size={36} /> {r.team}</td>
                    <td>{r.played ?? 0}</td>
                    <td>{r.won ?? 0}</td>
                    <td>{r.draw ?? 0}</td>
                    <td>{r.lost ?? 0}</td>
                    <td>{r.gd > 0 ? `+${r.gd}` : r.gd ?? 0}</td>
                    <td className="stbl-pts">{r.points ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export { StandingsTable };
