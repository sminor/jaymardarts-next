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
  statValue: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, swapPlayers, listType, statValue }) => {
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
      title={statValue.toFixed(2)}
    >
      {player.name}
    </div>
  );
};

const ABDrawTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({ tournament, onUpdate }) => {
  const [aPlayers, setAPlayers] = useState<Tournament['players']>([]);
  const [bPlayers, setBPlayers] = useState<Tournament['players']>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeShuffle, setActiveShuffle] = useState<'aPlayers' | 'bPlayers' | null>(null);
  const initializedTournamentId = useRef<string | null>(null);

  const getPlayerStat = useCallback((player: Tournament['players'][0], stat: 'combo' | 'ppd' | 'mpr') => {
    switch (stat) {
      case 'combo':
        return player.ppd + player.mpr * 10;
      case 'ppd':
        return player.ppd;
      case 'mpr':
        return player.mpr;
      default:
        return player.ppd + player.mpr * 10;
    }
  }, []);

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
        setSuccess(null);
      }
    }
  }, [tournament.teams, tournament.id, onUpdate, setError, setSuccess]);

  const dividePlayers = useCallback(
    async (stat: 'combo' | 'ppd' | 'mpr') => {
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        const statA = getPlayerStat(a, stat);
        const statB = getPlayerStat(b, stat);
        return statB - statA;
      });

      const middleIndex = Math.ceil(sortedPlayers.length / 2);
      const newAPlayers = sortedPlayers.slice(0, middleIndex);
      const newBPlayers = sortedPlayers.slice(middleIndex);

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      await clearTeams();
    },
    [tournament.players, getPlayerStat, clearTeams]
  );

  useEffect(() => {
    if (initializedTournamentId.current === tournament.id) return;

    console.log('useEffect running - tournament.id:', tournament.id, 'teams:', tournament.teams, 'players:', tournament.players);
    const totalTeamPlayers = tournament.teams.reduce((sum, team) => sum + team.players.length, 0);
    if (!tournament.teams.length || totalTeamPlayers !== tournament.players.length) {
      if (tournament.players.length > 0) {
        (async () => {
          await dividePlayers('combo');
          initializedTournamentId.current = tournament.id;
        })();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id, dividePlayers]);

  const swapPlayers = async (fromIndex: number, toIndex: number, fromListType: 'aPlayers' | 'bPlayers', toListType: 'aPlayers' | 'bPlayers') => {
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

    console.log('After swap - aPlayers:', updatedAPlayers, 'bPlayers:', updatedBPlayers);
    await clearTeams();
  };

  const shufflePlayers = async (
    groupSetter: React.Dispatch<React.SetStateAction<Tournament['players']>>,
    players: Tournament['players'],
    groupType: 'aPlayers' | 'bPlayers'
  ) => {
    setActiveShuffle(groupType);
    const shuffleTimes = 20;
    const intervalTime = 50;
    let shuffleCount = 0;
    const shuffled = [...players];

    await new Promise<void>((resolve) => {
      const shuffleInterval = setInterval(() => {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        groupSetter([...shuffled]);
        shuffleCount++;

        if (shuffleCount >= shuffleTimes) {
          clearInterval(shuffleInterval);
          setActiveShuffle(null);
          resolve();
        }
      }, intervalTime);
    });

    await clearTeams();
  };

  const generateTeams = (): { name: string; players: string[] }[] => {
    if (aPlayers.length === 0 || bPlayers.length === 0) {
      throw new Error('Both A and B groups must have players to generate teams.');
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
    setSuccess(null);
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
        {success && <p className="text-green-500 text-center">{success}</p>}
        <div className="flex flex-col gap-4">
          {/* Sort Buttons */}
          <div className="text-[var(--card-text)]">
            Re-sort players by:
            <div className="flex gap-2 mt-1">
              <Button onClick={() => dividePlayers('combo')} disabled={isGenerating} className="w-20 text-sm">
                Combo
              </Button>
              <Button onClick={() => dividePlayers('ppd')} disabled={isGenerating} className="w-20 text-sm">
                PPD
              </Button>
              <Button onClick={() => dividePlayers('mpr')} disabled={isGenerating} className="w-20 text-sm">
                MPR
              </Button>
            </div>
          </div>

          {/* Two-Column Player Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">A Players</h4>
              <div className="min-h-[100px]">
                {aPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="aPlayers"
                    statValue={getPlayerStat(player, 'combo')}
                  />
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    shufflePlayers(setAPlayers, aPlayers, 'aPlayers');
                  }}
                  className="text-[var(--text-highlight)] hover:opacity-70 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <FaRandom className={activeShuffle === 'aPlayers' ? 'animate-spin' : ''} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">B Players</h4>
              <div className="min-h-[100px]">
                {bPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="bPlayers"
                    statValue={getPlayerStat(player, 'combo')}
                  />
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    shufflePlayers(setBPlayers, bPlayers, 'bPlayers');
                  }}
                  className="text-[var(--text-highlight)] hover:opacity-70 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <FaRandom className={activeShuffle === 'bPlayers' ? 'animate-spin' : ''} />
                </a>
              </div>
            </div>
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

export default ABDrawTeams;