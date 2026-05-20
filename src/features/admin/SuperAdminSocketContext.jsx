/**
 * SuperAdminSocketContext
 * 
 * Manages a SINGLE socket connection for the entire Super Admin panel.
 * All admin pages consume this context to listen for real-time events
 * instead of each page creating its own socket (which caused reconnects,
 * multiple connections, and fetchData reference loops).
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../api/axiosInstance';
import { useSelector } from 'react-redux';

const SuperAdminSocketContext = createContext(null);

export const SuperAdminSocketProvider = ({ children }) => {
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect if user is a superadmin
        if (!token || user?.systemRole !== 'superadmin') return;

        const socketBaseUrl = API_BASE_URL.replace('/api', '');

        // Create a single socket connection
        const socket = io(socketBaseUrl, {
            auth: { token },
            transports: ['polling', 'websocket'], // Allow WebSocket upgrade
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[SuperAdmin Socket] Connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('[SuperAdmin Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.warn('[SuperAdmin Socket] Connection error:', err.message);
        });

        return () => {
            console.log('[SuperAdmin Socket] Cleaning up...');
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [token, user?.systemRole]);

    return (
        <SuperAdminSocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
            {children}
        </SuperAdminSocketContext.Provider>
    );
};

/**
 * Hook to listen for specific socket events in admin pages.
 * Uses a ref for the callback to avoid re-subscribing on every render.
 * 
 * @param {string[]} events - Array of socket event names to listen for
 * @param {Function} callback - Callback to invoke when any event fires
 */
export const useAdminSocket = (events, callback) => {
    const context = useContext(SuperAdminSocketContext);
    const callbackRef = useRef(callback);

    // Always keep callbackRef in sync with the latest callback
    // without needing it as a dep in the effect below
    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        const socket = context?.socket;
        if (!socket || !events?.length) return;

        const handler = (...args) => callbackRef.current(...args);

        events.forEach(event => socket.on(event, handler));

        return () => {
            events.forEach(event => socket.off(event, handler));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context?.socket, events?.join(',')]);
};

export default SuperAdminSocketContext;
