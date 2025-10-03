import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-hot-toast";

const AdminOperatorPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get("/admin/payments/history");
        setPayments(res.data);
      } catch (err) {
        toast.error("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Operator Payment History</h1>
      {loading ? (
        <p>Loading...</p>
      ) : payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Operator</th>
                <th className="p-2 border">Bookings</th>
                <th className="p-2 border">Total Revenue</th>
                <th className="p-2 border">Commission</th>
                <th className="p-2 border">Receivable</th>
                <th className="p-2 border">Paid By</th>
                <th className="p-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay._id} className="border-t">
                  <td className="p-2">{pay.operator?.email}</td>
                  <td className="p-2">{pay.bookings?.length}</td>
                  <td className="p-2">Rs. {pay.totalRevenue}</td>
                  <td className="p-2">Rs. {pay.totalCommission}</td>
                  <td className="p-2">Rs. {pay.operatorReceivable}</td>
                  <td className="p-2">{pay.paidBy?.email}</td>
                  <td className="p-2">
                    {new Date(pay.paymentDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOperatorPayments;
