import { Link, useLocation } from 'react-router-dom';
import WowLogo from '../../components/brand/WowLogo';

export default function VendorSidebar() {
  const location = useLocation();

  const menuItems = [
    { title: 'Dashboard', path: '/vendor' },
    { title: 'My Business', path: '/vendor/business' },
    { title: 'Bookings', path: '/vendor/bookings' },
    { title: 'Calendar', path: '/vendor/calendar' },
    { title: 'Reviews', path: '/vendor/reviews' },
    { title: 'Chat', path: '/vendor/chat' },
    { title: 'Profile', path: '/vendor/profile' },
  ];

  return (
    <div className="w-64 bg-[#1E1B32] text-white h-screen p-6 flex flex-col">
      <div className="mb-10 flex justify-center">
        <WowLogo variant="sidebar" to="/vendor" />
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block rounded-lg px-4 py-3 transition ${
              location.pathname === item.path
                ? 'bg-[#E91E63]'
                : 'hover:bg-white/5 text-white/80'
            }`}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
