// utils/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://192.168.0.106:5000";   // or http://10.0.2.2:5000 for emulator

export const apiFetch = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('userToken');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
};