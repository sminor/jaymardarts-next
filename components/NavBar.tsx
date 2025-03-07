'use client';
import React from 'react';
import Link from 'next/link';
import { FaMapMarkerAlt, FaUsers, FaChartBar, FaHome, FaBullseye } from 'react-icons/fa';
import Button from '@/components/Button';

interface NavBarProps {
  currentPage: string;
}

const NavBar: React.FC<NavBarProps> = ({ currentPage }) => {
  const navLinks = [
    { href: '/', label: 'Home', icon: FaHome },
    { href: '/locations', label: 'Locations', icon: FaMapMarkerAlt },
    { href: '/events', label: 'Events', icon: FaBullseye },
    { href: '/leagues', label: 'Leagues', icon: FaUsers },
    { href: '/stats', label: 'Stats', icon: FaChartBar },
  ];

  return (
    <nav className="bg-[var(--background-navbar)] w-full p-2">
      <div className="container max-w-screen-xl mx-auto flex justify-center gap-2 px-0">
        {navLinks
          .filter(({ label }) => label.toLowerCase() !== currentPage.toLowerCase()) // ✅ Hide current page
          .map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href} passHref className="flex-1">
              <Button
                icon={<Icon size={20} />}
                className="w-full py-2 flex-1"
              >
                {label}
              </Button>
            </Link>
          ))}
      </div>
    </nav>
  );
};

export default NavBar;
