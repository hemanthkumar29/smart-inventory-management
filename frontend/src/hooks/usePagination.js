import { useMemo, useState } from "react";

const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const pagination = useMemo(() => ({ page, limit }), [page, limit]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    pagination,
  };
};

export default usePagination;
