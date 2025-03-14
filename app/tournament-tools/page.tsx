'use client';
import { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { TournamentCreateModal } from './tournamentCreateModal';
import { FaPlus, FaList } from 'react-icons/fa';
import TournamentListModal from './tournamentListModal';
import TournamentDetails from './TournamentDetails';
import TournamentPlayers from './TournamentPlayers';
import TournamentTeams from './TournamentTeams';
import { Tournament } from './types';

export default function TournamentTools() {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = (newTournament?: Tournament) => {
    setIsCreateModalOpen(false);
    if (newTournament) {
      setSelectedTournament(newTournament);
    }
  };

  const handleOpenListModal = () => {
    setIsListModalOpen(true);
  };

  const handleCloseListModal = (tournament?: Tournament) => {
    setIsListModalOpen(false);
    if (tournament) {
      setSelectedTournament(tournament);
    }
  };

  const handleUpdateTournament = (updatedTournament: Tournament) => {
    setSelectedTournament(updatedTournament);
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <NavBar currentPage="tournament-tools" hideButtons={true} />
      <div className="w-full max-w-screen-xl mx-auto px-4">
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold text-[var(--card-title)]">Tournament Tools</h1>
        </header>
        <section className="p-4 flex justify-center">
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg grid grid-cols-2 gap-4">
            <div className="flex-1">
              <Button
                onClick={handleOpenCreateModal}
                icon={<FaPlus size={32} aria-hidden="true" />}
                className="w-full"
              >
                New Tournament
              </Button>
            </div>
            <div className="flex-1">
              <Button
                onClick={handleOpenListModal}
                icon={<FaList size={32} aria-hidden="true" />}
                className="w-full"
              >
                Existing Tournament
              </Button>
            </div>
          </div>
        </section>

        {/* Modal for New Tournament */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Tournament"
          content={<TournamentCreateModal onClose={handleCloseCreateModal} />}
        />

        {/* Modal for Existing Tournament */}
        <Modal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          title="Select Existing Tournament"
          content={<TournamentListModal onClose={handleCloseListModal} />}
        />

        {/* Tabbed Interface */}
        {selectedTournament && (
          <div className="mt-4 mb-8">
            {/* Tournament Info */}
            <hr className="border-[var(--text-highlight)]" />
            <div className="mb-4 mt-4 text-center">
              <h2 className="text-xl font-semibold text-[var(--text-highlight)]">
                {selectedTournament.name} - {selectedTournament.date} - {selectedTournament.location}
              </h2>
            </div>
            {/* Tabs */}
            <div className="flex rounded-t-lg">
              <button
                className={`px-4 py-2 rounded-t-md mr-1 ${activeTab === 'Details' ? 'bg-[var(--tab-background-active)] text-[var(--tab-text-active)]' : 'bg-[var(--tab-background-inactive)] text-[var(--card-text)]'}`}
                onClick={() => setActiveTab('Details')}
              >
                Details
              </button>
              <button
                className={`px-4 py-2 rounded-t-md mr-1 ${activeTab === 'Players' ? 'bg-[var(--tab-background-active)] text-[var(--tab-text-active)]' : 'bg-[var(--tab-background-inactive)] text-[var(--card-text)]'}`}
                onClick={() => setActiveTab('Players')}
              >
                Players
              </button>
              <button
                className={`px-4 py-2 rounded-t-md ${activeTab === 'Teams' ? 'bg-[var(--tab-background-active)] text-[var(--tab-text-active)]' : 'bg-[var(--tab-background-inactive)] text-[var(--card-text)]'}`}
                onClick={() => setActiveTab('Teams')}
              >
                Teams
              </button>
            </div>
            <div className="p-4 bg-[var(--card-background)] rounded-b-lg rounded-tr-lg border-t-0">
              {activeTab === 'Details' && (
                <TournamentDetails tournament={selectedTournament} onUpdate={handleUpdateTournament} />
              )}
              {activeTab === 'Players' && (
                <TournamentPlayers tournament={selectedTournament} onUpdate={handleUpdateTournament} />
              )}
              {activeTab === 'Teams' && (
                <TournamentTeams tournament={selectedTournament} onUpdate={handleUpdateTournament} />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-grow"></div> {/* Spacer to show background */}
      <Footer />
    </div>
  );
}