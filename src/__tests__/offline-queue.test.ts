import { getQueue, getQueueCount, clearQueue, isNetworkOnline } from '../lib/offline-queue';

describe('Offline Queue', () => {
  beforeEach(async () => {
    await clearQueue();
  });

  describe('getQueue', () => {
    it('should return an empty array initially', () => {
      const queue = getQueue();
      expect(queue).toEqual([]);
    });
  });

  describe('getQueueCount', () => {
    it('should return 0 for empty queue', () => {
      expect(getQueueCount()).toBe(0);
    });
  });

  describe('isNetworkOnline', () => {
    it('should return a boolean', () => {
      const online = isNetworkOnline();
      expect(typeof online).toBe('boolean');
    });
  });
});
