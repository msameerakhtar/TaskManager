import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { 
    items: [], 
    loading: false 
  },
  reducers: {
    setTasks: (state, action) => {
      state.items = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setTasks, setLoading } = tasksSlice.actions;
export default tasksSlice.reducer;