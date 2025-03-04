import { FaEnvelope, FaFacebookSquare, FaLock } from 'react-icons/fa';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="p-4 bg-[var(--background-footer)] text-[var(--text-main)] text-center mt-auto w-full">
      <div className="container max-w-screen-xl mx-auto">
        <div className="flex justify-center space-x-6 mb-2 text-sm">
          {[
            { href: '#', icon: FaEnvelope, label: 'Contact Us' },
            {
              href: 'https://www.facebook.com/jaymardarts',
              icon: FaFacebookSquare,
              label: 'Facebook',
            },
            { href: '#', icon: FaLock, label: 'Admin Login' },
          ].map(({ href, icon: Icon, label }, index) => (
            <Link
              key={index}
              href={href}
              target="_blank"
              className="flex items-center space-x-1 hover:text-[var(--text-highlight)]"
            >
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        &copy; {new Date().getFullYear()} Jaymar Darts. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
