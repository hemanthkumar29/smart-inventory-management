import api from "./api";

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data.data;
};

export const fetchOrders = async (params) => {
  const { data } = await api.get("/orders", { params });
  return data;
};

export const fetchOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
};

export const downloadInvoice = async (id) => {
  const response = await api.get(`/orders/${id}/invoice`, {
    responseType: "blob",
  });

  return response.data;
};
