import { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import StatCard from "../components/common/StatCard";
import RevenueChart from "../components/charts/RevenueChart";
import TopProductsChart from "../components/charts/TopProductsChart";
import {
  fetchSummary,
  fetchSalesTrend,
  fetchTopProducts,
  fetchInsights,
} from "../services/dashboardService";
import { formatCurrency } from "../utils/formatters";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalOrders: 0,
  });
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [insights, setInsights] = useState({
    frequentlySoldProducts: [],
    restockSuggestions: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [summaryRes, trendRes, topRes, insightsRes] = await Promise.all([
          fetchSummary(),
          fetchSalesTrend(30),
          fetchTopProducts(6),
          fetchInsights(30),
        ]);

        setSummary(summaryRes);
        setTrend(trendRes);
        setTopProducts(topRes);
        setInsights(insightsRes);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <Loader label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-5">
      <ErrorMessage message={error} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" value={summary.totalRevenue} type="currency" />
        <StatCard title="Total Products" value={summary.totalProducts} />
        <StatCard title="Low Stock Items" value={summary.lowStockItems} />
        <StatCard title="Total Orders" value={summary.totalOrders} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RevenueChart data={trend} />
        <TopProductsChart data={topProducts} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card-surface p-4">
          <h3 className="text-lg font-semibold text-brand-900">Frequently Sold Products</h3>
          <div className="mt-3 space-y-2">
            {insights.frequentlySoldProducts?.length ? (
              insights.frequentlySoldProducts.map((item) => (
                <div key={item.productId} className="rounded-xl border border-brand-100 p-3">
                  <p className="font-semibold text-brand-900">{item.productName}</p>
                  <p className="text-sm text-brand-600">
                    {item.soldUnits} units sold | {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-500">Not enough data yet</p>
            )}
          </div>
        </div>

        <div className="card-surface p-4">
          <h3 className="text-lg font-semibold text-brand-900">Smart Restock Suggestions</h3>
          <div className="mt-3 space-y-2">
            {insights.restockSuggestions?.length ? (
              insights.restockSuggestions.map((item) => (
                <div key={item.productId} className="rounded-xl border border-sand-200 bg-sand-50 p-3">
                  <p className="font-semibold text-sand-900">{item.productName}</p>
                  <p className="text-sm text-sand-700">
                    Current: {item.currentStock} | Suggested restock: {item.suggestedRestockQty}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-500">Stock levels are healthy for this period</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
