'use client';
import Image from 'next/image';
import Footer from './components/Footer';
import Button from './components/Button';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaChartBar,
} from 'react-icons/fa';
import Announcement from './components/Announcement'; // Updated import

const Home = () => {

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Header */}
      <header className="p-4 flex justify-center items-center">
        <div className="container max-w-screen-xl mx-auto flex justify-center">
          <div className="relative h-48 md:h-72 lg:h-96 xl:h-[30rem] w-48 md:w-72 lg:w-96 xl:w-[30rem]">
            <Image
              src="/logo.png"
              alt="Jaymar Darts Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </header>
       {/* Announcement  */}
       <section className="w-full px-4">
        <div className="container max-w-screen-xl mx-auto">
          <Announcement page="home" autoplayDelay={6000} />
        </div>
      </section>

      {/* Quick Links */}
      <section className="p-4 w-full">
        <div className="container max-w-screen-xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className='flex-1'>
              <Button href="/locations" icon={<FaMapMarkerAlt size={32} />} >
                Locations
              </Button>
            </div>
            <div className='flex-1'>
              <Button href="/events" icon={<FaCalendarAlt size={32} />} >
                Events
              </Button>
            </div>
            <div className='flex-1'>
              <Button href="/leagues" icon={<FaUsers size={32} />}>
                Leagues
              </Button>
            </div>
            <div className='flex-1'>
              <Button href="/stats" icon={<FaChartBar size={32} />}>
                Stats
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
