import { useEffect, useState } from "react";
import { vendorService } from "../services/vendorService";
import toast from "react-hot-toast";



export default function Business() {
  const [formData, setFormData] = useState({
    businessName: "",
    category: "photography",
    description: "",
    city: "",
    state: "",
    phone: "",
    startingPrice: "",
    services: "",
  });

  const [vendorId, setVendorId] = useState("");

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const data = await vendorService.getMyBusiness();

      setVendorId(data.id);

      setFormData({
        businessName: data.businessName ?? "",
        category: data.category ?? "photography",
        description: data.description ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        phone: data.phone ?? "",
        startingPrice: data.startingPrice?.toString() ?? "",
        services: data.services?.join(", ") ?? "",
      });

    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error("Please complete your business profile first.");
      } else {
        toast.error("Unable to load business profile.");
      }
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        businessName: formData.businessName,
        category: formData.category,
        description: formData.description,

        location: {
          city: formData.city,
          state: formData.state,
          address: "",
          pincode: "",
        },

        phone: formData.phone,

        pricing: {
          startingPrice: Number(formData.startingPrice),
          currency: "INR",
          priceType: "starting_from",
        },

        services: formData.services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await vendorService.updateBusiness(vendorId, payload);

      toast.success("Business updated successfully");
    } catch (err) {
      toast.error("Unable to update business");
    }
  };

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-8">
        My Business
      </h1>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="font-medium">
              Business Name
            </label>

            <input
              className="input-field mt-2"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  businessName: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-medium">
              Category
            </label>

            <select
              className="input-field mt-2"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                })
              }
            >
              <option value="venue">Venue</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="catering">Catering</option>
              <option value="decor">Decor</option>
              <option value="makeup">Makeup</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div>
            <label className="font-medium">
              City
            </label>

            <input
              className="input-field mt-2"
              value={formData.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  city: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-medium">
              State
            </label>

            <input
              className="input-field mt-2"
              value={formData.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  state: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-medium">
              Phone
            </label>

            <input
              className="input-field mt-2"
              value={formData.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="font-medium">
              Starting Price
            </label>

            <input
              className="input-field mt-2"
              type="number"
              value={formData.startingPrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startingPrice: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div className="mt-6">

          <label className="font-medium">
            Description
          </label>

          <textarea
            rows={5}
            className="input-field mt-2"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
          />

        </div>

        <div className="mt-6">

          <label className="font-medium">
            Services
          </label>

          <input
            className="input-field mt-2"
            placeholder="Photography, Drone, Album"
            value={formData.services}
            onChange={(e) =>
              setFormData({
                ...formData,
                services: e.target.value,
              })
            }
          />

        </div>

        <button
          onClick={handleSave}
          className="btn-primary mt-8"
        >
          Save Changes
        </button>

      </div>

    </div>
  );
}