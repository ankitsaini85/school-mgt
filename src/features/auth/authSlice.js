import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/client';

const saved = localStorage.getItem('sfms_auth');
const initialAuth = saved ? JSON.parse(saved) : { user: null, token: null };

export const loginThunk = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialAuth.user,
    token: initialAuth.token,
    loading: false,
    error: null,
    themeMode: 'light',
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('sfms_auth');
    },
    toggleTheme(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem(
          'sfms_auth',
          JSON.stringify({ user: action.payload.user, token: action.payload.token })
        );
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, toggleTheme } = authSlice.actions;
export default authSlice.reducer;
