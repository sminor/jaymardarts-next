'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import * as cheerio from 'cheerio';

interface League {
    id: string;
    name: string;
    day_of_week: string;
    start_time: string;
}

interface LeagueFlight {
    id: string;
    flight_name: string;
    schedule_url: string;
    players_url: string;
    league_type: string;
    league_id: string;
}

interface LeagueFlightOption {
    leagueName: string;
    flightName: string;
    schedule_url: string;
    players_url: string;
    league_type: string;
    day_of_week: string;
    start_time: string;
}

interface PlayerData {
    name: string;
}
interface TeamData {
    team: string;
    players: PlayerData[];
}

interface MatchScheduleData {
    homeTeam: string | null;
    awayTeam: string | null;
    at: string | null;
}

const LeagueSchedulesModal: React.FC = () => {
    // State Variables
    const [leagues, setLeagues] = useState<League[]>([]);
    const [leagueFlights, setLeagueFlights] = useState<LeagueFlight[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<LeagueFlightOption | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [leagueOptions, setLeagueOptions] = useState<LeagueFlightOption[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [matchupsByDate, setMatchupsByDate] = useState<Record<string, MatchScheduleData[]>>({});
    const [playerData, setPlayerData] = useState<TeamData[]>([]);
    const [expandedMatchups, setExpandedMatchups] = useState<Record<string, Record<number, boolean>>>({});

    // Fetch Leagues and Flights
    useEffect(() => {
        const fetchLeaguesAndFlights = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: leaguesData, error: leaguesError } = await supabase
                    .from('leagues')
                    .select('id, name, day_of_week, start_time')
                    .order('name', { ascending: true });

                if (leaguesError) throw leaguesError;

                setLeagues(leaguesData as League[]);

                const { data: flightsData, error: flightsError } = await supabase
                    .from('league_flights')
                    .select('id, flight_name, schedule_url, league_id, players_url, league_type')
                    .order('flight_name', { ascending: true });

                if (flightsError) throw flightsError;

                setLeagueFlights(flightsData as LeagueFlight[]);
            } catch (err) {
                setError((err as Error).message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaguesAndFlights();
    }, []);

    // Map Flights to Options
    useEffect(() => {
        if (leagues.length > 0 && leagueFlights.length > 0) {
            const newOptions = leagueFlights.map((flight) => {
                const league = leagues.find((league) => league.id === flight.league_id);
                return {
                    leagueName: league ? league.name : 'Unknown League',
                    flightName: flight.flight_name,
                    schedule_url: flight.schedule_url,
                    players_url: flight.players_url,
                    league_type: flight.league_type,
                    day_of_week: league ? league.day_of_week : 'Unknown day',
                    start_time: league ? league.start_time : 'Unknown Time',
                };
            });
            setLeagueOptions(newOptions);
        }
    }, [leagues, leagueFlights]);

    // Extract Schedule Data
    const extractScheduleData = (fullHtml: string) => {
        const $ = cheerio.load(fullHtml);
        const table = $('table.report:nth-of-type(2)');
        const matchupsByDate: Record<string, MatchScheduleData[]> = {};
        let currentDate = "";

        if (table.length > 0) {
            table.find('tr').each((_rowIndex, rowElement) => {
                const cells = $(rowElement).find('td');

                if (cells.length >= 6) {
                    const dateText = $(cells[1]).text().trim();
                    const homeTeam = $(cells[2]).text().trim();
                    const awayTeam = $(cells[3]).text().trim();
                    const atLocation = $(cells[4]).text().trim();

                    if (dateText) currentDate = dateText;

                    if (homeTeam || awayTeam) {
                        if (!matchupsByDate[currentDate]) {
                            matchupsByDate[currentDate] = [];
                        }
                        matchupsByDate[currentDate].push({
                            homeTeam: homeTeam || null,
                            awayTeam: awayTeam || null,
                            at: atLocation || null,
                        });
                    }
                }
            });

            setMatchupsByDate(matchupsByDate);
            const newExpandedMatchups: Record<string, Record<number, boolean>> = {};
            Object.keys(matchupsByDate).forEach((date) => {
                newExpandedMatchups[date] = {};
                matchupsByDate[date].forEach((_, index) => {
                    newExpandedMatchups[date][index] = false;
                });
            });
            setExpandedMatchups(newExpandedMatchups);
        } else {
            setScheduleError("No data table found on page.");
        }
    };

    // Extract Player Data
    const extractPlayerData = (fullHtml: string): TeamData[] => {
        const $ = cheerio.load(fullHtml);
        const teamDataArray: TeamData[] = [];
        let currentTeam: string | null = null;

        $('table.report tbody tr').each((index, element) => {
            const tds = $(element).find('td');
            const teamName = $(tds[0]).text().trim();
            const playerName = $(tds[1]).text().trim();

            if (teamName && !playerName) {
                currentTeam = teamName;
                teamDataArray.push({ team: currentTeam, players: [] });
            } else if (currentTeam && playerName) {
                const currentTeamObject = teamDataArray.find((team) => team.team === currentTeam);
                if (currentTeamObject) {
                    currentTeamObject.players.push({ name: playerName });
                } else {
                    console.warn(`Player '${playerName}' found without an assigned team!`);
                }
            }
        });

        return teamDataArray;
    };

    // Fetch Players
    const fetchPlayers = useCallback(async () => {
        if (!selectedFlight?.players_url) {
            console.log("No players URL set for this flight");
            return;
        }
        setPlayerData([]);
        const response = await fetch('/.netlify/functions/get-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: selectedFlight.players_url }),
        });

        if (!response.ok) throw new Error(`Failed to fetch player data: ${response.statusText}`);

        const result = await response.json();
        const fullHtml = result.data;
        setPlayerData(extractPlayerData(fullHtml));
    }, [selectedFlight?.players_url]);

    // Fetch Schedule
    const fetchSchedule = useCallback(async () => {
        if (!selectedFlight?.schedule_url) return;
        setScheduleLoading(true);
        setScheduleError(null);
        try {
            const response = await fetch('/.netlify/functions/get-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: selectedFlight.schedule_url }),
            });

            if (!response.ok) throw new Error(`Failed to fetch schedule: ${response.statusText}`);

            const result = await response.json();
            const fullHtml = result.data;
            extractScheduleData(fullHtml);
        } catch (err) {
            setScheduleError((err as Error).message || 'An unexpected error occurred while fetching the schedule.');
        } finally {
            setScheduleLoading(false);
        }
    }, [selectedFlight?.schedule_url]);

    // Fetch Schedule and Players when selectedFlight Changes
    useEffect(() => {
        fetchSchedule();
        fetchPlayers();
    }, [fetchSchedule, fetchPlayers]);

    // Handle Flight Change
    const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        const selected = leagueOptions.find(
            (option) => `${option.leagueName} - ${option.flightName}` === selectedValue
        );
        setSelectedFlight(selected || null);
    };

    // Toggle Matchup Expansion
    const toggleMatchupExpansion = (date: string, index: number) => {
        setExpandedMatchups((prev) => ({
            ...prev,
            [date]: {
                ...prev[date],
                [index]: !prev[date][index],
            },
        }));
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">League Schedules</h2>
            {loading && <p>Loading leagues and flights...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            {!loading && !error && (
                <>
                    <div>
                        <label htmlFor="leagueSelect" className="block text-sm font-medium">Select a Flight:</label>
                        <select
                            id="leagueSelect"
                            className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                            onChange={handleFlightChange}
                            value={selectedFlight ? `${selectedFlight.leagueName} - ${selectedFlight.flightName}` : ""}
                        >
                            <option value=""> -- Select a Flight --</option>
                            {leagueOptions.map((option, index) => (
                                <option key={index} value={`${option.leagueName} - ${option.flightName}`}>
                                    {`${option.leagueName} - ${option.flightName} (${option.day_of_week} ${option.start_time})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {scheduleLoading && <p>Loading schedule...</p>}
                    {scheduleError && <p className="text-red-500">Error: {scheduleError}</p>}

                    {selectedFlight && !scheduleLoading && !scheduleError && (
                        <div className="mt-6">
                            <div>
                                <h3>{selectedFlight.leagueName} - {selectedFlight.flightName}</h3>
                                <ul>
                                    <li>Day of Week: {selectedFlight.day_of_week}</li>
                                    <li>Start Time: {selectedFlight.start_time}</li>
                                    <li>League Type: {selectedFlight.league_type}</li>
                                </ul>
                                <p className='italic font-sm text-[var(--text-highlight)]'>Click on a match to see match information</p>
                                <hr />
                            </div>
                            {Object.entries(matchupsByDate).map(([date, matchups], index) => (
                                <div key={index} className="flex flex-col bg-[var(--card-background)] border-l-4 border-[var(--card-highlight)] p-4 mb-4">
                                    <h3 className="text-lg font-medium text-[var(--card-title)] mb-2">
                                        Week {index + 1} - {date}
                                    </h3>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-[var(--card-highlight)]">
                                                <th className="text-left font-medium text-[var(--card-text)] p-2 sm:w-[15%]">Home</th>
                                                <th className="text-center font-medium text-[var(--card-text)] p-2 sm:w-[10%]"></th>
                                                <th className="text-left font-medium text-[var(--card-text)] p-2">Away</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matchups.map((matchup, i) => {
                                                const homeTeamPlayers = (playerData.find(team => team.team === matchup.homeTeam)?.players || []).slice(0, 2);
                                                const awayTeamPlayers = (playerData.find(team => team.team === matchup.awayTeam)?.players || []).slice(0, 2);
                                                return (
                                                    <React.Fragment key={i}>
                                                        <tr
                                                            className="cursor-pointer odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)] border-none transition-all"
                                                            onClick={() => toggleMatchupExpansion(date, i)}
                                                        >
                                                            <td className="text-[var(--card-text)] p-2 whitespace-nowrap">
                                                                {matchup.homeTeam || "TBD"}
                                                                {expandedMatchups[date]?.[i] && homeTeamPlayers.length > 0 && (
                                                                    <div className="mt-1 text-xs">
                                                                        {homeTeamPlayers.map((player, playerIndex) => (
                                                                            <div key={playerIndex} className={"before:content-['↳'] before:mr-1"}>{player.name}</div>
                                                                        ))}
                                                                        <div className="mt-4 italic">@{matchup.at}</div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="text-center">vs.</td>
                                                            <td className="text-[var(--card-text)] p-2 whitespace-nowrap">
                                                                {matchup.awayTeam || "TBD"}
                                                                {expandedMatchups[date]?.[i] && awayTeamPlayers.length > 0 && (
                                                                    <div className="mt-1 text-xs">
                                                                        {awayTeamPlayers.map((player, playerIndex) => (
                                                                            <div key={playerIndex} className={"before:content-['↳'] before:mr-1"}>{player.name}</div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeagueSchedulesModal;
