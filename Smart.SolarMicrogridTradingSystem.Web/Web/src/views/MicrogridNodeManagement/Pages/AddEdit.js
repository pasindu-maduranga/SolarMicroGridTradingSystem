import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAlert } from 'react-alert';
import { trackPromise } from 'react-promise-tracker';
import { Switch } from '@headlessui/react';
import { Map, TileLayer, Marker } from 'react-leaflet';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';
import MapPickerModal from '../Components/MapPickerModal';
import '../Components/leafletIconFix';

const screenCode = 'NODES';

export default function NodeAddEdit() {
  const navigate = useNavigate();
  const alert = useAlert();
  const { nodeID } = useParams();
  const decrypted = atob(nodeID.toString());
  const isUpdate = decrypted !== '0';

  const [title, setTitle] = useState(isUpdate ? 'Update Node' : 'Add Node');
  const [node, setNode] = useState({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    capacity: '',
    numberOfSlots: '',
    defaultUnitPricePerKwh: '',
    openingTime: '',
    closingTime: '',
    isActive: true
  });
  const [mapOpen, setMapOpen] = useState(false);
  const [loaded, setLoaded] = useState(!isUpdate);

  useEffect(() => {
    trackPromise(getPermissions());
    if (isUpdate) {
      trackPromise(getNodeDetails());
    }
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  async function getNodeDetails() {
    const data = await services.getNodeDetailsByID(decrypted);
    setNode({
      name: data.name,
      address: data.address || '',
      latitude: data.latitude,
      longitude: data.longitude,
      capacity: data.capacity,
      numberOfSlots: data.numberOfSlots || '',
      defaultUnitPricePerKwh: '',
      openingTime: data.openingTime || '',
      closingTime: data.closingTime || '',
      isActive: data.isActive
    });
    setLoaded(true);
  }

  const handleCancel = () => navigate('/app/nodes/listing');

  async function saveNode(values) {
    if (values.latitude == null || values.longitude == null) {
      alert.error('Please pick the node location on the map.');
      return;
    }

    const payload = { ...values, nodeID: decrypted };
    const response = isUpdate ? await services.updateNode(payload) : await services.saveNode(payload);

    if (response.statusCode === 'Success') {
      alert.success(response.message);
      navigate('/app/nodes/listing');
    } else {
      alert.error(response.message);
    }
  }

  if (!loaded) {
    return (
      <Page title={title} className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
        <LoadingComponent />
      </Page>
    );
  }

  return (
    <Page title={title} className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <Formik
        initialValues={node}
        enableReinitialize
        validationSchema={Yup.object().shape({
          name: Yup.string().max(255).required('Node name is required'),
          address: Yup.string().max(500).required('Address is required'),
          capacity: Yup.number().min(0, 'Capacity must be 0 or higher').required('Capacity is required'),
          numberOfSlots: Yup.number().integer('Must be a whole number').min(1, 'Must be at least 1').required('Number of slots is required'),
          defaultUnitPricePerKwh: Yup.number().min(0, 'Price must be 0 or higher').nullable()
        })}
        onSubmit={saveNode}
      >
        {({ errors, touched, values, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden max-w-6xl mx-auto">
              <div className="px-7 py-5 border-b border-[#E6DDC4]">
                <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">{title}</h1>
                <p className="text-sm text-[#726A58] mt-1">Register a physical microgrid node's basic details. Assign a Grid Operator from the Grid Operator Mapping screen.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 p-7">
                {/* LEFT: form fields */}
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Node Name *</label>
                    <input
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      placeholder="e.g. Colombo North Hub"
                    />
                    {touched.name && errors.name && <div className="text-xs text-[#C0392B] mt-1">{errors.name}</div>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Capacity (kW) *</label>
                      <input
                        name="capacity"
                        type="number"
                        value={values.capacity}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                      {touched.capacity && errors.capacity && <div className="text-xs text-[#C0392B] mt-1">{errors.capacity}</div>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Number of Slots *</label>
                      <input
                        name="numberOfSlots"
                        type="number"
                        min="1"
                        step="1"
                        value={values.numberOfSlots}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                        placeholder="e.g. 10"
                      />
                      {touched.numberOfSlots && errors.numberOfSlots
                        ? <div className="text-xs text-[#C0392B] mt-1">{errors.numberOfSlots}</div>
                        : (values.capacity > 0 && values.numberOfSlots > 0) && (
                          <div className="text-xs text-[#726A58] mt-1">
                            {values.numberOfSlots} slots × <strong className="text-[#22201A]">{(values.capacity / values.numberOfSlots).toFixed(1)} kW</strong> each
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">
                        {isUpdate ? 'Price for New Slots (Rs/kWh)' : 'Price per Slot (Rs/kWh) *'}
                      </label>
                      <input
                        name="defaultUnitPricePerKwh"
                        type="number"
                        step="0.01"
                        value={values.defaultUnitPricePerKwh}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                        placeholder="e.g. 45.00"
                      />
                      {touched.defaultUnitPricePerKwh && errors.defaultUnitPricePerKwh && <div className="text-xs text-[#C0392B] mt-1">{errors.defaultUnitPricePerKwh}</div>}
                      {isUpdate && <div className="text-xs text-[#726A58] mt-1">Only applies if capacity/slot count changes. Edit existing slots' prices from the Slots screen.</div>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Opens At</label>
                      <input
                        name="openingTime"
                        type="time"
                        value={values.openingTime}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Closes At</label>
                      <input
                        name="closingTime"
                        type="time"
                        value={values.closingTime}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Address *</label>
                    <input
                      name="address"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      placeholder="Auto-filled from the map, editable"
                    />
                    {touched.address && errors.address && <div className="text-xs text-[#C0392B] mt-1">{errors.address}</div>}
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={values.isActive}
                      onChange={(v) => setFieldValue('isActive', v)}
                      className={`${values.isActive ? 'bg-[#2F6B45]' : 'bg-[#E6DDC4]'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                      <span className={`${values.isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </Switch>
                    <span className="text-sm font-semibold text-[#22201A]">Active</span>
                  </div>
                </div>

                {/* RIGHT: location + map preview */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58]">Location *</label>
                    <button
                      type="button"
                      onClick={() => setMapOpen(true)}
                      className="text-xs font-semibold text-[#2F6B45] hover:underline"
                    >
                      {values.latitude != null ? 'Change location' : 'Pick on map'}
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-[#E6DDC4] h-[240px] lg:h-[320px] relative">
                    {values.latitude != null ? (
                      <Map
                        center={[values.latitude, values.longitude]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        dragging={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        touchZoom={false}
                        zoomControl={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                        <Marker position={[values.latitude, values.longitude]} />
                      </Map>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMapOpen(true)}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#FAFAF8] hover:bg-[#F4F1E8] text-[#A9A290]"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span className="text-sm">Click to pick location on map…</span>
                      </button>
                    )}
                  </div>
                  {values.latitude != null && (
                    <div className="text-xs text-[#726A58]">{values.latitude.toFixed(6)}, {values.longitude.toFixed(6)}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-[#E6DDC4] bg-[#FAFAF8]">
                <button type="button" onClick={handleCancel} className="px-4 py-2.5 rounded-lg border border-[#E6DDC4] text-sm font-semibold text-[#5C3D0E]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold disabled:opacity-50">
                  {isUpdate ? 'Update' : 'Save'}
                </button>
              </div>
            </div>

            <MapPickerModal
              open={mapOpen}
              onClose={() => setMapOpen(false)}
              initialLat={values.latitude}
              initialLng={values.longitude}
              onConfirm={(lat, lng, address) => {
                setFieldValue('latitude', lat);
                setFieldValue('longitude', lng);
                if (address) setFieldValue('address', address);
              }}
            />
          </form>
        )}
      </Formik>
    </Page>
  );
}
