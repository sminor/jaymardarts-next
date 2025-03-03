'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import NavBar from '@/components/NavBar';
import EventCard from './EventCard';
import Button from '@/components/Button';
import Footer from '@/components/Footer';

// Type Definitions
interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  games: string;
  draw_type: string;
  signup_start: string;
  signup_end: string;
  entry_fee: number;
  special_event?: string;
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('thisMonth');
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [uniqueLocations, setUniqueLocations] = useState<string[]>(['all']);

  // Fetch Events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;
        setEvents(data || []);

        // Extract unique locations
        const locations = new Set(data.map(event => event.location));
        setUniqueLocations(['all', ...Array.from(locations)]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Event Filtering Logic
  const filteredEvents = events.filter(event => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(event.date + 'T00:00:00');
    const isPastEvent = eventDate < today;

    if (!showPastEvents && isPastEvent) return false;
    if (locationFilter !== 'all' && event.location !== locationFilter) return false;
    if (dateRange === 'thisMonth') return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
    if (dateRange === 'thisWeek') return eventDate >= today && eventDate <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    if (dateRange === 'today') return eventDate.toDateString() === today.toDateString();
    return true;
  });

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Navigation Bar */}
      <NavBar currentPage="Events" />

      {/* Header */}
      <header className="p-4 w-full bg-background-secondary">
        <div className="container max-w-screen-xl mx-auto text-left">
          <h1 className="text-2xl font-bold text-[var(--card-title)]">Upcoming Events</h1>
          <p>Whether you are a seasoned player or just starting out, our tournaments are the perfect opportunity to compete and have fun!</p>
        </div>
      </header>

      {/* Placeholder Buttons Section */}
      <section className="p-4 w-full flex justify-center">
        <div className="flex flex-row justify-center gap-4 flex-nowrap">
          <Button className="w-auto px-3 py-2 min-w-[90px] sm:min-w-[120px] whitespace-nowrap">New Players</Button>
          <Button className="w-auto px-3 py-2 min-w-[90px] sm:min-w-[120px] whitespace-nowrap">Conduct Code</Button>
          <Button className="w-auto px-3 py-2 min-w-[90px] sm:min-w-[120px] whitespace-nowrap">FAQ</Button>
        </div>
      </section>

      {/* Filters Section */}
      <section className="p-4 w-full bg-[var(--background-main)]">
        <div className="container max-w-screen-xl mx-auto flex flex-wrap justify-between items-end bg-[var(--background-secondary)] p-4 rounded-lg">
          
          {/* Left side: Date and Location Filters */}
          <div className="flex flex-col gap-2 w-auto">
            {/* Date Range Filter */}
            <select
              onChange={(e) => setDateRange(e.target.value)}
              value={dateRange}
              className="bg-[var(--select-background)] text-[var(--select-text)] border-2 border-[var(--select-border)] rounded-md px-2 py-1 focus:outline-none"
            >
              <option value="thisMonth">This Month</option>
              <option value="thisWeek">This Week</option>
              <option value="today">Today</option>
              <option value="all">All Events</option>
            </select>

            {/* Location Filter */}
            <select
              onChange={(e) => setLocationFilter(e.target.value)}
              value={locationFilter}
              className="bg-[var(--select-background)] text-[var(--select-text)] border-2 border-[var(--select-border)] rounded-md px-2 py-1 focus:outline-none"
            >
              {uniqueLocations.map(location => (
                <option key={location} value={location}>
                  {location === 'all' ? 'All Locations' : location}
                </option>
              ))}
            </select>
          </div>

          {/* Right side: Past Events Checkbox */}
          <div className="flex items-end">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPastEvents"
                checked={showPastEvents}
                onChange={() => setShowPastEvents(!showPastEvents)}
                className="appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-md checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
              />
              <label htmlFor="showPastEvents" className="ml-2 text-[var(--select-text)] cursor-pointer">
                Show Past Events
              </label>
            </div>
          </div>

        </div>
      </section>

      {/* Event Cards Section */}
      <section className="p-4 w-full">
        <div className="container max-w-screen-xl mx-auto">
          {!isLoading && !error && filteredEvents.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p className="text-left text-[var(--card-text)]">No events found for the selected criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default EventsPage;
