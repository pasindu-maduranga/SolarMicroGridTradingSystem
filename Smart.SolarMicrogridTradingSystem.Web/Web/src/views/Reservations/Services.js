import { CommonGet, CommonPost, CommonPut } from '../../helpers/HttpClient';

export default {
  getAllReservations,
  getReservationById,
  getBookableProsumers,
  getActiveNodes,
  createReservation,
  updateReservation,
  cancelReservation
};

async function getAllReservations() {
  const response = await CommonGet('/api/Reservation', null);
  return response.data;
}

async function getReservationById(reservationId) {
  const all = await getAllReservations();
  return (all || []).find((r) => r.reservationId === reservationId) || null;
}

// Only approved + active Prosumers can hold a reservation (the API enforces this too) -
// filtered here so staff can't pick someone who'd just get rejected on submit.
async function getBookableProsumers() {
  const response = await CommonGet('/api/Prosumer', null);
  return (response.data || []).filter((p) => p.isActive && p.approvalStatus === 'Approved');
}

async function getActiveNodes() {
  const response = await CommonGet('/api/Node', null);
  return (response.data || []).filter((n) => n.isActive);
}

async function createReservation(values) {
  const model = {
    nodeId: values.nodeId,
    slotNumber: values.slotNumber,
    prosumerNic: values.prosumerNic,
    scheduledDate: values.scheduledDate
  };
  return await CommonPost('/api/Reservation', null, model);
}

async function updateReservation(reservation, newSlotNumber, newScheduledDate) {
  const model = {
    prosumerNic: reservation.prosumerNic,
    newSlotNumber: newSlotNumber,
    newScheduledDate: newScheduledDate
  };
  return await CommonPut('/api/Reservation/' + reservation.reservationId, null, model);
}

async function cancelReservation(reservation) {
  const model = { prosumerNic: reservation.prosumerNic };
  return await CommonPut('/api/Reservation/' + reservation.reservationId + '/cancel', null, model);
}
