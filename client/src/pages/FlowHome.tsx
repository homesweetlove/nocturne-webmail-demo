import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronDown,
  Clock3,
  FileText,
  Forward,
  Inbox,
  Mail,
  Menu,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  RefreshCw,
  Reply,
  Search,
  Send,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import "./flow.css";

type Folder = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "archive";
type Filter = "all" | "unread" | "starred";
type Message = {
  id: number;
  sender: string;
  address: string;
  subject: string;
  preview: string;
  time: string;
  date: string;
  label: string;
  unread?: boolean;
  starred?: boolean;
  attachment?: boolean;
  body: string[];
};

const seed: Message[] = [
  {
    id: 1,
    sender: "Studio Aster",
    address: "hello@aster.example",
    time: "09:42",
    date: "오늘",
    label: "프로젝트",
    unread: true,
    starred: true,
    attachment: true,
    subject: "Q3 identity review — the final pass",
    preview:
      "The restraint in the new wordmark is working. I left three notes in the margin…",
    body: [
      "Hi Min,",
      "The restraint in the new wordmark is working. I left three notes in the margin, mostly around how the mark behaves when it is reduced to a single-color stamp.",
      "Could you take one last look before our 16:00 review? I would keep the gold seam, but let the surrounding space do more of the work.",
      "Warmly,\nAster",
    ],
  },
  {
    id: 2,
    sender: "Mara Chen",
    address: "mara@notes.example",
    time: "08:17",
    date: "오늘",
    label: "개인",
    unread: true,
    subject: "A quieter way to plan next week",
    preview:
      "I pulled the three commitments that deserve a little more room around them…",
    body: [
      "Morning,",
      "I pulled the three commitments that deserve a little more room around them. The rest can stay in the background until Wednesday.",
      "Sharing the note here so it is in one place when you are ready.",
      "Mara",
    ],
  },
  {
    id: 3,
    sender: "Ritual Objects",
    address: "orders@ritual.example",
    time: "어제",
    date: "어제",
    label: "영수증",
    subject: "Your order is moving through the studio",
    preview:
      "The small brass desk lamp has been wrapped and is ready for collection…",
    body: [
      "Hello Min,",
      "The small brass desk lamp has been wrapped and is ready for collection. We will send the tracking note as soon as it leaves the studio.",
      "Thank you for choosing something made slowly.",
      "Ritual Objects",
    ],
  },
  {
    id: 4,
    sender: "Hiro Tan",
    address: "hiro@studio.example",
    time: "어제",
    date: "어제",
    label: "프로젝트",
    starred: true,
    subject: "Re: The handoff should feel lighter",
    preview: "Agreed. I simplified the handoff to two moments instead of four…",
    body: [
      "Agreed. I simplified the handoff to two moments instead of four and removed the extra status email.",
      "The updated flow is attached. It should feel closer to a clear desk than another dashboard.",
      "Hiro",
    ],
  },
  {
    id: 5,
    sender: "Aster Notes",
    address: "letters@aster.example",
    time: "월요일",
    date: "월요일",
    label: "읽을거리",
    subject: "The margin is part of the message",
    preview: "A short field note on why less interface can sometimes say more…",
    body: [
      "A short field note on why less interface can sometimes say more.",
      "When the important things have enough space around them, attention stops feeling like something we need to wrestle back.",
      "Aster Notes",
    ],
  },
  {
    id: 6,
    sender: "Nami Logistics",
    address: "shipping@nami.example",
    time: "일요일",
    date: "일요일",
    label: "영수증",
    attachment: true,
    subject: "Friday delivery window confirmed",
    preview: "The delivery is now booked between 14:00 and 16:00 this Friday…",
    body: [
      "The delivery is now booked between 14:00 and 16:00 this Friday.",
      "Please keep the access note unchanged. We will call fifteen minutes before arrival.",
      "Nami Logistics",
    ],
  },
];

const folders: { id: Folder; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "받은편지함", icon: Inbox },
  { id: "starred", label: "별표 표시", icon: Star },
  { id: "snoozed", label: "다시 알림", icon: Clock3 },
  { id: "sent", label: "보낸편지함", icon: Send },
  { id: "drafts", label: "임시보관함", icon: FileText },
  { id: "archive", label: "보관함", icon: Archive },
];
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "unread", label: "안읽음" },
  { id: "starred", label: "별표" },
];

function IconAction({
  label,
  children,
  onClick,
  selected = false,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected || undefined}
      onClick={onClick}
      className={["flow-icon-action", selected && "is-active", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      className={["flow-avatar", large && "is-large"].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      {name
        .split(" ")
        .map(part => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}

export default function FlowHome() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [query, setQuery] = useState("");
  const [starred, setStarred] = useState(
    () => new Set(seed.filter(m => m.starred).map(m => m.id))
  );
  const [read, setRead] = useState(
    () => new Set(seed.filter(m => !m.unread).map(m => m.id))
  );
  const [archived, setArchived] = useState(() => new Set<number>());
  const [trashed, setTrashed] = useState(() => new Set<number>());
  const [snoozed, setSnoozed] = useState(() => new Set<number>());
  const [sent, setSent] = useState<Message[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [mobileReading, setMobileReading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const hasDraft = Boolean(recipient.trim() || subject.trim() || body.trim());

  const visible = useMemo(() => {
    let list = folder === "sent" ? sent : seed.filter(m => !trashed.has(m.id));
    if (folder === "inbox")
      list = list.filter(m => !archived.has(m.id) && !snoozed.has(m.id));
    if (folder === "archive") list = list.filter(m => archived.has(m.id));
    if (folder === "snoozed") list = list.filter(m => snoozed.has(m.id));
    if (folder === "starred") list = list.filter(m => starred.has(m.id));
    if (folder === "drafts") list = [];
    if (filter === "unread") list = list.filter(m => !read.has(m.id));
    if (filter === "starred") list = list.filter(m => starred.has(m.id));
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase();
      list = list.filter(m =>
        [m.sender, m.subject, m.preview, m.label].some(s =>
          s.toLocaleLowerCase().includes(q)
        )
      );
    }
    return list;
  }, [folder, filter, query, read, starred, archived, trashed, snoozed, sent]);

  const selected = visible.find(m => m.id === selectedId) ?? visible[0] ?? null;
  const unreadCount = seed.filter(
    m =>
      !read.has(m.id) &&
      !archived.has(m.id) &&
      !trashed.has(m.id) &&
      !snoozed.has(m.id)
  ).length;
  const heading =
    folders.find(item => item.id === folder)?.label ?? "받은편지함";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches(
        "input, textarea, [contenteditable='true']"
      );
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (!typing && !composeOpen && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (
        !typing &&
        !composeOpen &&
        event.key.toLowerCase() === "c" &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        setComposeOpen(true);
      } else if (event.key === "Escape") {
        setNavOpen(false);
        setMoreOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [composeOpen]);

  const chooseFolder = (id: Folder) => {
    setFolder(id);
    setFilter("all");
    setQuery("");
    setSelectedId(null);
    setMobileReading(false);
    setNavOpen(false);
    if (id === "drafts" && hasDraft) setComposeOpen(true);
  };

  const chooseMail = (id: number) => {
    setSelectedId(id);
    setMobileReading(true);
    setRead(current => new Set(current).add(id));
  };

  const toggleStar = (id: number) => {
    setStarred(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveSelected = (action: "archive" | "trash" | "snooze") => {
    if (!selected) return;
    const id = selected.id;
    if (action === "archive") {
      setArchived(current => new Set(current).add(id));
      toast.success("보관함으로 이동했습니다");
    } else if (action === "trash") {
      setTrashed(current => new Set(current).add(id));
      toast("목록에서 삭제했습니다", {
        description: "데모 세션에서만 적용됩니다.",
      });
    } else {
      setSnoozed(current => new Set(current).add(id));
      toast("다시 알림 목록으로 이동했습니다");
    }
    setSelectedId(null);
    setMobileReading(false);
    setMoreOpen(false);
  };

  const toggleRead = () => {
    if (!selected) return;
    const isRead = read.has(selected.id);
    setRead(current => {
      const next = new Set(current);
      if (isRead) next.delete(selected.id);
      else next.add(selected.id);
      return next;
    });
    toast(isRead ? "안읽음으로 표시했습니다" : "읽음으로 표시했습니다");
  };

  const clearDraft = () => {
    setRecipient("");
    setSubject("");
    setBody("");
    setComposeOpen(false);
  };

  const sendDemo = () => {
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      toast.error("받는 사람, 제목, 본문을 모두 입력해 주세요.");
      return;
    }
    const now = new Date();
    const sentMessage: Message = {
      id: now.getTime(),
      sender: "나",
      address: recipient.trim(),
      subject: subject.trim(),
      preview: body.trim().slice(0, 90),
      time: now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: "오늘",
      label: "보낸편지함",
      body: body.split(/\n\s*\n/).filter(Boolean),
    };
    setSent(current => [sentMessage, ...current]);
    clearDraft();
    chooseFolder("sent");
    setSelectedId(sentMessage.id);
    toast.success("데모 보낸편지함에 저장했습니다", {
      description: "실제 이메일은 발송되지 않았습니다.",
    });
  };

  const startReply = () => {
    if (!selected) return;
    setRecipient(selected.address);
    setSubject(
      selected.subject.startsWith("Re:")
        ? selected.subject
        : "Re: " + selected.subject
    );
    setBody("");
    setComposeOpen(true);
  };

  return (
    <main
      className={["flow-app", mobileReading && "flow-mobile-reading"]
        .filter(Boolean)
        .join(" ")}
    >
      {navOpen && (
        <button
          className="flow-nav-scrim"
          aria-label="메뉴 닫기"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        className={["flow-sidebar", navOpen && "is-open"]
          .filter(Boolean)
          .join(" ")}
        aria-label="메일 탐색"
      >
        <div className="flow-brand">
          <span className="flow-brand-mark">
            <span>N</span>
          </span>
          <span className="flow-brand-copy">
            <strong>nocturne</strong>
            <small>MAIL</small>
          </span>
          <IconAction
            className="flow-nav-close"
            label="메뉴 닫기"
            onClick={() => setNavOpen(false)}
          >
            <X size={19} />
          </IconAction>
        </div>
        <button
          className="flow-compose-primary"
          type="button"
          onClick={() => setComposeOpen(true)}
        >
          <PencilLine size={18} />
          <span>새 메일</span>
          <span className="flow-keycap">C</span>
        </button>
        <div className="flow-nav-label">메일함</div>
        <nav className="flow-navigation" aria-label="메일 폴더">
          {folders.map(item => {
            const Icon = item.icon;
            const count =
              item.id === "inbox"
                ? unreadCount
                : item.id === "starred"
                  ? starred.size
                  : item.id === "drafts"
                    ? Number(hasDraft)
                    : 0;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => chooseFolder(item.id)}
                className={[
                  "flow-nav-item",
                  folder === item.id && "is-selected",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={folder === item.id ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {count > 0 && <small>{count}</small>}
              </button>
            );
          })}
        </nav>
        <div className="flow-nav-label flow-label-heading">빠른 필터</div>
        <div className="flow-label-nav">
          {["프로젝트", "개인", "읽을거리"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                chooseFolder("inbox");
                setQuery(label);
              }}
            >
              <span className={["flow-label-dot", "tone-" + index].join(" ")} />
              {label}
            </button>
          ))}
        </div>
        <div className="flow-sidebar-bottom">
          <div className="flow-demo-note">
            <span className="flow-demo-dot" />
            인터랙티브 데모 <span className="flow-demo-tag">DEMO</span>
          </div>
          <p>실제 메일 계정과 연결되어 있지 않습니다.</p>
          <button
            type="button"
            onClick={() => toast("Nocturne Mail UI 프로토타입입니다.")}
          >
            <Settings2 size={17} />
            설정 및 정보
          </button>
        </div>
      </aside>

      <section className="flow-shell" aria-label="Nocturne Mail">
        <header className="flow-topbar">
          <div className="flow-topbar-left">
            <IconAction
              className="flow-menu-toggle"
              label="메뉴 열기"
              onClick={() => setNavOpen(true)}
            >
              <Menu size={21} />
            </IconAction>
            <div className="flow-topbar-title">
              <span className="flow-mobile-logo">nocturne</span>
              <span>나의 메일 공간</span>
            </div>
          </div>
          <div className="flow-topbar-right">
            <span className="flow-topbar-demo">
              <span />
              데모 모드
            </span>
            <IconAction
              label="알림 확인"
              onClick={() => toast("새로운 알림이 없습니다.")}
            >
              <Bell size={19} />
            </IconAction>
            <button
              className="flow-profile"
              onClick={() => toast("프로필 기능은 데모에서 제공되지 않습니다.")}
              type="button"
              aria-label="프로필"
            >
              <span>M</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="flow-workspace">
          <section className="flow-list-panel" aria-label="메일 목록">
            <div className="flow-list-heading">
              <div className="flow-section-topline">
                <span>MAILBOX</span>
                <span>{visible.length}개 대화</span>
              </div>
              <h1>{heading}</h1>
              <p>
                {folder === "inbox"
                  ? "오늘의 대화를 차분하게 살펴보세요."
                  : "필요한 대화를 한곳에서 확인하세요."}
              </p>
            </div>
            <div className="flow-list-controls">
              <label className="flow-search">
                <Search size={18} />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="메일 검색"
                  aria-label="메일 검색"
                />
                {!query && <kbd>⌘ K</kbd>}
              </label>
              <div className="flow-filter-row">
                <div
                  className="flow-segmented"
                  role="group"
                  aria-label="메일 필터"
                >
                  {filters.map(item => (
                    <button
                      key={item.id}
                      className={filter === item.id ? "is-active" : ""}
                      type="button"
                      aria-pressed={filter === item.id}
                      onClick={() => setFilter(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <IconAction
                  label="새로고침"
                  onClick={() =>
                    toast("새 메일이 없습니다.", {
                      description: "화면은 데모 데이터로 구성되어 있습니다.",
                    })
                  }
                >
                  <RefreshCw size={18} />
                </IconAction>
              </div>
            </div>
            <div className="flow-message-list">
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map(mail => (
                  <motion.article
                    key={mail.id}
                    layout="position"
                    className={[
                      "flow-message-row",
                      selected?.id === mail.id && "is-selected",
                      !read.has(mail.id) && "is-unread",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }
                    }
                    transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                  >
                    <button
                      type="button"
                      className="flow-message-main"
                      aria-pressed={selected?.id === mail.id}
                      onClick={() => chooseMail(mail.id)}
                    >
                      <Avatar name={mail.sender} />
                      <span className="flow-row-text">
                        <span className="flow-row-first">
                          <strong>{mail.sender}</strong>
                          <time>{mail.time}</time>
                        </span>
                        <span className="flow-row-subject">{mail.subject}</span>
                        <span className="flow-row-preview">{mail.preview}</span>
                        <span className="flow-row-bottom">
                          <span>{mail.label}</span>
                          {mail.attachment && <Paperclip size={13} />}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={[
                        "flow-row-star",
                        starred.has(mail.id) && "is-starred",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={
                        starred.has(mail.id) ? "별표 해제" : "별표 표시"
                      }
                      aria-pressed={starred.has(mail.id)}
                      onClick={() => toggleStar(mail.id)}
                    >
                      <motion.span
                        whileTap={reduceMotion ? undefined : { scale: 1.15 }}
                      >
                        <Star
                          size={17}
                          fill={starred.has(mail.id) ? "currentColor" : "none"}
                        />
                      </motion.span>
                    </button>
                    {!read.has(mail.id) && (
                      <span
                        className="flow-unread-dot"
                        aria-label="읽지 않음"
                      />
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
              {visible.length === 0 && (
                <div className="flow-empty-list">
                  <div className="flow-empty-symbol">
                    {folder === "drafts" ? (
                      <PencilLine size={26} />
                    ) : (
                      <Inbox size={26} />
                    )}
                  </div>
                  <strong>
                    {folder === "drafts" && hasDraft
                      ? "작성 중인 메일이 있어요"
                      : "표시할 메일이 없어요"}
                  </strong>
                  <p>다른 폴더나 검색어를 확인해 보세요.</p>
                  {folder === "drafts" && (
                    <button type="button" onClick={() => setComposeOpen(true)}>
                      {hasDraft ? "이어서 작성" : "새 메일 작성"}
                      <ArrowRight size={15} />
                    </button>
                  )}
                  {Boolean(query) && (
                    <button type="button" onClick={() => setQuery("")}>
                      검색 초기화
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flow-list-footer">
              <span>메일 데모</span>
              <span>
                {visible.length} /{" "}
                {folder === "sent" ? sent.length : seed.length}
              </span>
            </div>
          </section>

          <section className="flow-reader" aria-label="메일 읽기">
            {selected ? (
              <>
                <div className="flow-reader-toolbar">
                  <div className="flow-reader-back">
                    <IconAction
                      className="flow-mobile-back"
                      label="목록으로 돌아가기"
                      onClick={() => setMobileReading(false)}
                    >
                      <ArrowLeft size={19} />
                    </IconAction>
                    <span>{heading}</span>
                    <span className="flow-chevron">/</span>
                    <span>메일 읽기</span>
                  </div>
                  <div className="flow-reader-actions">
                    <IconAction
                      label="보관"
                      onClick={() => moveSelected("archive")}
                    >
                      <Archive size={18} />
                    </IconAction>
                    <IconAction
                      label={
                        read.has(selected.id) ? "안읽음 표시" : "읽음 표시"
                      }
                      onClick={toggleRead}
                    >
                      {read.has(selected.id) ? (
                        <Mail size={18} />
                      ) : (
                        <CheckCheck size={18} />
                      )}
                    </IconAction>
                    <IconAction
                      label="삭제"
                      onClick={() => moveSelected("trash")}
                    >
                      <Trash2 size={18} />
                    </IconAction>
                    <span className="flow-action-separator" />
                    <div className="flow-more-wrap">
                      <IconAction
                        label="추가 메뉴"
                        onClick={() => setMoreOpen(x => !x)}
                      >
                        <MoreHorizontal size={20} />
                      </IconAction>
                      {moreOpen && (
                        <div className="flow-more-menu">
                          <button
                            type="button"
                            onClick={() => moveSelected("snooze")}
                          >
                            <Clock3 size={16} />
                            다시 알림
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              toggleStar(selected.id);
                              setMoreOpen(false);
                            }}
                          >
                            <Star size={16} />
                            별표 전환
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={selected.id}
                    className="flow-reader-scroll"
                    initial={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: 9 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
                  >
                    <div className="flow-reader-inner">
                      <div className="flow-message-top">
                        <span className="flow-mail-category">
                          {selected.label}
                        </span>
                        <span className="flow-meta-date">
                          {selected.date} · {selected.time}
                        </span>
                      </div>
                      <h2>{selected.subject}</h2>
                      <div className="flow-sender-card">
                        <Avatar name={selected.sender} large />
                        <div className="flow-sender-details">
                          <strong>{selected.sender}</strong>
                          <span>{selected.address}</span>
                          <small>받는 사람: 나</small>
                        </div>
                        <IconAction
                          label={
                            starred.has(selected.id) ? "별표 해제" : "별표 표시"
                          }
                          selected={starred.has(selected.id)}
                          onClick={() => toggleStar(selected.id)}
                        >
                          <Star
                            size={19}
                            fill={
                              starred.has(selected.id) ? "currentColor" : "none"
                            }
                          />
                        </IconAction>
                      </div>
                      <div className="flow-mail-body">
                        {selected.body.map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                      {selected.attachment && (
                        <div className="flow-attachments">
                          <div className="flow-attachment-heading">
                            <Paperclip size={17} />
                            <strong>첨부파일</strong>
                            <span>데모</span>
                          </div>
                          <button
                            type="button"
                            className="flow-attachment"
                            onClick={() =>
                              toast("실제 첨부파일은 포함되지 않은 데모입니다.")
                            }
                          >
                            <span className="flow-pdf-icon">
                              <FileText size={20} />
                            </span>
                            <span>
                              <strong>document_preview.pdf</strong>
                              <small>미리보기 파일 · 데모</small>
                            </span>
                            <ArrowRight size={17} />
                          </button>
                        </div>
                      )}
                      <div className="flow-reply-row">
                        <button
                          type="button"
                          className="flow-reply-main"
                          onClick={startReply}
                        >
                          <Reply size={18} />
                          답장
                        </button>
                        <button
                          type="button"
                          className="flow-reply-secondary"
                          onClick={() => {
                            setRecipient("");
                            setSubject("Fwd: " + selected.subject);
                            setBody("");
                            setComposeOpen(true);
                          }}
                        >
                          <Forward size={17} />
                          전달
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              <div className="flow-reader-empty">
                <span>
                  <Mail size={30} />
                </span>
                <h2>대화를 선택해 주세요</h2>
                <p>왼쪽 목록에서 메일을 열어보세요.</p>
              </div>
            )}
          </section>
        </div>
      </section>

      <Dialog.Root open={composeOpen} onOpenChange={setComposeOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="flow-dialog-overlay" />
          <Dialog.Content
            className="flow-compose-dialog"
            aria-describedby="flow-compose-description"
          >
            <div className="flow-compose-head">
              <div>
                <span>새로운 대화</span>
                <Dialog.Title>새 메일</Dialog.Title>
              </div>
              <Dialog.Close
                className="flow-compose-close"
                aria-label="작성 창 닫기"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
            <Dialog.Description
              id="flow-compose-description"
              className="flow-compose-notice"
            >
              화면 데모입니다. 실제 이메일은 전송되지 않습니다.
            </Dialog.Description>
            <div className="flow-compose-fields">
              <label>
                <span>받는 사람</span>
                <input
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="name@example.com"
                  type="email"
                />
              </label>
              <label>
                <span>제목</span>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="메일 제목을 입력하세요"
                />
              </label>
              <label className="flow-compose-body">
                <span>내용</span>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="메시지를 작성해 보세요…"
                />
              </label>
            </div>
            <div className="flow-compose-footer">
              <button
                type="button"
                className="flow-compose-discard"
                onClick={clearDraft}
              >
                <Trash2 size={16} />
                버리기
              </button>
              <div>
                <span>데모 전송</span>
                <button
                  type="button"
                  className="flow-compose-send"
                  onClick={sendDemo}
                >
                  보내기
                  <Send size={17} />
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
