import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../api/axiosInstance';

/**
 * Custom hook to manage Socket.io connection for real-time task updates.
 * Handles project join/leave, presence tracking, and event listeners.
 */
const useTaskSocket = ({
  token,
  selectedProjectId,
  fetchTasks,
  fetchProjects,
  fetchNotifications,
  fetchPhase4Data,
  setOnlineCount,
  fetchPerms
}) => {
  const socketRef = useRef(null);
  const activeProjectRef = useRef(null);

  // Connect socket & register event listeners
  useEffect(() => {
    if (!token) return undefined;
    const socketBaseUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['polling']
    });
    socketRef.current = socket;

    socket.on('task:changed', ({ projectId }) => {
      if (projectId && projectId === activeProjectRef.current) {
        fetchTasks();
        fetchPhase4Data();
        window.dispatchEvent(new CustomEvent('tm-socket-task-changed', { detail: { projectId } }));
      }
    });
    socket.on('presence:update', ({ projectId, onlineCount: nextOnlineCount }) => {
      if (projectId && projectId === activeProjectRef.current) {
        setOnlineCount(nextOnlineCount || 0);
      }
    });
    socket.on('notification:new', () => {
      fetchNotifications();
    });
    socket.on('project:updated', ({ projectId }) => {
      fetchProjects(); // Always update the projects list for sidebar/navbar dropdowns
      if (projectId && projectId === activeProjectRef.current) {
        fetchPhase4Data();
        window.dispatchEvent(new CustomEvent('tm-socket-project-updated', { detail: { projectId } }));
      }
    });

    socket.on('permissions:updated', () => {
      if (fetchPerms) fetchPerms();
    });

    return () => {
      if (activeProjectRef.current) {
        socket.emit('project:leave', { projectId: activeProjectRef.current });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchTasks, fetchPerms]);

  // Handle project room switching
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedProjectId) return;
    if (activeProjectRef.current && activeProjectRef.current !== selectedProjectId) {
      socket.emit('project:leave', { projectId: activeProjectRef.current });
    }
    socket.emit('project:join', { projectId: selectedProjectId });
    activeProjectRef.current = selectedProjectId;
    setOnlineCount(0);
  }, [selectedProjectId]);

  return socketRef;
};

export default useTaskSocket;
