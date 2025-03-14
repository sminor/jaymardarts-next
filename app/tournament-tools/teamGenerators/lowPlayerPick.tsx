'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaUsers } from 'react-icons/fa';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean } | null; // Allow null for placeholders
  index: number;
  movePlayer: (
    fromIndex: number,
    toIndex: number,
    fromListType: 'aPlayers' | 'bPlayers' | 'availablePlayers',
    toListType: 'aPlayers' | 'bPlayers' | 'availablePlayers'
  ) => void;
  listType: 'aPlayers' | 'bPlayers' | 'availablePlayers';
  sortStat: 'combo' | 'ppd' | 'mpr'; // New prop to determine which stat to show
  isRemovePlaceholder?: boolean; // Flag for "Drop Here to Remove"
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, movePlayer, listType, sortStat, isRemovePlaceholder = false }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index, listType },
    canDrag: !!player && !isRemovePlaceholder, // Disable dragging for placeholders
  });

  const [, drop] = useDrop({
    accept: ItemType,
    drop(item: { index: number; listType: 'aPlayers' | 'bPlayers' | 'availablePlayers' }) {
      if (item.index !== index || item.listType !== listType) {
        movePlayer(item.index, index, item.listType, listType);
      }
    },
  });

  drag(drop(ref));

  // Calculate the tooltip based on the current sort stat
  const tooltipText = player
    ? sortStat === 'combo'
      ? `Combo: ${(player.ppd + player.mpr * 10).toFixed(2)}`
      : sortStat === 'ppd'
      ? `PPD: ${player.ppd.toFixed(2)}`
      : `MPR: ${player.mpr.toFixed(2)}`
    : isRemovePlaceholder
    ? 'Drop here to remove a player'
    : 'No player selected';

  return (
    <div
      ref={ref}
      className={`p-2 bg-[var(--drag-card-background)] rounded-md shadow-sm ${
        player ? 'cursor-move' : 'cursor-default opacity-50'
      } text-[var(--drag-card-text)] mb-2`}
      title={tooltipText} // Show only the relevant stat
    >
      {player ? player.name : isRemovePlaceholder ? <i>Drop Here to Remove</i> : <i>Empty</i>}
    </div>
  );
};

const LowPlayerPickTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({
  tournament,
  onUpdate,
}) => {
  const [aPlayers, setAPlayers] = useState<(Tournament['players'][0] | null)[]>([]);
  const [bPlayers, setBPlayers] = useState<(Tournament['players'][0] | null)[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<(Tournament['players'][0] | null)[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortStat, setSortStat] = useState<'combo' | 'ppd' | 'mpr'>('combo'); // Track current sort stat
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
      }
    }
  }, [tournament.teams, tournament.id, onUpdate]);

  const dividePlayers = useCallback(
    async (stat: 'combo' | 'ppd' | 'mpr') => {
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        const statA = getPlayerStat(a, stat);
        const statB = getPlayerStat(b, stat);
        return statB - statA; // Descending order (highest to lowest)
      });

      const middleIndex = Math.ceil(sortedPlayers.length / 2);
      const newAPlayers: (Tournament['players'][0] | null)[] = new Array(middleIndex).fill(null); // Placeholders
      const newBPlayers: (Tournament['players'][0] | null)[] = sortedPlayers.slice(middleIndex).reverse(); // Bottom half, reversed
      const newAvailablePlayers: (Tournament['players'][0] | null)[] = [null, ...sortedPlayers.slice(0, middleIndex)]; // Remove placeholder at top, then high players

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setAvailablePlayers(newAvailablePlayers);
      setSortStat(stat); // Update the current sort stat
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
      const newAPlayers: (Tournament['players'][0] | null)[] = tournament.teams.map(team => {
        const player = tournament.players.find(p => p.name === team.players[0]);
        return player || { name: team.players[0], ppd: 0, mpr: 0, paid: false };
      });
      const newBPlayers: (Tournament['players'][0] | null)[] = tournament.teams
        .filter(team => team.players.length > 1)
        .map(team => {
          const player = tournament.players.find(p => p.name === team.players[1]);
          return player || { name: team.players[1], ppd: 0, mpr: 0, paid: false };
        });
      const allPlayers = [...tournament.players];
      const usedPlayers = [...newAPlayers.filter(p => p !== null), ...newBPlayers.filter(p => p !== null)].map(p => p!.name);
      const newAvailablePlayers: (Tournament['players'][0] | null)[] = [null, ...allPlayers.filter(p => !usedPlayers.includes(p.name))]; // Remove placeholder at top

      // Pad A and B Players with placeholders if needed
      while (newAPlayers.length < newBPlayers.length) {
        newAPlayers.push(null);
      }
      while (newBPlayers.length < newAPlayers.length) {
        newBPlayers.push(null);
      }

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setAvailablePlayers(newAvailablePlayers);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, dividePlayers]);

  const movePlayer = (
    fromIndex: number,
    toIndex: number,
    fromListType: 'aPlayers' | 'bPlayers' | 'availablePlayers',
    toListType: 'aPlayers' | 'bPlayers' | 'availablePlayers'
  ) => {
    const updatedAPlayers = [...aPlayers];
    const updatedBPlayers = [...bPlayers];
    const updatedAvailablePlayers = [...availablePlayers];

    const sourceList = fromListType === 'aPlayers' ? updatedAPlayers : fromListType === 'bPlayers' ? updatedBPlayers : updatedAvailablePlayers;
    const targetList = toListType === 'aPlayers' ? updatedAPlayers : toListType === 'bPlayers' ? updatedBPlayers : updatedAvailablePlayers;

    const [movedPlayer] = sourceList.splice(fromIndex, 1);

    if (!movedPlayer) return; // Ignore dragging placeholders

    if (fromListType === toListType) {
      // Within the same list, just reorder
      sourceList.splice(toIndex, 0, movedPlayer);
    } else if ((fromListType === 'aPlayers' && toListType === 'bPlayers') || (fromListType === 'bPlayers' && toListType === 'aPlayers')) {
      // Swap between A and B Players
      const displacedPlayer = targetList[toIndex];
      targetList[toIndex] = movedPlayer;
      sourceList.splice(fromIndex, 0, displacedPlayer || null); // Replace with displaced player or placeholder
    } else {
      // Dragging to/from Available Players
      if (toListType === 'availablePlayers') {
        // Moving to Available Players
        const displacedPlayer = targetList[toIndex];
        if (displacedPlayer) {
          // Swap with the displaced player
          targetList[toIndex] = movedPlayer;
          sourceList.splice(fromIndex, 0, displacedPlayer);
        } else {
          // Dropped on "Drop Here to Remove", replace source with placeholder
          sourceList.splice(fromIndex, 0, null);
          targetList.splice(toIndex, 1, movedPlayer);
          if (!updatedAvailablePlayers.some(p => p === null)) {
            updatedAvailablePlayers.unshift(null); // Add remove placeholder at top
          }
        }
      } else if (fromListType === 'availablePlayers') {
        // Moving from Available Players to A or B
        const displacedPlayer = targetList[toIndex];
        targetList[toIndex] = movedPlayer;
        if (displacedPlayer) {
          updatedAvailablePlayers.push(displacedPlayer);
          if (!updatedAvailablePlayers.some(p => p === null)) {
            updatedAvailablePlayers.unshift(null); // Add remove placeholder at top
          }
        }
      }
    }

    setAPlayers(updatedAPlayers);
    setBPlayers(updatedBPlayers);
    setAvailablePlayers(updatedAvailablePlayers);
    clearTeams();
  };

  const generateTeams = (): { name: string; players: string[] }[] => {
    if (bPlayers.length === 0 || bPlayers.every(p => p === null)) {
      throw new Error('At least one B Player is required to generate teams.');
    }
    return bPlayers.map((bPlayer, index) => {
      const aPlayer = aPlayers[index];
      if (bPlayer) {
        const bFirstName = bPlayer.name.split(' ')[0];
        if (aPlayer) {
          const aFirstName = aPlayer.name.split(' ')[0];
          return { name: `${aFirstName} and ${bFirstName}`, players: [aPlayer.name, bPlayer.name] };
        }
        return { name: bFirstName, players: [bPlayer.name] };
      } else if (aPlayer) {
        const aFirstName = aPlayer.name.split(' ')[0];
        return { name: aFirstName, players: [aPlayer.name] };
      }
      return null; // Skip if both are null
    }).filter(team => team !== null) as { name: string; players: string[] }[];
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
        <h2 className='text-xl font-semibold text-[var(--text-highlight)]'>Low Player Pick</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          {/* Sort Buttons */}
          <div className="text-[var(--card-text)]">
            Sort players by:
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
                    key={player ? player.name : `placeholder-a-${index}`}
                    player={player}
                    index={index}
                    movePlayer={movePlayer}
                    listType="aPlayers"
                    sortStat={sortStat} // Pass current sort stat
                    isRemovePlaceholder={false} // Not needed here
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">B Players</h4>
              <div className="min-h-[100px]">
                {bPlayers.map((player, index) => (
                  <PlayerCard
                    key={player ? player.name : `placeholder-b-${index}`}
                    player={player}
                    index={index}
                    movePlayer={movePlayer}
                    listType="bPlayers"
                    sortStat={sortStat} // Pass current sort stat
                    isRemovePlaceholder={false} // Not needed here
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Available Players */}
          <div>
            <h4 className="text-md text-[var(--card-title)] mb-2">Available Players</h4>
            <div className="min-h-[100px]">
              {availablePlayers.map((player, index) => (
                <PlayerCard
                  key={player ? player.name : 'remove-placeholder'}
                  player={player}
                  index={index}
                  movePlayer={movePlayer}
                  listType="availablePlayers"
                  sortStat={sortStat} // Pass current sort stat
                  isRemovePlaceholder={!player}
                />
              ))}
            </div>
          </div>

          {/* Generate Teams Button */}
          <div className="flex justify-start">
            <Button
              onClick={handleGenerateTeams}
              disabled={isGenerating || bPlayers.length === 0 || bPlayers.every(p => p === null)}
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

export default LowPlayerPickTeams;