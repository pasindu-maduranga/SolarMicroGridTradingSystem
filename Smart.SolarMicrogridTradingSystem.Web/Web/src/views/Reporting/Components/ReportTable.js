import React, { useMemo, useState } from 'react';
import { formatValue, isNumeric } from '../utils/format';

const PAGE_SIZE = 25;

const STATUS_STYLES = {
  Completed: 'bg-[#E8F0E6] text-[#2F6B45]',
  Approved: 'bg-[#E8F0E6] text-[#2F6B45]',
  Active: 'bg-[#E6F0F7] text-[#2C6E9B]',
  Pending: 'bg-[#FEF3C7] text-[#B7791F]',
  Overdue: 'bg-[#FCE7E7] text-[#C0392B]',
  Rejected: 'bg-[#FCE7E7] text-[#C0392B]',
  Cancelled: 'bg-[#F4F1E8] text-[#726A58]'
};

// Sortable, paged table driven by the same column definitions the exports use.
export default function ReportTable({ section }) {
  const { title, columns, rows, totals } = section;
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    return [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (x === y) return 0;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return (x > y ? 1 : -1) * sort.dir;
    });
  }, [rows, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));
  }

  return (
    <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6DDC4]">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-5 rounded bg-[#F2A93B]" />
          <h2 className="text-[15px] font-bold text-[#22201A] m-0">{title}</h2>
        </div>
        <span className="text-xs font-semibold text-[#726A58] bg-[#F4F1E8] px-2.5 py-1 rounded-full">
          {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAFAF8] border-b border-[#E6DDC4] text-xs font-semibold uppercase tracking-wide text-[#726A58]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={'px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:text-[#2F6B45] ' + (isNumeric(c.type) ? 'text-right' : 'text-left')}
                >
                  {c.label}
                  {sort.key === c.key && <span className="ml-1">{sort.dir === 1 ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-[#A9A290]">No records for the selected filters.</td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={i} className="border-b border-[#F0EDE0] last:border-0 hover:bg-[#FAFAF8]">
                  {columns.map((c) => (
                    <td key={c.key} className={'px-4 py-2.5 whitespace-nowrap ' + (isNumeric(c.type) ? 'text-right tabular-nums text-[#403A2E]' : 'text-[#22201A]')}>
                      {c.type === 'status' ? (
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (STATUS_STYLES[row[c.key]] || STATUS_STYLES.Cancelled)}>
                          {row[c.key]}
                        </span>
                      ) : (
                        formatValue(row[c.key], c.type)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {totals && rows.length > 0 && (
            <tfoot>
              <tr className="bg-[#F5F4EF] border-t-2 border-[#2F6B45] font-bold text-[#1D4A30]">
                {columns.map((c, i) => (
                  <td key={c.key} className={'px-4 py-3 whitespace-nowrap ' + (isNumeric(c.type) ? 'text-right tabular-nums' : '')}>
                    {i === 0 ? 'Total' : totals[c.key] !== undefined ? formatValue(totals[c.key], c.type) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#E6DDC4] text-xs text-[#726A58]">
          <span>
            Showing {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="px-3 py-1.5 rounded-lg border border-[#E6DDC4] font-semibold disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="px-3 py-1.5 rounded-lg border border-[#E6DDC4] font-semibold disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
