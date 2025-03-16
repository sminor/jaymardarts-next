'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean } | null;
  index: number;
  movePlayer: (
    fromIndex: number,
    toIndex: number,
    fromListType: 'aPlayers' | 'bPlayers' | 'availablePlayers',
    toListType: 'aPlayers' | 'bPlayers' | 'availablePlayers'
  ) => void;
  listType: 'aPlayers' | 'bPlayers' | 'availablePlayers';
  sortStat: 'combo' | 'ppd' | 'mpr';
  isRemovePlaceholder?: boolean;
  isReadOnly?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  index,
  movePlayer,
  listType,
  sortStat,
  isRemovePlaceholder = false,
  isReadOnly = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index, listType },
    canDrag: !!player && !isRemovePlaceholder && !isReadOnly,
  });

  const [, drop] = useDrop({
    accept: ItemType,
    drop(item: { index: number; listType: 'aPlayers' | 'bPlayers' | 'availablePlayers' }) {
      if (!isReadOnly && (item.index !== index || item.listType !== listType)) {
        movePlayer(item.index, index, item.listType, listType);
      }
    },
  });

  if (!isReadOnly) {
    drag(drop(ref));
  }

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
        player && !isReadOnly ? 'cursor-move' : 'cursor-default opacity-50'
      } text-[var(--drag-card-text)] mb-2`}
      title={tooltipText}
    >
      {player ? player.name : isRemovePlaceholder ? <i>Drop Here to Remove</i> : <i>Empty</i>}
    </div>
  );
};

const HighPlayerPickTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void; isReadOnly?: boolean }> = ({
  tournament,
  onUpdate,
  isReadOnly = false,
}) => {
  const [aPlayers, setAPlayers] = useState<(Tournament['players'][0] | null)[]>([]);
  const [bPlayers, setBPlayers] = useState<(Tournament['players'][0] | null)[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<(Tournament['players'][0] | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortStat, setSortStat] = useState<'combo' | 'ppd' | 'mpr'>('combo');
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

  const generateTeams = useCallback((aPlayersList: (Tournament['players'][0] | null)[], bPlayersList: (Tournament['players'][0] | null)[]) => {
    return aPlayersList
      .map((aPlayer, index) => {
        const bPlayer = bPlayersList[index];
        if (aPlayer) {
          const aFirstName = aPlayer.name.split(' ')[0];
          if (bPlayer) {
            const bFirstName = bPlayer.name.split(' ')[0];
            return { name: `${aFirstName} and ${bFirstName}`, players: [aPlayer.name, bPlayer.name] };
          }
          return { name: aFirstName, players: [aPlayer.name] };
        } else if (bPlayer) {
          const bFirstName = bPlayer.name.split(' ')[0];
          return { name: bFirstName, players: [bPlayer.name] };
        }
        return null;
      })
      .filter(team => team !== null) as { name: string; players: string[] }[];
  }, []);

  const updateTeamsInDB = useCallback(
    async (aPlayersList: (Tournament['players'][0] | null)[], bPlayersList: (Tournament['players'][0] | null)[]) => {
      if (isReadOnly) return;
      try {
        const teams = generateTeams(aPlayersList, bPlayersList);
        console.log('Updating teams in DB:', teams);
        const { data, error } = await supabase
          .from('tournaments')
          .update({ teams })
          .eq('id', tournament.id)
          .select()
          .single();
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        console.log('DB updated successfully:', data);
        onUpdate(data);
      } catch (err) {
        console.error('Error updating teams:', (err as Error).message);
        setError('Failed to update teams in database.');
      }
    },
    [tournament.id, onUpdate, isReadOnly, generateTeams]
  );

  const dividePlayers = useCallback(
    async (stat: 'combo' | 'ppd' | 'mpr') => {
      if (isReadOnly) return;
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        const statA = getPlayerStat(a, stat);
        const statB = getPlayerStat(b, stat);
        return statB - statA; // Descending order (highest to lowest)
      });

      const middleIndex = Math.ceil(sortedPlayers.length / 2);
      const newAPlayers: (Tournament['players'][0] | null)[] = sortedPlayers.slice(0, middleIndex); // Top half (high players)
      const newBPlayers: (Tournament['players'][0] | null)[] = new Array(middleIndex).fill(null); // Placeholders
      const newAvailablePlayers: (Tournament['players'][0] | null)[] = [null, ...sortedPlayers.slice(middleIndex).reverse()]; // Remove placeholder at top, then low players

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setAvailablePlayers(newAvailablePlayers);
      setSortStat(stat);
      await updateTeamsInDB(newAPlayers, newBPlayers);
    },
    [tournament.players, getPlayerStat, updateTeamsInDB, isReadOnly]
  );

  useEffect(() => {
    const currentPlayerNames = new Set(tournament.players.map(p => p.name));
    const teamPlayerNames = new Set(tournament.teams.flatMap(team => team.players));
    const playersMatchTeams =
      currentPlayerNames.size === teamPlayerNames.size &&
      [...currentPlayerNames].every(name => teamPlayerNames.has(name));

    console.log('useEffect triggered:', {
      currentPlayerNames: [...currentPlayerNames],
      teamPlayerNames: [...teamPlayerNames],
      playersMatchTeams,
      teamsLength: tournament.teams.length,
      initialized: initializedTournamentId.current === tournament.id,
      isReadOnly,
    });

    if ((!playersMatchTeams || tournament.teams.length === 0) && tournament.players.length > 0 && !isReadOnly) {
      console.log('Regenerating teams due to player list mismatch or empty teams');
      (async () => {
        await dividePlayers('combo');
        initializedTournamentId.current = tournament.id;
      })();
    } else if (initializedTournamentId.current !== tournament.id && tournament.players.length > 0) {
      console.log('Loading existing teams');
      const newAPlayers: (Tournament['players'][0] | null)[] = [];
      const newBPlayers: (Tournament['players'][0] | null)[] = [];
      const allPlayers = [...tournament.players];
      const usedPlayers: string[] = [];

      tournament.teams.forEach(team => {
        if (team.players.length === 2) {
          const aPlayer = tournament.players.find(p => p.name === team.players[0]);
          const bPlayer = tournament.players.find(p => p.name === team.players[1]);
          newAPlayers.push(aPlayer || { name: team.players[0], ppd: 0, mpr: 0, paid: false });
          newBPlayers.push(bPlayer || { name: team.players[1], ppd: 0, mpr: 0, paid: false });
          usedPlayers.push(team.players[0], team.players[1]);
        } else if (team.players.length === 1) {
          const aPlayer = tournament.players.find(p => p.name === team.players[0]);
          newAPlayers.push(aPlayer || { name: team.players[0], ppd: 0, mpr: 0, paid: false });
          newBPlayers.push(null); // No B player
          usedPlayers.push(team.players[0]);
        }
      });

      while (newAPlayers.length < newBPlayers.length) {
        newAPlayers.push(null);
      }
      while (newBPlayers.length < newAPlayers.length) {
        newBPlayers.push(null);
      }

      const newAvailablePlayers: (Tournament['players'][0] | null)[] = [
        null,
        ...allPlayers.filter(p => !usedPlayers.includes(p.name)),
      ];

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setAvailablePlayers(newAvailablePlayers);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, dividePlayers, isReadOnly]);

  const movePlayer = useCallback(
    async (
      fromIndex: number,
      toIndex: number,
      fromListType: 'aPlayers' | 'bPlayers' | 'availablePlayers',
      toListType: 'aPlayers' | 'bPlayers' | 'availablePlayers'
    ) => {
      if (isReadOnly) return;

      const updatedAPlayers = [...aPlayers];
      const updatedBPlayers = [...bPlayers];
      const updatedAvailablePlayers = [...availablePlayers];

      const sourceList = fromListType === 'aPlayers' ? updatedAPlayers : fromListType === 'bPlayers' ? updatedBPlayers : updatedAvailablePlayers;
      const targetList = toListType === 'aPlayers' ? updatedAPlayers : toListType === 'bPlayers' ? updatedBPlayers : updatedAvailablePlayers;

      const [movedPlayer] = sourceList.splice(fromIndex, 1);

      if (!movedPlayer) return;

      if (fromListType === toListType) {
        sourceList.splice(toIndex, 0, movedPlayer);
      } else if ((fromListType === 'aPlayers' && toListType === 'bPlayers') || (fromListType === 'bPlayers' && toListType === 'aPlayers')) {
        const displacedPlayer = targetList[toIndex];
        targetList[toIndex] = movedPlayer;
        sourceList.splice(fromIndex, 0, displacedPlayer || null);
      } else {
        if (toListType === 'availablePlayers') {
          const displacedPlayer = targetList[toIndex];
          if (displacedPlayer) {
            targetList[toIndex] = movedPlayer;
            sourceList.splice(fromIndex, 0, displacedPlayer);
          } else {
            sourceList.splice(fromIndex, 0, null);
            targetList.splice(toIndex, 1, movedPlayer);
            if (!updatedAvailablePlayers.some(p => p === null)) {
              updatedAvailablePlayers.unshift(null);
            }
          }
        } else if (fromListType === 'availablePlayers') {
          const displacedPlayer = targetList[toIndex];
          targetList[toIndex] = movedPlayer;
          if (displacedPlayer) {
            updatedAvailablePlayers.push(displacedPlayer);
            if (!updatedAvailablePlayers.some(p => p === null)) {
              updatedAvailablePlayers.unshift(null);
            }
          }
        }
      }

      setAPlayers(updatedAPlayers);
      setBPlayers(updatedBPlayers);
      setAvailablePlayers(updatedAvailablePlayers);
      await updateTeamsInDB(updatedAPlayers, updatedBPlayers);
    },
    [aPlayers, bPlayers, availablePlayers, updateTeamsInDB, isReadOnly]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--text-highlight)]">High Player Pick</h2>
        {error && !isReadOnly && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          <div className="text-[var(--card-text)]">
            Sort players by:
            <div className="flex gap-2 mt-1">
              <Button
                onClick={() => dividePlayers('combo')}
                disabled={isReadOnly}
                className={`w-20 text-sm ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Combo
              </Button>
              <Button
                onClick={() => dividePlayers('ppd')}
                disabled={isReadOnly}
                className={`w-20 text-sm ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                PPD
              </Button>
              <Button
                onClick={() => dividePlayers('mpr')}
                disabled={isReadOnly}
                className={`w-20 text-sm ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                MPR
              </Button>
            </div>
          </div>

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
                    sortStat={sortStat}
                    isRemovePlaceholder={false}
                    isReadOnly={isReadOnly}
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
                    sortStat={sortStat}
                    isRemovePlaceholder={false}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
          </div>

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
                  sortStat={sortStat}
                  isRemovePlaceholder={!player}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default HighPlayerPickTeams;