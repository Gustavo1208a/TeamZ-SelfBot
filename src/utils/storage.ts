const STORAGE_KEY = "teamz_accounts";

export interface SavedAccount {
  id: string;
  token: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    global_name?: string;
  };
  addedAt: number;
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedAccount[];
  } catch {
    return [];
  }
}

export function saveAccount(account: SavedAccount): void {
  const accounts = getSavedAccounts();
  const existing = accounts.findIndex((a) => a.id === account.id);
  if (existing >= 0) {
    accounts[existing] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function removeAccount(userId: string): void {
  const accounts = getSavedAccounts().filter((a) => a.id !== userId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function clearAllAccounts(): void {
  localStorage.removeItem(STORAGE_KEY);
}
