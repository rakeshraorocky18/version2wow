import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function BookingForm() {
  const { vendorId } = useParams();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    serviceDescription: "",
    eventType: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    city: "",
    guestCount: 0,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    specialRequirements: "",
    amount: 0,
    advancePaid: 0,
    userNotes: "",
  });

  const handleSubmit = async () => {
    try {
      await api.post("/bookings", {
        vendorId,
        vendorName: "",
        ...form,
      });

      toast.success("Booking created");
      navigate("/app/vendors");
    } catch (err) {
      toast.error("Booking failed");
      console.log(err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "guestCount" ||
        name === "amount" ||
        name === "advancePaid"
          ? Number(value)
          : value,
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Book Vendor
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <input
          name="customerName"
          placeholder="Customer Name"
          value={form.customerName}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="customerPhone"
          placeholder="Customer Phone"
          value={form.customerPhone}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="customerEmail"
          placeholder="Customer Email"
          value={form.customerEmail}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="eventType"
          placeholder="Event Type"
          value={form.eventType}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          type="date"
          name="eventDate"
          value={form.eventDate}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          type="time"
          name="eventTime"
          value={form.eventTime}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="venue"
          placeholder="Venue"
          value={form.venue}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          type="number"
          name="guestCount"
          placeholder="Guest Count"
          value={form.guestCount}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          type="number"
          name="amount"
          placeholder="Budget"
          value={form.amount}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        <input
          type="number"
          name="advancePaid"
          placeholder="Advance Paid"
          value={form.advancePaid}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

      </div>

      <textarea
        name="serviceDescription"
        placeholder="Service Description"
        value={form.serviceDescription}
        onChange={handleChange}
        className="border rounded-lg p-3 w-full mt-5"
        rows={3}
      />

      <textarea
        name="specialRequirements"
        placeholder="Special Requirements"
        value={form.specialRequirements}
        onChange={handleChange}
        className="border rounded-lg p-3 w-full mt-5"
        rows={3}
      />

      <textarea
        name="userNotes"
        placeholder="Additional Notes"
        value={form.userNotes}
        onChange={handleChange}
        className="border rounded-lg p-3 w-full mt-5"
        rows={3}
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-pink-600 text-white rounded-lg p-3 mt-8 hover:bg-pink-700"
      >
        Book Vendor
      </button>

    </div>
  );
}