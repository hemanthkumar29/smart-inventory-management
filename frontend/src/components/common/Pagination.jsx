const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onPageChange(meta.page - 1)}
        disabled={!meta.hasPrevPage}
      >
        Prev
      </button>

      {pages.map((pageNo) => (
        <button
          key={pageNo}
          type="button"
          className={[
            "h-9 min-w-9 rounded-lg px-2 text-sm font-semibold",
            meta.page === pageNo ? "bg-brand-700 text-white" : "bg-white text-brand-700 border border-brand-200",
          ].join(" ")}
          onClick={() => onPageChange(pageNo)}
        >
          {pageNo}
        </button>
      ))}

      <button
        type="button"
        className="btn-secondary"
        onClick={() => onPageChange(meta.page + 1)}
        disabled={!meta.hasNextPage}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
