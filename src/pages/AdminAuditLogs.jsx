import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    email: "",
    action: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/audit-logs",
        {
          params: { ...filters, page, limit: 10 },
          withCredentials: true,
        }
      );
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [page]);

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(
      logs.map((log) => ({
        User: log.user?.email || "N/A",
        Action: log.action.toUpperCase(),
        Details: JSON.stringify(log.details),
        Date: new Date(log.createdAt).toLocaleString(),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditLogs");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "audit_logs.xlsx"
    );
  };

  const columns = [
    {
      name: "User",
      selector: (row) => row.user?.email || "N/A",
      sortable: true,
    },
    {
      name: "Action",
      selector: (row) => row.action.toUpperCase(),
      sortable: true,
    },
    {
      name: "Details",
      cell: (row) => (
        <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded-md max-w-xs overflow-x-auto">
          {JSON.stringify(row.details, null, 2)}
        </pre>
      ),
    },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toLocaleString(),
      sortable: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">
        🧾 Audit Log Viewer
      </h2>

      <div className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by email"
          value={filters.email}
          onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          className="border px-3 py-2 rounded w-full sm:w-48"
        />
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border px-3 py-2 rounded w-full sm:w-40"
        >
          <option value="">All Actions</option>
          <option value="login">LOGIN</option>
          <option value="book">BOOK</option>
          <option value="cancel">CANCEL</option>
          <option value="profile_update">PROFILE_UPDATE</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="border px-3 py-2 rounded"
        />
        <button
          onClick={() => {
            setPage(1);
            fetchLogs();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Apply Filters
        </button>
        <button
          onClick={handleExportXLSX}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export XLSX
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Print
        </button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        progressPending={loading}
        pagination
        paginationServer
        paginationTotalRows={totalPages * 10}
        paginationPerPage={10}
        onChangePage={(page) => setPage(page)}
        highlightOnHover
        striped
        responsive
        persistTableHead
      />
    </div>
  );
};

export default AdminAuditLogs;
