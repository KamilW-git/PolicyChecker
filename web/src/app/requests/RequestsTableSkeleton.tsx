import { Card } from '@/components/ui/Card'

export default function RequestsTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse mx-auto"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="h-5 bg-slate-200 rounded w-48 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-32 animate-pulse"></div>
                </td>
                <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-24 animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-20 animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-24 animate-pulse"></div></td>
                <td className="px-6 py-4 flex justify-center"><div className="h-6 bg-slate-200 rounded-full w-24 animate-pulse mt-2"></div></td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded w-16 animate-pulse"></div>
                </td>
                <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-20 animate-pulse"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-16 animate-pulse"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
