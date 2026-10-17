import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Map, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import nodeService from 'src/views/MicrogridNodeManagement/Services';
import './NodeMap.css';

// Sri Lanka - used when no node has a location yet.
const DEFAULT_CENTER = [7.8731, 80.7718];
const REFRESH_MS = 60 * 1000;
const MAP_HEIGHT = 440;
const CARD_HEIGHT = 270; // approx. height of the hover card
const CARD_WIDTH = 250;

// The map clips anything outside it, so pick the side of the marker the hover card fits on:
// above if there's room, otherwise below, otherwise beside it (Leaflet's left/right "auto").
function placeTooltip(e) {
  const marker = e.target;
  const tooltip = marker.getTooltip();
  const map = marker._map;
  if (!tooltip || !map) return;
  const point = map.latLngToContainerPoint(marker.getLatLng());
  const height = map.getSize().y;
  let direction = 'auto';
  let offset = [0, 0];
  if (point.y > CARD_HEIGHT + 24) {
    direction = 'top';
  } else if (height - point.y > CARD_HEIGHT + 24) {
    direction = 'bottom';
    offset = [0, 34]; // icon anchors the tooltip 16px above centre - push it below the pin
  } else {
    offset = [0, 16]; // centre vertically on the pin
  }
  if (tooltip.options.direction !== direction) {
    tooltip.options.direction = direction;
    tooltip.options.offset = offset;
    tooltip.update();
  }
}
const kwh = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 });

// Colour a node by how much of today's capacity is still free.
function availabilityLevel(node) {
  if (!node.isActive) return { key: 'inactive', color: '#A9A290', soft: '#F4F1E8', label: 'Inactive' };
  const ratio = node.capacity > 0 ? node.availableCapacity / node.capacity : 0;
  if (ratio > 0.5) return { key: 'high', color: '#2F6B45', soft: '#E8F0E6', label: 'Plenty available' };
  if (ratio > 0.2) return { key: 'medium', color: '#E8A53A', soft: '#FEF3C7', label: 'Filling up' };
  return { key: 'low', color: '#C0392B', soft: '#FCE7E7', label: 'Nearly full' };
}

function hasLocation(node) {
  const lat = Number(node.latitude);
  const lng = Number(node.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function markerIcon(level, selected) {
  return L.divIcon({
    className: 'sg-node-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -16],
    html:
      `<div class="sg-node-pin${level.key === 'inactive' ? ' sg-node-pin--inactive' : ''}${selected ? ' sg-node-pin--selected' : ''}">` +
      `<span class="sg-node-pin__ring" style="background:${level.color}"></span>` +
      `<span class="sg-node-pin__dot" style="background:${level.color}">` +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>' +
      '</span></div>'
  });
}

const NodeMapPanel = () => {
  const [nodes, setNodes] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await nodeService.getAllNodes();
        if (!cancelled) setNodes(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setNodes((prev) => prev || []);
      }
    };
    load();
    // Available capacity changes as Grid Operators verify deliveries - keep it current.
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const located = useMemo(() => (nodes || []).filter(hasLocation), [nodes]);
  const unlocated = nodes ? nodes.length - located.length : 0;

  const bounds = useMemo(() => {
    if (located.length < 2) return null;
    return L.latLngBounds(located.map((n) => [Number(n.latitude), Number(n.longitude)]));
  }, [located]);

  const totals = useMemo(() => {
    const active = located.filter((n) => n.isActive);
    return {
      capacity: active.reduce((t, n) => t + (n.capacity || 0), 0),
      available: active.reduce((t, n) => t + (n.availableCapacity || 0), 0)
    };
  }, [located]);

  function focusNode(node) {
    setSelectedId(node.nodeID);
    const map = mapRef.current && mapRef.current.leafletElement;
    if (map) {
      map.flyTo([Number(node.latitude), Number(node.longitude)], Math.max(map.getZoom(), 13), { duration: 0.8 });
    }
    const marker = markerRefs.current[node.nodeID];
    if (marker && marker.leafletElement) {
      setTimeout(() => marker.leafletElement.openTooltip(), 850);
    }
  }

  return (
    <div className="bg-white border border-solid border-[#E6DDC4] rounded-2xl p-[22px] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2F6B45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div>
            <div className="text-[15px] font-bold text-[#22201A]">Microgrid Nodes</div>
            <div className="text-xs text-[#726A58]">Hover a node to see its available and total capacity for today</div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Legend color="#2F6B45" label="> 50% free" />
          <Legend color="#E8A53A" label="20–50% free" />
          <Legend color="#C0392B" label="< 20% free" />
          <Legend color="#A9A290" label="Inactive" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map */}
        <div className="sg-node-map relative flex-[2.2] rounded-xl overflow-hidden border border-solid border-[#E6DDC4] z-0" style={{ height: MAP_HEIGHT }}>
          {nodes === null ? (
            <div className="w-full h-full bg-[#FBFAF6] animate-pulse" />
          ) : (
            <Map
              ref={mapRef}
              center={bounds ? undefined : located.length === 1 ? [Number(located[0].latitude), Number(located[0].longitude)] : DEFAULT_CENTER}
              zoom={bounds ? undefined : located.length === 1 ? 13 : 7}
              bounds={bounds || undefined}
              boundsOptions={{ padding: [CARD_WIDTH / 2 + 16, 60], maxZoom: 13 }}
              zoomControl={false}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
              <ZoomControl position="bottomright" />
              {located.map((node) => {
                const level = availabilityLevel(node);
                return (
                  <Marker
                    key={node.nodeID}
                    ref={(r) => (markerRefs.current[node.nodeID] = r)}
                    position={[Number(node.latitude), Number(node.longitude)]}
                    icon={markerIcon(level, node.nodeID === selectedId)}
                    onClick={() => setSelectedId(node.nodeID)}
                    onTooltipopen={placeTooltip}
                  >
                    <Tooltip direction="top" opacity={1} className="sg-node-tip">
                      <NodeCard node={node} level={level} />
                    </Tooltip>
                  </Marker>
                );
              })}
            </Map>
          )}
          {nodes !== null && located.length === 0 && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 border border-solid border-[#E6DDC4] rounded-xl px-5 py-4 text-center shadow-sm">
                <div className="text-[13.5px] font-semibold text-[#726A58]">No node locations yet</div>
                <div className="text-xs text-[#A9A290] mt-1">Set a location on a Microgrid Node to see it here.</div>
              </div>
            </div>
          )}
        </div>

        {/* Node list */}
        <div className="flex-1 flex flex-col gap-3 min-w-[260px]">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Available today" value={kwh.format(totals.available) + ' kWh'} accent="#2F6B45" />
            <MiniStat label="Total capacity" value={kwh.format(totals.capacity) + ' kWh'} accent="#F2A93B" />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1" style={{ maxHeight: MAP_HEIGHT - 90 }}>
            {(nodes || []).map((node) => {
              const level = availabilityLevel(node);
              const pct = node.capacity > 0 ? Math.round((node.availableCapacity / node.capacity) * 100) : 0;
              const canFocus = hasLocation(node);
              return (
                <button
                  key={node.nodeID}
                  type="button"
                  disabled={!canFocus}
                  onClick={() => focusNode(node)}
                  // Inline border: the app's `.tw-scope button { border: none }` reset would win over a class.
                  style={{ border: '1px solid ' + (selectedId === node.nodeID ? '#2F6B45' : '#E6DDC4') }}
                  className={
                    'text-left rounded-xl px-3.5 py-3 transition-colors disabled:cursor-default ' +
                    (selectedId === node.nodeID ? 'bg-[#F4F8F3]' : 'bg-white hover:bg-[#FBFAF6]')
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} />
                      <span className="text-[13.5px] font-semibold text-[#22201A] truncate">{node.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#726A58] flex-shrink-0">{node.isActive ? pct + '% free' : 'Inactive'}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#F0EDE0] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: (node.isActive ? pct : 0) + '%', backgroundColor: level.color }} />
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-[#726A58]">
                    {kwh.format(node.availableCapacity || 0)} of {kwh.format(node.capacity || 0)} kWh available
                    {!canFocus && <span className="text-[#C0392B]"> · no location set</span>}
                  </div>
                </button>
              );
            })}
            {nodes !== null && nodes.length === 0 && <div className="text-sm text-[#A9A290] text-center py-6">No microgrid nodes yet.</div>}
          </div>
          {unlocated > 0 && (
            <div className="text-[11.5px] text-[#B7791F]">
              {unlocated} node{unlocated === 1 ? '' : 's'} not shown on the map (no location set).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hover card shown over a node on the map.
const NodeCard = ({ node, level }) => {
  const pct = node.capacity > 0 ? Math.round((node.availableCapacity / node.capacity) * 100) : 0;
  const used = Math.max(0, (node.capacity || 0) - (node.availableCapacity || 0));
  return (
    <div style={{ width: CARD_WIDTH }} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-bold leading-tight text-[#22201A]">{node.name}</div>
          {node.address && <div className="text-[11px] text-[#726A58] mt-0.5 leading-snug line-clamp-2">{node.address}</div>}
        </div>
        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: level.soft, color: level.color }}>
          {level.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#F4F8F3] px-2.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#726A58]">Available</div>
          <div className="text-[15px] font-bold text-[#2F6B45]">{kwh.format(node.availableCapacity || 0)} kWh</div>
        </div>
        <div className="rounded-lg bg-[#FBF6EA] px-2.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#726A58]">Total capacity</div>
          <div className="text-[15px] font-bold text-[#22201A]">{kwh.format(node.capacity || 0)} kWh</div>
        </div>
      </div>

      <div className="mt-2.5 h-2 rounded-full bg-[#F0EDE0] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: level.color }} />
      </div>
      <div className="mt-1 flex justify-between text-[10.5px] text-[#726A58]">
        <span>{pct}% free today</span>
        <span>{kwh.format(used)} kWh used</span>
      </div>

      <div className="mt-2.5 pt-2.5 border-0 border-t border-solid border-[#F0EDE0] grid grid-cols-2 gap-y-1 text-[11px]">
        <span className="text-[#726A58]">Slots free</span>
        <span className="text-right font-semibold">{node.availableSlotsCount} / {node.numberOfSlots}</span>
        {(node.openingTime || node.closingTime) && (
          <>
            <span className="text-[#726A58]">Hours</span>
            <span className="text-right font-semibold">{node.openingTime || '—'} – {node.closingTime || '—'}</span>
          </>
        )}
        <span className="text-[#726A58]">Operator</span>
        <span className="text-right font-semibold truncate">{node.assignedGridOperatorName || 'Unassigned'}</span>
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#726A58]">
    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </span>
);

const MiniStat = ({ label, value, accent }) => (
  <div className="relative rounded-xl border border-solid border-[#E6DDC4] px-3.5 py-2.5 overflow-hidden">
    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r" style={{ backgroundColor: accent }} />
    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#726A58]">{label}</div>
    <div className="text-[16px] font-bold text-[#22201A]">{value}</div>
  </div>
);

export default NodeMapPanel;
