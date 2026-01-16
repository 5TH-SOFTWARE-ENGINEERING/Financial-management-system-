import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const BASE_URL = Platform.select({
    android: 'http://192.168.137.238:8000/api/v1',
    ios: 'http://192.168.137.238:8000/api/v1',
    default: 'http://192.168.137.238:8000/api/v1',
});

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
client.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error reading token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 (Unauthorized) - could trigger logout here
        if (error.response?.status === 401) {
            // We might want to clear token or notify store, 
            // but circular dependency with store is tricky.
            // For now, just reject.
        }
        return Promise.reject(error);
    }
);

export default client;
