export default function VendorNavbar() {
  return (
    <div className="h-16 bg-white shadow flex justify-between items-center px-6">
      <h2 className="text-xl font-semibold">
        Vendor Dashboard
      </h2>

      <button className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
}