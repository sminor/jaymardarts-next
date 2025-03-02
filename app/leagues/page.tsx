'use client';
import Footer from '@/components/Footer';

const Leagues = () => {
  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Global Page Wrapper */}
      <div className="w-full max-w-screen-xl mx-auto px-4">
        
        {/* Page Header */}
        <header className="p-6 text-center">
          <h1 className="text-3xl font-bold text-[var(--primary-text)]">Leagues</h1>
        </header>

        {/* Placeholder Content */}
        <section className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <p className="text-lg text-[var(--secondary-text)]">Coming Soon...</p>
        </section>

      </div> {/* End of Global Wrapper */}

      {/* Footer (Stays full-width) */}
      <Footer />
    </div>
  );
};

export default Leagues;
