import { Link, useLocation } from "react-router-dom";

export default function VendorSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/vendor",
    },
    {
      title: "My Business",
      path: "/vendor/business",
    },
    {
      title: "Bookings",
      path: "/vendor/bookings",
    },
    {
      title: "Calendar",
      path: "/vendor/calendar",
    },
    {
      title: "Reviews",
      path: "/vendor/reviews",
    },
    {
      title: "Chat",
      path: "/vendor/chat",
    },
    {
      title: "Profile",
      path: "/vendor/profile",
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen p-6">

      <h1 className="text-3xl font-bold mb-10">
        Vendor Portal
      </h1>

      <div className="space-y-2">

        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block rounded-lg px-4 py-3 transition ${
              location.pathname === item.path
                ? "bg-pink-600"
                : "hover:bg-slate-800"
            }`}
          >
            {item.title}
          </Link>
        ))}

      </div>

    </div>
  );
}