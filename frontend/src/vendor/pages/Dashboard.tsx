import { useEffect, useState } from "react";
import { vendorService } from "../services/vendorService";
import toast from "react-hot-toast";




export default function Dashboard() {

  const [stats, setStats] = useState({
    pendingBookings: 0,
    confirmedBookings: 0,
    averageRating: 0,
    reviews: 0,
  });

  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Load dashboard statistics
      const stats = await vendorService.getDashboard();
      setStats(stats);

      // Get logged-in vendor business
      const business = await vendorService.getMyBusiness();

      // Load vendor bookings
      const bookingData = await vendorService.getVendorBookings(
        business.id
      );

      setBookings(bookingData);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load dashboard");
    }
  };

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-8">
        Vendor Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">

        {[
          {
            title: "Pending Bookings",
            value: stats.pendingBookings,
            color: "bg-yellow-100",
          },
          {
            title: "Confirmed Bookings",
            value: stats.confirmedBookings,
            color: "bg-green-100",
          },
          {
            title: "Average Rating",
            value: `${stats.averageRating} ⭐`,
            color: "bg-blue-100",
          },
          {
            title: "Reviews",
            value: stats.reviews,
            color: "bg-pink-100",
          },
        ].map((item) => (
          <div
            key={item.title}
            className={`${item.color} rounded-xl p-6 shadow`}
          >
            <h2 className="text-gray-600">
              {item.title}
            </h2>

            <p className="text-4xl font-bold mt-3">
              {item.value}
            </p>
          </div>
        ))}

      </div>

      <div className="mt-10 bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-semibold mb-5">
          Recent Booking Requests
        </h2>

        <table className="w-full">

          <thead className="border-b">

            <tr className="text-left">

              <th className="py-3">Customer</th>
              <th>Date</th>
              <th>Service</th>
              <th>Status</th>

            </tr>

          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-gray-500"
                >
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking: any) => (
                <tr
                  key={booking.id}
                  className="border-b"
                >
                  <td className="py-4">
                    {booking.customerName}
                  </td>

                  <td>
                    {new Date(
                      booking.eventDate
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {booking.serviceDescription}
                  </td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full ${
                        booking.status === "requested"
                          ? "bg-yellow-100 text-yellow-700"
                          : booking.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : booking.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : booking.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

      </div>

    </div>
  );
}