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
  <div className="card-surface h-80 p-4">
    <h3 className="mb-3 text-base font-semibold text-brand-900">Top Selling Products</h3>
    <ResponsiveContainer width="100%" height="88%">
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffe4bc" />
        <XAxis dataKey="productName" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="soldUnits" fill="#de6e20" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TopProductsChart;
