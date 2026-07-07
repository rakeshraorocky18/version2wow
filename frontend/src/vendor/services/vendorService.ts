import vendorApi from "../../lib/vendorApi";

export const vendorService = {
  getMyBusiness: async () => {
    const { data } = await vendorApi.get("/vendors/me");
    return data;
  },

  updateBusiness: async (id: string, payload: any) => {
    const { data } = await vendorApi.put(`/vendors/${id}`, payload);
    return data;
  },

  getDashboard: async () => {
    const { data } = await vendorApi.get("/vendor/dashboard");
    return data;
  },

  getVendorBookings: async (vendorId: string) => {
    const { data } = await vendorApi.get(
      `/bookings/vendor/${vendorId}`
    );
    return data;
  },

};