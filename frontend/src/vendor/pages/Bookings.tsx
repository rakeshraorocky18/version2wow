import { useEffect, useState } from "react";
import vendorApi from "../../lib/vendorApi";

// const bookings = [
//   {
//     id: "BK001",
//     customer: "Rahul Sharma",
//     phone: "+91 9876543210",
//     email: "rahul@gmail.com",
//     event: "Wedding",
//     venue: "Taj Krishna, Hyderabad",
//     date: "20 Jul 2026",
//     time: "6:00 PM",
//     guests: 500,
//     amount: 120000,
//     advancePaid: 50000,
//     balance: 70000,
//     status: "Pending",
//   },
//   {
//     id: "BK002",
//     customer: "Priya",
//     phone: "+91 9876543210",
//     email: "rahul@gmail.com",
//     event: "Wedding",
//     venue: "Taj Krishna, Hyderabad",
//     date: "25 Jul 2026",
//     time: "6:00 PM",
//     guests: 300,
//     advancePaid: 50000,
//     balance: 70000,
//     amount: 80000,
//     status: "Confirmed",
//   },
//   {
//     id: "BK003",
//     customer: "Kiran Kumar",
//     phone: "+91 9123456789",
//     email: "kiran@gmail.com",
//     event: "Engagement",
//     venue: "Novotel Hyderabad",
//     date: "30 Jul 2026",
//     time: "7:00 PM",
//     guests: 150,
//     amount: 40000,
//     advancePaid: 20000,
//     balance: 20000,
//     status: "Completed",
//   },
// ];

interface Booking {
  id: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  city?: string;
  guestCount: number;
  amount: number;
  advancePaid: number;
  balanceDue: number;
  specialRequirements?: string;
  userNotes?: string;
  vendorNotes?: string;
  status: string;
}



const VendorBookings = () => {

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const vendorResponse = await vendorApi.get("/vendors/me");

      const vendorId = vendorResponse.data.id;

      const response = await vendorApi.get(
        `/bookings/vendor/${vendorId}`
      );

      setBookings(response.data);

    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(search.toLowerCase()) ||
      booking.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" ||
      booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const total = bookings.length;

  const pending = bookings.filter(
    b => b.status === "requested"
  ).length;

  const confirmed = bookings.filter(
    b => b.status === "confirmed"
  ).length;

  const completed = bookings.filter(
    b => b.status === "completed"
  ).length;

  const confirmBooking = async (bookingId: string) => {
    try {
      await vendorApi.put(`/bookings/${bookingId}/status`, {
        status: "confirmed",
        notes: "Booking accepted",
      });

      fetchBookings();
      setSelectedBooking(null);

    } catch (error) {
      console.error(error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    await vendorApi.put(`/bookings/${bookingId}/status`, {
      status: "cancelled",
      cancellationReason: "Rejected by vendor",
    });

    fetchBookings();
    setSelectedBooking(null);
  };

  const completeBooking = async (bookingId: string) => {
    try {
      await vendorApi.put(`/bookings/${bookingId}/status`, {
        status: "completed",
        notes: "Event completed successfully",
      });

      fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
    <div>
      <h1 className="text-3xl font-bold mb-6">Vendor Bookings</h1>

      <p className="text-gray-500">
        Manage all your customer bookings here.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-10">

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-gray-500">Total Bookings</h3>
        <p className="text-3xl font-bold">{total}</p>
      </div>

      <div className="bg-yellow-100 rounded-lg shadow p-5">
        <h3>Pending</h3>
        <p className="text-3xl font-bold">{pending}</p>
      </div>

      <div className="bg-green-100 rounded-lg shadow p-5">
        <h3>Confirmed</h3>
        <p className="text-3xl font-bold">{confirmed}</p>
      </div>

      <div className="bg-blue-100 rounded-lg shadow p-5">
        <h3>Completed</h3>
        <p className="text-3xl font-bold">{completed}</p>
      </div>

    </div>

<div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
  <input
    type="text"
    placeholder="Search customer or booking..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded-lg px-4 py-2 w-full md:flex-1"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border rounded-lg px-4 py-2 w-full md:w-56"
  >
    <option value="All Status">All Status</option>
    <option value="requested">Requested</option>
    <option value="confirmed">Confirmed</option>
    <option value="completed">Completed</option>
    <option value="cancelled">Cancelled</option>
  </select>

</div>

<div className="bg-white rounded-lg shadow mt-8 overflow-x-auto">
  <table className="min-w-full">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-3 text-left">Booking ID</th>
        <th className="p-3 text-left">Customer</th>
        <th className="p-3 text-left">Event</th>
        <th className="p-3 text-left">Date</th>
        <th className="p-3 text-left">Guests</th>
        <th className="p-3 text-left">Amount</th>
        <th className="p-3 text-left">Status</th>
        <th className="p-3 text-left">Action</th>
      </tr>
    </thead>

    <tbody>
      {filteredBookings.map((booking) => (
        <tr key={booking.id} className="border-b hover:bg-gray-50">
          <td className="p-3">{booking.id}</td>
          <td className="p-3">{booking.customerName}</td>
          <td className="p-3">{booking.eventType}</td>
          <td className="p-3">{booking.eventDate}</td>
          <td className="p-3">{booking.guestCount}</td>
          <td className="p-3">₹{booking.amount.toLocaleString()}</td>
          <td className="p-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === "requested"
                  ? "bg-yellow-100 text-yellow-700"
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
          <td className="p-3">
            <div className="flex gap-2">

              <button
                onClick={() => setSelectedBooking(booking)}
                className="bg-pink-600 text-white px-3 py-2 rounded hover:bg-pink-700"
              >
                View
              </button>

              <button
                onClick={() => confirmBooking(booking.id)}
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
              >
                Accept
              </button>

              <button
                onClick={() => cancelBooking(booking.id)}
                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
              >
                Reject
              </button>

            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{selectedBooking && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-full max-w-lg">

      <h2 className="text-2xl font-bold mb-4">
        Booking Details
      </h2>

      <div className="space-y-5">

        <div>
          <h3 className="font-semibold text-lg border-b pb-2">Customer Details</h3>
          <p><strong>Name:</strong> {selectedBooking.customerName}</p>
          <p><strong>Phone:</strong> {selectedBooking.customerPhone}</p>
          <p><strong>Email:</strong> {selectedBooking.customerEmail}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg border-b pb-2">Event Details</h3>
          <p><strong>Event:</strong> {selectedBooking.eventType}</p>
          <p><strong>Venue:</strong> {selectedBooking.venue}</p>
          <p><strong>Date:</strong> {selectedBooking.eventDate}</p>
          <p><strong>Time:</strong> {selectedBooking.eventTime}</p>
          <p><strong>Guests:</strong> {selectedBooking.guestCount}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg border-b pb-2">Payment Details</h3>
          <p><strong>Total Amount:</strong> ₹{selectedBooking.amount.toLocaleString()}</p>
          <p><strong>Advance Paid:</strong> ₹{selectedBooking.advancePaid?.toLocaleString() ?? 0}</p>
          <p><strong>Balance:</strong> ₹{selectedBooking.balanceDue.toLocaleString()}</p>
          <p><strong>Status:</strong> {selectedBooking.status}</p>
        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">

        {selectedBooking.status === "requested" && (
          <button
            onClick={() => confirmBooking(selectedBooking.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Confirm
          </button>
        )}

        {selectedBooking.status === "confirmed" && (
          <button
            onClick={() => completeBooking(selectedBooking.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Mark Completed
          </button>
        )}

        <button
          onClick={() => cancelBooking(selectedBooking.id)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Cancel Booking
        </button>

        <button
          onClick={() => setSelectedBooking(null)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Close
        </button>

      </div>

    </div>
  </div>
)}
    </>

    
  );
};

export default VendorBookings;