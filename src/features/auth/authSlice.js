
import { createSlice } from '@reduxjs/toolkit';


const savedUser = JSON.parse(localStorage.getItem('user'));
const savedToken = localStorage.getItem('userToken');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser || null,
    token: savedToken || null,
    isAuthenticated: !!savedToken, 
  },
  reducers: {
    login: (state, action) => {
    
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

     
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('userToken', action.payload.token);
    },
    logout: (state) => {
    
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

     
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      
     
      localStorage.removeItem('token'); 
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;