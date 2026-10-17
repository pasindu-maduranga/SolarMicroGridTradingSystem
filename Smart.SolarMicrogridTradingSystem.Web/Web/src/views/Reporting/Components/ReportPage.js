import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import { useAlert } from 'react-alert';
import Page from 'src/components/Page';
import { LoadingComponent } from 'src/utils/newLoader';
import permissionService from 'src/utils/permissionAuth';
import tokenService from 'src/utils/tokenDecoder';
import services from '../Services';
import { exportReportPdf } from '../utils/exportPdf';
import { exportReportExcel } from '../utils/exportExcel';
import { describeRange, toInputDate } from '../utils/format';
import KpiGrid from './KpiGrid';
import ReportTable from './ReportTable';

const PRESETS = [
  { key: '7', label: '7 days', days: 7 },
  { key: '30', label: '30 days', days: 30 },
  { key: '90', label: '90 days', days: 90 },
  { key: '365', label: '12 months', days: 365 }
];

function presetRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toInputDate(from), to: toInputDate(to) };
}

const inputClass =
  'h-10 px-3 rounded-lg border border-[#E6DDC4] bg-white text-sm text-[#22201A] focus:outline-none focus:ring-2 focus:ring-[#2F6B45]/30 focus:border-[#2F6B45]';

/**
 * Shared shell for every screen in the Reports module: permission check, filter bar,
 * PDF / Excel export, KPI cards, optional charts and the data tables.
 *
 * Props:
 *  - screenCode, title, description
 *  - load(filters) => Promise<data>
 *  - build(data, filters) => { kpis, sections, charts? }   (charts: React node)
 *  - showNodeFilter, statusOptions, extraFilters(filters, setFilter) => React node
 *  - extraMeta(filters) => [{ label, value }]
 */
export default function ReportPage({
  screenCode,
  title,
  description,
  load,
  build,
  showNodeFilter = true,
  statusOptions,
  extraFilters,
  extraMeta,
  defaultDays = 30
}) {
  const navigate = useNavigate();
  const alert = useAlert();
  const [authorized, setAuthorized] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [filters, setFilters] = useState({ ...presetRange(defaultDays), preset: String(defaultDays), nodeId: '', status: '' });
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState('');

  const setFilter = useCallback((key, value) => setFilters((f) => ({ ...f, [key]: value })), []);

  useEffect(() => {
    trackPromise(checkPermission());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authorized) {
      trackPromise(fetchReport());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, filters.from, filters.to, filters.nodeId, filters.status, filters.prosumerNic]);

  async function checkPermission() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    if (!permissions || !permissions.find((p) => p.permissionCode === 'VIEW' + screenCode)) {
      navigate('/unauthorized');
      return;
    }
    setAuthorized(true);
    if (showNodeFilter) {
      try {
        const list = await services.getNodes();
        setNodes([...list].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) {
        setNodes([]); // filter falls back to "All nodes"; the report still loads
      }
    }
  }

  async function fetchReport() {
    try {
      setData(await load(filters));
    } catch (e) {
      alert.error(e.message || 'Failed to load the report.');
      setData(null);
    }
  }

  const view = data ? build(data, filters) : null;

  function reportMeta() {
    const meta = [{ label: 'Period', value: describeRange(filters.from, filters.to) }];
    if (showNodeFilter) {
      const node = nodes.find((n) => n.nodeID === filters.nodeId);
      meta.push({ label: 'Node', value: node ? node.name : 'All nodes' });
    }
    if (statusOptions) {
      meta.push({ label: 'Status', value: filters.status || 'All' });
    }
    if (extraMeta) {
      meta.push(...extraMeta(filters));
    }
    let user = '';
    try {
      user = tokenService.getUserNameFromToken();
    } catch (e) {
      user = '';
    }
    if (user) meta.push({ label: 'Prepared by', value: user });
    return meta;
  }

  async function handleExport(kind) {
    if (!view) return;
    const report = { title, subtitle: description, meta: reportMeta(), kpis: view.kpis, sections: view.sections };
    setExporting(kind);
    try {
      if (kind === 'pdf') {
        await exportReportPdf(report);
      } else {
        await exportReportExcel(report);
      }
    } catch (e) {
      alert.error('Export failed: ' + (e.message || e));
    } finally {
      setExporting('');
    }
  }

  function applyPreset(preset) {
    setFilters((f) => ({ ...f, ...presetRange(preset.days), preset: preset.key }));
  }

  return (
    <Page title={title} className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B7791F]">Reports</div>
          <h1 className="font-sans text-[22px] font-bold text-[#22201A] m-0 mt-1">{title}</h1>
          <p className="text-sm text-[#726A58] mt-1 max-w-[640px]">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton kind="pdf" busy={exporting === 'pdf'} disabled={!view || !!exporting} onClick={() => handleExport('pdf')} />
          <ExportButton kind="excel" busy={exporting === 'excel'} disabled={!view || !!exporting} onClick={() => handleExport('excel')} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E6DDC4] rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">Quick range</span>
          <div className="flex rounded-lg border border-[#E6DDC4] overflow-hidden">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className={
                  'h-10 px-3 text-xs font-semibold transition-colors border-r border-[#E6DDC4] last:border-r-0 ' +
                  (filters.preset === p.key ? 'bg-[#2F6B45] text-white' : 'bg-white text-[#403A2E] hover:bg-[#F4F1E8]')
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">From</span>
          <input
            type="date"
            className={inputClass}
            value={filters.from}
            max={filters.to}
            onChange={(e) => e.target.value && setFilters((f) => ({ ...f, from: e.target.value, preset: '' }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">To</span>
          <input
            type="date"
            className={inputClass}
            value={filters.to}
            min={filters.from}
            onChange={(e) => e.target.value && setFilters((f) => ({ ...f, to: e.target.value, preset: '' }))}
          />
        </label>
        {showNodeFilter && (
          <label className="flex flex-col gap-1.5 min-w-[190px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">Node</span>
            <select className={inputClass} value={filters.nodeId} onChange={(e) => setFilter('nodeId', e.target.value)}>
              <option value="">All nodes</option>
              {nodes.map((n) => (
                <option key={n.nodeID} value={n.nodeID}>{n.name}</option>
              ))}
            </select>
          </label>
        )}
        {statusOptions && (
          <label className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">Status</span>
            <select className={inputClass} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">All</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {extraFilters && extraFilters(filters, setFilter, inputClass)}
      </div>

      {view && (
        <>
          <KpiGrid kpis={view.kpis} />
          {view.charts && <div className="mt-5">{view.charts}</div>}
          {view.sections.map((section) => (
            <div key={section.title} className="mt-5">
              <ReportTable section={section} />
            </div>
          ))}
        </>
      )}
    </Page>
  );
}

function ExportButton({ kind, busy, disabled, onClick }) {
  const isPdf = kind === 'pdf';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
        (isPdf ? 'bg-[#2F6B45] text-white hover:bg-[#265939]' : 'bg-white border border-[#E6DDC4] text-[#2F6B45] hover:bg-[#EAF3EC]')
      }
    >
      <span className="material-icons" style={{ fontSize: 18 }}>{isPdf ? 'picture_as_pdf' : 'grid_on'}</span>
      {busy ? 'Preparing…' : isPdf ? 'Export PDF' : 'Export Excel'}
    </button>
  );
}
