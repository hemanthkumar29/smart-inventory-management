import api from "./api";

export const fetchSummary = async () => {
  const { data } = await api.get("/dashboard/summary");
  return data.data;
};

export const fetchSalesTrend = async (range = 30) => {
  const { data } = await api.get("/dashboard/sales-trend", {
    params: { range },
  });
  return data.data;
};

export const fetchTopProducts = async (limit = 5) => {
  const { data } = await api.get("/dashboard/top-products", {
    params: { limit },
  });
  return data.data;
};

export const fetchInsights = async (range = 30) => {
  const { data } = await api.get("/dashboard/insights", {
    params: { range },
  });
  return data.data;
};

export const fetchSalesReport = async (params) => {
  const { data } = await api.get("/reports/sales", { params });
  return data.data;
};

export const fetchInventoryReport = async () => {
  const { data } = await api.get("/reports/inventory");
  return data.data;
};
