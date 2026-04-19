import api from "./api";

const toFormData = (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return formData;
};

export const fetchProducts = async (params) => {
  const { data } = await api.get("/products", { params });
  return data;
};

export const fetchProductCatalog = async (params) => {
  const { data } = await api.get("/products/catalog", { params });
  return data.data;
};

export const fetchProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
};

export const createProduct = async (payload) => {
  const { data } = await api.post("/products", toFormData(payload), {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.data;
};

export const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, toFormData(payload), {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data.data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export const updateStock = async (id, quantity) => {
  const { data } = await api.patch(`/products/${id}/stock`, { quantity });
  return data.data;
};
