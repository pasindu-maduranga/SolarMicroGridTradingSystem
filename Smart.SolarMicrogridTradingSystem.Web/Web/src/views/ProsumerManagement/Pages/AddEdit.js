import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAlert } from 'react-alert';
import { trackPromise } from 'react-promise-tracker';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';
import MapPickerModal from '../../MicrogridNodeManagement/Components/MapPickerModal';
import '../../MicrogridNodeManagement/Components/leafletIconFix';

const screenCode = 'PROSUMERPROFILE';

const NIC_REGEX = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

export default function ProsumerAddEdit() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    trackPromise(getPermissions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  const handleCancel = () => navigate('/app/prosumers/profiles');

  async function saveProsumer(values) {
    if (values.latitude == null || values.longitude == null) {
      alert.error('Please pick the prosumer\'s location on the map.');
      return;
    }

    const response = await services.createProsumer(values);
    if (response.statusCode === 'Success') {
      alert.success('Prosumer account created and approved.');
      navigate('/app/prosumers/profiles');
    } else {
      alert.error(response.message);
    }
  }

  return (
    <Page title="Add Prosumer" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <LoadingComponent />

      <Formik
        initialValues={{
          nic: '',
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phoneNumber: '',
          address: '',
          latitude: null,
          longitude: null
        }}
        validationSchema={Yup.object().shape({
          nic: Yup.string().matches(NIC_REGEX, 'Enter a valid Sri Lankan NIC').required('NIC is required'),
          firstName: Yup.string().max(255).required('First name is required'),
          lastName: Yup.string().max(255).required('Last name is required'),
          email: Yup.string().email('Enter a valid email').required('Email is required'),
          password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
          phoneNumber: Yup.string().max(20).required('Phone number is required'),
          address: Yup.string().max(500).required('Address is required')
        })}
        onSubmit={saveProsumer}
      >
        {({ errors, touched, values, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden max-w-6xl mx-auto">
              <div className="px-7 py-5 border-b border-[#E6DDC4]">
                <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">Add Prosumer</h1>
                <p className="text-sm text-[#726A58] mt-1">
                  Create a Prosumer account on their behalf (NIC as primary key). The account is active and approved
                  immediately - the Prosumer can then sign in and manage their own profile from the mobile app.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 p-7">
                {/* LEFT: form fields */}
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">NIC *</label>
                    <input
                      name="nic"
                      value={values.nic}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      placeholder="e.g. 200201001234 or 903456789V"
                    />
                    {touched.nic && errors.nic && <div className="text-xs text-[#C0392B] mt-1">{errors.nic}</div>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">First Name *</label>
                      <input
                        name="firstName"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                      {touched.firstName && errors.firstName && <div className="text-xs text-[#C0392B] mt-1">{errors.firstName}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Last Name *</label>
                      <input
                        name="lastName"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                      {touched.lastName && errors.lastName && <div className="text-xs text-[#C0392B] mt-1">{errors.lastName}</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Email *</label>
                      <input
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                      {touched.email && errors.email && <div className="text-xs text-[#C0392B] mt-1">{errors.email}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Phone Number *</label>
                      <input
                        name="phoneNumber"
                        value={values.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      />
                      {touched.phoneNumber && errors.phoneNumber && <div className="text-xs text-[#C0392B] mt-1">{errors.phoneNumber}</div>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Initial Password *</label>
                    <input
                      name="password"
                      type="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                      placeholder="The Prosumer signs in with this until they change it"
                    />
                    {touched.password && errors.password && <div className="text-xs text-[#C0392B] mt-1">{errors.password}</div>}
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
                </div>

                {/* RIGHT: location + map preview */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58]">Location *</label>
                    <button type="button" onClick={() => setMapOpen(true)} className="text-xs font-semibold text-[#2F6B45] hover:underline">
                      {values.latitude != null ? 'Change location' : 'Pick on map'}
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-[#E6DDC4] h-[240px] lg:h-[320px] relative">
                    {values.latitude == null && (
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
                  Create Prosumer
                </button>
              </div>
            </div>

            <MapPickerModal
              open={mapOpen}
              onClose={() => setMapOpen(false)}
              initialLat={values.latitude}
              initialLng={values.longitude}
              title="Pick prosumer's location"
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
