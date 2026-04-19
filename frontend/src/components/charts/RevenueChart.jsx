import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

const RevenueChart = ({ data }) => (
  <div className="card-surface h-80 p-4">
    <h3 className="mb-3 text-base font-semibold text-brand-900">Sales Trend</h3>
    <ResponsiveContainer width="100%" height="88%">
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d6eef2" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Line type="monotone" dataKey="revenue" stroke="#0f6474" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default RevenueChart;
