'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { FaTools, FaTrashAlt } from 'react-icons/fa';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from './types';
import { tournamentTypes } from './teamGenerators';

// Define the props type for team generator components
type TeamGeneratorProps = {
  tournament: Tournament;
  onUpdate: (updatedTournament: Tournament) => void;
};

// Dynamic import mapping with explicit typing
const teamGeneratorComponents: Record<string, React.ComponentType<TeamGeneratorProps>> = Object.fromEntries(
  tournamentTypes.map(({ name, fileName }) => [
    name,
    dynamic(() => import(`./teamGenerators/${fileName}`), { ssr: false }) as React.ComponentType<TeamGeneratorProps>
  ])
);

const TournamentTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({
  tournament,
  onUpdate,
}) => {
  const clearTeams = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ teams: [] })
        .eq('id', tournament.id);

      if (error) {
        console.error('Error clearing teams in database:', error.message);
        alert('Failed to clear teams. Please try again.');
        return;
      }

      const updatedTournament = { ...tournament, teams: [] };
      onUpdate(updatedTournament);
    } catch (err) {
      console.error('Unexpected error clearing teams:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const renderTeamGenerator = () => {
    if (!tournament.tournament_type || !teamGeneratorComponents[tournament.tournament_type]) {
      return <p className="text-[var(--card-text)] text-center">Unsupported tournament type: {tournament.tournament_type || 'None'}</p>;
    }
    const Component = teamGeneratorComponents[tournament.tournament_type];
    return <Component tournament={tournament} onUpdate={onUpdate} />;
  };

  return (
    <section className="p-4">
      <div className="mb-4">{renderTeamGenerator()}</div>
      <div className="mt-4">
        <table className="w-full mt-2 border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--card-highlight)]">
              <th className="text-left text-[var(--card-text)] p-2">Team Name</th>
              <th className="text-left text-[var(--card-text)] p-2">Players</th>
            </tr>
          </thead>
          <tbody>
            {tournament.teams.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-2 text-[var(--card-text)] text-center">
                  No teams generated yet.
                </td>
              </tr>
            ) : (
              tournament.teams.map((team, index) => (
                <tr key={index} className="odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)]">
                  <td className="p-2 text-[var(--card-text)]">{team.name}</td>
                  <td className="p-2 text-[var(--card-text)]">{team.players.join(', ')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-between mt-8">
          <TournamentHelper tournament={tournament} />
          <Button
            onClick={clearTeams}
            icon={<FaTrashAlt />}
            iconPosition="left"
            className="w-auto bg-[var(--color5)]"
          >
            Clear Teams
          </Button>
        </div>
      </div>
    </section>
  );
};

export const TournamentHelper: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
  const leagueleaderWindowRef = React.useRef<Window | null>(null);
  const toolbarWindowRef = React.useRef<Window | null>(null);

  const leagueleaderWindowWidth = 800;
  const toolbarWindowWidth = 400;
  const windowHeight = 600;

  const calculatePositions = () => {
    const screenWidth = window.screen.availWidth;
    const totalWidth = leagueleaderWindowWidth + toolbarWindowWidth;
    const leftPosition = (screenWidth - totalWidth) / 2;
    return {
      leagueleaderLeft: leftPosition,
      toolbarLeft: leftPosition + leagueleaderWindowWidth,
    };
  };

  const openOrFocusLeagueleaderWindow = (left: number) => {
    if (leagueleaderWindowRef.current && !leagueleaderWindowRef.current.closed) {
      leagueleaderWindowRef.current.focus();
    } else {
      leagueleaderWindowRef.current = window.open(
        'https://leagueleader.net',
        'leagueleaderWindow',
        `width=${leagueleaderWindowWidth},height=${windowHeight},resizable=yes,scrollbars=yes,left=${left},top=100`
      );
    }
  };

  const openOrFocusToolbarWindow = (left: number) => {
    if (toolbarWindowRef.current && !toolbarWindowRef.current.closed) {
      // Update existing popup with new data
      toolbarWindowRef.current.postMessage({ type: 'updateTournament', data: tournament }, '*');
      toolbarWindowRef.current.focus();
    } else {
      if (!tournament || !tournament.teams) {
        alert('Invalid tournament data.');
        return;
      }

      const currentYear = new Date().getFullYear();
      const initialTournamentData = JSON.stringify(tournament);
      const toolbarContent = `
      <html>
        <head>
          <title>JayMar Tournament Helper</title>
          <style>
            body { font-family: Arial, Tahoma, Verdana; background-color: #FFFFFF; margin: 0; padding: 0; }
            div { box-sizing: border-box; }
            .header { height: 47px; width: 100%; background-color: #000000; color: #FFFFFF; text-align: center; line-height: 47px; font-size: 30px; }
            .table-container { margin-top: 8px; padding: 10px; background-color: #FFFFFF; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #000066; color: #FFFFFF; font-weight: bold; padding: 5px; text-align: left; border-bottom: 1px solid #000000; }
            td { padding: 5px; color: #0000CC; border-bottom: 1px solid #000000; }
            tr:nth-child(even) { background-color: #EEEEEE; }
            tr:nth-child(odd) { background-color: #CCCCCC; }
            .copyable { cursor: pointer; }
            .copyable.copied { color: #000080; }
            #footer { text-align: right; padding: 10px; font-size: x-small; color: #000066; background-color: #FFFFFF; }
          </style>
        </head>
        <body>
          <div class="header">JayMar Tournament Helper</div>
          <div class="table-container">
            <div id="team-info"></div>
          </div>
          <div id="footer">© ${currentYear} JayMar Entertainment</div>
          <script>
            let teamData = ${initialTournamentData};

            function populateTeamData() {
              if (!teamData || !teamData.teams) {
                document.getElementById('team-info').innerHTML = 'No team data available.';
                return;
              }
              const teamHTML = \`
                <table>
                  <thead>
                    <tr>
                      <th style="width: 30px;"></th>
                      <th>Team Name</th>
                      <th>Players</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${teamData.teams.map((team, index) => {
                      const players = team.players.map(player => {
                        const [firstName, ...lastNameParts] = player.split(' ');
                        const lastName = lastNameParts.join(' ');
                        return \`<span class="copyable" data-name="\${firstName}">\${firstName}</span> <span class="copyable" data-name="\${lastName}">\${lastName}</span>\`;
                      }).join('<br>');
                      return \`
                        <tr>
                          <td><input type="checkbox" class="toggle-row" data-row="\${index}"></td>
                          <td><span class="copyable" data-name="\${team.name}">\${team.name}</span></td>
                          <td>\${players}</td>
                        </tr>
                      \`;
                    }).join('')}
                  </tbody>
                </table>
              \`;
              document.getElementById('team-info').innerHTML = teamHTML;

              document.querySelectorAll('.copyable').forEach(item => {
                item.addEventListener('click', () => {
                  const textToCopy = item.getAttribute('data-name');
                  navigator.clipboard.writeText(textToCopy).then(() => {
                    item.classList.add('copied');
                    setTimeout(() => item.classList.remove('copied'), 1000);
                  });
                });
              });

              document.querySelectorAll('.toggle-row').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                  const rowIndex = e.target.getAttribute('data-row');
                  const row = document.querySelectorAll('tbody tr')[rowIndex];
                  const spans = row.querySelectorAll('.copyable');
                  spans.forEach(span => {
                    if (e.target.checked) {
                      span.style.textDecoration = 'line-through';
                    } else {
                      span.style.textDecoration = 'none';
                    }
                  });
                });
              });
            }

            // Initial population
            populateTeamData();

            // Listen for updates from the parent window
            window.addEventListener('message', (event) => {
              if (event.data.type === 'updateTournament') {
                teamData = event.data.data;
                populateTeamData();
              }
            });
          </script>
        </body>
      </html>
    `;

      toolbarWindowRef.current = window.open(
        '',
        'toolbarWindow',
        `width=${toolbarWindowWidth},height=${windowHeight},resizable=yes,scrollbars=yes,left=${left},top=100`
      );

      if (toolbarWindowRef.current) {
        toolbarWindowRef.current.document.write(toolbarContent);
        toolbarWindowRef.current.document.close();
      }
    }
  };

  const handleWindows = () => {
    const { leagueleaderLeft, toolbarLeft } = calculatePositions();
    openOrFocusLeagueleaderWindow(leagueleaderLeft);
    openOrFocusToolbarWindow(toolbarLeft);
  };

  return (
    <Button
      onClick={handleWindows}
      icon={<FaTools />}
      iconPosition="left"
      className="w-auto"
    >
      Tournament Helper
    </Button>
  );
};

export default TournamentTeams;