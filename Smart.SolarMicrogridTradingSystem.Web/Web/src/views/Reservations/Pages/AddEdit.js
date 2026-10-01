import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAlert } from 'react-alert';
import { trackPromise } from 'react-promise-tracker';
import Page from 'src/components/Page';
import services from '../Services';
import permissionService from 'src/utils/permissionAuth';
import { LoadingComponent } from 'src/utils/newLoader';

const screenCode = 'RESERVATIONS';

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in LOCAL time, not the ISO/UTC string
// the API stores - this converts one way, toIsoUtc (below) converts back on submit.
function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoUtc(datetimeLocalValue) {
  return new Date(datetimeLocalValue).toISOString();
}

export default function ReservationAddEdit() {
  const navigate = useNavigate();
  const alert = useAlert();
  const { reservationID } = useParams();
  const isUpdate = reservationID !== 'new';

  const [title, setTitle] = useState(isUpdate ? 'Reschedule Reservation' : 'New Reservation');
  const [loaded, setLoaded] = useState(!isUpdate);
  const [prosumers, setProsumers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [existing, setExisting] = useState(null);
  const [form, setForm] = useState({
    prosumerNic: '',
    nodeId: '',
    slotNumber: '',
    scheduledDate: ''
  });

  useEffect(() => {
    trackPromise(getPermissions());
    trackPromise(loadLookups());
    if (isUpdate) {
      trackPromise(loadExisting());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getPermissions() {
    const permissions = await permissionService.getPermissionsByScreen(screenCode);
    const isAuthorized = permissions.find((p) => p.permissionCode == 'ADDEDIT' + screenCode);
    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  async function loadLookups() {
    const [prosumerList, nodeList] = await Promise.all([services.getBookableProsumers(), services.getActiveNodes()]);
    setProsumers(prosumerList || []);
    setNodes(nodeList || []);
  }

  async function loadExisting() {
    const data = await services.getReservationById(reservationID);
    if (!data) {
      alert.error('Reservation not found.');
      navigate('/app/reservations/listing');
      return;
    }
    setExisting(data);
    setTitle(`Reschedule — ${data.nodeName}, Slot #${data.slotNumber}`);
    setForm({
      prosumerNic: data.prosumerNic,
      nodeId: data.nodeID,
      slotNumber: data.slotNumber,
      scheduledDate: toDatetimeLocalValue(data.scheduledDate)
    });
    setLoaded(true);
  }

  const handleCancel = () => navigate('/app/reservations/listing');

  async function handleSubmit(values, { setSubmitting }) {
    const scheduledDateIso = toIsoUtc(values.scheduledDate);

    const response = isUpdate
      ? await services.updateReservation(existing, Number(values.slotNumber), scheduledDateIso)
      : await services.createReservation({ ...values, scheduledDate: scheduledDateIso });

    setSubmitting(false);
    if (response.statusCode === 'Success') {
      alert.success(response.message);
      navigate('/app/reservations/listing');
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
        initialValues={form}
        enableReinitialize
        validationSchema={Yup.object().shape({
          prosumerNic: Yup.string().required('Select a Prosumer'),
          nodeId: Yup.string().required('Select a node'),
          slotNumber: Yup.string().required('Select a slot'),
          scheduledDate: Yup.string()
            .required('Pick a date and time')
            .test('in-future', 'Must be in the future', (v) => !v || new Date(v).getTime() > Date.now())
            .test('within-7-days', 'Must be within the next 7 days', (v) => !v || new Date(v).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000)
        })}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue }) => {
          const selectedNode = nodes.find((n) => n.nodeID === values.nodeId);
          // Slots a Prosumer could actually pick for this node right now: free ones, plus (in
          // reschedule mode) the slot this reservation already holds - the API itself reports
          // that one as unavailable, since it's reserved by this very reservation.
          const pickableSlots = selectedNode
            ? selectedNode.slots.filter((s) => s.isAvailable || (isUpdate && s.slotNumber === existing?.slotNumber))
            : [];

          return (
          <form onSubmit={formikSubmit}>
            <div className="bg-white border border-[#E6DDC4] rounded-2xl overflow-hidden max-w-3xl mx-auto">
              <div className="px-7 py-5 border-b border-[#E6DDC4]">
                <h1 className="font-sans text-lg font-bold text-[#22201A] m-0">{title}</h1>
                <p className="text-sm text-[#726A58] mt-1">
                  {isUpdate
                    ? 'Change the slot and/or scheduled time - at least 12 hours\' notice is required.'
                    : 'Book a slot on behalf of a Prosumer. Must be scheduled within the next 7 days.'}
                </p>
              </div>

              <div className="flex flex-col gap-5 p-7">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Prosumer *</label>
                  {isUpdate ? (
                    <div className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF8] text-[#403A2E]">
                      {existing?.prosumerName} ({existing?.prosumerNic})
                    </div>
                  ) : (
                    <>
                      <select
                        name="prosumerNic"
                        value={values.prosumerNic}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45] bg-white"
                      >
                        <option value="">Select a Prosumer…</option>
                        {prosumers.map((p) => (
                          <option key={p.nic} value={p.nic}>{p.firstName} {p.lastName} ({p.nic})</option>
                        ))}
                      </select>
                      {touched.prosumerNic && errors.prosumerNic && <div className="text-xs text-[#C0392B] mt-1">{errors.prosumerNic}</div>}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Node *</label>
                  {isUpdate ? (
                    <div className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm bg-[#FAFAF8] text-[#403A2E]">
                      {existing?.nodeName}
                    </div>
                  ) : (
                    <>
                      <select
                        name="nodeId"
                        value={values.nodeId}
                        onChange={(e) => {
                          handleChange(e);
                          setFieldValue('slotNumber', '');
                        }}
                        onBlur={handleBlur}
                        className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45] bg-white"
                      >
                        <option value="">Select a node…</option>
                        {nodes.map((n) => (
                          <option key={n.nodeID} value={n.nodeID}>{n.name} ({n.availableSlotsCount} free slots)</option>
                        ))}
                      </select>
                      {touched.nodeId && errors.nodeId && <div className="text-xs text-[#C0392B] mt-1">{errors.nodeId}</div>}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Slot *</label>
                  <select
                    name="slotNumber"
                    value={values.slotNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!selectedNode}
                    className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45] bg-white disabled:bg-[#FAFAF8]"
                  >
                    <option value="">{selectedNode ? 'Select a slot…' : 'Select a node first'}</option>
                    {pickableSlots.map((s) => (
                      <option key={s.slotNumber} value={s.slotNumber}>
                        Slot #{s.slotNumber} · {s.capacity} kW · Rs. {s.unitPricePerKwh}/kWh
                        {isUpdate && s.slotNumber === existing?.slotNumber ? ' (current)' : ''}
                      </option>
                    ))}
                  </select>
                  {touched.slotNumber && errors.slotNumber && <div className="text-xs text-[#C0392B] mt-1">{errors.slotNumber}</div>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#726A58] mb-1.5">Scheduled Date &amp; Time *</label>
                  <input
                    name="scheduledDate"
                    type="datetime-local"
                    value={values.scheduledDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full border border-[#E6DDC4] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2F6B45]"
                  />
                  {touched.scheduledDate && errors.scheduledDate && <div className="text-xs text-[#C0392B] mt-1">{errors.scheduledDate}</div>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-[#E6DDC4] bg-[#FAFAF8]">
                <button type="button" onClick={handleCancel} className="px-4 py-2.5 rounded-lg border border-[#E6DDC4] text-sm font-semibold text-[#5C3D0E]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-[#2F6B45] text-white text-sm font-semibold disabled:opacity-50">
                  {isUpdate ? 'Save Changes' : 'Reserve Slot'}
                </button>
              </div>
            </div>
          </form>
          );
        }}
      </Formik>
    </Page>
  );
}
