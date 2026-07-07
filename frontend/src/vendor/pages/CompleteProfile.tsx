import { useState } from "react";
import vendorApi from "../../lib/vendorApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function CompleteProfile() {

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

  const navigate = useNavigate();

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
        .map((service) => service.trim())
        .filter(Boolean),
    };

    await vendorApi.post("/vendors", payload);

    toast.success("Business Profile Created");

    navigate("/vendor");
  } catch (err: any) {
    toast.error(
      err?.response?.data?.message ??
        "Unable to create business profile"
    );
  }
};

  return (
    <div className="min-h-screen bg-gray-100 py-10">

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold">
          Complete Your Business Profile
        </h1>

        <p className="text-gray-500 mt-2 mb-8">
          Fill in your business details to appear in the marketplace.
        </p>

        <div className="grid grid-cols-2 gap-5">

          <div>
            <label className="font-medium">Business Name</label>

            <input
              className="input-field mt-2"
              value={formData.businessName}
              onChange={(e)=>
                setFormData({
                  ...formData,
                  businessName:e.target.value
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
              onChange={(e)=>
                setFormData({
                  ...formData,
                  category:e.target.value
                })
              }
            >

              <option value="venue">Venue</option>

              <option value="photography">
                Photography
              </option>

              <option value="videography">
                Videography
              </option>

              <option value="catering">
                Catering
              </option>

              <option value="decor">
                Decor
              </option>

              <option value="makeup">
                Makeup
              </option>

              <option value="entertainment">
                Entertainment
              </option>

            </select>

          </div>

          <div>

            <label className="font-medium">
              City
            </label>

            <input
              className="input-field mt-2"
              value={formData.city}
              onChange={(e)=>
                setFormData({
                  ...formData,
                  city:e.target.value
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
              onChange={(e)=>
                setFormData({
                  ...formData,
                  state:e.target.value
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
              onChange={(e)=>
                setFormData({
                  ...formData,
                  phone:e.target.value
                })
              }
            />

          </div>

          <div>

            <label className="font-medium">
              Starting Price
            </label>

            <input
              type="number"
              className="input-field mt-2"
              value={formData.startingPrice}
              onChange={(e)=>
                setFormData({
                  ...formData,
                  startingPrice:e.target.value
                })
              }
            />

          </div>

        </div>

        <div className="mt-5">

          <label className="font-medium">
            Description
          </label>

          <textarea
            rows={5}
            className="input-field mt-2"
            value={formData.description}
            onChange={(e)=>
              setFormData({
                ...formData,
                description:e.target.value
              })
            }
          />

        </div>

        <div className="mt-5">

          <label className="font-medium">
            Services
          </label>

          <input
            className="input-field mt-2"
            placeholder="Photography, Drone, Album"
            value={formData.services}
            onChange={(e)=>
              setFormData({
                ...formData,
                services:e.target.value
              })
            }
          />

        </div>

        <button
          onClick={handleSave}
          className="btn-primary w-full mt-8"
        >
          Save Business Profile
        </button>

      </div>

    </div>
  );

}