// import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();


// // ✅ CRA-compatible env usage
// const API =
//   process.env.REACT_APP_API_URL || "http://localhost:10000/api";


// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// // const API = `${BACKEND_URL}/api`;

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     try {
//       const token = localStorage.getItem('access_token');
//       if (token) {
//         const response = await axios.get(`${API}/auth/me`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setUser(response.data);
//         setIsAuthenticated(true);
//       }
//     } catch (error) {
//       localStorage.removeItem('access_token');
//       setIsAuthenticated(false);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const login = async (email, password) => {
//     try {
//       const response = await axios.post(`${API}/auth/login`, { email, password });
//       const { access_token, user } = response.data;
      
//       localStorage.setItem('access_token', access_token);
//       setUser(user);
//       setIsAuthenticated(true);
//       return { success: true };
//     } catch (error) {
//       return { 
//         success: false, 
//         error: error.response?.data?.detail || 'Login failed'
//       };
//     }
//   };

//   const register = async (email, password, full_name) => {
//     try {
//       const response = await axios.post(`${API}/auth/register`, { 
//         email, 
//         password, 
//         full_name 
//       });
//       const { access_token, user } = response.data;
      
//       localStorage.setItem('access_token', access_token);
//       setUser(user);
//       setIsAuthenticated(true);
//       return { success: true };
//     } catch (error) {
//       return { 
//         success: false, 
//         error: error.response?.data?.detail || 'Registration failed'
//       };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('access_token');
//     setUser(null);
//     setIsAuthenticated(false);
//   };

//   return (
//     <AuthContext.Provider value={{ 
//       user, 
//       isAuthenticated, 
//       isLoading, 
//       login, 
//       register, 
//       logout 
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API =
  process.env.REACT_APP_API_URL || "http://localhost:10000/api";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('access_token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      const { access_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      setUser(user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const register = async (email, password, full_name) => {
    try {
      const response = await axios.post(`${API}/auth/register`, {
        email,
        password,
        full_name,
      });

      const { access_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      setUser(user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
