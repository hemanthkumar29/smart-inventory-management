export const formatCurrency = (value = 0) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

export const formatCompactNumber = (value = 0) => new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
}).format(Number(value) || 0);
