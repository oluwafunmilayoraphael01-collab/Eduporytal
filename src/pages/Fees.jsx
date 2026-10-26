import { CreditCard, Wallet } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/Statcard";
const payments = [
  {
    name: "Daniel Okafor",
    reference: "FEE-001",
    amount: "₦120,000",
    date: "Oct 18, 2026",
    status: "Paid",
  },
  {
    name: "Amara Johnson",
    reference: "FEE-002",
    amount: "₦80,000",
    date: "Oct 17, 2026",
    status: "Part payment",
  },
  {
    name: "Samuel Adeyemi",
    reference: "FEE-003",
    amount: "₦120,000",
    date: "Oct 15, 2026",
    status: "Paid",
  },
];

function Fees() {
  return (
    <div>
      <PageHeader
        title="School fees"
        description="View sample fee records and payment statuses."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Expected fees"
          value="₦12.5M"
          change="Illustrative amount"
          icon={Wallet}
        />
        <StatCard
          title="Recorded payments"
          value="₦8.4M"
          change="Illustrative amount"
          icon={CreditCard}
        />
        <StatCard
          title="Outstanding balance"
          value="₦4.1M"
          change="Illustrative amount"
          icon={Wallet}
        />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-bold text-gray-900">Recent payment records</h2>
          <p className="mt-1 text-sm text-gray-500">
            Example transactions, not real payments
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Reference</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.reference}>
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {payment.name}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {payment.reference}
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {payment.amount}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{payment.date}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        payment.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Fees;