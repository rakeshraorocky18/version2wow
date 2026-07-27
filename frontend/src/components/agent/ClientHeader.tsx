function ClientHeader() {
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-rose-100 p-6">

      {/* Left */}
      <div className="flex items-center gap-4">
        <img
          src="https://i.pravatar.cc/80"
          alt="Client"
          className="w-16 h-16 rounded-full object-cover"
        />

        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Priya Sharma
          </h2>

          <p className="text-gray-500">
            27 Years • Hyderabad • Software Engineer
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
          Shortlist
        </button>

        <button className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600">
          Contact
        </button>
      </div>

    </div>
  );
}

export default ClientHeader;