// import { createContext, useContext, useState, useEffect } from 'react';

// const WebSocketContext = createContext();

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// const WS_URL = BACKEND_URL
//   ? BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')
//   : null;


// export const useWebSocket = () => {
//   const context = useContext(WebSocketContext);
//   if (!context) {
//     throw new Error('useWebSocket must be used within WebSocketProvider');
//   }
//   return context;
// };

// export const WebSocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [lastMessage, setLastMessage] = useState(null);
//   const [realtimeUpdates, setRealtimeUpdates] = useState([]);

//   useEffect(() => {
//     connectWebSocket();
//     if (!WS_URL) {
//   console.error("WebSocket URL not defined");
//   return;
// }


//     return () => {
//       if (socket) {
//         socket.close();
//       }
//     };
//   }, []);

//   const connectWebSocket = () => {
//     try {
//       const ws = new WebSocket(`${WS_URL}/ws`);

//       ws.onopen = () => {
//         console.log('WebSocket Connected');
//         setIsConnected(true);
//       };

//       ws.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           console.log('WebSocket message received:', data);
//           setLastMessage(data);

//           // Handle different message types
//           if (data.type === 'performance_update') {
//             setRealtimeUpdates(prev => [data.data, ...prev].slice(0, 10)); // Keep last 10 updates
//           }
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };

//       ws.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         setIsConnected(false);
//       };

//       ws.onclose = () => {
//         console.log('WebSocket Disconnected');
//         setIsConnected(false);
        
//         // Attempt to reconnect after 5 seconds
//         setTimeout(() => {
//           console.log('Attempting to reconnect...');
//           connectWebSocket();
//         }, 5000);
//       };

//       setSocket(ws);
//     } catch (error) {
//       console.error('Failed to connect WebSocket:', error);
//       setIsConnected(false);
//     }
//   };

//   const sendMessage = (message) => {
//     if (socket && socket.readyState === WebSocket.OPEN) {
//       socket.send(JSON.stringify(message));
//     } else {
//       console.error('WebSocket is not connected');
//     }
//   };

//   return (
//     <WebSocketContext.Provider
//       value={{
//         socket,
//         isConnected,
//         lastMessage,
//         realtimeUpdates,
//         sendMessage,
//         reconnect: connectWebSocket
//       }}
//     >
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

import { createContext, useContext, useState, useEffect } from "react";

const WebSocketContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const WS_URL = BACKEND_URL
  ? BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://")
  : null;

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
    // eslint-disable-next-line
  }, []);

  const connectWebSocket = () => {
    if (!WS_URL) {
      console.warn("WebSocket URL not defined — skipping connection");
      return;
    }

    try {
      const ws = new WebSocket(`${WS_URL}/ws`);

      ws.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);

          if (data?.type === "performance_update") {
            setRealtimeUpdates((prev) =>
              [data.data, ...prev].slice(0, 10)
            );
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);

        setTimeout(() => {
          console.log("Reconnecting WebSocket...");
          connectWebSocket();
        }, 5000);
      };

      setSocket(ws);
    } catch (err) {
      console.error("WebSocket failed:", err);
      setIsConnected(false);
    }
  };

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected");
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        lastMessage,
        realtimeUpdates,
        sendMessage,
        reconnect: connectWebSocket,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
