// Teams tab — now just the official Group Tables (points / played / W-D-L / GD).
// The legacy "Teams & Status" teambox grid, the knockout bracket and the team
// detail modal were removed: the scoreline game doesn't use them.
//
// Props: { standingsTable } — { [group]: { table: [{position,team,played,...}] } }
import StandingsTable from '../components/teams/StandingsTable.jsx';

export default function TeamsView({ standingsTable = null }) {
  return <StandingsTable standingsTable={standingsTable} />;
}
