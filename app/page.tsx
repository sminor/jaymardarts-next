'use client';
import Image from 'next/image';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaChartBar } from 'react-icons/fa';
import Announcement from '@/components/Announcement';

const Home = () => {
  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Global Page Wrapper */}
      <div className="w-full max-w-screen-xl mx-auto px-4">
        
        {/* Header */}
        <header className="p-4 flex justify-center items-center">
          <div className="relative h-48 md:h-72 lg:h-96 xl:h-[30rem] w-48 md:w-72 lg:w-96 xl:w-[30rem]">
            <Image
              src="/logo.png"
              alt="Jaymar Darts official logo displayed on the homepage"
              fill
              className="object-contain"
              priority
            />
          </div>
        </header>

        {/* Announcement - Always visible */}
        <section className="w-full p-4">
          <Announcement page="home" autoplayDelay={6000} />
        </section>

        {/* Quick Links */}
        <section className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex-1">
              <Button href="/locations" icon={<FaMapMarkerAlt size={32} aria-hidden="true" />} aria-label="View Locations">
                Locations
              </Button>
            </div>
            <div className="flex-1">
              <Button href="/events" icon={<FaCalendarAlt size={32} aria-hidden="true" />} aria-label="View Events">
                Events
              </Button>
            </div>
            <div className="flex-1">
              <Button href="/leagues" icon={<FaUsers size={32} aria-hidden="true" />} aria-label="View Leagues">
                Leagues
              </Button>
            </div>
            <div className="flex-1">
              <Button href="/stats" icon={<FaChartBar size={32} aria-hidden="true" />} aria-label="View Stats">
                Stats
              </Button>
            </div>
          </div>
        </section>

      </div> {/* End of Global Wrapper */}

      {/* Footer (Not inside wrapper so it stays full-width) */}
      <Footer />
    </div>
  );
};

export default Home;
