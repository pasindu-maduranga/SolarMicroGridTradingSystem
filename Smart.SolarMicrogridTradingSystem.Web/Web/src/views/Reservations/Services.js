import { CommonGet } from '../../helpers/HttpClient';

export default {
  getAllReservations
};

async function getAllReservations() {
  const response = await CommonGet('/api/Reservation', null);
  return response.data;
}
