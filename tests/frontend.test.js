// Frontend tests - Node environment

// Mock window and localStorage
global.window = {};
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Load core modules
require('../js/core.js');

describe('Frontend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('StorageManager', () => {
    test('should get item from localStorage', () => {
      global.localStorage.getItem.mockReturnValue('{"test": "value"}');
      const result = global.window.GatewaysCore.StorageManager.get('test');
      expect(result).toEqual({ test: 'value' });
    });

    test('should set item to localStorage', () => {
      const result = global.window.GatewaysCore.StorageManager.set('test', { data: 'value' });
      expect(global.localStorage.setItem).toHaveBeenCalledWith('test', '{"data":"value"}');
      expect(result).toBe(true);
    });
  });

  describe('Utils', () => {
    test('should generate random ID', () => {
      const id = global.window.GatewaysCore.Utils.generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(8);
    });

    test('should format bytes correctly', () => {
      expect(global.window.GatewaysCore.Utils.formatBytes(1024)).toBe('1 KB');
      expect(global.window.GatewaysCore.Utils.formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('ProxyEndpoint', () => {
    test('should create proxy endpoint with defaults', () => {
      const endpoint = new global.window.GatewaysCore.ProxyEndpoint();
      expect(endpoint.type).toBe('residential');
      expect(endpoint.status).toBe('active');
      expect(endpoint.host).toContain('gateways-proxy.com');
    });
  });
});