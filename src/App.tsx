import { useState, useRef, useEffect, useCallback } from "react";
import {
  getSavedAccounts,
  saveAccount,
  removeAccount,
  type SavedAccount,
} from "./utils/storage";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  global_name?: string;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id?: string;
  parent_id?: string | null;
  position?: number;
  topic?: string | null;
  nsfw?: boolean;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  permission_overwrites?: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

interface LogEntry {
  id: number;
  type: "info" | "success" | "error" | "warning" | "system";
  context: string;
  message: string;
  timestamp: string;
}

type BotFeature =
  | "spam"
  | "dm_all"
  | "status"
  | "nickname"
  | "raid"
  | "nuke"
  | "webhook"
  | "rpc"
  | "cloner";

// ========== ACCOUNT SELECTOR COMPONENT ==========
function AccountSelector({
  accounts,
  currentUserId,
  onSelect,
  onRemove,
  onAddNew,
}: {
  accounts: SavedAccount[];
  currentUserId: string | null;
  onSelect: (account: SavedAccount) => void;
  onRemove: (userId: string) => void;
  onAddNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentAccount = accounts.find((a) => a.id === currentUserId);

  const getAvatarUrl = (acc: SavedAccount) =>
    `https://cdn.discordapp.com/avatars/${acc.user.id}/${acc.user.avatar}.png?size=64`;

  if (accounts.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 transition-all hover:border-white/20"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {currentAccount ? (
          <>
            <div className="relative">
              <img
                src={getAvatarUrl(currentAccount)}
                alt=""
                className="w-7 h-7 rounded-full border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {currentAccount.user.global_name || currentAccount.user.username}
              </p>
              <p className="text-[10px] text-neutral-500">
                {accounts.length} conta{accounts.length !== 1 ? "s" : ""} salva
                {accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center">
              <i className="fa-solid fa-user text-[10px] text-neutral-500" />
            </div>
            <span className="text-xs text-neutral-400">Selecionar conta</span>
          </>
        )}
        <i
          className={`fa-solid fa-chevron-down text-[10px] text-neutral-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-72 rounded-xl border border-white/[0.08] p-2 z-50 shadow-2xl shadow-black/50"
          style={{
            background: "linear-gradient(180deg, #0c0c0c, #080808)",
          }}
        >
          <p className="text-[10px] text-neutral-600 uppercase tracking-[0.15em] font-medium px-2 pt-1 pb-2">
            Contas Salvas
          </p>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  onSelect(acc);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                  currentUserId === acc.id
                    ? "bg-white/[0.08] text-white"
                    : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <img
                  src={getAvatarUrl(acc)}
                  alt=""
                  className="w-8 h-8 rounded-full border border-white/10 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://cdn.discordapp.com/embed/avatars/0.png";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {acc.user.global_name || acc.user.username}
                  </p>
                  <p className="text-[10px] text-neutral-600 truncate">
                    @{acc.user.username}
                  </p>
                </div>
                {currentUserId === acc.id && (
                  <i className="fa-solid fa-check text-[10px] text-white shrink-0" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(acc.id);
                  }}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Remover conta"
                >
                  <i className="fa-solid fa-trash-can text-[9px]" />
                </button>
              </button>
            ))}
          </div>
          <div className="border-t border-white/[0.05] mt-1.5 pt-1.5">
            <button
              onClick={() => {
                onAddNew();
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
            >
              <i className="fa-solid fa-plus text-[10px]" />
              Adicionar nova conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== MAIN APP ==========
export function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeFeature, setActiveFeature] = useState<BotFeature>("spam");
  const [selectedGuild, setSelectedGuild] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Multi-account state
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() =>
    getSavedAccounts()
  );
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [spamMessage, setSpamMessage] = useState("");
  const [spamCount, setSpamCount] = useState(10);
  const [spamDelay, setSpamDelay] = useState(500);
  const [dmMessage, setDmMessage] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [statusType, setStatusType] = useState("online");
  const [newNickname, setNewNickname] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookMessage, setWebhookMessage] = useState("");
  const [webhookCount, setWebhookCount] = useState(5);

  // RPC States
  const [rpcAppId, setRpcAppId] = useState("");
  const [rpcName, setRpcName] = useState("");
  const [rpcDetails, setRpcDetails] = useState("");
  const [rpcState, setRpcState] = useState("");
  const [rpcLargeImage, setRpcLargeImage] = useState("");
  const [rpcLargeText, setRpcLargeText] = useState("");
  const [rpcSmallImage, setRpcSmallImage] = useState("");
  const [rpcSmallText, setRpcSmallText] = useState("");
  const [rpcButton1Label, setRpcButton1Label] = useState("");
  const [rpcButton1Url, setRpcButton1Url] = useState("");
  const [rpcButton2Label, setRpcButton2Label] = useState("");
  const [rpcButton2Url, setRpcButton2Url] = useState("");
  const [rpcType, setRpcType] = useState(0);
  const [rpcActive, setRpcActive] = useState(false);

  // Cloner States
  const [clonerOrigin, setClonerOrigin] = useState("");
  const [clonerTarget, setClonerTarget] = useState("");
  const [clonerRoles, setClonerRoles] = useState(true);
  const [clonerChannels, setClonerChannels] = useState(true);
  const [clonerEmojis, setClonerEmojis] = useState(true);
  const [clonerSettings, setClonerSettings] = useState(true);
  const [clonerDeleteExisting, setClonerDeleteExisting] = useState(false);
  const [clonerProgress, setClonerProgress] = useState(0);
  const [clonerTotal, setClonerTotal] = useState(0);
  const [clonerPhase, setClonerPhase] = useState("");
  const [clonerDelay, setClonerDelay] = useState(600);

  const logsRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  const abortRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rpcActiveRef = useRef(false);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const headers = useCallback(
    () => ({
      Authorization: token,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const addLog = useCallback(
    (type: LogEntry["type"], context: string, message: string) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString("pt-BR");
      logIdRef.current += 1;
      setLogs((prev) => [
        ...prev.slice(-200),
        { id: logIdRef.current, type, context, message, timestamp },
      ]);
    },
    []
  );

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close(1000);
        } catch (_e) {
          /* ignore */
        }
      }
    };
  }, []);

  // ========== ACCOUNT MANAGEMENT ==========
  const persistAccounts = (accounts: SavedAccount[]) => {
    setSavedAccounts(accounts);
    // Sync to localStorage
    localStorage.setItem("teamz_accounts", JSON.stringify(accounts));
  };

  const handleSaveCurrentAccount = () => {
    if (!user || !token) return;
    const account: SavedAccount = {
      id: user.id,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        global_name: user.global_name,
      },
      addedAt: Date.now(),
    };
    const existing = getSavedAccounts();
    const idx = existing.findIndex((a) => a.id === user.id);
    if (idx >= 0) {
      existing[idx] = account;
    } else {
      existing.push(account);
    }
    persistAccounts(existing);
  };

  const handleSwitchAccount = (account: SavedAccount) => {
    setToken(account.token);
    setUser(account.user);
    setGuilds([]);
    setIsConnected(true);
    setChannels([]);
    setSelectedGuild("");
    setSelectedChannel("");
    setLogs([]);
    setIsRunning(false);
    setRpcActive(false);
    rpcActiveRef.current = false;
    // Auto-load guilds
    (async () => {
      try {
        const guildsResp = await fetch(
          "https://discord.com/api/v9/users/@me/guilds",
          {
            headers: {
              Authorization: account.token,
              "Content-Type": "application/json",
            },
          }
        );
        if (guildsResp.ok) {
          const guildsData: DiscordGuild[] = await guildsResp.json();
          setGuilds(guildsData);
        }
      } catch (_e) {
        /* ignore */
      }
    })();
  };

  const handleRemoveAccount = (userId: string) => {
    const updated = savedAccounts.filter((a) => a.id !== userId);
    persistAccounts(updated);
    // If we're currently viewing this account, log out
    if (user?.id === userId) {
      logout();
    }
  };

  const login = async () => {
    if (!token.trim()) return;
    setIsConnecting(true);
    addLog("system", "AUTH", "Tentando conectar...");
    try {
      const resp = await fetch("https://discord.com/api/v9/users/@me", {
        headers: headers(),
      });
      if (!resp.ok) throw new Error("Token invalido");
      const userData: DiscordUser = await resp.json();
      setUser(userData);
      const guildsResp = await fetch(
        "https://discord.com/api/v9/users/@me/guilds",
        { headers: headers() }
      );
      if (!guildsResp.ok) throw new Error("Falha ao carregar servidores");
      const guildsData: DiscordGuild[] = await guildsResp.json();
      setGuilds(guildsData);
      setIsConnected(true);
      addLog(
        "success",
        "AUTH",
        `Conectado como ${userData.global_name || userData.username}`
      );
      addLog("info", "GUILDS", `${guildsData.length} servidores carregados`);
    } catch (_e) {
      addLog("error", "AUTH", "Falha na autenticacao. Token invalido.");
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    handleRpcStop();
    disconnectGateway();
    setToken("");
    setUser(null);
    setGuilds([]);
    setIsConnected(false);
    setChannels([]);
    setSelectedGuild("");
    setSelectedChannel("");
    setLogs([]);
    abortRef.current = true;
    setIsRunning(false);
    setRpcActive(false);
    rpcActiveRef.current = false;
  };

  const loadChannels = async (guildId: string) => {
    setSelectedGuild(guildId);
    setSelectedChannel("");
    if (!guildId) {
      setChannels([]);
      return;
    }
    try {
      const resp = await fetch(
        `https://discord.com/api/v9/guilds/${guildId}/channels`,
        { headers: headers() }
      );
      if (!resp.ok) throw new Error();
      const data: DiscordChannel[] = await resp.json();
      setChannels(data.filter((c) => c.type === 0 || c.type === 5));
      addLog("info", "CHANNELS", `${data.length} canais carregados`);
    } catch (_e) {
      addLog("error", "CHANNELS", "Falha ao carregar canais");
    }
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const stopExecution = () => {
    abortRef.current = true;
    setIsRunning(false);
    addLog("warning", "SISTEMA", "Execucao interrompida pelo usuario");
  };

  // ========== SPAM ==========
  const executeSpam = async () => {
    if (!selectedChannel || !spamMessage) {
      addLog("error", "SPAM", "Selecione um canal e digite uma mensagem");
      return;
    }
    setIsRunning(true);
    abortRef.current = false;
    addLog("system", "SPAM", `Iniciando spam: ${spamCount}x`);
    for (let i = 0; i < spamCount; i++) {
      if (abortRef.current) break;
      try {
        const resp = await fetch(
          `https://discord.com/api/v9/channels/${selectedChannel}/messages`,
          {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ content: spamMessage }),
          }
        );
        if (resp.ok) {
          addLog("success", "SPAM", `Mensagem ${i + 1}/${spamCount} enviada`);
        } else {
          const err = await resp.json();
          addLog("error", "SPAM", `Erro: ${err.message || "Rate limited"}`);
          if (resp.status === 429) {
            await sleep((err.retry_after || 5) * 1000);
          }
        }
      } catch (_e) {
        addLog("error", "SPAM", `Falha ao enviar mensagem ${i + 1}`);
      }
      await sleep(spamDelay);
    }
    setIsRunning(false);
    addLog("system", "SPAM", "Spam finalizado");
  };

  // ========== DM ALL (ORIGINAL) ==========
  const executeDmAll = async () => {
    if (!selectedGuild || !dmMessage) {
      addLog("error", "DM", "Selecione um servidor e digite uma mensagem");
      return;
    }
    setIsRunning(true);
    abortRef.current = false;
    addLog("system", "DM", "Buscando membros...");
    try {
      const resp = await fetch(
        `https://discord.com/api/v9/guilds/${selectedGuild}/members?limit=100`,
        { headers: headers() }
      );
      if (!resp.ok) throw new Error();
      const members = await resp.json();
      addLog("info", "DM", `${members.length} membros encontrados`);
      let sent = 0;
      for (const member of members) {
        if (abortRef.current) break;
        if (member.user.bot || member.user.id === user?.id) continue;
        try {
          const dmResp = await fetch(
            "https://discord.com/api/v9/users/@me/channels",
            {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({ recipient_id: member.user.id }),
            }
          );
          if (!dmResp.ok) continue;
          const dm = await dmResp.json();
          const msgResp = await fetch(
            `https://discord.com/api/v9/channels/${dm.id}/messages`,
            {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({ content: dmMessage }),
            }
          );
          if (msgResp.ok) {
            sent++;
            addLog(
              "success",
              "DM",
              `DM enviada para ${member.user.username} (${sent})`
            );
          } else if (msgResp.status === 429) {
            const err = await msgResp.json();
            await sleep((err.retry_after || 5) * 1000);
          }
        } catch (_e) {
          addLog("error", "DM", `Falha: ${member.user.username}`);
        }
        await sleep(1000);
      }
      addLog("system", "DM", `Concluido: ${sent} DMs enviadas`);
    } catch (_e) {
      addLog("error", "DM", "Erro ao executar DM em massa");
    }
    setIsRunning(false);
  };

  // ========== STATUS ==========
  const executeStatus = async () => {
    if (!customStatus) {
      addLog("error", "STATUS", "Digite um status");
      return;
    }
    setIsRunning(true);
    try {
      const resp = await fetch(
        "https://discord.com/api/v9/users/@me/settings",
        {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({
            status: statusType,
            custom_status: { text: customStatus },
          }),
        }
      );
      if (resp.ok) addLog("success", "STATUS", "Status alterado!");
      else addLog("error", "STATUS", "Falha ao alterar status");
    } catch (_e) {
      addLog("error", "STATUS", "Erro de conexao");
    }
    setIsRunning(false);
  };

  // ========== NICKNAME ==========
  const executeNickname = async () => {
    if (!selectedGuild || !newNickname) {
      addLog("error", "NICK", "Preencha todos os campos");
      return;
    }
    setIsRunning(true);
    try {
      const resp = await fetch(
        `https://discord.com/api/v9/guilds/${selectedGuild}/members/@me`,
        {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({ nick: newNickname }),
        }
      );
      if (resp.ok) addLog("success", "NICK", "Nickname alterado!");
      else addLog("error", "NICK", "Falha ao alterar nickname");
    } catch (_e) {
      addLog("error", "NICK", "Erro de conexao");
    }
    setIsRunning(false);
  };

  // ========== RAID ==========
  const executeRaid = async () => {
    if (!selectedGuild) {
      addLog("error", "RAID", "Selecione um servidor");
      return;
    }
    setIsRunning(true);
    abortRef.current = false;
    addLog("warning", "RAID", "Iniciando raid...");
    try {
      const resp = await fetch(
        `https://discord.com/api/v9/guilds/${selectedGuild}/channels`,
        { headers: headers() }
      );
      const allChannels: DiscordChannel[] = await resp.json();
      const textChannels = allChannels.filter((c) => c.type === 0);
      addLog("info", "RAID", `${textChannels.length} canais encontrados`);
      for (const ch of textChannels) {
        if (abortRef.current) break;
        for (let i = 0; i < 3; i++) {
          if (abortRef.current) break;
          try {
            await fetch(
              `https://discord.com/api/v9/channels/${ch.id}/messages`,
              {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({
                  content: spamMessage || "TEAMZ SELFBOT",
                }),
              }
            );
            addLog("success", "RAID", `Mensagem em #${ch.name}`);
          } catch (_e) {
            /* continue */
          }
          await sleep(500);
        }
      }
    } catch (_e) {
      addLog("error", "RAID", "Erro durante raid");
    }
    setIsRunning(false);
    addLog("system", "RAID", "Raid finalizado");
  };

  // ========== NUKE ==========
  const executeNuke = async () => {
    if (!selectedGuild) {
      addLog("error", "NUKE", "Selecione um servidor");
      return;
    }
    setIsRunning(true);
    abortRef.current = false;
    addLog("warning", "NUKE", "Iniciando NUKE...");
    try {
      const resp = await fetch(
        `https://discord.com/api/v9/guilds/${selectedGuild}/channels`,
        { headers: headers() }
      );
      const allChannels: DiscordChannel[] = await resp.json();
      addLog("info", "NUKE", `Deletando ${allChannels.length} canais...`);
      for (const ch of allChannels) {
        if (abortRef.current) break;
        try {
          const delResp = await fetch(
            `https://discord.com/api/v9/channels/${ch.id}`,
            { method: "DELETE", headers: headers() }
          );
          if (delResp.ok)
            addLog("success", "NUKE", `Deletado: ${ch.name}`);
          else addLog("error", "NUKE", `Falha: ${ch.name}`);
        } catch (_e) {
          /* continue */
        }
        await sleep(300);
      }
      addLog("info", "NUKE", "Criando canais...");
      for (let i = 0; i < 5; i++) {
        if (abortRef.current) break;
        try {
          await fetch(
            `https://discord.com/api/v9/guilds/${selectedGuild}/channels`,
            {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({ name: `teamz-${i + 1}`, type: 0 }),
            }
          );
          addLog("success", "NUKE", `Canal teamz-${i + 1} criado`);
        } catch (_e) {
          /* continue */
        }
        await sleep(300);
      }
    } catch (_e) {
      addLog("error", "NUKE", "Erro durante nuke");
    }
    setIsRunning(false);
    addLog("system", "NUKE", "Nuke finalizado");
  };

  // ========== WEBHOOK ==========
  const executeWebhook = async () => {
    if (!webhookUrl || !webhookMessage) {
      addLog("error", "WEBHOOK", "Preencha URL e mensagem");
      return;
    }
    setIsRunning(true);
    abortRef.current = false;
    addLog("system", "WEBHOOK", `Enviando ${webhookCount} mensagens...`);
    for (let i = 0; i < webhookCount; i++) {
      if (abortRef.current) break;
      try {
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: webhookMessage,
            username: "TEAMZ SELFBOT",
          }),
        });
        if (resp.ok || resp.status === 204)
          addLog(
            "success",
            "WEBHOOK",
            `Mensagem ${i + 1}/${webhookCount}`
          );
        else if (resp.status === 429) {
          const err = await resp.json();
          await sleep((err.retry_after || 2) * 1000);
        } else addLog("error", "WEBHOOK", `Erro ${i + 1}`);
      } catch (_e) {
        addLog("error", "WEBHOOK", "Erro de conexao");
      }
      await sleep(300);
    }
    setIsRunning(false);
    addLog("system", "WEBHOOK", "Finalizado");
  };

  // ========== GATEWAY ==========
  const disconnectGateway = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "RPC stopped");
      } catch (_e) {
        /* ignore */
      }
      wsRef.current = null;
    }
  };

  // ========== RPC ==========
  async function resolveExternalAsset(imageUrl: string): Promise<string> {
    if (!imageUrl) return "";
    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    try {
      addLog(
        "info",
        "RPC",
        `Convertendo imagem: ${imageUrl.substring(0, 50)}...`
      );
      const resp = await fetch(
        `https://discord.com/api/v9/applications/${rpcAppId}/external-assets`,
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ urls: [imageUrl] }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && data[0] && data[0].external_asset_path) {
          const resolved = `mp:${data[0].external_asset_path}`;
          addLog("success", "RPC", `Imagem convertida: ${resolved}`);
          return resolved;
        }
      } else {
        const err = await resp.json().catch(() => ({}));
        addLog(
          "error",
          "RPC",
          `Erro ao converter imagem: ${resp.status} - ${JSON.stringify(err)}`
        );
      }
    } catch (e) {
      addLog("error", "RPC", `Erro de rede ao converter imagem: ${e}`);
    }
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, "");
    return `mp:external/${urlWithoutProtocol}`;
  }

  const executeRpc = async () => {
    if (!rpcAppId) {
      addLog("error", "RPC", "Insira um Application ID!");
      return;
    }
    if (rpcActive) {
      addLog("system", "RPC", "Desativando Rich Presence...");
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            op: 3,
            d: { since: 0, activities: [], status: "online", afk: false },
          })
        );
        await sleep(500);
      }
      disconnectGateway();
      setRpcActive(false);
      rpcActiveRef.current = false;
      addLog("success", "RPC", "Rich Presence desativado");
      return;
    }
    setIsRunning(true);
    addLog("system", "RPC", "Iniciando Rich Presence...");
    disconnectGateway();
    let resolvedLargeImage = "";
    let resolvedSmallImage = "";
    if (rpcLargeImage.trim()) {
      resolvedLargeImage = await resolveExternalAsset(rpcLargeImage.trim());
    }
    if (rpcSmallImage.trim()) {
      resolvedSmallImage = await resolveExternalAsset(rpcSmallImage.trim());
    }
    const startTime = Date.now();
    const buildPresence = () => {
      const buttons: Array<{ label: string; url: string }> = [];
      if (rpcButton1Label.trim() && rpcButton1Url.trim()) {
        buttons.push({ label: rpcButton1Label, url: rpcButton1Url });
      }
      if (rpcButton2Label.trim() && rpcButton2Url.trim()) {
        buttons.push({ label: rpcButton2Label, url: rpcButton2Url });
      }
      const activity: Record<string, unknown> = {
        name: rpcName || "TEAMZ SELFBOT",
        type: rpcType,
        application_id: rpcAppId,
        details: rpcDetails || undefined,
        state: rpcState || undefined,
        timestamps: { start: startTime },
        assets: {
          large_image: resolvedLargeImage || undefined,
          large_text: rpcLargeText || undefined,
          small_image: resolvedSmallImage || undefined,
          small_text: rpcSmallText || undefined,
        },
        buttons:
          buttons.length > 0 ? buttons.map((b) => b.label) : undefined,
        metadata:
          buttons.length > 0
            ? { button_urls: buttons.map((b) => b.url) }
            : undefined,
      };
      return {
        status: "online",
        since: 0,
        activities: [activity],
        afk: false,
      };
    };
    addLog("info", "RPC", "Conectando ao Gateway...");
    const ws = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");
    wsRef.current = ws;
    ws.onopen = () => {
      addLog("info", "GATEWAY", "WebSocket conectado");
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.op === 10) {
        const interval = msg.d.heartbeat_interval;
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: null }));
          }
        }, interval);
        ws.send(
          JSON.stringify({
            op: 2,
            d: {
              token: tokenRef.current,
              properties: {
                os: "windows",
                browser: "Chrome",
                device: "desktop",
              },
              presence: buildPresence(),
            },
          })
        );
        addLog("info", "GATEWAY", "IDENTIFY enviado com presence");
      }
      if (msg.t === "READY") {
        addLog("success", "RPC", `Rich Presence ativo! App: ${rpcAppId}`);
        if (resolvedLargeImage)
          addLog("info", "RPC", `Imagem grande: ${resolvedLargeImage}`);
        if (resolvedSmallImage)
          addLog("info", "RPC", `Imagem pequena: ${resolvedSmallImage}`);
        setRpcActive(true);
        rpcActiveRef.current = true;
        setIsRunning(false);
      }
    };
    ws.onerror = () => {
      addLog("error", "GATEWAY", "Erro no WebSocket");
      setIsRunning(false);
    };
    ws.onclose = () => {
      addLog("warning", "GATEWAY", "Conexao fechada");
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      setRpcActive(false);
      rpcActiveRef.current = false;
    };
  };

  function stopRpc() {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            op: 3,
            d: {
              status: "online",
              since: 0,
              activities: [],
              afk: false,
            },
          })
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setRpcActive(false);
    rpcActiveRef.current = false;
    addLog("warning", "RPC", "Rich Presence desativado");
  }

  async function updateRpcPresence() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("error", "RPC", "WebSocket nao conectado!");
      return;
    }
    let resolvedLarge = "";
    let resolvedSmall = "";
    if (rpcLargeImage.trim()) {
      resolvedLarge = await resolveExternalAsset(rpcLargeImage.trim());
    }
    if (rpcSmallImage.trim()) {
      resolvedSmall = await resolveExternalAsset(rpcSmallImage.trim());
    }
    const buttons: Array<{ label: string; url: string }> = [];
    if (rpcButton1Label.trim() && rpcButton1Url.trim()) {
      buttons.push({ label: rpcButton1Label, url: rpcButton1Url });
    }
    if (rpcButton2Label.trim() && rpcButton2Url.trim()) {
      buttons.push({ label: rpcButton2Label, url: rpcButton2Url });
    }
    const activity: Record<string, unknown> = {
      name: rpcName || "TEAMZ SELFBOT",
      type: rpcType,
      application_id: rpcAppId,
      details: rpcDetails || undefined,
      state: rpcState || undefined,
      timestamps: { start: Date.now() },
      assets: {
        large_image: resolvedLarge || undefined,
        large_text: rpcLargeText || undefined,
        small_image: resolvedSmall || undefined,
        small_text: rpcSmallText || undefined,
      },
      buttons:
        buttons.length > 0 ? buttons.map((b) => b.label) : undefined,
      metadata:
        buttons.length > 0
          ? { button_urls: buttons.map((b) => b.url) }
          : undefined,
    };
    wsRef.current.send(
      JSON.stringify({
        op: 3,
        d: {
          status: "online",
          since: 0,
          activities: [activity],
          afk: false,
        },
      })
    );
    addLog("success", "RPC", "Presence atualizado!");
  }

  // ========== CLONER ==========
  const executeCloner = async () => {
    if (!clonerOrigin || !clonerTarget) {
      addLog("error", "CLONER", "Selecione servidor de origem e destino!");
      return;
    }
    if (clonerOrigin === clonerTarget) {
      addLog("error", "CLONER", "Origem e destino nao podem ser iguais!");
      return;
    }
    setIsRunning(true);
    abortRef.current = false;
    setClonerProgress(0);
    setClonerTotal(0);
    setClonerPhase("");

    const originName =
      guilds.find((g) => g.id === clonerOrigin)?.name || clonerOrigin;
    const targetName =
      guilds.find((g) => g.id === clonerTarget)?.name || clonerTarget;

    addLog("system", "CLONER", "--------------------------------");
    addLog("system", "CLONER", "Iniciando clonagem...");
    addLog("info", "CLONER", `Origem: ${originName}`);
    addLog("info", "CLONER", `Destino: ${targetName}`);
    addLog("info", "CLONER", `Delay: ${clonerDelay}ms`);
    addLog("system", "CLONER", "--------------------------------");

    const roleMap = new Map<string, string>();

    try {
      // FASE 0: CONFIGURACOES
      if (clonerSettings && !abortRef.current) {
        setClonerPhase("Configuracoes do Servidor");
        addLog("system", "CLONER", "[Fase 0] Copiando configuracoes...");
        try {
          const guildResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerOrigin}`,
            { headers: headers() }
          );
          if (guildResp.ok) {
            const guildData = await guildResp.json();
            const settingsPayload: Record<string, unknown> = {
              name: guildData.name,
              verification_level: guildData.verification_level,
              default_message_notifications:
                guildData.default_message_notifications,
              explicit_content_filter: guildData.explicit_content_filter,
            };
            if (guildData.description)
              settingsPayload.description = guildData.description;
            const settingsResp = await fetch(
              `https://discord.com/api/v9/guilds/${clonerTarget}`,
              {
                method: "PATCH",
                headers: headers(),
                body: JSON.stringify(settingsPayload),
              }
            );
            if (settingsResp.ok) {
              addLog("success", "CLONER", `Nome: ${guildData.name}`);
              addLog(
                "success",
                "CLONER",
                `Verificacao: nivel ${guildData.verification_level}`
              );
            } else {
              const err = await settingsResp.json().catch(() => ({}));
              addLog(
                "warning",
                "CLONER",
                `Config parciais: ${JSON.stringify(err).substring(0, 100)}`
              );
            }
            // Clonar icone
            if (guildData.icon) {
              try {
                const iconUrl = `https://cdn.discordapp.com/icons/${clonerOrigin}/${guildData.icon}.png?size=1024`;
                const iconResp = await fetch(iconUrl);
                if (iconResp.ok) {
                  const blob = await iconResp.blob();
                  const reader = new FileReader();
                  const base64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                  await fetch(
                    `https://discord.com/api/v9/guilds/${clonerTarget}`,
                    {
                      method: "PATCH",
                      headers: headers(),
                      body: JSON.stringify({ icon: base64 }),
                    }
                  );
                  addLog("success", "CLONER", "Icone do servidor copiado!");
                }
              } catch (_e) {
                addLog("warning", "CLONER", "Nao foi possivel copiar o icone");
              }
            }
          }
        } catch (_e) {
          addLog("error", "CLONER", "Erro ao copiar configuracoes");
        }
        await sleep(1000);
      }

      // FASE 1: DELETAR EXISTENTES
      if (clonerDeleteExisting && !abortRef.current) {
        setClonerPhase("Limpando servidor destino");
        addLog("warning", "CLONER", "[Fase 1] Limpando servidor destino...");
        try {
          const existingChannelsResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerTarget}/channels`,
            { headers: headers() }
          );
          if (existingChannelsResp.ok) {
            const existingChannels: DiscordChannel[] =
              await existingChannelsResp.json();
            addLog(
              "info",
              "CLONER",
              `Deletando ${existingChannels.length} canais existentes...`
            );
            for (const ch of existingChannels) {
              if (abortRef.current) break;
              try {
                const resp = await fetch(
                  `https://discord.com/api/v9/channels/${ch.id}`,
                  { method: "DELETE", headers: headers() }
                );
                if (resp.ok)
                  addLog("success", "CLONER", `Deletado canal: #${ch.name}`);
                else if (resp.status === 429) {
                  const err = await resp.json();
                  const wait = (err.retry_after || 3) * 1000;
                  addLog(
                    "warning",
                    "CLONER",
                    `Rate limit! Esperando ${wait / 1000}s...`
                  );
                  await sleep(wait);
                }
              } catch (_e) {
                /* continue */
              }
              await sleep(clonerDelay);
            }
          }
        } catch (_e) {
          addLog("error", "CLONER", "Erro ao deletar canais");
        }
        try {
          const existingRolesResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerTarget}`,
            { headers: headers() }
          );
          if (existingRolesResp.ok) {
            const guildData = await existingRolesResp.json();
            const existingRoles: DiscordRole[] = guildData.roles || [];
            const deletableRoles = existingRoles.filter(
              (r) => r.name !== "@everyone" && !r.managed
            );
            addLog(
              "info",
              "CLONER",
              `Deletando ${deletableRoles.length} cargos existentes...`
            );
            for (const role of deletableRoles) {
              if (abortRef.current) break;
              try {
                const resp = await fetch(
                  `https://discord.com/api/v9/guilds/${clonerTarget}/roles/${role.id}`,
                  { method: "DELETE", headers: headers() }
                );
                if (resp.ok)
                  addLog(
                    "success",
                    "CLONER",
                    `Deletado cargo: @${role.name}`
                  );
                else if (resp.status === 429) {
                  const err = await resp.json();
                  await sleep((err.retry_after || 3) * 1000);
                }
              } catch (_e) {
                /* continue */
              }
              await sleep(clonerDelay);
            }
          }
        } catch (_e) {
          addLog("error", "CLONER", "Erro ao deletar cargos");
        }
        await sleep(1000);
      }

      // FASE 2: CLONAR CARGOS
      if (clonerRoles && !abortRef.current) {
        setClonerPhase("Clonando Cargos");
        addLog("system", "CLONER", "[Fase 2] Clonando cargos...");
        try {
          const guildResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerOrigin}`,
            { headers: headers() }
          );
          if (!guildResp.ok) throw new Error("Falha ao buscar servidor");
          const guildData = await guildResp.json();
          const originRoles: DiscordRole[] = guildData.roles || [];
          const rolesToClone = originRoles
            .filter((r) => r.name !== "@everyone" && !r.managed)
            .sort((a, b) => b.position - a.position);
          setClonerTotal((prev) => prev + rolesToClone.length);
          addLog(
            "info",
            "CLONER",
            `${rolesToClone.length} cargos para clonar`
          );
          for (const role of rolesToClone) {
            if (abortRef.current) break;
            try {
              const resp = await fetch(
                `https://discord.com/api/v9/guilds/${clonerTarget}/roles`,
                {
                  method: "POST",
                  headers: headers(),
                  body: JSON.stringify({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    mentionable: role.mentionable,
                  }),
                }
              );
              if (resp.ok) {
                const newRole = await resp.json();
                roleMap.set(role.id, newRole.id);
                setClonerProgress((prev) => prev + 1);
                addLog(
                  "success",
                  "CLONER",
                  `Cargo: @${role.name} (pos: ${role.position})`
                );
              } else if (resp.status === 429) {
                const err = await resp.json();
                const wait = (err.retry_after || 3) * 1000;
                addLog(
                  "warning",
                  "CLONER",
                  `Rate limit! Esperando ${wait / 1000}s...`
                );
                await sleep(wait);
              } else {
                addLog("error", "CLONER", `Falha cargo: @${role.name}`);
              }
            } catch (_e) {
              addLog("error", "CLONER", `Erro cargo: @${role.name}`);
            }
            await sleep(clonerDelay);
          }
          // Mapear @everyone
          const originEveryone = originRoles.find(
            (r) => r.name === "@everyone"
          );
          const targetGuildResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerTarget}`,
            { headers: headers() }
          );
          if (targetGuildResp.ok) {
            const targetGuild = await targetGuildResp.json();
            const targetEveryone = (targetGuild.roles as DiscordRole[])?.find(
              (r) => r.name === "@everyone"
            );
            if (originEveryone && targetEveryone) {
              roleMap.set(originEveryone.id, targetEveryone.id);
              // Copiar permissoes do @everyone
              try {
                await fetch(
                  `https://discord.com/api/v9/guilds/${clonerTarget}/roles/${targetEveryone.id}`,
                  {
                    method: "PATCH",
                    headers: headers(),
                    body: JSON.stringify({
                      permissions: originEveryone.permissions,
                    }),
                  }
                );
                addLog(
                  "success",
                  "CLONER",
                  "Permissoes do @everyone copiadas"
                );
              } catch (_e) {
                addLog(
                  "warning",
                  "CLONER",
                  "Falha ao copiar permissoes do @everyone"
                );
              }
            }
          }
          // Reordenar cargos
          if (roleMap.size > 0 && !abortRef.current) {
            addLog("info", "CLONER", "Reordenando cargos...");
            await sleep(1000);
            const positionUpdates: Array<{ id: string; position: number }> = [];
            for (const role of rolesToClone) {
              const newId = roleMap.get(role.id);
              if (newId) {
                positionUpdates.push({ id: newId, position: role.position });
              }
            }
            try {
              const resp = await fetch(
                `https://discord.com/api/v9/guilds/${clonerTarget}/roles`,
                {
                  method: "PATCH",
                  headers: headers(),
                  body: JSON.stringify(positionUpdates),
                }
              );
              if (resp.ok) {
                addLog(
                  "success",
                  "CLONER",
                  `${positionUpdates.length} cargos reordenados`
                );
              } else {
                addLog(
                  "warning",
                  "CLONER",
                  "Reordenacao em lote falhou, tentando individual..."
                );
                for (const update of positionUpdates) {
                  if (abortRef.current) break;
                  try {
                    await fetch(
                      `https://discord.com/api/v9/guilds/${clonerTarget}/roles`,
                      {
                        method: "PATCH",
                        headers: headers(),
                        body: JSON.stringify([update]),
                      }
                    );
                  } catch (_e) {
                    /* continue */
                  }
                  await sleep(300);
                }
                addLog("info", "CLONER", "Reordenacao individual concluida");
              }
            } catch (_e) {
              addLog("error", "CLONER", "Erro ao reordenar cargos");
            }
          }
        } catch (_e) {
          addLog("error", "CLONER", "Erro ao clonar cargos");
        }
        await sleep(1000);
      }

      // FASE 3: CLONAR CANAIS
      if (clonerChannels && !abortRef.current) {
        setClonerPhase("Clonando Canais");
        addLog("system", "CLONER", "[Fase 3] Clonando canais...");
        try {
          const channelsResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerOrigin}/channels`,
            { headers: headers() }
          );
          if (!channelsResp.ok) throw new Error("Falha ao buscar canais");
          const originChannels: DiscordChannel[] = await channelsResp.json();
          const categories = originChannels
            .filter((c) => c.type === 4)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          const nonCategories = originChannels
            .filter((c) => c.type !== 4)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          const totalChannels = originChannels.length;
          setClonerTotal((prev) => prev + totalChannels);
          addLog(
            "info",
            "CLONER",
            `${totalChannels} canais encontrados (${categories.length} categorias)`
          );
          const categoryMap = new Map<string, string>();
          // Criar categorias
          for (const cat of categories) {
            if (abortRef.current) break;
            try {
              const overwrites = (cat.permission_overwrites || []).map(
                (ow) => ({
                  id: roleMap.get(ow.id) || ow.id,
                  type: ow.type,
                  allow: ow.allow,
                  deny: ow.deny,
                })
              );
              const resp = await fetch(
                `https://discord.com/api/v9/guilds/${clonerTarget}/channels`,
                {
                  method: "POST",
                  headers: headers(),
                  body: JSON.stringify({
                    name: cat.name,
                    type: 4,
                    position: cat.position,
                    permission_overwrites: overwrites,
                  }),
                }
              );
              if (resp.ok) {
                const newCat = await resp.json();
                categoryMap.set(cat.id, newCat.id);
                setClonerProgress((prev) => prev + 1);
                addLog("success", "CLONER", `Categoria: ${cat.name}`);
              } else if (resp.status === 429) {
                const err = await resp.json();
                const wait = (err.retry_after || 3) * 1000;
                addLog(
                  "warning",
                  "CLONER",
                  `Rate limit! Esperando ${wait / 1000}s...`
                );
                await sleep(wait);
              } else {
                addLog("error", "CLONER", `Falha categoria: ${cat.name}`);
              }
            } catch (_e) {
              addLog("error", "CLONER", `Erro categoria: ${cat.name}`);
            }
            await sleep(clonerDelay);
          }
          // Criar canais
          for (const ch of nonCategories) {
            if (abortRef.current) break;
            const overwrites = (ch.permission_overwrites || []).map((ow) => ({
              id: roleMap.get(ow.id) || ow.id,
              type: ow.type,
              allow: ow.allow,
              deny: ow.deny,
            }));
            const channelPayload: Record<string, unknown> = {
              name: ch.name,
              type: ch.type,
              position: ch.position,
              permission_overwrites: overwrites,
            };
            if (ch.parent_id && categoryMap.has(ch.parent_id)) {
              channelPayload.parent_id = categoryMap.get(ch.parent_id);
            }
            if (ch.type === 0 || ch.type === 5) {
              if (ch.topic) channelPayload.topic = ch.topic;
              if (ch.nsfw) channelPayload.nsfw = ch.nsfw;
              if (ch.rate_limit_per_user)
                channelPayload.rate_limit_per_user = ch.rate_limit_per_user;
            }
            if (ch.type === 2) {
              if (ch.bitrate) channelPayload.bitrate = ch.bitrate;
              if (ch.user_limit) channelPayload.user_limit = ch.user_limit;
            }
            try {
              const resp = await fetch(
                `https://discord.com/api/v9/guilds/${clonerTarget}/channels`,
                {
                  method: "POST",
                  headers: headers(),
                  body: JSON.stringify(channelPayload),
                }
              );
              if (resp.ok) {
                setClonerProgress((prev) => prev + 1);
                const typeLabel =
                  ch.type === 0
                    ? "#"
                    : ch.type === 2
                      ? "VOZ"
                      : ch.type === 5
                        ? "NEWS"
                        : ch.type === 13
                          ? "STAGE"
                          : ch.type === 15
                            ? "FORUM"
                            : "CANAL";
                addLog(
                  "success",
                  "CLONER",
                  `Canal: [${typeLabel}] ${ch.name}`
                );
              } else if (resp.status === 429) {
                const err = await resp.json();
                const wait = (err.retry_after || 3) * 1000;
                addLog(
                  "warning",
                  "CLONER",
                  `Rate limit! Esperando ${wait / 1000}s...`
                );
                await sleep(wait);
              } else {
                const err = await resp.json().catch(() => ({}));
                addLog(
                  "error",
                  "CLONER",
                  `Falha canal: #${ch.name} - ${JSON.stringify(err).substring(0, 80)}`
                );
              }
            } catch (_e) {
              addLog("error", "CLONER", `Erro canal: #${ch.name}`);
            }
            await sleep(clonerDelay);
          }
        } catch (_e) {
          addLog("error", "CLONER", "Erro ao clonar canais");
        }
        await sleep(1000);
      }

      // FASE 4: CLONAR EMOJIS
      if (clonerEmojis && !abortRef.current) {
        setClonerPhase("Clonando Emojis");
        addLog("system", "CLONER", "[Fase 4] Clonando emojis...");
        try {
          const emojisResp = await fetch(
            `https://discord.com/api/v9/guilds/${clonerOrigin}/emojis`,
            { headers: headers() }
          );
          if (!emojisResp.ok) throw new Error("Falha ao buscar emojis");
          const emojis = await emojisResp.json();
          setClonerTotal((prev) => prev + emojis.length);
          addLog("info", "CLONER", `${emojis.length} emojis encontrados`);

          for (const emoji of emojis) {
            if (abortRef.current) break;
            try {
              const ext = emoji.animated ? "gif" : "png";
              const emojiUrl = `https://cdn.discordapp.com/emojis/${emoji.id}.${ext}?size=128&quality=lossless`;

              let base64 = "";
              try {
                const imgResp = await fetch(emojiUrl);
                if (imgResp.ok) {
                  const blob = await imgResp.blob();
                  base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error("FileReader error"));
                    reader.readAsDataURL(blob);
                  });
                }
              } catch (_e) {
                try {
                  base64 = await new Promise<string>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL(emoji.animated ? "image/gif" : "image/png"));
                      } else {
                        reject(new Error("No canvas context"));
                      }
                    };
                    img.onerror = () => reject(new Error("Image load failed"));
                    img.src = emojiUrl;
                  });
                } catch (_e2) {
                  addLog("warning", "CLONER", `Nao conseguiu baixar: :${emoji.name}:`);
                  continue;
                }
              }

              if (!base64) {
                addLog("warning", "CLONER", `Imagem vazia: :${emoji.name}:`);
                continue;
              }

              const resp = await fetch(
                `https://discord.com/api/v9/guilds/${clonerTarget}/emojis`,
                {
                  method: "POST",
                  headers: headers(),
                  body: JSON.stringify({
                    name: emoji.name,
                    image: base64,
                  }),
                }
              );
              if (resp.ok) {
                setClonerProgress((prev) => prev + 1);
                addLog(
                  "success",
                  "CLONER",
                  `Emoji: :${emoji.name}: ${emoji.animated ? "(animado)" : ""}`
                );
              } else if (resp.status === 429) {
                const err = await resp.json();
                const wait = (err.retry_after || 5) * 1000;
                addLog(
                  "warning",
                  "CLONER",
                  `Rate limit! Esperando ${wait / 1000}s...`
                );
                await sleep(wait);
              } else if (resp.status === 400) {
                addLog(
                  "warning",
                  "CLONER",
                  `Limite de emojis ou emoji invalido: :${emoji.name}:`
                );
              } else {
                addLog("error", "CLONER", `Falha emoji: :${emoji.name}:`);
              }
            } catch (_e) {
              addLog("error", "CLONER", `Erro emoji: :${emoji.name}:`);
            }
            await sleep(Math.max(clonerDelay, 1500));
          }
        } catch (_e) {
          addLog("error", "CLONER", "Erro ao clonar emojis");
        }
      }

      // FINALIZAR
      addLog("system", "CLONER", "--------------------------------");
      if (abortRef.current) {
        addLog("warning", "CLONER", "Clonagem interrompida pelo usuario!");
      } else {
        addLog("success", "CLONER", "Clonagem concluida com sucesso!");
        addLog("info", "CLONER", `Cargos mapeados: ${roleMap.size}`);
      }
      addLog("system", "CLONER", "--------------------------------");
    } catch (e) {
      addLog("error", "CLONER", `Erro fatal: ${e}`);
    }
    setIsRunning(false);
    setClonerPhase("");
  };

  // ========== EXECUTE ==========
  const executeFeature = () => {
    switch (activeFeature) {
      case "spam":
        executeSpam();
        break;
      case "dm_all":
        executeDmAll();
        break;
      case "status":
        executeStatus();
        break;
      case "nickname":
        executeNickname();
        break;
      case "raid":
        executeRaid();
        break;
      case "nuke":
        executeNuke();
        break;
      case "webhook":
        executeWebhook();
        break;
      case "rpc":
        executeRpc();
        break;
      case "cloner":
        executeCloner();
        break;
    }
  };

  const handleRpcStop = () => {
    if (rpcActive) stopRpc();
  };

  const features: {
    key: BotFeature;
    icon: string;
    label: string;
    desc: string;
  }[] = [
    { key: "spam", icon: "fa-comment-dots", label: "Spam", desc: "Envio em massa" },
    { key: "dm_all", icon: "fa-envelope", label: "DM Mass", desc: "DMs em massa" },
    { key: "status", icon: "fa-circle", label: "Status", desc: "Alterar status" },
    { key: "nickname", icon: "fa-pen", label: "Nick", desc: "Mudar apelido" },
    { key: "raid", icon: "fa-bolt", label: "Raid", desc: "Spam em canais" },
    { key: "nuke", icon: "fa-bomb", label: "Nuke", desc: "Destruir server" },
    { key: "webhook", icon: "fa-link", label: "Webhook", desc: "Spam webhook" },
    { key: "rpc", icon: "fa-gamepad", label: "RPC", desc: "Rich Presence" },
    { key: "cloner", icon: "fa-clone", label: "Cloner", desc: "Clonar servidor" },
  ];

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return "text-emerald-400";
      case "error": return "text-red-400";
      case "warning": return "text-amber-400";
      case "system": return "text-white";
      default: return "text-neutral-500";
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return "fa-check-circle";
      case "error": return "fa-times-circle";
      case "warning": return "fa-exclamation-triangle";
      case "system": return "fa-terminal";
      default: return "fa-info-circle";
    }
  };

  const avatarUrl = user
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : "";

  const needsServer =
    activeFeature === "spam" ||
    activeFeature === "dm_all" ||
    activeFeature === "raid" ||
    activeFeature === "nuke" ||
    activeFeature === "nickname";
  const needsChannel = activeFeature === "spam";

  const inputClass =
    "w-full rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/20 transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.03)" };
  const labelClass =
    "block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider";

  const rpcActivityTypes = [
    { value: 0, label: "Playing", icon: "fa-gamepad" },
    { value: 1, label: "Streaming", icon: "fa-video" },
    { value: 2, label: "Listening", icon: "fa-headphones" },
    { value: 3, label: "Watching", icon: "fa-eye" },
    { value: 5, label: "Competing", icon: "fa-trophy" },
  ];

  const delayOptions = [
    { value: 200, label: "200ms" },
    { value: 400, label: "400ms" },
    { value: 600, label: "600ms" },
    { value: 800, label: "800ms" },
    { value: 1000, label: "1s" },
    { value: 1500, label: "1.5s" },
    { value: 2000, label: "2s" },
    { value: 3000, label: "3s" },
  ];

  // Check if current account is already saved
  const isCurrentAccountSaved = user
    ? savedAccounts.some((a) => a.id === user.id)
    : false;

  // ---------- LOGIN SCREEN ----------
  if (!isConnected) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={{ background: "#000", fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div
          className="fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="fixed top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, white, transparent)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, white, transparent)",
            filter: "blur(60px)",
          }}
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 border border-white/10"
              style={{
                background: "linear-gradient(135deg, #111, #1a1a1a)",
              }}
            >
              <i className="fa-solid fa-robot text-2xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-1">
              TEAMZ SELFBOT
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 font-medium">
                Premium Edition
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 font-medium">
                v3.0
              </span>
            </div>
          </div>

          {/* Saved Accounts Section */}
          {savedAccounts.length > 0 && (
            <div
              className="rounded-2xl border border-white/[0.06] p-4 mb-4"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <i className="fa-solid fa-users text-xs text-neutral-500" />
                Contas Salvas
              </h2>
              <p className="text-xs text-neutral-500 mb-3">
                Selecione uma conta para conectar rapidamente.
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSwitchAccount(acc)}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left transition-all hover:border-white/15 hover:bg-white/[0.03]"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <img
                      src={`https://cdn.discordapp.com/avatars/${acc.user.id}/${acc.user.avatar}.png?size=64`}
                      alt=""
                      className="w-9 h-9 rounded-full border border-white/10 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://cdn.discordapp.com/embed/avatars/0.png";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {acc.user.global_name || acc.user.username}
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        @{acc.user.username}
                      </p>
                    </div>
                    <i className="fa-solid fa-arrow-right-to-bracket text-xs text-neutral-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-2xl border border-white/[0.06] p-6"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <i className="fa-solid fa-lock text-xs text-neutral-500" />
              {savedAccounts.length > 0 ? "Adicionar Nova Conta" : "Autenticacao"}
            </h2>
            <p className="text-xs text-neutral-500 mb-5">
              {savedAccounts.length > 0
                ? "Insira o token de outra conta para adicionar."
                : "Insira seu token para acessar o painel."}
            </p>
            <div
              className="rounded-xl border border-white/[0.06] p-3 mb-5"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex gap-2">
                <i className="fa-solid fa-triangle-exclamation text-xs text-neutral-400 mt-0.5" />
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Self bots violam os ToS do Discord. Sua conta pode ser{" "}
                  <span className="text-white font-medium">
                    permanentemente banida
                  </span>
                  . Use por sua conta e risco.
                </p>
              </div>
            </div>
            <div className="relative mb-4">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="Cole seu token aqui..."
                className="w-full rounded-xl border border-white/[0.08] px-4 py-3.5 pr-12 text-sm text-white outline-none transition-all focus:border-white/20 placeholder:text-neutral-600"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                <i
                  className={`fa-solid ${showToken ? "fa-eye-slash" : "fa-eye"} text-sm`}
                />
              </button>
            </div>
            <button
              onClick={login}
              disabled={isConnecting || !token.trim()}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isConnecting ? "rgba(255,255,255,0.5)" : "white",
              }}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin text-sm" />
                  Conectando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-arrow-right text-sm" />
                  Conectar
                </span>
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-neutral-700 mt-6 tracking-wide">
            TEAMZ GROUP &copy; 2025 — Apenas para fins educacionais
          </p>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD ----------
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#000", fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6">
        {/* Top Bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.08]"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <i className="fa-solid fa-robot text-sm text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                TEAMZ SELFBOT
              </h1>
              <span className="text-[10px] text-neutral-600 tracking-[0.15em] uppercase">
                Premium v3.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Account Switcher */}
            <AccountSelector
              accounts={savedAccounts}
              currentUserId={user?.id ?? null}
              onSelect={handleSwitchAccount}
              onRemove={handleRemoveAccount}
              onAddNew={() => {
                logout();
                setToken("");
              }}
            />

            {/* Save Account Button */}
            {user && (
              <button
                onClick={handleSaveCurrentAccount}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  isCurrentAccountSaved
                    ? "border-emerald-500/20 text-emerald-400"
                    : "border-white/[0.08] text-neutral-500 hover:text-white hover:border-white/20"
                }`}
                style={{ background: "rgba(255,255,255,0.02)" }}
                title={
                  isCurrentAccountSaved
                    ? "Conta salva — clique para atualizar"
                    : "Salvar conta"
                }
              >
                <i
                  className={`fa-solid ${isCurrentAccountSaved ? "fa-check" : "fa-floppy-disk"} text-xs`}
                />
                <span className="hidden sm:inline">
                  {isCurrentAccountSaved ? "Salvo" : "Salvar"}
                </span>
              </button>
            )}

            <div
              className="hidden sm:flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-2"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full border border-white/10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://cdn.discordapp.com/embed/avatars/0.png";
                  }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {user?.global_name || user?.username}
                </p>
                <p className="text-[10px] text-neutral-500">
                  @{user?.username}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] text-neutral-500 hover:text-red-400 hover:border-red-500/20 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <i className="fa-solid fa-right-from-bracket text-sm" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Sidebar */}
          <aside>
            <p className="text-[10px] text-neutral-600 uppercase tracking-[0.15em] font-medium px-3 mb-2">
              Ferramentas
            </p>
            <div className="tools-scrollbar space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {features.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFeature(f.key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all group ${
                    activeFeature === f.key
                      ? "border-white/[0.1] text-white"
                      : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                  style={{
                    background:
                      activeFeature === f.key
                        ? "rgba(255,255,255,0.05)"
                        : "transparent",
                    border: `1px solid ${activeFeature === f.key ? "rgba(255,255,255,0.08)" : "transparent"}`,
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                      activeFeature === f.key
                        ? "bg-white text-black"
                        : "bg-white/[0.04] text-neutral-500 group-hover:text-neutral-300"
                    }`}
                  >
                    <i className={`fa-solid ${f.icon} text-xs`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-[10px] text-neutral-600">{f.desc}</p>
                  </div>
                  {activeFeature === f.key && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                  {f.key === "rpc" &&
                    rpcActive &&
                    activeFeature !== f.key && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                  {f.key === "cloner" &&
                    isRunning &&
                    activeFeature === "cloner" && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    )}
                </button>
              ))}
            </div>
            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-white/[0.04] px-3">
              <p className="text-[10px] text-neutral-600 uppercase tracking-[0.15em] font-medium mb-3">
                Info
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Servidores</span>
                  <span className="text-white font-medium">{guilds.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Logs</span>
                  <span className="text-white font-medium">{logs.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">RPC</span>
                  <span
                    className={`font-medium ${rpcActive ? "text-emerald-400" : "text-neutral-600"}`}
                  >
                    {rpcActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Status</span>
                  <span
                    className={`font-medium ${isRunning ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {isRunning ? "Executando" : "Pronto"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Contas</span>
                  <span className="text-white font-medium">
                    {savedAccounts.length} salva{savedAccounts.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-5">
            {/* Feature Panel */}
            <div
              className="rounded-2xl border border-white/[0.06] p-6"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-black">
                    <i
                      className={`fa-solid ${features.find((f) => f.key === activeFeature)?.icon} text-sm`}
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {features.find((f) => f.key === activeFeature)?.label}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {features.find((f) => f.key === activeFeature)?.desc}
                    </p>
                  </div>
                </div>
                {activeFeature === "rpc" && rpcActive && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20"
                    style={{ background: "rgba(16,185,129,0.05)" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-400 font-medium">
                      RPC Ativo
                    </span>
                  </div>
                )}
                {activeFeature === "cloner" && isRunning && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20"
                    style={{ background: "rgba(245,158,11,0.05)" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[11px] text-amber-400 font-medium">
                      {clonerPhase || "Clonando..."}
                    </span>
                  </div>
                )}
                {isRunning &&
                  activeFeature !== "rpc" &&
                  activeFeature !== "cloner" && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20"
                      style={{ background: "rgba(245,158,11,0.05)" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[11px] text-amber-400 font-medium">
                        Executando
                      </span>
                    </div>
                  )}
              </div>

              {/* Server/Channel Selects */}
              {needsServer && (
                <div
                  className={`grid gap-4 mb-5 ${needsChannel ? "sm:grid-cols-2" : ""}`}
                >
                  <div>
                    <label className={labelClass}>Servidor</label>
                    <select
                      value={selectedGuild}
                      onChange={(e) => loadChannels(e.target.value)}
                      className={inputClass + " appearance-none cursor-pointer"}
                      style={inputStyle}
                    >
                      <option value="">Selecione...</option>
                      {guilds.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {needsChannel && (
                    <div>
                      <label className={labelClass}>Canal</label>
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className={
                          inputClass + " appearance-none cursor-pointer"
                        }
                        style={inputStyle}
                      >
                        <option value="">Selecione...</option>
                        {channels.map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* SPAM */}
              {activeFeature === "spam" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Mensagem</label>
                    <textarea
                      value={spamMessage}
                      onChange={(e) => setSpamMessage(e.target.value)}
                      placeholder="Digite a mensagem..."
                      rows={3}
                      className={inputClass + " resize-none"}
                      style={inputStyle}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Quantidade</label>
                      <input
                        type="number"
                        value={spamCount}
                        onChange={(e) => setSpamCount(Number(e.target.value))}
                        min={1}
                        max={100}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Delay (ms)</label>
                      <input
                        type="number"
                        value={spamDelay}
                        onChange={(e) => setSpamDelay(Number(e.target.value))}
                        min={100}
                        max={10000}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DM MASS */}
              {activeFeature === "dm_all" && (
                <div>
                  <label className={labelClass}>Mensagem DM</label>
                  <textarea
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    placeholder="Mensagem para enviar via DM..."
                    rows={3}
                    className={inputClass + " resize-none"}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* STATUS */}
              {activeFeature === "status" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Tipo</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { v: "online", l: "Online", c: "bg-emerald-500" },
                        { v: "idle", l: "Ausente", c: "bg-amber-500" },
                        { v: "dnd", l: "Ocupado", c: "bg-red-500" },
                        { v: "invisible", l: "Invisivel", c: "bg-neutral-500" },
                      ].map((s) => (
                        <button
                          key={s.v}
                          onClick={() => setStatusType(s.v)}
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                            statusType === s.v
                              ? "border-white/20 text-white"
                              : "border-white/[0.06] text-neutral-500 hover:text-neutral-300"
                          }`}
                          style={{
                            background:
                              statusType === s.v
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <span className={`w-2 h-2 rounded-full ${s.c}`} />
                          {s.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Status Customizado</label>
                    <input
                      type="text"
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="Ex: TEAMZ SELFBOT"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* NICKNAME */}
              {activeFeature === "nickname" && (
                <div>
                  <label className={labelClass}>Novo Nickname</label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Digite o nickname..."
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* RAID */}
              {activeFeature === "raid" && (
                <div>
                  <label className={labelClass}>Mensagem de Raid</label>
                  <input
                    type="text"
                    value={spamMessage}
                    onChange={(e) => setSpamMessage(e.target.value)}
                    placeholder="TEAMZ SELFBOT"
                    className={inputClass}
                    style={inputStyle}
                  />
                  <div
                    className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl border border-white/[0.06]"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <i className="fa-solid fa-circle-info text-xs text-neutral-500" />
                    <p className="text-[11px] text-neutral-500">
                      Envia em todos os canais de texto do servidor.
                    </p>
                  </div>
                </div>
              )}

              {/* NUKE */}
              {activeFeature === "nuke" && (
                <div
                  className="rounded-xl border border-red-500/10 p-4"
                  style={{ background: "rgba(239,68,68,0.03)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 mt-0.5">
                      <i className="fa-solid fa-skull-crossbones text-xs text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-400">
                        Acao Destrutiva
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        Esta acao ira deletar{" "}
                        <span className="text-white font-medium">
                          todos os canais
                        </span>{" "}
                        do servidor selecionado e criar novos. Esta acao e{" "}
                        <span className="text-red-400 font-medium">
                          irreversivel
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* WEBHOOK */}
              {activeFeature === "webhook" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Webhook URL</label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Mensagem</label>
                    <textarea
                      value={webhookMessage}
                      onChange={(e) => setWebhookMessage(e.target.value)}
                      placeholder="Mensagem do webhook..."
                      rows={3}
                      className={inputClass + " resize-none"}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Quantidade</label>
                    <input
                      type="number"
                      value={webhookCount}
                      onChange={(e) => setWebhookCount(Number(e.target.value))}
                      min={1}
                      max={100}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* RPC */}
              {activeFeature === "rpc" && (
                <div className="space-y-5">
                  {/* Preview */}
                  <div
                    className="rounded-xl border border-white/[0.06] p-4"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fa-solid fa-eye text-xs text-neutral-500" />
                      <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
                        Preview
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div
                        className="w-16 h-16 rounded-xl border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {rpcLargeImage && rpcLargeImage.startsWith("http") ? (
                          <img
                            src={rpcLargeImage}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <i className="fa-solid fa-gamepad text-xl text-neutral-700" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
                          {rpcActivityTypes.find((t) => t.value === rpcType)
                            ?.label || "Playing"}
                        </p>
                        <p className="text-xs font-bold text-white truncate">
                          {rpcName || "TEAMZ SELFBOT"}
                        </p>
                        {rpcDetails && (
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {rpcDetails}
                          </p>
                        )}
                        {rpcState && (
                          <p className="text-[11px] text-neutral-500 truncate">
                            {rpcState}
                          </p>
                        )}
                        {rpcActive && (
                          <p className="text-[10px] text-neutral-600 mt-1">
                            Elapsed: agora
                          </p>
                        )}
                      </div>
                    </div>
                    {(rpcButton1Label || rpcButton2Label) && (
                      <div className="flex gap-2 mt-3">
                        {rpcButton1Label && (
                          <div
                            className="flex-1 text-center rounded-lg border border-white/[0.08] py-1.5 text-[11px] text-neutral-400"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                          >
                            {rpcButton1Label}
                          </div>
                        )}
                        {rpcButton2Label && (
                          <div
                            className="flex-1 text-center rounded-lg border border-white/[0.08] py-1.5 text-[11px] text-neutral-400"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                          >
                            {rpcButton2Label}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Application ID{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={rpcAppId}
                      onChange={(e) => setRpcAppId(e.target.value)}
                      placeholder="Ex: 123456789012345678"
                      className={inputClass}
                      style={inputStyle}
                    />
                    <p className="text-[10px] text-neutral-600 mt-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info text-[9px]" />
                      Crie em discord.com/developers/applications
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Nome da Atividade</label>
                    <input
                      type="text"
                      value={rpcName}
                      onChange={(e) => setRpcName(e.target.value)}
                      placeholder="Ex: Minecraft, Spotify..."
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Atividade</label>
                    <div className="grid grid-cols-5 gap-2">
                      {rpcActivityTypes.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setRpcType(t.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[10px] font-medium transition-all ${
                            rpcType === t.value
                              ? "border-white/20 text-white"
                              : "border-white/[0.06] text-neutral-600 hover:text-neutral-400"
                          }`}
                          style={{
                            background:
                              rpcType === t.value
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <i className={`fa-solid ${t.icon} text-sm`} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Detalhes (Linha 1)</label>
                      <input
                        type="text"
                        value={rpcDetails}
                        onChange={(e) => setRpcDetails(e.target.value)}
                        placeholder="Ex: Jogando algo..."
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Estado (Linha 2)</label>
                      <input
                        type="text"
                        value={rpcState}
                        onChange={(e) => setRpcState(e.target.value)}
                        placeholder="Ex: No lobby"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Imagens</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rpcLargeImage}
                          onChange={(e) => setRpcLargeImage(e.target.value)}
                          placeholder="URL ou nome do asset grande"
                          className={inputClass}
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={rpcLargeText}
                          onChange={(e) => setRpcLargeText(e.target.value)}
                          placeholder="Tooltip grande"
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rpcSmallImage}
                          onChange={(e) => setRpcSmallImage(e.target.value)}
                          placeholder="URL ou nome do asset pequeno"
                          className={inputClass}
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={rpcSmallText}
                          onChange={(e) => setRpcSmallText(e.target.value)}
                          placeholder="Tooltip pequena"
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-2 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info text-[9px]" />
                      Cole qualquer URL de imagem — sera convertida via API
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Botoes (max. 2)</label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={rpcButton1Label}
                          onChange={(e) => setRpcButton1Label(e.target.value)}
                          placeholder="Label botao 1"
                          className={inputClass}
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={rpcButton1Url}
                          onChange={(e) => setRpcButton1Url(e.target.value)}
                          placeholder="URL botao 1"
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={rpcButton2Label}
                          onChange={(e) => setRpcButton2Label(e.target.value)}
                          placeholder="Label botao 2"
                          className={inputClass}
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={rpcButton2Url}
                          onChange={(e) => setRpcButton2Url(e.target.value)}
                          placeholder="URL botao 2"
                          className={inputClass}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CLONER */}
              {activeFeature === "cloner" && (
                <div className="space-y-5">
                  {/* Server Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        <i className="fa-solid fa-upload mr-1.5" />
                        Servidor Origem
                      </label>
                      <select
                        value={clonerOrigin}
                        onChange={(e) => setClonerOrigin(e.target.value)}
                        className={
                          inputClass + " appearance-none cursor-pointer"
                        }
                        style={inputStyle}
                      >
                        <option value="">Selecione a origem...</option>
                        {guilds.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <i className="fa-solid fa-download mr-1.5" />
                        Servidor Destino
                      </label>
                      <select
                        value={clonerTarget}
                        onChange={(e) => setClonerTarget(e.target.value)}
                        className={
                          inputClass + " appearance-none cursor-pointer"
                        }
                        style={inputStyle}
                      >
                        <option value="">Selecione o destino...</option>
                        {guilds.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Clone Direction */}
                  {clonerOrigin &&
                    clonerTarget &&
                    clonerOrigin !== clonerTarget && (
                      <div
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <i className="fa-solid fa-server text-xs text-neutral-500" />
                          <span className="text-xs text-white font-medium truncate">
                            {guilds.find((g) => g.id === clonerOrigin)?.name}
                          </span>
                        </div>
                        <i className="fa-solid fa-arrow-right text-xs text-neutral-600 shrink-0" />
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-xs text-white font-medium truncate">
                            {guilds.find((g) => g.id === clonerTarget)?.name}
                          </span>
                          <i className="fa-solid fa-server text-xs text-neutral-500" />
                        </div>
                      </div>
                    )}

                  {/* Options */}
                  <div>
                    <label className={labelClass}>O que clonar</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          state: clonerSettings,
                          set: setClonerSettings,
                          icon: "fa-gear",
                          label: "Configuracoes",
                          desc: "Nome, icone, verificacao",
                        },
                        {
                          state: clonerRoles,
                          set: setClonerRoles,
                          icon: "fa-user-shield",
                          label: "Cargos",
                          desc: "Cores, permissoes",
                        },
                        {
                          state: clonerChannels,
                          set: setClonerChannels,
                          icon: "fa-hashtag",
                          label: "Canais",
                          desc: "Categorias, texto, voz",
                        },
                        {
                          state: clonerEmojis,
                          set: setClonerEmojis,
                          icon: "fa-face-smile",
                          label: "Emojis",
                          desc: "Emojis customizados",
                        },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => opt.set(!opt.state)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                            opt.state
                              ? "border-white/15 text-white"
                              : "border-white/[0.06] text-neutral-600"
                          }`}
                          style={{
                            background: opt.state
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                              opt.state
                                ? "bg-white text-black"
                                : "bg-white/[0.04]"
                            }`}
                          >
                            <i className={`fa-solid ${opt.icon} text-xs`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">{opt.label}</p>
                            <p className="text-[10px] text-neutral-600">
                              {opt.desc}
                            </p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              opt.state
                                ? "bg-white border-white"
                                : "border-white/15"
                            }`}
                          >
                            {opt.state && (
                              <i className="fa-solid fa-check text-[8px] text-black" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delay Buttons */}
                  <div>
                    <label className={labelClass}>
                      <i className="fa-solid fa-clock mr-1.5" />
                      Delay entre requisicoes
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {delayOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setClonerDelay(opt.value)}
                          className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                            clonerDelay === opt.value
                              ? "border-white/20 text-white"
                              : "border-white/[0.06] text-neutral-500 hover:text-neutral-300"
                          }`}
                          style={{
                            background:
                              clonerDelay === opt.value
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.02)",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete Existing */}
                  <div>
                    <button
                      onClick={() =>
                        setClonerDeleteExisting(!clonerDeleteExisting)
                      }
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                        clonerDeleteExisting
                          ? "border-red-500/20 text-red-400"
                          : "border-white/[0.06] text-neutral-500"
                      }`}
                      style={{
                        background: clonerDeleteExisting
                          ? "rgba(239,68,68,0.05)"
                          : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                          clonerDeleteExisting
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/[0.04]"
                        }`}
                      >
                        <i className="fa-solid fa-trash text-xs" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">
                          Limpar servidor destino antes
                        </p>
                        <p className="text-[10px] text-neutral-600">
                          Deleta todos os canais e cargos existentes
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          clonerDeleteExisting
                            ? "bg-red-500 border-red-500"
                            : "border-white/15"
                        }`}
                      >
                        {clonerDeleteExisting && (
                          <i className="fa-solid fa-check text-[8px] text-white" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Progress */}
                  {isRunning && activeFeature === "cloner" && (
                    <div
                      className="rounded-xl border border-white/[0.06] p-4"
                      style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-neutral-400">
                          {clonerPhase || "Preparando..."}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {clonerProgress}/{clonerTotal}
                        </span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width:
                              clonerTotal > 0
                                ? `${(clonerProgress / clonerTotal) * 100}%`
                                : "0%",
                            background:
                              "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7))",
                          }}
                        />
                      </div>
                      {clonerTotal > 0 && (
                        <p className="text-[10px] text-neutral-600 mt-1.5 text-right">
                          {Math.round(
                            (clonerProgress / clonerTotal) * 100
                          )}
                          %
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warning */}
                  <div
                    className="rounded-xl border border-white/[0.06] p-3"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex gap-2">
                      <i className="fa-solid fa-circle-info text-xs text-neutral-500 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          A clonagem copia{" "}
                          <span className="text-white font-medium">
                            configuracoes, cargos, canais, permissoes e emojis
                          </span>{" "}
                          do servidor de origem para o destino. Voce precisa ter{" "}
                          <span className="text-white font-medium">
                            permissao de administrador
                          </span>{" "}
                          no servidor destino.
                        </p>
                        <p className="text-[10px] text-neutral-600 mt-1">
                          Rate limits podem atrasar o processo. Servidores
                          grandes podem demorar varios minutos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={executeFeature}
                  disabled={isRunning && activeFeature !== "rpc"}
                  className={`flex-1 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${
                    activeFeature === "nuke"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : activeFeature === "raid"
                        ? "bg-amber-500 hover:bg-amber-600 text-black"
                        : activeFeature === "rpc" && rpcActive
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-white hover:bg-neutral-200 text-black"
                  }`}
                >
                  {activeFeature === "rpc" ? (
                    rpcActive ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-stop text-xs" />
                        Desativar RPC
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-play text-xs" />
                        Ativar Rich Presence
                      </span>
                    )
                  ) : activeFeature === "cloner" ? (
                    isRunning ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin text-sm" />
                        Clonando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-clone text-xs" />
                        Iniciar Clonagem
                      </span>
                    )
                  ) : isRunning ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fa-solid fa-spinner fa-spin text-sm" />
                      Executando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fa-solid fa-play text-xs" />
                      Executar{" "}
                      {features.find((f) => f.key === activeFeature)?.label}
                    </span>
                  )}
                </button>
                {activeFeature === "rpc" && rpcActive && (
                  <button
                    onClick={updateRpcPresence}
                    className="px-5 rounded-xl border border-white/10 text-neutral-400 text-sm font-medium hover:bg-white/5 transition-all"
                  >
                    <i className="fa-solid fa-rotate mr-2" />
                    Atualizar
                  </button>
                )}
                {isRunning && activeFeature !== "rpc" && (
                  <button
                    onClick={stopExecution}
                    className="px-5 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/5 transition-all"
                  >
                    <i className="fa-solid fa-stop mr-2" />
                    Parar
                  </button>
                )}
              </div>
            </div>

            {/* Logs Console */}
            <div
              className="rounded-2xl border border-white/[0.06] p-6"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-terminal text-xs text-neutral-500" />
                  <h3 className="text-sm font-semibold text-white">Console</h3>
                  <span className="text-[10px] text-neutral-600 bg-white/[0.04] px-2 py-0.5 rounded-full">
                    {logs.length}
                  </span>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-trash-can text-[10px]" />
                  Limpar
                </button>
              </div>
              <div
                ref={logsRef}
                className="console-scrollbar h-56 overflow-y-auto rounded-xl border border-white/[0.04] p-4"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-700">
                    <i className="fa-solid fa-terminal text-2xl mb-2" />
                    <p className="text-xs">Aguardando execucao...</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 mb-1 text-[11px] leading-relaxed ${getLogColor(log.type)}`}
                    >
                      <i
                        className={`fa-solid ${getLogIcon(log.type)} text-[9px] mt-1 opacity-60`}
                      />
                      <span className="text-neutral-600 shrink-0">
                        {log.timestamp}
                      </span>
                      <span className="font-semibold shrink-0">
                        [{log.context}]
                      </span>
                      <span className="text-neutral-400 break-all">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-center pb-4">
              <p className="text-[10px] text-neutral-700 tracking-wide">
                TEAMZ SELFBOT v3.0 — Teamz GROUP &copy; 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        select option { background: #0a0a0a; color: white; }
        .tools-scrollbar::-webkit-scrollbar { width: 6px; }
        .tools-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; margin: 4px 0; }
        .tools-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06)); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
        .tools-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12)); }
        .tools-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) rgba(255,255,255,0.02); }
        .console-scrollbar::-webkit-scrollbar { width: 5px; }
        .console-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .console-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .console-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .console-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
