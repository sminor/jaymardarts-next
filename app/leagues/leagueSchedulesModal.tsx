'use client';
import React, { useState, useEffect } from 'react';
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
    league_id: string;
}

interface LeagueFlightOption {
    leagueName: string;
    flightName: string;
    schedule_url: string;
    day_of_week: string;
    start_time: string;
}

const LeagueSchedulesModal: React.FC = () => {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [leagueFlights, setLeagueFlights] = useState<LeagueFlight[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<LeagueFlightOption | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [leagueOptions, setLeagueOptions] = useState<LeagueFlightOption[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [matchupsByDate, setMatchupsByDate] = useState<Record<string, { homeTeam: string | null, awayTeam: string | null }[]>>({});

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

                if (leaguesData) {
                    setLeagues(leaguesData as League[]);
                    const { data: flightsData, error: flightsError } = await supabase
                        .from('league_flights')
                        .select('id, flight_name, schedule_url, league_id')
                        .order('flight_name', { ascending: true });

                    if (flightsError) throw flightsError;

                    if (flightsData) {
                        setLeagueFlights(flightsData as LeagueFlight[]);
                    }
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unexpected error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLeaguesAndFlights();
    }, []);

    useEffect(() => {
        if (leagues.length > 0 && leagueFlights.length > 0) {
            const newOptions = leagueFlights.map((flight) => {
                const league = leagues.find(league => league.id === flight.league_id);
                return {
                    leagueName: league ? league.name : 'Unknown League',
                    flightName: flight.flight_name,
                    schedule_url: flight.schedule_url,
                    day_of_week: league ? league.day_of_week : 'Unknown day',
                    start_time: league ? league.start_time : 'Unknown Time',
                };
            });
            setLeagueOptions(newOptions);
        }
    }, [leagues, leagueFlights]);

    const extractScheduleData = (fullHtml: string) => {
        const $ = cheerio.load(fullHtml);
        const table = $('table.report:nth-of-type(2)'); // Select the second table with the class 'report'
        const matchupsByDate: Record<string, { homeTeam: string | null, awayTeam: string | null }[]> = {};
        let currentDate = "";

        if (table.length > 0) {
            table.find('tr').each((_rowIndex, rowElement) => {
                const cells = $(rowElement).find('td');

                if (cells.length >= 4) { // Ensure we have at least 4 columns
                    const dateText = $(cells[1]).text().trim();
                    const homeTeam = $(cells[2]).text().trim();
                    const awayTeam = $(cells[3]).text().trim();

                    // Update currentDate if a new one is found
                    if (dateText) currentDate = dateText;

                    // Only store matchups where at least one team exists
                    if (homeTeam || awayTeam) {
                        if (!matchupsByDate[currentDate]) {
                            matchupsByDate[currentDate] = [];
                        }
                        matchupsByDate[currentDate].push({
                            homeTeam: homeTeam || null,
                            awayTeam: awayTeam || null,
                        });
                    }
                }
            });

            // Update state so React re-renders
            setMatchupsByDate(matchupsByDate);
        } else {
            setScheduleError("No data table found on page.");
            console.error("No data table found on page.");
        }
    };

    useEffect(() => {
        const fetchSchedule = async () => {
            if (selectedFlight) {
                setScheduleLoading(true);
                setScheduleError(null);
                try {
                    console.log("Fetching schedule from Netlify function...");
                    const response = await fetch('/.netlify/functions/get-html', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: selectedFlight.schedule_url }),
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch schedule: ${response.statusText}`);
                    }

                    const result = await response.json();
                    const fullHtml = result.data;
                    console.log("Full HTML from Netlify function:", fullHtml.substring(0, 500));

                    extractScheduleData(fullHtml);
                } catch (err) {
                    if (err instanceof Error) {
                        setScheduleError(err.message);
                    } else {
                        setScheduleError('An unexpected error occurred while fetching the schedule.');
                    }
                } finally {
                    setScheduleLoading(false);
                }
            }
        };

        fetchSchedule();
    }, [selectedFlight]);

    const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        const selected = leagueOptions.find(option => `${option.leagueName} - ${option.flightName}` === selectedValue);
        if (selected) {
            setSelectedFlight(selected);
        }
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

                    {/* Render schedule cards if data exists */}
                    {selectedFlight && !scheduleLoading && !scheduleError && (
                        <div className="mt-6">
                            {Object.entries(matchupsByDate).map(([date, matchups], index) => (
                                <div key={index} className="flex flex-col bg-[var(--card-background)] border-l-4 border-[var(--card-highlight)] p-4 mb-4">
                                    <h3 className="text-lg font-medium text-[var(--card-title)] mb-2">
                                        Week {index + 1} - {date}
                                    </h3>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-[var(--card-highlight)]">
                                                <th className="text-left font-medium text-[var(--card-text)] p-2">Home</th>
                                                <th className="text-left font-medium text-[var(--card-text)] p-2">Away</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matchups.map((matchup, i) => (
                                                <tr key={i} className="odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)] border-none">
                                                    {/* First column: Expands naturally but maxes out at 25% at 640px+ */}
                                                    <td className="text-[var(--card-text)] p-2 whitespace-nowrap min-w-max sm:w-1/4">
                                                        {matchup.homeTeam || "TBD"}
                                                    </td>
                                                    {/* Second column: Takes remaining space */}
                                                    <td className="text-[var(--card-text)] p-2 whitespace-nowrap w-full">
                                                        {matchup.awayTeam || "TBD"}
                                                    </td>
                                                </tr>
                                            ))}
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
