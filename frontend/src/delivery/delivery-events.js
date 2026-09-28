// frontend/src/delivery/delivery-events.js
// Socket.io subscription manager for delivery events
import { store } from '../data/store.js';

let socket = null;
const listeners = new Map();

export function initDeliverySocket() {
  if (socket) return; // Already initialized

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocal ? `http://${window.location.hostname}:4000` : 'https://farmchain-ai-1oge.onrender.com';

    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl, { transports: ['websocket', 'polling'] });

      socket.on('delivery:created', (delivery) => {
        const deliveries = store.get('deliveries') || [];
        if (!deliveries.find(d => d.deliveryId === delivery.deliveryId)) {
          store.set('deliveries', [...deliveries, delivery]);
        }
        notifyListeners('delivery:created', delivery);
      });

      socket.on('delivery:updated', (delivery) => {
        store.updateItem('deliveries', d => d.deliveryId === delivery.deliveryId, delivery);
        notifyListeners('delivery:updated', delivery);
      });

      socket.on('delivery:location', (data) => {
        store.updateItem('deliveries',
          d => d.deliveryId === data.deliveryId,
          { currentLocation: data.location }
        );
        notifyListeners('delivery:location', data);
      });

      socket.on('delivery:delivered', (delivery) => {
        store.updateItem('deliveries', d => d.deliveryId === delivery.deliveryId, delivery);
        notifyListeners('delivery:delivered', delivery);
      });

      socket.on('invoice:created', (invoice) => {
        const invoices = store.get('invoices') || [];
        if (!invoices.find(inv => inv.invoiceId === invoice.invoiceId)) {
          store.set('invoices', [...invoices, invoice]);
        }
        notifyListeners('invoice:created', invoice);
      });

      console.log('[Delivery] Socket connected');
    }).catch(() => {
      console.warn('Socket.io client not available for delivery events');
    });
  } catch (err) {
    console.warn('Delivery socket init failed:', err.message);
  }
}

export function onDeliveryEvent(event, callback) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(callback);

  // Return unsubscribe
  return () => {
    const cbs = listeners.get(event) || [];
    listeners.set(event, cbs.filter(cb => cb !== callback));
  };
}

function notifyListeners(event, data) {
  const cbs = listeners.get(event) || [];
  cbs.forEach(cb => { try { cb(data); } catch (e) { console.error('Delivery event listener error:', e); } });
}

export function destroyDeliverySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  listeners.clear();
}
