import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function planTrip(data) {
  const response = await api.post('/api/trip/plan/', {
    current_location: data.currentLocation,
    pickup_location: data.pickupLocation,
    dropoff_location: data.dropoffLocation,
    current_cycle_used: parseFloat(data.currentCycleUsed) || 0,
  });
  return response.data;
}

export async function healthCheck() {
  const response = await api.get('/api/trip/health/');
  return response.data;
}

export default api;
