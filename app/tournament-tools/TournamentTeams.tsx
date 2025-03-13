'use client';
import React from 'react';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from './types'; // Import shared type

const TournamentTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({ tournament, onUpdate }) => {
  const handleGenerateTeams = async () => {
    try {
      const { data, error } = await supabase
        .rpc('generate_teams', { tournament_id: tournament.id })
        .select()
        .single();
      if (error) throw error;
      onUpdate(data);
    } catch (error: any) {
      console.error('Error generating teams:', error.message);
    }
  };

  return (
    <section className="p-4">
      <div className="mb-4">
        <Button onClick={handleGenerateTeams} className="w-full">
          Generate Teams
        </Button>
      </div>

      {/* Teams List */}
      <div className="bg-[var(--card-background)] p-4 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--card-highlight)]">
              <th className="text-left py-2 text-[var(--card-text)]">Team</th>
              <th className="text-left py-2 text-[var(--card-text)]">Players</th>
            </tr>
          </thead>
          <tbody>
            {tournament.teams.map((team, index) => (
              <tr key={index} className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="py-2 text-[var(--card-text)]">Team {index + 1}</td>
                <td className="py-2 text-[var(--card-text)]">{team.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TournamentTeams;