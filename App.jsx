import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet, User, Home, Briefcase, ShoppingCart, Landmark, LineChart,
  Shield, MessageSquare, Gift, BarChart3, Crown, LogOut, Send,
  Lock, Search, AlertTriangle, Stamp, Newspaper, RefreshCw,
  Plus, Minus, Check, X, ChevronRight, ChevronLeft, Coins, TrendingUp, TrendingDown,
  FileText, Users, Ban, DollarSign, Percent, Building2, Car, Store,
  Trees, Dice5, Ticket, Award, Bell, Gavel, KeyRound
} from "lucide-react";
import { loadKey, saveKey } from "./lib/storage";

/* ============================================================
   ГОРОД: живой реестр — государственная экономическая симуляция
   Единый JSX-файл. Все данные — в общем (shared) хранилище,
   поэтому все, кто открывают эту страницу, играют в ОДНОМ мире.
   ============================================================ */

// ---------- Константы игрового мира ----------

const PROFESSIONS = [
  { name: "Безработный", salary: 0, req: 0 },
  { name: "Курьер", salary: 120, req: 0 },
  { name: "Продавец", salary: 220, req: 0 },
  { name: "Таксист", salary: 280, req: 1 },
  { name: "Строитель", salary: 340, req: 1 },
  { name: "Учитель", salary: 420, req: 2 },
  { name: "Врач", salary: 520, req: 3 },
  { name: "Полицейский", salary: 600, req: 3 },
  { name: "Судья", salary: 750, req: 5 },
  { name: "Бизнесмен", salary: 850, req: 5 },
];

const SHOP_CATALOG = {
  food: [
    { name: "Хлеб", base: 10 },
    { name: "Вода", base: 5 },
    { name: "Мясо", base: 45 },
    { name: "Консервы", base: 25 },
  ],
  tools: [
    { name: "Молоток", base: 80 },
    { name: "Отвёртка", base: 50 },
    { name: "Аптечка", base: 120 },
  ],
  phones: [
    { name: "Телефон «Стандарт»", base: 300 },
    { name: "Телефон «Про»", base: 950 },
  ],
  cars: [
    { name: "Седан", base: 5000 },
    { name: "Внедорожник", base: 12000 },
    { name: "Спорткар", base: 28000 },
  ],
  houses: [
    { name: "Квартира", base: 15000 },
    { name: "Дом", base: 42000 },
    { name: "Особняк", base: 130000 },
  ],
  blackmarket: [
    { name: "Пистолет", base: 2200 },
    { name: "Обрез", base: 4800 },
    { name: "Автомат", base: 9500 },
  ],
};

const INITIAL_STOCKS = [
  { name: "Нефтегаз", price: 120 },
  { name: "МеталлПром", price: 65 },
  { name: "ТехноКорп", price: 210 },
  { name: "АгроСоюз", price: 40 },
];
const INITIAL_CRYPTO = [
  { name: "CityCoin", price: 300 },
  { name: "GhostChain", price: 55 },
];

const LICENSES = [
  { name: "Оружейная лицензия", cost: 5000 },
  { name: "Водительские права", cost: 1500 },
  { name: "Лицензия на бизнес", cost: 8000 },
];

const ADMIN_NICK = "Nurik";
const ADMIN_PASSWORD = "Nurik2011";
const ONLINE_THRESHOLD_MS = 20000; // 20 секунд без пинга — считаем офлайн

// ---------- Утилиты ----------

const money = (n) =>
  (Math.round((n || 0) * 100) / 100).toLocaleString("ru-RU") + " ₪";

const uid = () => Math.random().toString(36).slice(2, 10);
const nowStr = () =>
  new Date().toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

function newPlayer(nick) {
  return {
    nick,
    id: uid().toUpperCase(),
    age: 18,
    profession: "Безработный",
    level: 1,
    reputation: 50,
    balance: 1500,
    bank: { deposit: 0, loan: 0, loanDueDay: null },
    house: null,
    car: null,
    business: [],
    land: [],
    shops: [],
    inventory: {},
    licenses: [],
    wanted: false,
    inJail: false,
    jailUntilDay: null,
    criminalRecord: [],
    debts: [],
    stockHoldings: {},
    cryptoHoldings: {},
    lastSalaryDay: 0,
    lastDailyClaim: 0,
    lastWheelDay: 0,
    isAdmin: nick === ADMIN_NICK,
    isBanned: false,
    createdAt: Date.now(),
  };
}

// ---------- Хранилище (общий мир для всех игроков, через Supabase) ----------
// loadKey/saveKey импортируются из ./lib/storage.js (см. import выше)

// ---------- Мелкие UI-компоненты ----------

function Seal({ children, tone = "ok" }) {
  const tones = {
    ok: "border-emerald-600 text-emerald-700 bg-emerald-50",
    danger: "border-rose-700 text-rose-800 bg-rose-50",
    warn: "border-amber-600 text-amber-800 bg-amber-50",
    neutral: "border-slate-500 text-slate-700 bg-slate-50",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-0.5 text-[11px] font-bold tracking-wide uppercase ${tones[tone]}`}
      style={{ fontFamily: "Georgia, serif" }}
    >
      {children}
    </span>
  );
}

function Ledger({ title, icon: Icon, children, right }) {
  return (
    <div className="bg-[#F7F1E1] border border-[#C9BFA0] rounded-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-dashed border-[#B9AD86] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-[#7A6A3F]" />}
          <h3
            className="text-[#3B3222] text-sm font-bold tracking-wide uppercase"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {title}
          </h3>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Btn({ children, onClick, tone = "default", disabled, className = "", type = "button" }) {
  const tones = {
    default: "bg-[#1F3350] text-[#F3E9CC] hover:bg-[#284069]",
    danger: "bg-[#7A2530] text-[#F3E9CC] hover:bg-[#8f2c39]",
    gold: "bg-[#8A6D1D] text-[#F3E9CC] hover:bg-[#9d7d22]",
    ghost: "bg-transparent border border-[#1F3350] text-[#1F3350] hover:bg-[#1F3350]/10",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-2">
      <span className="block text-[10px] uppercase tracking-wider text-[#7A6A3F] font-bold mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-white border border-[#C9BFA0] rounded-sm px-2.5 py-1.5 text-sm text-[#2B2417] focus:outline-none focus:ring-2 focus:ring-[#8A6D1D]";

// ============================================================
// Главный компонент
// ============================================================

export default function App() {
  const [booted, setBooted] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [mode, setMode] = useState("login"); // login | register
  const [authErr, setAuthErr] = useState("");

  const [me, setMe] = useState(null); // current player nick
  const [players, setPlayers] = useState({});
  const [users, setUsers] = useState({});
  const [market, setMarket] = useState({ prices: {}, demand: {} });
  const [stocks, setStocks] = useState({ companies: INITIAL_STOCKS, crypto: INITIAL_CRYPTO, currency: { USD: 1, EUR: 0.92 } });
  const [meta, setMeta] = useState({ day: 1, taxRate: 0.1, treasury: 0, lotteryPot: 0, lotteryTickets: {} });
  const [news, setNews] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [forum, setForum] = useState([]);
  const [reports, setReports] = useState([]);
  const [jobsExtra, setJobsExtra] = useState([]); // custom professions created by admin
  const [propertyListings, setPropertyListings] = useState([]);
  const [presence, setPresence] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tab, setTab] = useState("profile");
  const [flash, setFlash] = useState(null);

  const pollRef = useRef(null);

  const showFlash = (text, tone = "ok") => {
    setFlash({ text, tone });
    setTimeout(() => setFlash(null), 3200);
  };

  // ---------- загрузка / синхронизация общего мира ----------
  const refreshAll = useCallback(async (silent) => {
    const [u, p, m, s, mt, n, tx, msg, f, rp, je, pl, pr] = await Promise.all([
      loadKey("users", {}),
      loadKey("players", {}),
      loadKey("market", { prices: {}, demand: {} }),
      loadKey("stocks", { companies: INITIAL_STOCKS, crypto: INITIAL_CRYPTO, currency: { USD: 1, EUR: 0.92 } }),
      loadKey("meta", { day: 1, taxRate: 0.1, treasury: 0, lotteryPot: 0, lotteryTickets: {} }),
      loadKey("news", []),
      loadKey("transactions", []),
      loadKey("messages", []),
      loadKey("forum", []),
      loadKey("reports", []),
      loadKey("jobsExtra", []),
      loadKey("propertyListings", []),
      loadKey("presence", {}),
    ]);
    setUsers(u); setPlayers(p); setMarket(m); setStocks(s); setMeta(mt);
    setNews(n); setTransactions(tx); setMessages(msg); setForum(f); setReports(rp);
    setJobsExtra(je); setPropertyListings(pl); setPresence(pr);
    if (!silent) setBooted(true);
  }, []);

  useEffect(() => {
    refreshAll(false);
    pollRef.current = setInterval(() => refreshAll(true), 6000);
    return () => clearInterval(pollRef.current);
  }, [refreshAll]);

  useEffect(() => {
    if (!me) return;
    const ping = async () => {
      const fresh = await loadKey("presence", {});
      const updated = { ...fresh, [me]: Date.now() };
      await saveKey("presence", updated);
      setPresence(updated);
    };
    ping();
    const id = setInterval(ping, 5000);
    return () => clearInterval(id);
  }, [me]);

  // ---------- вспомогательные записи ----------
  const persistPlayers = async (next) => {
    setPlayers(next);
    await saveKey("players", next);
  };
  const persistMeta = async (next) => { setMeta(next); await saveKey("meta", next); };
  const persistMarket = async (next) => { setMarket(next); await saveKey("market", next); };
  const persistStocks = async (next) => { setStocks(next); await saveKey("stocks", next); };
  const persistNews = async (next) => { setNews(next); await saveKey("news", next); };
  const persistTx = async (next) => { setTransactions(next); await saveKey("transactions", next); };
  const persistMessages = async (next) => { setMessages(next); await saveKey("messages", next); };
  const persistForum = async (next) => { setForum(next); await saveKey("forum", next); };
  const persistReports = async (next) => { setReports(next); await saveKey("reports", next); };
  const persistUsers = async (next) => { setUsers(next); await saveKey("users", next); };
  const persistListings = async (next) => { setPropertyListings(next); await saveKey("propertyListings", next); };
  const persistJobsExtra = async (next) => { setJobsExtra(next); await saveKey("jobsExtra", next); };

  // ---------- фоновое восстановление профиля (без блокирующего экрана) ----------
  const lastPlayerRef = useRef(null);
  const healAttemptedRef = useRef(false);
  const [healing, setHealing] = useState(false);

  useEffect(() => {
    if (me && players[me]) lastPlayerRef.current = players[me];
  }, [players, me]);

  useEffect(() => {
    if (!me || !booted) return;
    if (players[me]) { healAttemptedRef.current = false; return; }
    if (healAttemptedRef.current) return;
    healAttemptedRef.current = true;
    let cancelled = false;
    (async () => {
      setHealing(true);
      await refreshAll(true);
      await new Promise((r) => setTimeout(r, 900));
      if (cancelled) return;
      const fresh = await loadKey("players", {});
      if (fresh[me]) {
        await refreshAll(true);
      } else {
        const next = { ...fresh, [me]: newPlayer(me) };
        await persistPlayers(next);
      }
      if (!cancelled) setHealing(false);
    })();
    return () => { cancelled = true; };
  }, [me, booted, players]); // eslint-disable-line

  const logTx = (list, entry) => [...list, { id: uid(), ts: Date.now(), ...entry }].slice(-500);

  // ---------- Аутентификация ----------
  const handleRegister = async () => {
    setAuthErr("");
    const nick = nickInput.trim();
    if (!nick || !passInput) return setAuthErr("Введите ник и пароль.");
    if (nick.length < 2) return setAuthErr("Ник слишком короткий.");
    if (nick === ADMIN_NICK && passInput !== ADMIN_PASSWORD) {
      return setAuthErr("Этот ник зарезервирован для администратора.");
    }
    const freshUsers = await loadKey("users", {});
    if (freshUsers[nick]) return setAuthErr("Такой ник уже зарегистрирован.");
    const freshPlayers = await loadKey("players", {});
    const updatedUsers = { ...freshUsers, [nick]: { password: nick === ADMIN_NICK ? ADMIN_PASSWORD : passInput } };
    const updatedPlayers = { ...freshPlayers, [nick]: newPlayer(nick) };
    await persistUsers(updatedUsers);
    await persistPlayers(updatedPlayers);
    setMe(nick);
    showFlash(`Добро пожаловать, ${nick}! Стартовый капитал: ${money(1500)}`);
  };

  const handleLogin = async () => {
    setAuthErr("");
    const nick = nickInput.trim();
    const freshUsers = await loadKey("users", {});
    const freshPlayers = await loadKey("players", {});

    if (nick === ADMIN_NICK) {
      if (passInput !== ADMIN_PASSWORD) return setAuthErr("Неверный пароль администратора.");
      let updatedUsers = freshUsers;
      let updatedPlayers = freshPlayers;
      if (!freshUsers[nick]) updatedUsers = { ...freshUsers, [nick]: { password: ADMIN_PASSWORD } };
      if (!freshPlayers[nick]) updatedPlayers = { ...freshPlayers, [nick]: newPlayer(nick) };
      if (updatedUsers !== freshUsers) await persistUsers(updatedUsers);
      if (updatedPlayers !== freshPlayers) await persistPlayers(updatedPlayers);
      if (updatedPlayers[nick]?.isBanned) return setAuthErr("Этот аккаунт заблокирован.");
      setUsers(updatedUsers);
      setPlayers(updatedPlayers);
      setMe(nick);
      return;
    }

    const acc = freshUsers[nick];
    if (!acc || acc.password !== passInput) return setAuthErr("Неверный ник или пароль.");
    const pl = freshPlayers[nick];
    if (pl?.isBanned) return setAuthErr("Этот игрок заблокирован администрацией.");
    setUsers(freshUsers);
    setPlayers(freshPlayers);
    setMe(nick);
  };

  const handleLogout = () => { setMe(null); setNickInput(""); setPassInput(""); setTab("profile"); };

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1B2B] text-[#F3E9CC]">
        <div className="flex items-center gap-2 text-sm tracking-wide uppercase">
          <RefreshCw className="animate-spin" size={16} /> Открываем реестр…
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <AuthScreen
        mode={mode} setMode={setMode}
        nickInput={nickInput} setNickInput={setNickInput}
        passInput={passInput} setPassInput={setPassInput}
        onLogin={handleLogin} onRegister={handleRegister}
        authErr={authErr}
      />
    );
  }

  const player = players[me] || lastPlayerRef.current || newPlayer(me);
  if (player.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1B2B] text-[#F3E9CC]">
        <div className="text-center max-w-sm">
          <Ban size={40} className="mx-auto mb-3 text-rose-400" />
          <p className="mb-4 font-bold">Ваш аккаунт заблокирован администрацией города.</p>
          <Btn tone="ghost" className="!text-[#F3E9CC] !border-[#F3E9CC]" onClick={handleLogout}>Выйти</Btn>
        </div>
      </div>
    );
  }

  const isAdmin = player.isAdmin;
  const isPolice = player.profession === "Полицейский";

  const NAV = [
    { id: "profile", label: "Профиль", icon: User },
    { id: "economy", label: "Экономика", icon: Wallet },
    { id: "job", label: "Работа", icon: Briefcase },
    { id: "shop", label: "Магазин", icon: ShoppingCart },
    { id: "bank", label: "Банк", icon: Landmark },
    { id: "stocks", label: "Биржа", icon: LineChart },
    { id: "gov", label: "Государство", icon: Shield },
    { id: "chat", label: "Общение", icon: MessageSquare },
    { id: "online", label: "Онлайн", icon: Users },
    { id: "daily", label: "Ежедневное", icon: Gift },
    { id: "stats", label: "Статистика", icon: BarChart3 },
  ];
  if (isPolice) NAV.push({ id: "police", label: "Полиция", icon: Ban });
  if (isAdmin) NAV.push({ id: "admin", label: "Админка", icon: Crown });

  return (
    <div className="min-h-screen bg-[#0F1B2B] text-[#EDE6D0] flex" style={{ fontFamily: "'Iowan Old Style','Georgia',serif" }}>
      {healing && (
        <div
          title="Синхронизируем профиль…"
          className="fixed bottom-3 right-3 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-[#0B141F] border border-[#233248] text-[#C9A227] shadow-lg"
        >
          <RefreshCw size={14} className="animate-spin" />
        </div>
      )}
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-52" : "w-14"} shrink-0 bg-[#0B141F] border-r border-[#233248] flex flex-col transition-[width] duration-200`}>
        <div className={`px-2 ${sidebarOpen ? "sm:px-4" : ""} py-4 border-b border-[#233248] flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Stamp size={20} className="text-[#C9A227] shrink-0" />
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-[#F3E9CC] font-bold text-sm tracking-wide truncate">ГОРОД</div>
                <div className="text-[10px] text-[#7C8AA0] uppercase tracking-widest truncate">гос. реестр</div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Свернуть меню" : "Развернуть меню"}
          className="flex items-center justify-center gap-1.5 py-2 text-[#8FB3D9] hover:bg-[#16233A] border-b border-[#233248] text-[10px] uppercase font-bold tracking-wide"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          {sidebarOpen && <span>Свернуть</span>}
        </button>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              title={n.label}
              onClick={() => setTab(n.id)}
              className={`w-full flex items-center ${sidebarOpen ? "justify-start px-4" : "justify-center px-1"} gap-2.5 py-2.5 text-xs uppercase tracking-wide font-semibold text-left transition-colors ${
                tab === n.id ? "bg-[#1F3350] text-[#F3E9CC]" : "text-[#8B99AF] hover:bg-[#16233A] hover:text-[#EDE6D0]"
              }`}
            >
              <n.icon size={16} className="shrink-0" />
              {sidebarOpen && <span className="truncate">{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className={`px-2 ${sidebarOpen ? "sm:px-4" : ""} py-3 border-t border-[#233248] text-[11px] text-[#7C8AA0]`}>
          {sidebarOpen && (
            <>
              <div className="flex justify-between mb-1"><span>Игровой день</span><span className="text-[#C9A227] font-bold">{meta.day}</span></div>
              <div className="flex justify-between mb-2"><span>Налог</span><span className="font-bold">{Math.round(meta.taxRate * 100)}%</span></div>
            </>
          )}
          <button onClick={handleLogout} title="Выйти" className={`w-full flex items-center ${sidebarOpen ? "justify-start" : "justify-center"} gap-1.5 text-rose-300 hover:text-rose-200`}>
            <LogOut size={15}/> {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <header className="sticky top-0 z-10 bg-[#0F1B2B]/95 backdrop-blur border-b border-[#233248] px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[#F3E9CC] font-bold flex items-center gap-2 flex-wrap text-sm sm:text-base">
              {player.nick}
              {player.isAdmin && <Seal tone="warn"><Crown size={11} className="inline -mt-0.5"/> админ</Seal>}
              {player.wanted && <Seal tone="danger">в розыске</Seal>}
              {player.inJail && <Seal tone="danger">в тюрьме</Seal>}
            </div>
            <div className="text-[11px] text-[#7C8AA0] truncate">ID {player.id} · {player.profession} · Ур.{player.level}</div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-[#7C8AA0]">Наличные</div>
              <div className="text-[#C9A227] font-bold text-sm sm:text-base">{money(player.balance)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-[#7C8AA0]">Вклад</div>
              <div className="text-[#8FB3D9] font-bold text-sm sm:text-base">{money(player.bank.deposit)}</div>
            </div>
          </div>
        </header>

        {flash && (
          <div className={`mx-6 mt-3 px-4 py-2 rounded-sm text-sm font-semibold border ${
            flash.tone === "danger" ? "bg-rose-950/40 border-rose-700 text-rose-200" : "bg-emerald-950/40 border-emerald-700 text-emerald-200"
          }`}>{flash.text}</div>
        )}

        <div className="p-3 sm:p-6 max-w-5xl">
          {tab === "profile" && <ProfileTab player={player} players={players} persistPlayers={persistPlayers} showFlash={showFlash} meta={meta} />}
          {tab === "economy" && (
            <EconomyTab
              player={player} players={players} persistPlayers={persistPlayers}
              transactions={transactions} persistTx={persistTx} logTx={logTx} showFlash={showFlash}
            />
          )}
          {tab === "job" && (
            <JobTab player={player} players={players} persistPlayers={persistPlayers} meta={meta}
              persistMeta={persistMeta} jobsExtra={jobsExtra} showFlash={showFlash}
              transactions={transactions} persistTx={persistTx} logTx={logTx}
            />
          )}
          {tab === "shop" && (
            <ShopTab player={player} players={players} persistPlayers={persistPlayers}
              market={market} persistMarket={persistMarket} showFlash={showFlash}
              propertyListings={propertyListings}
            />
          )}
          {tab === "bank" && (
            <BankTab player={player} players={players} persistPlayers={persistPlayers}
              transactions={transactions} persistTx={persistTx} logTx={logTx} showFlash={showFlash} meta={meta}
            />
          )}
          {tab === "stocks" && (
            <StocksTab player={player} players={players} persistPlayers={persistPlayers}
              stocks={stocks} showFlash={showFlash}
            />
          )}
          {tab === "gov" && (
            <GovTab player={player} players={players} news={news} meta={meta} showFlash={showFlash} />
          )}
          {tab === "chat" && (
            <ChatTab player={player} players={players} messages={messages} persistMessages={persistMessages}
              forum={forum} persistForum={persistForum} reports={reports} persistReports={persistReports} showFlash={showFlash}
            />
          )}
          {tab === "online" && (
            <OnlineTab player={player} players={players} presence={presence} />
          )}
          {tab === "daily" && (
            <DailyTab player={player} players={players} persistPlayers={persistPlayers} meta={meta}
              persistMeta={persistMeta} showFlash={showFlash}
            />
          )}
          {tab === "stats" && <StatsTab players={players} transactions={transactions} />}
          {tab === "police" && (
            <PoliceTab player={player} players={players} persistPlayers={persistPlayers} meta={meta}
              transactions={transactions} persistTx={persistTx} logTx={logTx} showFlash={showFlash}
            />
          )}
          {tab === "admin" && (
            <AdminTab
              player={player} players={players} persistPlayers={persistPlayers}
              meta={meta} persistMeta={persistMeta}
              market={market} persistMarket={persistMarket}
              stocks={stocks} persistStocks={persistStocks}
              news={news} persistNews={persistNews}
              transactions={transactions}
              reports={reports} persistReports={persistReports}
              jobsExtra={jobsExtra} persistJobsExtra={persistJobsExtra}
              propertyListings={propertyListings} persistListings={persistListings}
              showFlash={showFlash}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Экран входа / регистрации
// ============================================================
function AuthScreen({ mode, setMode, nickInput, setNickInput, passInput, setPassInput, onLogin, onRegister, authErr }) {
  return (
    <div className="min-h-screen bg-[#0F1B2B] flex items-center justify-center px-4" style={{ fontFamily: "'Iowan Old Style','Georgia',serif" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Stamp size={34} className="mx-auto text-[#C9A227] mb-2" />
          <h1 className="text-2xl font-bold text-[#F3E9CC] tracking-wide">ГОРОД</h1>
          <p className="text-[#7C8AA0] text-xs uppercase tracking-widest mt-1">государственный экономический реестр</p>
        </div>
        <div className="bg-[#F7F1E1] border border-[#C9BFA0] rounded-sm p-5 shadow-xl">
          <div className="flex mb-4 border-b border-dashed border-[#B9AD86]">
            <button onClick={() => setMode("login")} className={`flex-1 pb-2 text-xs uppercase font-bold tracking-wide ${mode === "login" ? "text-[#1F3350] border-b-2 border-[#1F3350]" : "text-[#9A8F6E]"}`}>Вход</button>
            <button onClick={() => setMode("register")} className={`flex-1 pb-2 text-xs uppercase font-bold tracking-wide ${mode === "register" ? "text-[#1F3350] border-b-2 border-[#1F3350]" : "text-[#9A8F6E]"}`}>Регистрация</button>
          </div>
          <Field label="Ник">
            <input className={inputCls} value={nickInput} onChange={(e) => setNickInput(e.target.value)} placeholder="Ваш игровой ник" />
          </Field>
          <Field label="Пароль">
            <input type="password" className={inputCls} value={passInput} onChange={(e) => setPassInput(e.target.value)} placeholder="••••••••" />
          </Field>
          {authErr && <p className="text-rose-700 text-xs font-semibold mb-2">{authErr}</p>}
          <Btn className="w-full mt-1 justify-center" onClick={mode === "login" ? onLogin : onRegister}>
            {mode === "login" ? "Войти" : "Создать персонажа"}
          </Btn>
          <p className="text-[10px] text-[#9A8F6E] mt-3 leading-relaxed">
            Регистрация мгновенная: только ник и пароль. Каждому новому жителю выдаётся стартовый капитал 1 500 ₪.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Профиль
// ============================================================
function ProfileTab({ player, players, persistPlayers, showFlash }) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Паспорт жителя" icon={User}>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-[#7A6A3F]">Ник</span><span className="font-bold text-[#2B2417]">{player.nick}</span>
          <span className="text-[#7A6A3F]">ID игрока</span><span className="font-mono text-[#2B2417]">{player.id}</span>
          <span className="text-[#7A6A3F]">Возраст</span><span className="text-[#2B2417]">{player.age}</span>
          <span className="text-[#7A6A3F]">Профессия</span><span className="text-[#2B2417]">{player.profession}</span>
          <span className="text-[#7A6A3F]">Уровень</span><span className="text-[#2B2417]">{player.level}</span>
          <span className="text-[#7A6A3F]">Репутация</span><span className="text-[#2B2417]">{player.reputation}</span>
          <span className="text-[#7A6A3F]">Судимость</span>
          <span className="text-[#2B2417]">{player.criminalRecord.length ? `${player.criminalRecord.length} запись(ей)` : "чиста"}</span>
        </div>
      </Ledger>
      <Ledger title="Имущество" icon={Home}>
        <div className="text-sm space-y-1.5 text-[#2B2417]">
          <div className="flex justify-between"><span className="flex items-center gap-1.5"><Home size={14}/> Дом</span><span>{player.house || "—"}</span></div>
          <div className="flex justify-between"><span className="flex items-center gap-1.5"><Car size={14}/> Машина</span><span>{player.car || "—"}</span></div>
          <div className="flex justify-between"><span className="flex items-center gap-1.5"><Store size={14}/> Бизнесы</span><span>{player.business.length ? player.business.join(", ") : "—"}</span></div>
          <div className="flex justify-between"><span className="flex items-center gap-1.5"><Trees size={14}/> Земля</span><span>{player.land.length ? player.land.join(", ") : "—"}</span></div>
          <div className="flex justify-between"><span>Лицензии</span><span>{player.licenses.length ? player.licenses.join(", ") : "нет"}</span></div>
        </div>
      </Ledger>
    </div>
  );
}

// ============================================================
// Экономика: баланс, переводы, история, штрафы/долги
// ============================================================
function EconomyTab({ player, players, persistPlayers, transactions, persistTx, logTx, showFlash }) {
  const [toNick, setToNick] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [debtNick, setDebtNick] = useState("");
  const [debtAmount, setDebtAmount] = useState("");

  const doTransfer = async () => {
    const amt = Number(amount);
    if (!toNick || !players[toNick]) return showFlash("Такого игрока нет.", "danger");
    if (toNick === player.nick) return showFlash("Нельзя перевести самому себе.", "danger");
    if (!amt || amt <= 0) return showFlash("Некорректная сумма.", "danger");
    if (player.balance < amt) return showFlash("Недостаточно средств.", "danger");
    const next = { ...players };
    next[player.nick] = { ...player, balance: player.balance - amt };
    next[toNick] = { ...players[toNick], balance: players[toNick].balance + amt };
    await persistPlayers(next);
    await persistTx(logTx(transactions, { from: player.nick, to: toNick, amount: amt, type: "перевод", note }));
    showFlash(`Переведено ${money(amt)} игроку ${toNick}.`);
    setToNick(""); setAmount(""); setNote("");
  };

  const createDebt = async () => {
    const amt = Number(debtAmount);
    if (!debtNick || !players[debtNick]) return showFlash("Такого игрока нет.", "danger");
    if (!amt || amt <= 0) return showFlash("Некорректная сумма.", "danger");
    const debtId = uid();
    const next = { ...players };
    const me2 = { ...player, debts: [...player.debts, { id: debtId, role: "creditor", other: debtNick, amount: amt, paid: false }] };
    const other = { ...players[debtNick], debts: [...players[debtNick].debts, { id: debtId, role: "debtor", other: player.nick, amount: amt, paid: false }] };
    next[player.nick] = me2; next[debtNick] = other;
    await persistPlayers(next);
    showFlash(`Долг зафиксирован: ${debtNick} должен вам ${money(amt)}.`);
    setDebtNick(""); setDebtAmount("");
  };

  const payDebt = async (debt) => {
    if (player.balance < debt.amount) return showFlash("Недостаточно средств для погашения.", "danger");
    const next = { ...players };
    const other = players[debt.other];
    next[player.nick] = {
      ...player, balance: player.balance - debt.amount,
      debts: player.debts.map((d) => (d.id === debt.id ? { ...d, paid: true } : d)),
    };
    next[debt.other] = {
      ...other, balance: other.balance + debt.amount,
      debts: other.debts.map((d) => (d.id === debt.id ? { ...d, paid: true } : d)),
    };
    await persistPlayers(next);
    await persistTx(logTx(transactions, { from: player.nick, to: debt.other, amount: debt.amount, type: "погашение долга" }));
    showFlash("Долг погашен.");
  };

  const myTx = transactions.filter((t) => t.from === player.nick || t.to === player.nick).slice().reverse();

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Перевод денег" icon={Send}>
        <Field label="Кому (ник)"><input className={inputCls} value={toNick} onChange={(e) => setToNick(e.target.value)} /></Field>
        <Field label="Сумма"><input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Комментарий"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <Btn onClick={doTransfer}><Send size={12} className="inline mr-1"/>Отправить</Btn>
      </Ledger>

      <Ledger title="Долги между игроками" icon={FileText}>
        <div className="flex gap-2 mb-3">
          <input className={inputCls} placeholder="Ник должника" value={debtNick} onChange={(e) => setDebtNick(e.target.value)} />
          <input type="number" className={inputCls} placeholder="Сумма" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} />
        </div>
        <Btn tone="gold" onClick={createDebt}>Зафиксировать долг</Btn>
        <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
          {player.debts.length === 0 && <p className="text-xs text-[#9A8F6E]">Долгов нет.</p>}
          {player.debts.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-xs bg-white/60 rounded px-2 py-1.5">
              <span>{d.role === "creditor" ? `${d.other} должен вам` : `Вы должны ${d.other}`} — {money(d.amount)}</span>
              {d.paid ? <Seal tone="ok">оплачено</Seal> : d.role === "debtor" ? (
                <Btn tone="ghost" className="!text-[10px] !py-0.5" onClick={() => payDebt(d)}>Погасить</Btn>
              ) : <Seal tone="warn">ждём оплаты</Seal>}
            </div>
          ))}
        </div>
      </Ledger>

      <Ledger title="История переводов" icon={FileText} right={<span className="text-[10px] text-[#9A8F6E]">последние {myTx.length}</span>}>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {myTx.length === 0 && <p className="text-xs text-[#9A8F6E]">Операций пока нет.</p>}
          {myTx.map((t) => (
            <div key={t.id} className="text-xs flex items-center justify-between bg-white/60 rounded px-2 py-1.5">
              <span>
                {t.from === player.nick ? <TrendingDown size={12} className="inline text-rose-700 mr-1"/> : <TrendingUp size={12} className="inline text-emerald-700 mr-1"/>}
                {t.type} {t.from === player.nick ? `→ ${t.to}` : `от ${t.from}`} {t.note ? `(${t.note})` : ""}
              </span>
              <span className="font-bold">{money(t.amount)}</span>
            </div>
          ))}
        </div>
      </Ledger>

      <Ledger title="Баланс" icon={Wallet}>
        <div className="text-3xl font-bold text-[#2B2417] mb-1">{money(player.balance)}</div>
        <p className="text-xs text-[#9A8F6E]">наличные средства на руках. Вклад и кредиты — во вкладке «Банк».</p>
      </Ledger>
    </div>
  );
}

// ============================================================
// Работа
// ============================================================
function JobTab({ player, players, persistPlayers, meta, persistMeta, jobsExtra, showFlash, transactions, persistTx, logTx }) {
  const allJobs = [...PROFESSIONS, ...jobsExtra];

  const apply = async (prof) => {
    if (prof.req > player.level) return showFlash(`Нужен уровень ${prof.req}.`, "danger");
    const next = { ...players, [player.nick]: { ...player, profession: prof.name } };
    await persistPlayers(next);
    showFlash(`Теперь вы работаете: ${prof.name}.`);
  };

  const claimSalary = async () => {
    const prof = allJobs.find((p) => p.name === player.profession);
    if (!prof || prof.salary <= 0) return showFlash("У вас нет оплачиваемой работы.", "danger");
    if (player.lastSalaryDay >= meta.day) return showFlash("Зарплата уже получена в этом игровом дне.", "danger");
    const gross = prof.salary * player.level;
    const tax = Math.round(gross * meta.taxRate);
    const net = gross - tax;
    const next = { ...players, [player.nick]: { ...player, balance: player.balance + net, lastSalaryDay: meta.day } };
    await persistPlayers(next);
    await persistMeta({ ...meta, treasury: meta.treasury + tax });
    await persistTx(logTx(transactions, { from: "государство", to: player.nick, amount: net, type: "зарплата", note: `налог ${tax}` }));
    showFlash(`Начислена зарплата: ${money(net)} (налог ${money(tax)}).`);
  };

  const promote = async () => {
    const cost = player.level * 1000;
    if (player.balance < cost) return showFlash(`Курсы повышения стоят ${money(cost)}.`, "danger");
    const next = { ...players, [player.nick]: { ...player, level: player.level + 1, balance: player.balance - cost } };
    await persistPlayers(next);
    showFlash(`Повышение! Теперь уровень ${player.level + 1}.`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Текущая работа" icon={Briefcase}>
        <p className="text-sm mb-2 text-[#2B2417]">Профессия: <b>{player.profession}</b> · Уровень {player.level}</p>
        <p className="text-xs text-[#9A8F6E] mb-3">График: 09:00–18:00 по игровому времени. Зарплата начисляется один раз за игровой день.</p>
        <div className="flex gap-2">
          <Btn onClick={claimSalary}><Coins size={12} className="inline mr-1"/>Получить зарплату</Btn>
          <Btn tone="gold" onClick={promote}>Повышение ({money(player.level * 1000)})</Btn>
        </div>
      </Ledger>
      <Ledger title="Список профессий" icon={Users}>
        <div className="max-h-72 overflow-y-auto space-y-1.5">
          {allJobs.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-sm bg-white/60 rounded px-2.5 py-1.5">
              <div>
                <div className="font-semibold text-[#2B2417]">{p.name}</div>
                <div className="text-[10px] text-[#9A8F6E]">З/п база {money(p.salary)} · нужен ур. {p.req}</div>
              </div>
              <Btn tone="ghost" className="!text-[10px]" disabled={player.profession === p.name} onClick={() => apply(p)}>
                {player.profession === p.name ? "Текущая" : "Устроиться"}
              </Btn>
            </div>
          ))}
        </div>
      </Ledger>
    </div>
  );
}

// ============================================================
// Магазин (динамичные цены по спросу) + чёрный рынок
// ============================================================
function ShopTab({ player, players, persistPlayers, market, persistMarket, showFlash, propertyListings }) {
  const [cat, setCat] = useState("food");

  const priceFor = (name, base) => {
    const p = market.prices[name];
    return p ? Math.round(p) : base;
  };

  const buy = async (item) => {
    const price = priceFor(item.name, item.base);
    if (player.balance < price) return showFlash("Недостаточно средств.", "danger");
    let updatedPlayer = { ...player, balance: player.balance - price };

    if (cat === "houses") {
      updatedPlayer.house = item.name;
    } else if (cat === "cars") {
      updatedPlayer.car = item.name;
    } else if (cat === "blackmarket") {
      updatedPlayer.wanted = true;
      updatedPlayer.criminalRecord = [...player.criminalRecord, { ts: Date.now(), reason: `Покупка на чёрном рынке: ${item.name}` }];
    } else {
      updatedPlayer.inventory = { ...player.inventory, [item.name]: (player.inventory[item.name] || 0) + 1 };
    }

    const nextPlayers = { ...players, [player.nick]: updatedPlayer };
    await persistPlayers(nextPlayers);

    const demand = { ...market.demand, [item.name]: (market.demand[item.name] || 0) + 1 };
    const bump = 1 + Math.min(demand[item.name] * 0.03, 0.6); // цена растёт со спросом, максимум +60%
    const prices = { ...market.prices, [item.name]: Math.round(item.base * bump) };
    await persistMarket({ ...market, demand, prices });

    showFlash(cat === "blackmarket"
      ? `Куплено: ${item.name}. Внимание — вы теперь в розыске!`
      : `Куплено: ${item.name} за ${money(price)}.`, cat === "blackmarket" ? "danger" : "ok");
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.keys(SHOP_CATALOG).map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide border ${
              cat === c ? "bg-[#1F3350] text-[#F3E9CC] border-[#1F3350]" : "bg-transparent border-[#3A4A63] text-[#8B99AF]"
            }`}>
            {{ food: "Еда", tools: "Инструменты", phones: "Телефоны", cars: "Машины", houses: "Дома", blackmarket: "Чёрный рынок" }[c]}
          </button>
        ))}
      </div>
      {cat === "blackmarket" && (
        <div className="mb-3 flex items-center gap-2 text-rose-300 text-xs bg-rose-950/30 border border-rose-800 rounded px-3 py-2">
          <AlertTriangle size={14}/> Покупка здесь делает вас разыскиваемым. Полиция может вас задержать.
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SHOP_CATALOG[cat].map((item) => {
          const price = priceFor(item.name, item.base);
          const changed = price !== item.base;
          return (
            <div key={item.name} className="bg-[#F7F1E1] border border-[#C9BFA0] rounded-sm p-3.5">
              <div className="font-bold text-[#2B2417] text-sm mb-1">{item.name}</div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[#8A6D1D] font-bold">{money(price)}</span>
                {changed && (price > item.base
                  ? <span className="text-[10px] text-rose-700 flex items-center"><TrendingUp size={11}/> спрос растёт</span>
                  : <span className="text-[10px] text-emerald-700 flex items-center"><TrendingDown size={11}/> дешевеет</span>)}
              </div>
              <Btn tone={cat === "blackmarket" ? "danger" : "default"} className="w-full justify-center" onClick={() => buy(item)}>Купить</Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Банк
// ============================================================
function BankTab({ player, players, persistPlayers, transactions, persistTx, logTx, showFlash, meta }) {
  const [amt, setAmt] = useState("");
  const [loanAmt, setLoanAmt] = useState("");

  const deposit = async () => {
    const v = Number(amt);
    if (!v || v <= 0 || v > player.balance) return showFlash("Некорректная сумма.", "danger");
    const next = { ...players, [player.nick]: { ...player, balance: player.balance - v, bank: { ...player.bank, deposit: player.bank.deposit + v } } };
    await persistPlayers(next);
    showFlash(`Внесено на вклад: ${money(v)}.`);
    setAmt("");
  };
  const withdraw = async () => {
    const v = Number(amt);
    if (!v || v <= 0 || v > player.bank.deposit) return showFlash("Некорректная сумма.", "danger");
    const next = { ...players, [player.nick]: { ...player, balance: player.balance + v, bank: { ...player.bank, deposit: player.bank.deposit - v } } };
    await persistPlayers(next);
    showFlash(`Снято со вклада: ${money(v)}.`);
    setAmt("");
  };
  const takeLoan = async () => {
    const v = Number(loanAmt);
    if (!v || v <= 0) return showFlash("Некорректная сумма.", "danger");
    if (player.bank.loan > 0) return showFlash("У вас уже есть непогашенный кредит.", "danger");
    const next = { ...players, [player.nick]: { ...player, balance: player.balance + v, bank: { ...player.bank, loan: Math.round(v * 1.15), loanDueDay: meta.day + 7 } } };
    await persistPlayers(next);
    await persistTx(logTx(transactions, { from: "банк", to: player.nick, amount: v, type: "кредит" }));
    showFlash(`Кредит выдан: ${money(v)} (к возврату ${money(Math.round(v * 1.15))}).`);
    setLoanAmt("");
  };
  const payLoan = async (v) => {
    const pay = Math.min(v, player.balance, player.bank.loan);
    if (pay <= 0) return showFlash("Нечем платить.", "danger");
    const next = { ...players, [player.nick]: { ...player, balance: player.balance - pay, bank: { ...player.bank, loan: player.bank.loan - pay } } };
    await persistPlayers(next);
    showFlash(`Погашено ${money(pay)} долга по кредиту.`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Вклад" icon={Landmark}>
        <p className="text-sm text-[#2B2417] mb-2">Текущий вклад: <b>{money(player.bank.deposit)}</b></p>
        <p className="text-xs text-[#9A8F6E] mb-3">Проценты по вкладу начисляются автоматически каждую игровую неделю (7 дней) — банк добавляет 2%.</p>
        <Field label="Сумма"><input type="number" className={inputCls} value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
        <div className="flex gap-2"><Btn onClick={deposit}>Внести</Btn><Btn tone="ghost" onClick={withdraw}>Снять</Btn></div>
      </Ledger>
      <Ledger title="Кредит" icon={KeyRound}>
        <p className="text-sm text-[#2B2417] mb-2">Текущий долг по кредиту: <b>{money(player.bank.loan)}</b></p>
        {player.bank.loan === 0 ? (
          <>
            <Field label="Сумма кредита"><input type="number" className={inputCls} value={loanAmt} onChange={(e) => setLoanAmt(e.target.value)} /></Field>
            <p className="text-[10px] text-[#9A8F6E] mb-2">Ставка 15%, срок 7 игровых дней.</p>
            <Btn tone="gold" onClick={takeLoan}>Оформить кредит</Btn>
          </>
        ) : (
          <div className="flex gap-2">
            <Btn onClick={() => payLoan(player.bank.loan)}>Погасить полностью</Btn>
            <Btn tone="ghost" onClick={() => payLoan(Math.round(player.bank.loan / 2))}>Погасить половину</Btn>
          </div>
        )}
      </Ledger>
      <Ledger title="Банковская карта" icon={FileText}>
        <div className="font-mono bg-[#1F3350] text-[#F3E9CC] rounded-md p-4 text-sm w-64">
          <div className="text-[10px] uppercase tracking-widest text-[#8FB3D9] mb-3">гос. банк города</div>
          <div className="tracking-widest mb-3">{player.id.padEnd(8, "0").match(/.{1,4}/g).join(" ")}</div>
          <div className="flex justify-between text-[10px]"><span>{player.nick.toUpperCase()}</span><span>ГОРОД</span></div>
        </div>
      </Ledger>
      <Ledger title="Выписка операций" icon={FileText}>
        <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
          {transactions.filter(t => (t.from === player.nick || t.to === player.nick) && (t.type.includes("кредит") || t.type.includes("зарплата") || t.type.includes("процент"))).slice().reverse().map(t => (
            <div key={t.id} className="flex justify-between bg-white/60 rounded px-2 py-1"><span>{t.type}</span><span className="font-bold">{money(t.amount)}</span></div>
          ))}
        </div>
      </Ledger>
    </div>
  );
}

// ============================================================
// Биржа
// ============================================================
function StocksTab({ player, players, persistPlayers, stocks, showFlash }) {
  const trade = async (list, key, name, qty, sell) => {
    const asset = list.find((s) => s.name === name);
    const holdKey = key === "crypto" ? "cryptoHoldings" : "stockHoldings";
    const holdings = player[holdKey];
    if (!sell) {
      const cost = asset.price * qty;
      if (player.balance < cost) return showFlash("Недостаточно средств.", "danger");
      const next = { ...players, [player.nick]: { ...player, balance: player.balance - cost, [holdKey]: { ...holdings, [name]: (holdings[name] || 0) + qty } } };
      await persistPlayers(next);
      showFlash(`Куплено ${qty} × ${name} за ${money(cost)}.`);
    } else {
      if ((holdings[name] || 0) < qty) return showFlash("Недостаточно активов для продажи.", "danger");
      const revenue = asset.price * qty;
      const next = { ...players, [player.nick]: { ...player, balance: player.balance + revenue, [holdKey]: { ...holdings, [name]: holdings[name] - qty } } };
      await persistPlayers(next);
      showFlash(`Продано ${qty} × ${name} за ${money(revenue)}.`);
    }
  };

  const AssetRow = ({ asset, holdKey }) => {
    const [qty, setQty] = useState(1);
    const holdings = player[holdKey][asset.name] || 0;
    return (
      <div className="flex items-center justify-between bg-white/60 rounded px-2.5 py-2 text-sm">
        <div>
          <div className="font-semibold text-[#2B2417]">{asset.name}</div>
          <div className="text-[10px] text-[#9A8F6E]">Цена {money(asset.price)} · у вас {holdings} шт.</div>
        </div>
        <div className="flex items-center gap-1.5">
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-14 border border-[#C9BFA0] rounded-sm px-1.5 py-1 text-xs" />
          <Btn tone="ghost" className="!text-[10px]" onClick={() => trade(holdKey === "cryptoHoldings" ? stocks.crypto : stocks.companies, holdKey === "cryptoHoldings" ? "crypto" : "stock", asset.name, qty, false)}>Купить</Btn>
          <Btn tone="ghost" className="!text-[10px]" onClick={() => trade(holdKey === "cryptoHoldings" ? stocks.crypto : stocks.companies, holdKey === "cryptoHoldings" ? "crypto" : "stock", asset.name, qty, true)}>Продать</Btn>
        </div>
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Акции компаний" icon={LineChart}>
        <div className="space-y-1.5">{stocks.companies.map((s) => <AssetRow key={s.name} asset={s} holdKey="stockHoldings" />)}</div>
      </Ledger>
      <Ledger title="Криптовалюта" icon={Coins}>
        <div className="space-y-1.5">{stocks.crypto.map((s) => <AssetRow key={s.name} asset={s} holdKey="cryptoHoldings" />)}</div>
      </Ledger>
      <Ledger title="Курсы валют" icon={DollarSign}>
        <div className="text-sm space-y-1">
          {Object.entries(stocks.currency).map(([k, v]) => (
            <div key={k} className="flex justify-between"><span>{k}</span><span className="font-bold">{v} ₪</span></div>
          ))}
        </div>
      </Ledger>
      <Ledger title="Примечание" icon={AlertTriangle}>
        <p className="text-xs text-[#9A8F6E]">Цены на бирже и курсы валют изменяются при наступлении нового игрового дня (см. новости государства). Администрация продвигает день кнопкой в Админке.</p>
      </Ledger>
    </div>
  );
}

// ============================================================
// Государство
// ============================================================
function GovTab({ player, players, news, meta, showFlash }) {
  const wantedList = Object.values(players).filter((p) => p.wanted);
  const laws = [
    "Ст.1 — Запрещена покупка оружия вне чёрного рынка.",
    "Ст.2 — Уклонение от налога карается штрафом от полиции.",
    "Ст.3 — Долг по кредиту, не выплаченный в срок, повышает розыск.",
    "Ст.4 — Задержание производится только сотрудником полиции.",
  ];
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Новости" icon={Newspaper}>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {news.length === 0 && <p className="text-xs text-[#9A8F6E]">Новостей пока нет.</p>}
          {news.slice().reverse().map((n, i) => (
            <div key={i} className="bg-white/60 rounded px-3 py-2">
              <div className="text-xs text-[#9A8F6E]">{new Date(n.ts).toLocaleString("ru-RU")}</div>
              <div className="font-bold text-[#2B2417] text-sm">{n.title}</div>
              <div className="text-xs text-[#4A4130]">{n.text}</div>
            </div>
          ))}
        </div>
      </Ledger>
      <Ledger title="Законы" icon={Gavel}>
        <ul className="text-sm space-y-1.5 text-[#2B2417] list-disc pl-4">
          {laws.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </Ledger>
      <Ledger title="Розыск" icon={AlertTriangle}>
        {wantedList.length === 0 ? <p className="text-xs text-[#9A8F6E]">Сейчас никто не в розыске.</p> : (
          <div className="space-y-1.5">
            {wantedList.map((p) => (
              <div key={p.nick} className="flex justify-between text-sm bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                <span>{p.nick}</span><Seal tone="danger">в розыске</Seal>
              </div>
            ))}
          </div>
        )}
      </Ledger>
      <Ledger title="Судимость и лицензии" icon={FileText}>
        <p className="text-sm mb-1 text-[#2B2417]">Судимость: {player.criminalRecord.length ? `${player.criminalRecord.length} запись(ей)` : "чиста"}</p>
        <p className="text-sm text-[#2B2417]">Лицензии: {player.licenses.length ? player.licenses.join(", ") : "нет"}</p>
      </Ledger>
    </div>
  );
}

// ============================================================
// Общение
// ============================================================
function ChatTab({ player, players, messages, persistMessages, forum, persistForum, reports, persistReports, showFlash }) {
  const [toNick, setToNick] = useState("");
  const [msgText, setMsgText] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [reportAgainst, setReportAgainst] = useState("");
  const [reportText, setReportText] = useState("");

  const inbox = messages.filter((m) => m.to === player.nick || m.from === player.nick).slice().reverse();

  const send = async () => {
    if (!toNick || !players[toNick]) return showFlash("Такого игрока нет.", "danger");
    if (!msgText.trim()) return;
    await persistMessages([...messages, { id: uid(), from: player.nick, to: toNick, text: msgText, ts: Date.now() }]);
    setMsgText("");
    showFlash("Сообщение отправлено.");
  };
  const post = async () => {
    if (!postTitle.trim() || !postText.trim()) return;
    await persistForum([...forum, { id: uid(), author: player.nick, title: postTitle, text: postText, ts: Date.now() }]);
    setPostTitle(""); setPostText("");
    showFlash("Тема опубликована на форуме.");
  };
  const sendReport = async () => {
    if (!reportAgainst || !reportText.trim()) return;
    await persistReports([...reports, { id: uid(), from: player.nick, against: reportAgainst, text: reportText, ts: Date.now(), resolved: false }]);
    setReportAgainst(""); setReportText("");
    showFlash("Жалоба отправлена администрации.");
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Личные сообщения" icon={MessageSquare}>
        <div className="flex gap-2 mb-2">
          <input className={inputCls} placeholder="Кому" value={toNick} onChange={(e) => setToNick(e.target.value)} />
        </div>
        <div className="flex gap-2 mb-2">
          <input className={inputCls} placeholder="Сообщение" value={msgText} onChange={(e) => setMsgText(e.target.value)} />
          <Btn onClick={send}>Отправить</Btn>
        </div>
        <div className="max-h-56 overflow-y-auto space-y-1.5">
          {inbox.map((m) => (
            <div key={m.id} className={`text-xs rounded px-2.5 py-1.5 ${m.from === player.nick ? "bg-[#1F3350] text-[#F3E9CC] ml-8" : "bg-white/60 mr-8"}`}>
              <div className="opacity-70 mb-0.5">{m.from === player.nick ? `Вам → ${m.to}` : `От ${m.from}`}</div>
              {m.text}
            </div>
          ))}
        </div>
      </Ledger>

      <Ledger title="Жалобы" icon={AlertTriangle}>
        <Field label="На кого"><input className={inputCls} value={reportAgainst} onChange={(e) => setReportAgainst(e.target.value)} /></Field>
        <Field label="Суть жалобы"><input className={inputCls} value={reportText} onChange={(e) => setReportText(e.target.value)} /></Field>
        <Btn tone="danger" onClick={sendReport}>Отправить жалобу</Btn>
      </Ledger>

      <Ledger title="Форум" icon={Newspaper}>
        <Field label="Заголовок"><input className={inputCls} value={postTitle} onChange={(e) => setPostTitle(e.target.value)} /></Field>
        <Field label="Текст"><input className={inputCls} value={postText} onChange={(e) => setPostText(e.target.value)} /></Field>
        <Btn onClick={post}>Опубликовать</Btn>
        <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
          {forum.slice().reverse().map((f) => (
            <div key={f.id} className="bg-white/60 rounded px-3 py-2">
              <div className="text-xs text-[#9A8F6E]">{f.author} · {new Date(f.ts).toLocaleString("ru-RU")}</div>
              <div className="font-bold text-sm text-[#2B2417]">{f.title}</div>
              <div className="text-xs text-[#4A4130]">{f.text}</div>
            </div>
          ))}
        </div>
      </Ledger>
    </div>
  );
}

// ============================================================
// Ежедневное
// ============================================================
function DailyTab({ player, players, persistPlayers, meta, persistMeta, showFlash }) {
  const claimDaily = async () => {
    if (player.lastDailyClaim >= meta.day) return showFlash("Награда уже получена сегодня.", "danger");
    const reward = 100 + Math.floor(Math.random() * 400);
    const next = { ...players, [player.nick]: { ...player, balance: player.balance + reward, lastDailyClaim: meta.day } };
    await persistPlayers(next);
    showFlash(`Ежедневная награда: ${money(reward)}!`);
  };

  const spinWheel = async () => {
    if (player.lastWheelDay >= meta.day) return showFlash("Колесо доступно раз в игровой день.", "danger");
    const cost = 50;
    if (player.balance < cost) return showFlash("Недостаточно средств для вращения.", "danger");
    const outcomes = [0, 50, 100, 250, 500, -50];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    const next = { ...players, [player.nick]: { ...player, balance: player.balance - cost + Math.max(result, 0), lastWheelDay: meta.day } };
    await persistPlayers(next);
    showFlash(result > 0 ? `Колесо удачи: выигрыш ${money(result)}!` : "Колесо удачи: сегодня не повезло.", result > 0 ? "ok" : "danger");
  };

  const buyTicket = async () => {
    const cost = 100;
    if (player.balance < cost) return showFlash("Недостаточно средств.", "danger");
    const win = Math.random() < 0.15;
    const pot = meta.lotteryPot + cost;
    if (win) {
      const next = { ...players, [player.nick]: { ...player, balance: player.balance - cost + pot } };
      await persistPlayers(next);
      await persistMeta({ ...meta, lotteryPot: 0 });
      showFlash(`Билет сыграл! Вы выиграли джекпот ${money(pot)}!`);
    } else {
      const nextP = { ...players, [player.nick]: { ...player, balance: player.balance - cost } };
      await persistPlayers(nextP);
      await persistMeta({ ...meta, lotteryPot: pot });
      showFlash("Билет не выиграл. Джекпот растёт!", "danger");
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <Ledger title="Ежедневная награда" icon={Gift}>
        <p className="text-xs text-[#9A8F6E] mb-3">Заходите каждый игровой день за случайным бонусом 100–500 ₪.</p>
        <Btn onClick={claimDaily}>Забрать награду</Btn>
      </Ledger>
      <Ledger title="Колесо удачи" icon={Dice5}>
        <p className="text-xs text-[#9A8F6E] mb-3">Вращение стоит 50 ₪, приз до 500 ₪. Раз в игровой день.</p>
        <Btn tone="gold" onClick={spinWheel}>Крутить (−50 ₪)</Btn>
      </Ledger>
      <Ledger title="Лотерея" icon={Ticket}>
        <p className="text-xs text-[#9A8F6E] mb-2">Джекпот: <b className="text-[#8A6D1D]">{money(meta.lotteryPot)}</b></p>
        <Btn tone="danger" onClick={buyTicket}>Купить билет (100 ₪)</Btn>
      </Ledger>
    </div>
  );
}

// ============================================================
// Онлайн-пользователи
// ============================================================
function OnlineTab({ player, players, presence }) {
  const now = Date.now();
  const list = Object.values(players)
    .map((p) => {
      const lastSeen = presence[p.nick];
      const online = lastSeen && now - lastSeen < ONLINE_THRESHOLD_MS;
      return { ...p, lastSeen, online };
    })
    .sort((a, b) => (b.online - a.online) || ((b.lastSeen || 0) - (a.lastSeen || 0)));

  const onlineList = list.filter((p) => p.online);
  const offlineList = list.filter((p) => !p.online);

  const timeAgo = (ts) => {
    if (!ts) return "давно";
    const diff = Math.max(0, now - ts);
    if (diff < 60000) return "только что";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} мин. назад`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} ч. назад`;
  };

  const Row = ({ p }) => (
    <div className="flex items-center justify-between bg-white/60 rounded px-3 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${p.online ? "bg-emerald-500" : "bg-slate-400"}`} />
        <div className="min-w-0">
          <div className="font-bold text-[#2B2417] truncate flex items-center gap-1.5">
            {p.nick}
            {p.isAdmin && <Seal tone="warn">админ</Seal>}
            {p.wanted && <Seal tone="danger">розыск</Seal>}
            {p.inJail && <Seal tone="danger">тюрьма</Seal>}
          </div>
          <div className="text-[10px] text-[#9A8F6E] truncate">{p.profession} · Ур.{p.level} · ID {p.id}</div>
        </div>
      </div>
      <div className="text-[10px] text-[#9A8F6E] shrink-0 pl-2 text-right">
        {p.online ? <span className="text-emerald-700 font-bold">в сети</span> : timeAgo(p.lastSeen)}
      </div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Сейчас на сервере" icon={Users} right={<span className="text-[10px] text-[#9A8F6E]">{onlineList.length} игрок(ов)</span>}>
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {onlineList.length === 0 && <p className="text-xs text-[#9A8F6E]">Сейчас никого нет в сети.</p>}
          {onlineList.map((p) => <Row key={p.nick} p={p} />)}
        </div>
      </Ledger>
      <Ledger title="Недавно были в сети" icon={RefreshCw}>
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {offlineList.length === 0 && <p className="text-xs text-[#9A8F6E]">Все жители сейчас на связи.</p>}
          {offlineList.map((p) => <Row key={p.nick} p={p} />)}
        </div>
      </Ledger>
    </div>
  );
}

// ============================================================
// Статистика
// ============================================================
function StatsTab({ players, transactions }) {
  const list = Object.values(players);
  const richest = [...list].sort((a, b) => (b.balance + b.bank.deposit) - (a.balance + a.bank.deposit)).slice(0, 10);
  const houseOwners = list.filter((p) => p.house).sort((a, b) => (b.balance) - (a.balance));
  const turnover = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const businesses = list.flatMap((p) => p.business.map((b) => ({ owner: p.nick, name: b })));

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Самые богатые игроки" icon={Crown}>
        <div className="space-y-1.5">
          {richest.map((p, i) => (
            <div key={p.nick} className="flex justify-between text-sm bg-white/60 rounded px-2.5 py-1.5">
              <span>#{i + 1} {p.nick}</span><span className="font-bold text-[#8A6D1D]">{money(p.balance + p.bank.deposit)}</span>
            </div>
          ))}
          {richest.length === 0 && <p className="text-xs text-[#9A8F6E]">Пока нет данных.</p>}
        </div>
      </Ledger>
      <Ledger title="Самые дорогие дома" icon={Home}>
        <div className="space-y-1.5">
          {houseOwners.slice(0, 10).map((p) => (
            <div key={p.nick} className="flex justify-between text-sm bg-white/60 rounded px-2.5 py-1.5">
              <span>{p.nick}</span><span>{p.house}</span>
            </div>
          ))}
          {houseOwners.length === 0 && <p className="text-xs text-[#9A8F6E]">Никто ещё не купил дом.</p>}
        </div>
      </Ledger>
      <Ledger title="Лучшие бизнесы" icon={Building2}>
        {businesses.length === 0 ? <p className="text-xs text-[#9A8F6E]">Бизнесов пока нет.</p> : (
          <div className="space-y-1.5">{businesses.map((b, i) => <div key={i} className="flex justify-between text-sm bg-white/60 rounded px-2.5 py-1.5"><span>{b.name}</span><span>{b.owner}</span></div>)}</div>
        )}
      </Ledger>
      <Ledger title="Общий оборот экономики" icon={BarChart3}>
        <div className="text-3xl font-bold text-[#2B2417]">{money(turnover)}</div>
        <p className="text-xs text-[#9A8F6E] mt-1">сумма всех зафиксированных операций за всё время.</p>
      </Ledger>
    </div>
  );
}

// ============================================================
// Полиция
// ============================================================
function PoliceTab({ player, players, persistPlayers, meta, transactions, persistTx, logTx, showFlash }) {
  const [targetNick, setTargetNick] = useState("");
  const wantedList = Object.values(players).filter((p) => p.wanted);

  const arrest = async (nick) => {
    const target = players[nick];
    if (!target) return showFlash("Игрок не найден.", "danger");
    if (!target.wanted) return showFlash("Этот игрок не в розыске.", "danger");
    if (target.inJail) return showFlash("Игрок уже в тюрьме.", "danger");
    const bonus = 200;
    const next = {
      ...players,
      [nick]: { ...target, wanted: false, inJail: true, jailUntilDay: meta.day + 3, criminalRecord: [...target.criminalRecord, { ts: Date.now(), reason: "Задержан полицией" }] },
      [player.nick]: { ...player, balance: player.balance + bonus },
    };
    await persistPlayers(next);
    await persistTx(logTx(transactions, { from: "государство", to: player.nick, amount: bonus, type: "премия за задержание", note: `задержан ${nick}` }));
    showFlash(`${nick} задержан и отправлен в тюрьму на 3 игровых дня. Премия: ${money(bonus)}.`);
    setTargetNick("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Задержать подозреваемого" icon={Ban}>
        <Field label="Ник преступника"><input className={inputCls} value={targetNick} onChange={(e) => setTargetNick(e.target.value)} /></Field>
        <Btn tone="danger" onClick={() => arrest(targetNick)}>Задержать и отправить в тюрьму</Btn>
        <p className="text-[10px] text-[#9A8F6E] mt-2">За успешное задержание разыскиваемого игрока полагается премия 200 ₪.</p>
      </Ledger>
      <Ledger title="Список в розыске" icon={AlertTriangle}>
        {wantedList.length === 0 ? <p className="text-xs text-[#9A8F6E]">Никто не в розыске.</p> : (
          <div className="space-y-1.5">
            {wantedList.map((p) => (
              <div key={p.nick} className="flex justify-between items-center text-sm bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                <span>{p.nick}</span>
                <Btn tone="danger" className="!text-[10px]" onClick={() => arrest(p.nick)}>Задержать</Btn>
              </div>
            ))}
          </div>
        )}
      </Ledger>
    </div>
  );
}

// ============================================================
// Админ-панель
// ============================================================
function AdminTab({
  player, players, persistPlayers, meta, persistMeta, market, persistMarket,
  stocks, persistStocks, news, persistNews, transactions, reports, persistReports,
  jobsExtra, persistJobsExtra, propertyListings, persistListings, showFlash,
}) {
  const [targetNick, setTargetNick] = useState("");
  const [amount, setAmount] = useState("");
  const [newProf, setNewProf] = useState("");
  const [taxInput, setTaxInput] = useState(String(meta.taxRate));
  const [newsTitle, setNewsTitle] = useState("");
  const [newsText, setNewsText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySalary, setCompanySalary] = useState("");
  const [priceItem, setPriceItem] = useState("");
  const [priceValue, setPriceValue] = useState("");

  const findTarget = () => players[targetNick];

  const give = async (sign) => {
    const t = findTarget();
    if (!t) return showFlash("Игрок не найден.", "danger");
    const v = Number(amount) * sign;
    const next = { ...players, [targetNick]: { ...t, balance: t.balance + v } };
    await persistPlayers(next);
    showFlash(`${sign > 0 ? "Выдано" : "Списано"} ${money(Math.abs(v))} игроку ${targetNick}.`);
  };

  const toggleBan = async (ban) => {
    const t = findTarget();
    if (!t) return showFlash("Игрок не найден.", "danger");
    const next = { ...players, [targetNick]: { ...t, isBanned: ban } };
    await persistPlayers(next);
    showFlash(ban ? `${targetNick} заблокирован.` : `${targetNick} разблокирован.`);
  };

  const changeProfession = async () => {
    const t = findTarget();
    if (!t || !newProf) return showFlash("Заполните ник и профессию.", "danger");
    const next = { ...players, [targetNick]: { ...t, profession: newProf } };
    await persistPlayers(next);
    showFlash(`Профессия игрока ${targetNick} изменена на ${newProf}.`);
  };

  const setTax = async () => {
    const rate = Number(taxInput);
    if (isNaN(rate) || rate < 0 || rate > 1) return showFlash("Ставка от 0 до 1 (например 0.1 = 10%).", "danger");
    await persistMeta({ ...meta, taxRate: rate });
    showFlash(`Налоговая ставка установлена на ${Math.round(rate * 100)}%.`);
  };

  const postNews = async () => {
    if (!newsTitle.trim()) return;
    await persistNews([...news, { title: newsTitle, text: newsText, ts: Date.now() }]);
    setNewsTitle(""); setNewsText("");
    showFlash("Новость опубликована.");
  };

  const createCompany = async () => {
    if (!companyName.trim() || !companySalary) return;
    await persistJobsExtra([...jobsExtra, { name: companyName, salary: Number(companySalary), req: 0 }]);
    setCompanyName(""); setCompanySalary("");
    showFlash(`Новая профессия/компания «${companyName}» добавлена.`);
  };

  const changePrice = async () => {
    if (!priceItem.trim() || !priceValue) return;
    await persistMarket({ ...market, prices: { ...market.prices, [priceItem]: Number(priceValue) } });
    setPriceItem(""); setPriceValue("");
    showFlash(`Цена «${priceItem}» установлена: ${money(Number(priceValue))}.`);
  };

  const advanceDay = async () => {
    // проценты по вкладам раз в 7 дней, случайное движение биржи каждый день
    const nextDay = meta.day + 1;
    let nextPlayers = { ...players };
    if (nextDay % 7 === 0) {
      Object.keys(nextPlayers).forEach((nick) => {
        const p = nextPlayers[nick];
        if (p.bank.deposit > 0) {
          nextPlayers[nick] = { ...p, bank: { ...p.bank, deposit: Math.round(p.bank.deposit * 1.02) } };
        }
      });
    }
    // освобождение из тюрьмы
    Object.keys(nextPlayers).forEach((nick) => {
      const p = nextPlayers[nick];
      if (p.inJail && p.jailUntilDay && nextDay >= p.jailUntilDay) {
        nextPlayers[nick] = { ...p, inJail: false, jailUntilDay: null };
      }
    });
    await persistPlayers(nextPlayers);

    const companies = stocks.companies.map((s) => ({ ...s, price: Math.max(5, Math.round(s.price * (1 + (Math.random() - 0.45) * 0.2))) }));
    const crypto = stocks.crypto.map((s) => ({ ...s, price: Math.max(1, Math.round(s.price * (1 + (Math.random() - 0.4) * 0.35))) }));
    await persistStocks({ ...stocks, companies, crypto });

    // спрос в магазине понемногу спадает
    const decayedDemand = {};
    Object.entries(market.demand).forEach(([k, v]) => { decayedDemand[k] = Math.max(0, v - 2); });
    await persistMarket({ ...market, demand: decayedDemand });

    await persistMeta({ ...meta, day: nextDay });
    showFlash(`Наступил игровой день ${nextDay}. Рынок и биржа обновлены.`);
  };

  const resolveReport = async (id) => {
    await persistReports(reports.map((r) => (r.id === id ? { ...r, resolved: true } : r)));
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Ledger title="Управление игроком" icon={Users}>
        <Field label="Ник игрока"><input className={inputCls} value={targetNick} onChange={(e) => setTargetNick(e.target.value)} /></Field>
        <Field label="Сумма"><input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <div className="flex gap-2 mb-2">
          <Btn onClick={() => give(1)}><Plus size={12} className="inline"/> Выдать деньги</Btn>
          <Btn tone="danger" onClick={() => give(-1)}><Minus size={12} className="inline"/> Забрать деньги</Btn>
        </div>
        <div className="flex gap-2 mb-2">
          <Btn tone="ghost" onClick={() => toggleBan(true)}><Ban size={12} className="inline"/> Забанить</Btn>
          <Btn tone="ghost" onClick={() => toggleBan(false)}><Check size={12} className="inline"/> Разбанить</Btn>
        </div>
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Новая профессия" value={newProf} onChange={(e) => setNewProf(e.target.value)} />
          <Btn onClick={changeProfession}>Изменить</Btn>
        </div>
      </Ledger>

      <Ledger title="Налоги и игровой день" icon={Percent}>
        <div className="flex gap-2 mb-2">
          <input className={inputCls} placeholder="0.10" value={taxInput} onChange={(e) => setTaxInput(e.target.value)} />
          <Btn onClick={setTax}>Установить налог</Btn>
        </div>
        <p className="text-xs text-[#9A8F6E] mb-2">Сейчас: день {meta.day}, налог {Math.round(meta.taxRate * 100)}%, казна {money(meta.treasury)}.</p>
        <Btn tone="gold" onClick={advanceDay}>Наступление нового игрового дня →</Btn>
      </Ledger>

      <Ledger title="Новости / объявления" icon={Newspaper}>
        <Field label="Заголовок"><input className={inputCls} value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} /></Field>
        <Field label="Текст"><input className={inputCls} value={newsText} onChange={(e) => setNewsText(e.target.value)} /></Field>
        <Btn onClick={postNews}>Опубликовать</Btn>
      </Ledger>

      <Ledger title="Создать компанию / профессию" icon={Building2}>
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Название" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input className={inputCls} placeholder="Зарплата" type="number" value={companySalary} onChange={(e) => setCompanySalary(e.target.value)} />
        </div>
        <Btn className="mt-2" onClick={createCompany}>Добавить</Btn>
      </Ledger>

      <Ledger title="Изменить цену товара" icon={ShoppingCart}>
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Название товара" value={priceItem} onChange={(e) => setPriceItem(e.target.value)} />
          <input className={inputCls} placeholder="Новая цена" type="number" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} />
        </div>
        <Btn className="mt-2" onClick={changePrice}>Применить</Btn>
      </Ledger>

      <Ledger title="Жалобы игроков" icon={AlertTriangle}>
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {reports.length === 0 && <p className="text-xs text-[#9A8F6E]">Жалоб нет.</p>}
          {reports.slice().reverse().map((r) => (
            <div key={r.id} className="text-xs bg-white/60 rounded px-2.5 py-1.5">
              <div className="flex justify-between mb-1"><span><b>{r.from}</b> → <b>{r.against}</b></span>{r.resolved ? <Seal tone="ok">решено</Seal> : <Btn tone="ghost" className="!text-[9px] !py-0" onClick={() => resolveReport(r.id)}>Отметить решённой</Btn>}</div>
              <div>{r.text}</div>
            </div>
          ))}
        </div>
      </Ledger>

      <Ledger title="История всех операций" icon={FileText} right={<span className="text-[10px] text-[#9A8F6E]">{transactions.length} записей</span>}>
        <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
          {transactions.slice().reverse().slice(0, 100).map((t) => (
            <div key={t.id} className="flex justify-between bg-white/60 rounded px-2 py-1">
              <span>{t.from} → {t.to} ({t.type})</span><span className="font-bold">{money(t.amount)}</span>
            </div>
          ))}
        </div>
      </Ledger>
    </div>
  );
}
