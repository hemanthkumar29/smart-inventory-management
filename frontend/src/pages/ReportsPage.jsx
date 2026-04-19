import { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Badge from "../components/common/Badge";
import RevenueChart from "../components/charts/RevenueChart";
import {
  fetchSalesReport,
  fetchInventoryReport,
} from "../services/dashboardService";
import { formatCurrency } from "../utils/formatters";

const todayDate = new Date().toISOString().slice(0, 10);

const ReportsPage = () => {
  const [fromDate, setFromDate] = useState(todayDate);
  const [toDate, setToDate] = useState(todayDate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salesReport, setSalesReport] = useState({ summary: {}, dailySales: [], paymentBreakdown: [] });
  const [inventoryReport, setInventoryReport] = useState([]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [sales, inventory] = await Promise.all([
        fetchSalesReport({ from: fromDate, to: toDate }),
        fetchInventoryReport(),
      ]);

      setSalesReport(sales);
      setInventoryReport(inventory);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return <Loader label="Loading reports..." />;
  }

  return (
    <div className="space-y-5">
      <ErrorMessage message={error} />

      <div className="card-surface p-4">
        <div className="grid gap-3 md:grid-cols-4 md:items-end">
          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="fromDate">From</label>
            <input id="fromDate" type="date" className="input-base" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-brand-700" htmlFor="toDate">To</label>
            <input id="toDate" type="date" className="input-base" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <button type="button" className="btn-primary" onClick={loadReports}>Apply</button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-sm text-brand-600">Total Revenue</p>
          <p className="text-2xl font-bold text-brand-900">{formatCurrency(salesReport.summary.totalRevenue || 0)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-sm text-brand-600">Total Orders</p>
          <p className="text-2xl font-bold text-brand-900">{salesReport.summary.totalOrders || 0}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-sm text-brand-600">Average Order Value</p>
          <p className="text-2xl font-bold text-brand-900">{formatCurrency(salesReport.summary.avgOrderValue || 0)}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RevenueChart
          data={(salesReport.dailySales || []).map((entry) => ({
            date: entry._id,
            revenue: entry.revenue,
          }))}
        />

        <div className="card-surface p-4">
          <h3 className="mb-3 text-base font-semibold text-brand-900">Payment Method Breakdown</h3>
          <div className="space-y-2">
            {(salesReport.paymentBreakdown || []).map((entry) => (
              <div key={entry._id} className="rounded-xl border border-brand-100 p-3">
                <p className="font-semibold capitalize text-brand-900">{entry._id || "Unknown"}</p>
                <p className="text-sm text-brand-600">
                  {entry.orders} orders | {formatCurrency(entry.total)}
                </p>
              </div>
            ))}

            {!(salesReport.paymentBreakdown || []).length ? (
              <p className="text-sm text-brand-500">No payment data found for selected range</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="card-surface overflow-x-auto p-2">
        <h3 className="px-3 py-2 text-lg font-semibold text-brand-900">Inventory Health Report</h3>
        <table className="table-base">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Inventory Value</th>
            </tr>
          </thead>
          <tbody>
            {inventoryReport.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.sku}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td><Badge value={item.status} /></td>
                <td>{formatCurrency(item.inventoryValue)}</td>
              </tr>
            ))}

            {inventoryReport.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-brand-500">No inventory data available</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;
