import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TopProductsChart = ({ data }) => (
  <div className="card-surface h-80 p-5">
    <h3 className="mb-3 text-base font-semibold text-slate-900">Top Selling Products</h3>
    <ResponsiveContainer width="100%" height="88%">
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="productName" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
        <Bar dataKey="soldUnits" fill="#0f7e92" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TopProductsChart;
