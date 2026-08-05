import StatusBadge from "@/components/StatusBadge";

export default function CompanyLeaveCalendar({ entries }) {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">No upcoming or recent leave planned across the company.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
            <th className="px-5 py-2 font-medium">Employee</th>
            <th className="px-5 py-2 font-medium">Department</th>
            <th className="px-5 py-2 font-medium">Type</th>
            <th className="px-5 py-2 font-medium">Departs</th>
            <th className="px-5 py-2 font-medium">Returns</th>
            <th className="px-5 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-slate-50 last:border-0">
              <td className="px-5 py-2.5 font-medium text-slate-800">{e.userName}</td>
              <td className="px-5 py-2.5 text-slate-600">{e.department || "—"}</td>
              <td className="px-5 py-2.5 text-slate-600 capitalize">{e.type}</td>
              <td className="px-5 py-2.5 text-slate-600">{e.startDate}</td>
              <td className="px-5 py-2.5 text-slate-600">{e.endDate}</td>
              <td className="px-5 py-2.5"><StatusBadge status={e.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
