'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaUsers } from 'react-icons/fa';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean };
  index: number;
  swapPlayers: (fromIndex: number, toIndex: number, fromListType: 'player1List' | 'player2List', toListType: 'player1List' | 'player2List') => void;
  listType: 'player1List' | 'player2List';
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, swapPlayers, listType }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index, listType },
  });

  const [, drop] = useDrop({
    accept: ItemType,
    drop(item: { index: number; listType: 'player1List' | 'player2List' }) {
      if (item.index !== index || item.listType !== listType) {
        swapPlayers(item.index, index, item.listType, listType);
      }
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="p-2 bg-[var(--drag-card-background)] rounded-md shadow-sm cursor-move text-[var(--drag-card-text)] mb-2"
    >
      {player.name}
    </div>
  );
};

const PartnerBringTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({
  tournament,
  onUpdate,
}) => {
  const [player1List, setPlayer1List] = useState<Tournament['players']>([]);
  const [player2List, setPlayer2List] = useState<Tournament['players']>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedTournamentId = useRef<string | null>(null);

  const clearTeams = async () => {
    if (tournament.teams?.length) {
      const { data, error } = await supabase
        .from('tournaments')
        .update({ teams: [] })
        .eq('id', tournament.id)
        .select()
        .single();
      if (error) {
        console.error('Error clearing teams:', error.message);
        setError('Failed to clear teams.');
      } else {
        onUpdate(data);
      }
    }
  };

  useEffect(() => {
    if (initializedTournamentId.current === tournament.id) return;

    console.log('useEffect running - tournament.id:', tournament.id, 'teams:', tournament.teams, 'players:', tournament.players);
    const totalTeamPlayers = tournament.teams.reduce((sum, team) => sum + team.players.length, 0);
    if (!tournament.teams.length || totalTeamPlayers !== tournament.players.length) {
      if (tournament.players.length > 0) {
        const splitPlayers = () => {
          const newPlayer1List = [];
          const newPlayer2List = [];
          for (let i = 0; i < tournament.players.length; i++) {
            if (i % 2 === 0) {
              newPlayer1List.push(tournament.players[i]);
            } else {
              newPlayer2List.push(tournament.players[i]);
            }
          }
          setPlayer1List(newPlayer1List);
          setPlayer2List(newPlayer2List);
        };
        splitPlayers();
        initializedTournamentId.current = tournament.id;
      }
    } else {
      const newPlayer1List = tournament.teams.map(team => team.players[0]).map(name => {
        const player = tournament.players.find(p => p.name === name);
        return player || { name, ppd: 0, mpr: 0, paid: false };
      });
      const newPlayer2List = tournament.teams
        .filter(team => team.players.length > 1)
        .map(team => team.players[1])
        .map(name => {
          const player = tournament.players.find(p => p.name === name);
          return player || { name, ppd: 0, mpr: 0, paid: false };
        });
      setPlayer1List(newPlayer1List);
      setPlayer2List(newPlayer2List);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams]); // Only external dependencies

  const swapPlayers = async (
    fromIndex: number,
    toIndex: number,
    fromListType: 'player1List' | 'player2List',
    toListType: 'player1List' | 'player2List'
  ) => {
    const updatedPlayer1List = [...player1List];
    const updatedPlayer2List = [...player2List];

    if (fromListType === toListType) {
      const listSetter = fromListType === 'player1List' ? setPlayer1List : setPlayer2List;
      const players = fromListType === 'player1List' ? updatedPlayer1List : updatedPlayer2List;
      [players[fromIndex], players[toIndex]] = [players[toIndex], players[fromIndex]];
      listSetter([...players]);
    } else {
      const fromPlayers = fromListType === 'player1List' ? updatedPlayer1List : updatedPlayer2List;
      const toPlayers = toListType === 'player1List' ? updatedPlayer1List : updatedPlayer2List;
      [fromPlayers[fromIndex], toPlayers[toIndex]] = [toPlayers[toIndex], fromPlayers[fromIndex]];
      setPlayer1List([...updatedPlayer1List]);
      setPlayer2List([...updatedPlayer2List]);
    }

    await clearTeams();
  };

  const generateTeams = (): { name: string; players: string[] }[] => {
    if (player1List.length === 0) {
      throw new Error('At least one pair of players is required to generate teams.');
    }
    return player1List.map((player1, index) => {
      const player2 = player2List[index];
      const p1FirstName = player1.name.split(' ')[0];
      if (player2) {
        const p2FirstName = player2.name.split(' ')[0];
        return { name: `${p1FirstName} and ${p2FirstName}`, players: [player1.name, player2.name] };
      }
      return { name: p1FirstName, players: [player1.name] };
    });
  };

  const handleGenerateTeams = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generatedTeams = generateTeams();
      const { data, error } = await supabase
        .from('tournaments')
        .update({ teams: generatedTeams })
        .eq('id', tournament.id)
        .select()
        .single();
      if (error) throw error;
      onUpdate(data);
    } catch (err: unknown) {
      console.error('Error generating teams:', (err as Error).message);
      setError((err as Error).message || 'Failed to generate teams.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          {/* Two-Column Player Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 1</h4>
              <div className="min-h-[100px]">
                {player1List.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="player1List"
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 2</h4>
              <div className="min-h-[100px]">
                {player2List.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="player2List"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Generate Teams Button */}
          <div className="flex justify-start">
            <Button
              onClick={handleGenerateTeams}
              disabled={isGenerating || player1List.length === 0}
              icon={<FaUsers />}
              iconPosition="left"
              className="w-auto"
            >
              {isGenerating ? 'Generating...' : 'Generate Teams'}
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default PartnerBringTeams;