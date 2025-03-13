'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaRandom, FaUsers } from 'react-icons/fa';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean };
  index: number;
  swapPlayers: (fromIndex: number, toIndex: number, fromListType: 'aPlayers' | 'bPlayers', toListType: 'aPlayers' | 'bPlayers') => void;
  listType: 'aPlayers' | 'bPlayers';
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, swapPlayers, listType }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index, listType },
  });

  const [, drop] = useDrop({
    accept: ItemType,
    drop(item: { index: number; listType: 'aPlayers' | 'bPlayers' }) {
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

const BlindDrawTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({
  tournament,
  onUpdate,
}) => {
  const [aPlayers, setAPlayers] = useState<Tournament['players']>([]);
  const [bPlayers, setBPlayers] = useState<Tournament['players']>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedTournamentId = useRef<string | null>(null);

  const clearTeams = useCallback(async () => {
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
  }, [tournament.teams, tournament.id, onUpdate]);

  const splitPlayers = useCallback(() => {
    const shuffledPlayers = [...tournament.players].sort(() => Math.random() - 0.5); // Initial random shuffle
    const middleIndex = Math.ceil(shuffledPlayers.length / 2);
    const newAPlayers = shuffledPlayers.slice(0, middleIndex);
    const newBPlayers = shuffledPlayers.slice(middleIndex);
    setAPlayers(newAPlayers);
    setBPlayers(newBPlayers);
  }, [tournament.players]);

  useEffect(() => {
    if (initializedTournamentId.current === tournament.id) return;

    console.log('useEffect running - tournament.id:', tournament.id, 'teams:', tournament.teams, 'players:', tournament.players);
    const totalTeamPlayers = tournament.teams.reduce((sum, team) => sum + team.players.length, 0);
    if (!tournament.teams.length || totalTeamPlayers !== tournament.players.length) {
      if (tournament.players.length > 0) {
        splitPlayers();
        initializedTournamentId.current = tournament.id;
      }
    } else {
      const newAPlayers = tournament.teams.map(team => team.players[0]).map(name => {
        const player = tournament.players.find(p => p.name === name);
        return player || { name, ppd: 0, mpr: 0, paid: false };
      });
      const newBPlayers = tournament.teams
        .filter(team => team.players.length > 1)
        .map(team => team.players[1])
        .map(name => {
          const player = tournament.players.find(p => p.name === name);
          return player || { name, ppd: 0, mpr: 0, paid: false };
        });
      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, splitPlayers]);

  const swapPlayers = async (
    fromIndex: number,
    toIndex: number,
    fromListType: 'aPlayers' | 'bPlayers',
    toListType: 'aPlayers' | 'bPlayers'
  ) => {
    const updatedAPlayers = [...aPlayers];
    const updatedBPlayers = [...bPlayers];

    if (fromListType === toListType) {
      const listSetter = fromListType === 'aPlayers' ? setAPlayers : setBPlayers;
      const players = fromListType === 'aPlayers' ? updatedAPlayers : updatedBPlayers;
      [players[fromIndex], players[toIndex]] = [players[toIndex], players[fromIndex]];
      listSetter([...players]);
    } else {
      const fromPlayers = fromListType === 'aPlayers' ? updatedAPlayers : updatedBPlayers;
      const toPlayers = toListType === 'aPlayers' ? updatedAPlayers : updatedBPlayers;
      [fromPlayers[fromIndex], toPlayers[toIndex]] = [toPlayers[toIndex], fromPlayers[fromIndex]];
      setAPlayers([...updatedAPlayers]);
      setBPlayers([...updatedBPlayers]);
    }

    await clearTeams();
  };

  const shuffleAllPlayers = async () => {
    setIsShuffling(true);
    const allPlayers = [...aPlayers, ...bPlayers];
    const shuffleTimes = 20;
    const intervalTime = 50;
    let shuffleCount = 0;

    await new Promise<void>((resolve) => {
      const shuffleInterval = setInterval(() => {
        for (let i = allPlayers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
        }
        const middleIndex = Math.ceil(allPlayers.length / 2);
        setAPlayers([...allPlayers.slice(0, middleIndex)]);
        setBPlayers([...allPlayers.slice(middleIndex)]);
        shuffleCount++;

        if (shuffleCount >= shuffleTimes) {
          clearInterval(shuffleInterval);
          setIsShuffling(false);
          resolve();
        }
      }, intervalTime);
    });

    await clearTeams();
  };

  const generateTeams = (): { name: string; players: string[] }[] => {
    if (aPlayers.length === 0 || bPlayers.length === 0) {
      throw new Error('Both groups must have players to generate teams.');
    }
    return aPlayers.map((aPlayer, index) => {
      const bPlayer = bPlayers[index];
      const aFirstName = aPlayer.name.split(' ')[0];
      if (bPlayer) {
        const bFirstName = bPlayer.name.split(' ')[0];
        return { name: `${aFirstName} and ${bFirstName}`, players: [aPlayer.name, bPlayer.name] };
      }
      return { name: aFirstName, players: [aPlayer.name] };
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
                {aPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="aPlayers"
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 2</h4>
              <div className="min-h-[100px]">
                {bPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="bPlayers"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Shuffle Button */}
          <div className="flex justify-center mt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                shuffleAllPlayers();
              }}
              className="text-[var(--text-highlight)] hover:opacity-70 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <FaRandom className={isShuffling ? 'animate-spin' : ''} />
            </a>
          </div>

          {/* Generate Teams Button */}
          <div className="flex justify-start">
            <Button
              onClick={handleGenerateTeams}
              disabled={isGenerating || aPlayers.length === 0}
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

export default BlindDrawTeams;