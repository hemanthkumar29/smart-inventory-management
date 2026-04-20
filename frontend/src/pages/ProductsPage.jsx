import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Badge from "../components/common/Badge";
import usePagination from "../hooks/usePagination";
import useDebounce from "../hooks/useDebounce";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from "../services/productService";
import { fetchSuppliers } from "../services/supplierService";
import { formatCurrency } from "../utils/formatters";
import { isPositiveNumber } from "../utils/validators";

const initialFormState = {
  name: "",
  sku: "",
  price: "",
  quantity: "",
  category: "",
  supplier: "",
  lowStockThreshold: "10",
  image: null,
};

const notifyProductCatalogChanged = () => {
  window.dispatchEvent(new Event("products:updated"));

  try {
    localStorage.setItem("smart_inventory_products_updated_at", String(Date.now()));
  } catch (_error) {
    // Ignore storage failures in restricted environments.
  }
};

const ProductsPage = () => {
  const { page, setPage, limit } = usePagination(1, 10);
  const [meta, setMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingProductId, setEditingProductId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category).filter(Boolean))),
    [products],
  );
  const lowStockCount = useMemo(
    () => products.filter((item) => item.quantity <= item.lowStockThreshold).length,
    [products],
  );
  const totalUnits = useMemo(
    () => products.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [products],
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetchProducts({
        page,
        limit,
        search: debouncedSearch || undefined,
        category: category || undefined,
        lowStock: lowStockOnly ? true : undefined,
      });

      setProducts(response.data || []);
      setMeta(response.meta || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, category, lowStockOnly]);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetchSuppliers({ limit: 100 });
      setSuppliers(response.data || []);
    } catch (_error) {
      toast.error("Could not fetch suppliers");
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingProductId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProductId(product._id);
    setFormState({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
      category: product.category,
      supplier: product.supplier?._id || "",
      lowStockThreshold: String(product.lowStockThreshold || 10),
      image: null,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "image") {
      setFormState((prev) => ({ ...prev, image: files?.[0] || null }));
      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formState.name.trim().length < 2) {
      return "Product name should be at least 2 characters";
    }

    if (!isPositiveNumber(formState.price)) {
      return "Price should be zero or a positive number";
    }

    if (!Number.isInteger(Number(formState.quantity)) || Number(formState.quantity) < 0) {
      return "Quantity should be a non-negative integer";
    }

    if (!formState.category.trim()) {
      return "Category is required";
    }

    if (!Number.isInteger(Number(formState.lowStockThreshold)) || Number(formState.lowStockThreshold) < 1) {
      return "Low stock threshold should be at least 1";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        name: formState.name.trim(),
        sku: formState.sku.trim() || undefined,
        price: Number(formState.price),
        quantity: Number(formState.quantity),
        category: formState.category.trim(),
        supplier: formState.supplier || undefined,
        lowStockThreshold: Number(formState.lowStockThreshold),
        image: formState.image || undefined,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        toast.success("Product updated successfully");
      } else {
        await createProduct(payload);
        toast.success("Product added successfully");
      }

      notifyProductCatalogChanged();

      setIsModalOpen(false);
      resetForm();
      await loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId);
      toast.success("Product deleted");
      notifyProductCatalogChanged();
      await loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleStockUpdate = async (product) => {
    const input = window.prompt(`Set new stock quantity for ${product.name}`, String(product.quantity));

    if (input === null) {
      return;
    }

    const nextQty = Number(input);
    if (!Number.isInteger(nextQty) || nextQty < 0) {
      toast.error("Stock quantity should be a non-negative integer");
      return;
    }

    try {
      await updateStock(product._id, nextQty);
      toast.success("Stock updated");
      notifyProductCatalogChanged();
      await loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    }
  };

  return (
    <div className="space-y-5">
      <section className="card-surface p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Catalog</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Inventory operations</h3>
            <p className="text-sm text-slate-600">
              Track stock movement, maintain product data quality, and react quickly to low inventory.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <span className="metric-chip">Visible SKUs: {products.length}</span>
            <span className="metric-chip">Low stock: {lowStockCount}</span>
            <span className="metric-chip">Units in view: {totalUnits}</span>
          </div>
        </div>
      </section>

      <div className="card-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
            <input
              className="input-base"
              placeholder="Search name, SKU, category..."
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />

            <select
              className="input-base"
              value={category}
              onChange={(event) => {
                setPage(1);
                setCategory(event.target.value);
              }}
            >
              <option value="">All categories</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => {
                  setPage(1);
                  setLowStockOnly(event.target.checked);
                }}
              />
              Low stock only
            </label>
          </div>

          <button type="button" className="btn-primary" onClick={openCreateModal}>
            Add Product
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="card-surface overflow-x-auto p-2">
        {loading ? (
          <Loader label="Loading products..." />
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {product.image?.url ? (
                        <img
                          src={product.image.url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-100" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.supplier?.name || "No supplier"}</p>
                      </div>
                    </div>
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.quantity}</td>
                  <td>
                    <Badge value={product.quantity <= product.lowStockThreshold ? "low" : "healthy"} />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-secondary" onClick={() => openEditModal(product)}>
                        Edit
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handleStockUpdate(product)}>
                        Stock
                      </button>
                      <button type="button" className="btn-danger" onClick={() => handleDelete(product._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500">No products found</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={meta} onPageChange={setPage} />

      <Modal
        isOpen={isModalOpen}
        title={editingProductId ? "Update Product" : "Add Product"}
        onClose={() => setIsModalOpen(false)}
      >
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="name">Name</label>
            <input id="name" name="name" className="input-base" value={formState.name} onChange={handleInputChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="sku">SKU (optional)</label>
            <input id="sku" name="sku" className="input-base" value={formState.sku} onChange={handleInputChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="price">Price</label>
            <input id="price" name="price" type="number" step="0.01" className="input-base" value={formState.price} onChange={handleInputChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="quantity">Quantity</label>
            <input id="quantity" name="quantity" type="number" className="input-base" value={formState.quantity} onChange={handleInputChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="category">Category</label>
            <input id="category" name="category" className="input-base" value={formState.category} onChange={handleInputChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="supplier">Supplier</label>
            <select id="supplier" name="supplier" className="input-base" value={formState.supplier} onChange={handleInputChange}>
              <option value="">No supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="lowStockThreshold">Low Stock Threshold</label>
            <input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              className="input-base"
              value={formState.lowStockThreshold}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="image">Image</label>
            <input id="image" name="image" type="file" accept="image/*" className="input-base" onChange={handleInputChange} />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitLoading}>
              {submitLoading ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
