import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Pagination from "../components/common/Pagination";
import usePagination from "../hooks/usePagination";
import { fetchProductCatalog } from "../services/productService";
import { createOrder, fetchOrders, downloadInvoice } from "../services/orderService";
import { PAYMENT_METHODS } from "../utils/constants";
import { formatCurrency, formatDate } from "../utils/formatters";

const createBlankItem = () => ({ product: "", quantity: 1 });

const OrdersPage = () => {
  const { page, setPage, limit } = usePagination(1, 10);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    items: [createBlankItem()],
    tax: 0,
    discount: 0,
    paymentMethod: "cash",
    customerName: "",
    customerPhone: "",
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const catalog = await fetchProductCatalog({ inStockOnly: true });
      setProducts(catalog || []);
    } catch (_error) {
      toast.error("Failed to load product catalog");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const response = await fetchOrders({ page, limit });
      setOrders(response.data || []);
      setMeta(response.meta || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const handleProductsUpdated = () => {
      loadProducts();
    };

    const handleStorage = (event) => {
      if (event.key === "smart_inventory_products_updated_at") {
        loadProducts();
      }
    };

    window.addEventListener("products:updated", handleProductsUpdated);
    window.addEventListener("focus", handleProductsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("products:updated", handleProductsUpdated);
      window.removeEventListener("focus", handleProductsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadProducts]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products],
  );

  const subtotal = useMemo(() => form.items.reduce((sum, item) => {
    const product = productMap.get(item.product);
    if (!product) {
      return sum;
    }

    return sum + (product.price * Number(item.quantity || 0));
  }, 0), [form.items, productMap]);

  const total = useMemo(() => subtotal + Number(form.tax || 0) - Number(form.discount || 0), [subtotal, form.tax, form.discount]);

  const updateItem = (index, key, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };
      return { ...prev, items };
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, createBlankItem()] }));
  };

  const removeItemRow = (index) => {
    setForm((prev) => {
      const items = prev.items.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        items: items.length ? items : [createBlankItem()],
      };
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      items: [createBlankItem()],
      tax: 0,
      discount: 0,
      paymentMethod: "cash",
      customerName: "",
      customerPhone: "",
    });
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();

    const cleanedItems = form.items
      .map((item) => ({ product: item.product, quantity: Number(item.quantity) }))
      .filter((item) => item.product && Number.isInteger(item.quantity) && item.quantity > 0);

    if (!cleanedItems.length) {
      toast.error("Please add at least one valid order item");
      return;
    }

    for (const item of cleanedItems) {
      const selectedProduct = productMap.get(item.product);

      if (!selectedProduct) {
        toast.error("One or more selected products are no longer available");
        return;
      }

      if (selectedProduct.quantity < item.quantity) {
        toast.error(`Insufficient stock for ${selectedProduct.name}`);
        return;
      }
    }

    if (total < 0) {
      toast.error("Total cannot be negative");
      return;
    }

    try {
      setCreatingOrder(true);
      await createOrder({
        items: cleanedItems,
        tax: Number(form.tax || 0),
        discount: Number(form.discount || 0),
        paymentMethod: form.paymentMethod,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
      });

      toast.success("Order created successfully");
      resetForm();
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleInvoiceDownload = async (order) => {
    try {
      const blob = await downloadInvoice(order._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (_error) {
      toast.error("Failed to download invoice");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
      <div className="card-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-brand-900">Create Sale Order</h3>
          <button type="button" className="btn-secondary" onClick={loadProducts}>
            Refresh Products
          </button>
        </div>

        {loadingCatalog ? (
          <p className="mt-3 text-sm text-brand-600">Refreshing product catalog...</p>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={handleSubmitOrder}>
          {form.items.map((item, index) => (
            <div key={`${item.product}-${index}`} className="grid gap-2 rounded-xl border border-brand-100 p-3 md:grid-cols-[1fr_130px_auto]">
              <select
                className="input-base"
                value={item.product}
                onChange={(event) => updateItem(index, "product", event.target.value)}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id} disabled={product.quantity <= 0}>
                    {product.name} ({product.quantity} in stock){product.quantity <= 0 ? " - out of stock" : ""}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                className="input-base"
                value={item.quantity}
                onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
              />

              <button type="button" className="btn-secondary" onClick={() => removeItemRow(index)}>
                Remove
              </button>
            </div>
          ))}

          <button type="button" className="btn-secondary" onClick={addItemRow}>
            Add Item
          </button>

          {!products.length && !loadingCatalog ? (
            <p className="text-sm text-brand-600">
              No sellable products found. Add products with stock from Product Management.
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-brand-700" htmlFor="customerName">Customer Name</label>
              <input id="customerName" name="customerName" className="input-base" value={form.customerName} onChange={handleFormChange} />
            </div>

            <div>
              <label className="mb-1 block text-sm text-brand-700" htmlFor="customerPhone">Customer Phone</label>
              <input id="customerPhone" name="customerPhone" className="input-base" value={form.customerPhone} onChange={handleFormChange} />
            </div>

            <div>
              <label className="mb-1 block text-sm text-brand-700" htmlFor="paymentMethod">Payment Method</label>
              <select id="paymentMethod" name="paymentMethod" className="input-base" value={form.paymentMethod} onChange={handleFormChange}>
                {PAYMENT_METHODS.map((entry) => (
                  <option key={entry.value} value={entry.value}>{entry.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm text-brand-700" htmlFor="tax">Tax</label>
                <input id="tax" name="tax" type="number" step="0.01" className="input-base" value={form.tax} onChange={handleFormChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-brand-700" htmlFor="discount">Discount</label>
                <input id="discount" name="discount" type="number" step="0.01" className="input-base" value={form.discount} onChange={handleFormChange} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-sm text-brand-700">Subtotal: {formatCurrency(subtotal)}</p>
            <p className="text-sm text-brand-700">Total: <span className="font-semibold">{formatCurrency(total)}</span></p>
          </div>

          <button type="submit" className="btn-primary" disabled={creatingOrder}>
            {creatingOrder ? "Creating order..." : "Create Order"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <ErrorMessage message={error} />

        <div className="card-surface overflow-x-auto p-2">
          <h3 className="px-3 py-2 text-lg font-semibold text-brand-900">Recent Orders</h3>

          {loadingOrders ? (
            <Loader label="Loading orders..." />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <p className="font-semibold text-brand-900">{order.orderNumber}</p>
                      <p className="text-xs text-brand-500">{order.items.length} items</p>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => handleInvoiceDownload(order)}>
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-brand-500">No orders found</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default OrdersPage;
