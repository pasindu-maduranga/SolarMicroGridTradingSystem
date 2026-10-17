import React, { useEffect, useState } from 'react';
import reportingService from 'src/views/Reporting/Services';

const LIMIT = 8;
const REFRESH_MS = 60 * 1000;

// Icon + colours per event type returned by /api/Reporting/recent-activity.
const TYPES = {
  booked: { color: '#2C6E9B', bg: '#E6F0F7', icon: <><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></> },
  verified: { color: '#2F6B45', bg: '#E8F0E6', icon: <path d="M13 2 4 14h6l-1 8 9-12h-6z" /> },
  cancelled: { color: '#8A8170', bg: '#F4F1E8', icon: <><circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></> },
  registered: { color: '#B7791F', bg: '#FEF3C7', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></> },
  approved: { color: '#2F6B45', bg: '#E8F0E6', icon: <polyline points="20 6 9 17 4 12" /> },
  rejected: { color: '#C0392B', bg: '#FCE7E7', icon: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> },
  node: { color: '#6D4FC7', bg: '#EDE9FE', icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></> }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' min ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + (hours === 1 ? ' hr ago' : ' hrs ago');
  const days = Math.floor(hours / 24);
  if (days < 7) return days + (days === 1 ? ' day ago' : ' days ago');
  const d = new Date(value);
  return pad(d.getDate()) + ' ' + MONTHS[d.getMonth()];
}

function localDateTime(value) {
  const d = new Date(value);
  return pad(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

const RecentActivityPanel = () => {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const feed = await reportingService.getRecentActivity(LIMIT);
        if (!cancelled) {
          setItems(feed);
          setFailed(false);
        }
      } catch (e) {
        if (!cancelled) setFailed(true);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex-1 h-full bg-white border border-[#E6DDC4] rounded-2xl p-[22px] flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2F6B45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <div className="text-[15px] font-bold text-[#22201A]">Recent Activity</div>
        {items && items.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-[11.5px] font-semibold text-[#2F6B45]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B45] inline-block" /> Live
          </span>
        )}
      </div>

      {items === null && !failed ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[#FBFAF6] animate-pulse" />
          ))}
        </div>
      ) : failed && !items ? (
        <EmptyState message="Activity is unavailable" hint="The activity feed could not be loaded. Check that the API is running." />
      ) : items.length === 0 ? (
        <EmptyState message="Nothing to show yet" hint="Bookings, deliveries, registrations and approvals will appear here as they happen." />
      ) : (
        <ol className="relative flex flex-col m-0 p-0 list-none overflow-y-auto max-h-[300px] pr-1">
          {items.map((item, i) => {
            const type = TYPES[item.type] || TYPES.booked;
            const isLast = i === items.length - 1;
            return (
              <li key={item.type + item.timestamp + i} className="relative flex gap-3 pb-3.5">
                {/* timeline rail */}
                {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[#EFEAD9]" />}
                <span className="relative z-[1] w-[31px] h-[31px] flex-shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: type.bg }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={type.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {type.icon}
                  </svg>
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-semibold text-[#22201A] leading-snug">{item.title}</div>
                    <div className="text-[11px] text-[#A9A290] whitespace-nowrap pt-0.5" title={localDateTime(item.timestamp)}>
                      {timeAgo(item.timestamp)}
                    </div>
                  </div>
                  <div className="text-[11.5px] text-[#726A58] mt-0.5 leading-snug truncate">
                    {item.detail}
                    {item.scheduledDate && ' · scheduled ' + localDateTime(item.scheduledDate)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

const EmptyState = ({ message, hint }) => (
  <div className="flex-1 rounded-xl bg-[#FBFAF6] border border-dashed border-[#E6DDC4] flex flex-col items-center justify-center gap-1.5 text-center p-6 min-h-[180px]">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A9A290" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
    <div className="text-[13.5px] font-semibold text-[#726A58]">{message}</div>
    <div className="text-xs text-[#A9A290] max-w-[320px]">{hint}</div>
  </div>
);

export default RecentActivityPanel;
