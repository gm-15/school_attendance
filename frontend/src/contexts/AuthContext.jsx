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

  // Axios 인터셉터 설정
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // 로그인/refresh 엔드포인트는 interceptor에서 제외
        if (originalRequest.url?.includes('/api/auth/login') || 
            originalRequest.url?.includes('/api/auth/refresh')) {
          return Promise.reject(error);
        }

        // 401 에러이고 아직 재시도하지 않은 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh Token으로 새 Access Token 받기
            const response = await axios.post('/api/auth/refresh', {}, {
              withCredentials: true
            });

            const { accessToken: newAccessToken } = response.data;
            setAccessToken(newAccessToken);
            localStorage.setItem('accessToken', newAccessToken);

            // 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh 실패 시 로그아웃 (무한 루프 방지)
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

  // 초기 로드 시 사용자 정보 확인
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password }, {
        withCredentials: true
      });

      const { accessToken: newAccessToken, user: userData } = response.data;
      
      if (!newAccessToken) {
        return {
          success: false,
          error: 'No access token received'
        };
      }

      setAccessToken(newAccessToken);
      setUser(userData);
      localStorage.setItem('accessToken', newAccessToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await axios.post('/api/auth/logout', {}, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
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

