import { CurrencyWallet } from "./economy";

export interface UserAccount {
  userId: string;
  username: string;
  wallet: CurrencyWallet;
  createdAt: string;
}
