import React, { useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import './leafletIconFix';

const searchProvider = new OpenStreetMapProvider();

const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo, Sri Lanka

const MapPickerModal = ({ open, onClose, initialLat, initialLng, onConfirm, title = 'Pick node location' }) => {
  const hasInitial = initialLat != null && initialLng != null;
  const [position, setPosition] = useState(hasInitial ? [initialLat, initialLng] : null);
  const [mapCenter, setMapCenter] = useState(hasInitial ? [initialLat, initialLng] : DEFAULT_CENTER);
  const [address, setAddress] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const mapRef = useRef(null);
  const locatedRef = useRef(false);

  const fixMapSize = () => {
    if (mapRef.current && mapRef.current.leafletElement) {
      mapRef.current.leafletElement.invalidateSize();
    }
  };

  const handleAfterEnter = () => {
    fixMapSize();
    // Leaflet sometimes measures a stale size right as the fade/scale transition
    // finishes; a second check shortly after guarantees the real viewport size.
    setTimeout(fixMapSize, 150);

    if (!hasInitial && !locatedRef.current && navigator.geolocation) {
      locatedRef.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
          setPosition(coords);
          reverseGeocode(coords[0], coords[1]);
        },
        () => {
          // Location denied/unavailable: keep the default center, no error needed.
        },
        { timeout: 8000 }
      );
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setAddress(data?.display_name || '');
    } catch {
      setAddress('');
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setBusy(true);
    try {
      const results = await searchProvider.search({ query: searchText });
      setSearchResults(results.slice(0, 5));
    } finally {
      setBusy(false);
    }
  };

  const pickResult = (result) => {
    const coords = [result.y, result.x];
    setPosition(coords);
    setMapCenter(coords);
    setAddress(result.label);
    setSearchResults([]);
    setSearchText(result.label);
  };

  const handleConfirm = () => {
    if (!position) return;
    onConfirm(position[0], position[1], address);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment} afterEnter={handleAfterEnter}>
      <Dialog onClose={onClose} className="tw-scope relative z-50">
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center gap-3 p-4 border-b border-[#E6DDC4] flex-shrink-0">
                <Dialog.Title className="text-base font-bold text-[#22201A] flex-shrink-0">{title}</Dialog.Title>
                <form onSubmit={handleSearch} className="flex-1 flex gap-2 relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search a location…"
                    className="flex-1 border border-[#E6DDC4] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F6B45]"
                  />
                  <button type="submit" disabled={busy} className="px-4 py-2 bg-[#2F6B45] text-white rounded-lg text-sm font-semibold flex-shrink-0">
                    {busy ? 'Searching…' : 'Search'}
                  </button>
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-16 mt-1 bg-white border border-[#E6DDC4] rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
                      {searchResults.map((r, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => pickResult(r)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#F4F1E8] border-b border-[#F0EDE0] last:border-b-0"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
                <button type="button" onClick={onClose} className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F4F1E8]" aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22201A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <div className="flex-1 relative min-h-0">
                <Map
                  ref={mapRef}
                  center={mapCenter}
                  zoom={position ? 15 : 8}
                  style={{ height: '100%', width: '100%' }}
                  onClick={handleMapClick}
                  whenReady={fixMapSize}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {position && <Marker position={position} />}
                </Map>
              </div>

              <div className="flex items-center gap-4 p-4 border-t border-[#E6DDC4] flex-shrink-0">
                <div className="flex-1 text-sm text-[#726A58]">
                  {position
                    ? <span><strong className="text-[#22201A]">{position[0].toFixed(6)}, {position[1].toFixed(6)}</strong>{address ? ` — ${address}` : ''}</span>
                    : 'Click on the map, or search above, to set the node location.'}
                </div>
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E6DDC4] text-sm font-semibold text-[#5C3D0E]">Cancel</button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!position}
                  className="px-5 py-2 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold disabled:opacity-50"
                >
                  Confirm location
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MapPickerModal;
