import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Axios 기본 설정
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  // Axios interceptor 설정
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          originalRequest.url?.includes('/api/auth/login') ||
          originalRequest.url?.includes('/api/auth/refresh')
        ) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });

            const { accessToken: newAccessToken } = response.data;
            if (!newAccessToken) throw new Error('No access token returned');

            setAccessToken(newAccessToken);
            localStorage.setItem('accessToken', newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            setAccessToken(null);
            setUser(null);
            localStorage.removeItem('accessToken');
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  useEffect(() => {
    setLoading(false); // 초기화 완료
  }, []);

  /**
   * 로그인 함수 수정
   * admin 로그인 실패 시 자동 생성
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password }, {
        withCredentials: true
      });

      const { accessToken: newAccessToken, user: userData } = response.data;
      setAccessToken(newAccessToken);
      setUser(userData);
      localStorage.setItem('accessToken', newAccessToken);

      return { success: true };
    } catch (error) {

      // ⭐ Admin 계정 최초 입력 시 자동 생성 처리 ⭐
      if (email === 'admin@school.edu') {
        try {
          await axios.post('/api/admin/bootstrap', {
            email: 'admin@school.edu',
            name: 'System Admin',
            password: password ?? 'admin1234'
          });

          // 재로그인 시도
          const retry = await axios.post('/api/auth/login', { email, password });

          const { accessToken: newAccessToken, user: retryUser } = retry.data;
          setAccessToken(newAccessToken);
          setUser(retryUser);
          localStorage.setItem('accessToken', newAccessToken);

          return { success: true };
        } catch (e) {
          return { success: false, error: "Admin initialization failed" };
        }
      }

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  };

  const value = {
    user,
    setUser,
    accessToken,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
