import React, { useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import './leafletIconFix';

const MapViewModal = ({ open, onClose, lat, lng, name, address }) => {
  const mapRef = useRef(null);

  const fixMapSize = () => {
    if (mapRef.current && mapRef.current.leafletElement) {
      mapRef.current.leafletElement.invalidateSize();
    }
  };

  const handleAfterEnter = () => {
    fixMapSize();
    setTimeout(fixMapSize, 150);
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
                <Dialog.Title className="text-base font-bold text-[#22201A] flex-1">{name}</Dialog.Title>
                <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F4F1E8]" aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22201A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="flex-1 relative min-h-0">
                {lat != null && lng != null ? (
                  <Map ref={mapRef} center={[lat, lng]} zoom={16} style={{ height: '100%', width: '100%' }} whenReady={fixMapSize}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[lat, lng]}>
                      <Popup>
                        <strong>{name}</strong>{address ? <div>{address}</div> : null}
                      </Popup>
                    </Marker>
                  </Map>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#726A58] text-sm">
                    This node doesn't have a location set yet.
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MapViewModal;
