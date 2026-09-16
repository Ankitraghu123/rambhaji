import { sleep } from '../utils/format';
import { subscriptionPlans, deliveries, walletTransactions, notifications } from '../data/mockData';

export const api = {
  async getPlans() {
    await sleep(220);
    return subscriptionPlans;
  },
  async getDeliveries() {
    await sleep(220);
    return deliveries;
  },
  async getWalletTransactions() {
    await sleep(220);
    return walletTransactions;
  },
  async getNotifications() {
    await sleep(220);
    return notifications;
  }
};
