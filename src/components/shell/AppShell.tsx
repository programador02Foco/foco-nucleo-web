"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Breadcrumb,
  Button,
  ConfigProvider,
  Drawer,
  Input,
  Layout,
  Switch,
  Tooltip,
  theme,
} from "antd";
import {
  AppstoreOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EyeOutlined,
  FormOutlined,
  HomeOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { api, clearSession } from "@/lib/api";

const { Header, Content, Sider } = Layout;

type ModuleKey = "hm" | "lc" | "mo" | "pa";

const modules: { key: ModuleKey; label: string; icon: ReactNode }[] = [
  { key: "hm", label: "Home", icon: <HomeOutlined /> },
  { key: "lc", label: "Licença", icon: <SafetyCertificateOutlined /> },
  { key: "mo", label: "Monitoria", icon: <EyeOutlined /> },
  { key: "pa", label: "Parâmetro", icon: <SettingOutlined /> },
];

const moduleName: Record<ModuleKey, string> = {
  hm: "Home",
  lc: "Licença",
  mo: "Monitoria",
  pa: "Parâmetro",
};

const menus: Record<ModuleKey, { label: string; items: { label: string; href: string }[] }[]> = {
  hm: [],
  lc: [
    {
      label: "",
      items: [{ label: "Central de Empresas", href: "/lc/acoes/business/centralbusiness" }],
    },
    {
      label: "Cadastros",
      items: [{ label: "Grupo de Empresa", href: "/lc/cadastro/grupoempresa/list" }],
    },
  ],
  mo: [
    {
      label: "",
      items: [{ label: "Monitoramento", href: "/monitoria" }],
    },
  ],
  pa: [
    {
      label: "",
      items: [
        { label: "Acessos por Usuário", href: "/pa/acoes/paacesso" },
        { label: "Empresas do usuário", href: "/pa/acoes/empresas-usuario" },
      ],
    },
    {
      label: "Cadastros",
      items: [{ label: "Usuários", href: "/pa/cadastro/usuarios/list" }],
    },
  ],
};

const crumbs: Record<string, string> = {
  lc: "Licença",
  acoes: "Ações",
  business: "Empresas",
  centralbusiness: "Central de Empresas",
  cadastro: "Cadastros",
  grupoempresa: "Grupo de Empresa",
  list: "Lista",
  monitoria: "Monitoria",
  pa: "Parâmetro",
  paacesso: "Acessos por Usuário",
  "empresas-usuario": "Empresas do usuário",
  usuarios: "Usuários",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ModuleKey>("hm");
  const [showMenu, setShowMenu] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const dark = stored === null ? true : stored === "true";
    setDarkMode(dark);
    const raw = localStorage.getItem("userProfile");
    if (raw) {
      try {
        setProfile(JSON.parse(raw) as { name: string; email: string });
      } catch {
        setProfile({ name: "", email: "" });
      }
    }
    api<{ userRoles?: { description: string }[] }>("/usersAutentication")
      .then((me) => {
        setAdmin(
          Boolean(me.userRoles?.some((role) => role.description.toLowerCase() === "administrator")),
        );
      })
      .catch(() => setAdmin(false));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("darkMode", String(darkMode));
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode, ready]);

  useEffect(() => {
    if (pathname.startsWith("/monitoria")) setSelectedKey("mo");
    else if (pathname.startsWith("/lc")) setSelectedKey("lc");
    else if (pathname.startsWith("/pa")) setSelectedKey("pa");
    else setSelectedKey("hm");
  }, [pathname]);

  const breadcrumb = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);

  function openModule(key: ModuleKey) {
    setSelectedKey(key);
    setShowMenu(key !== "hm");
    if (key === "hm" && pathname !== "/") router.push("/");
    if (key === "mo") router.push("/monitoria");
  }

  function leave() {
    clearSession();
    router.push("/login");
  }

  return (
    <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <Layout style={{ height: "100vh", background: "var(--color-bg-container)", color: "var(--color-text)" }}>
        <Header
          style={{
            background: "linear-gradient(90deg, #261157 0%, #39276d 100%)",
            padding: "4px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)",
            minHeight: 40,
            height: 40,
            lineHeight: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 500 }}>
              Organização e segurança para seus documentos, tudo em um só lugar no <strong>Arquiva-e</strong>.
            </span>
            <Button
              type="primary"
              icon={<TagOutlined />}
              size="small"
              style={{
                background: "linear-gradient(90deg, #ffc107, #ffb300)",
                border: "none",
                color: "#000",
                fontWeight: 600,
                borderRadius: 8,
                height: 28,
              }}
            >
              Fale com um especialista
            </Button>
          </div>
        </Header>

        <div
          style={{
            background: "var(--color-bg-container)",
            color: "var(--color-text)",
            padding: "8px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: "bold", display: "flex", alignItems: "center" }}>
              <AppstoreOutlined style={{ color: "#fd9902", marginRight: 8 }} />
              Arquiva-e
              <img src="/images/iconcanada2.png" alt="" style={{ width: 24, height: 24, marginLeft: 8 }} />
              <span style={{ fontSize: 12, marginTop: 15 }}>Pro</span>
            </span>
            <Breadcrumb
              items={[
                { title: "Home" },
                ...breadcrumb.map((segment) => ({
                  title: <span style={{ color: "#fd9902", fontWeight: "bold" }}>{crumbs[segment] ?? segment}</span>,
                })),
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Input
              placeholder="Pesquisar... Pressione F3"
              style={{ width: 220 }}
              readOnly
              prefix={<SearchOutlined style={{ color: "#fd9902" }} />}
            />
            <Avatar
              size={44}
              style={{ background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)", fontWeight: "bold" }}
            >
              {initials(profile.name || profile.email)}
            </Avatar>
            <div>
              <div style={{ fontWeight: "bold", lineHeight: 1.2 }}>{profile.name || "Usuário"}</div>
              <div style={{ fontSize: 12 }}>{profile.email}</div>
            </div>
            <SettingOutlined style={{ fontSize: 20, cursor: "pointer" }} onClick={() => setSettingsOpen(true)} />
          </div>
        </div>

        <Layout style={{ background: "var(--color-bg-container)" }}>
          <Sider
            width={60}
            style={{
              background: "var(--color-bg-container)",
              borderRight: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", paddingTop: 16 }}>
              {modules.map((module) => (
                <Tooltip placement="right" title={module.label} key={module.key}>
                  <div
                    onClick={() => openModule(module.key)}
                    style={{
                      marginBottom: 8,
                      cursor: "pointer",
                      background: selectedKey === module.key ? "#fde3cf" : "transparent",
                      padding: 8,
                      borderRadius: 8,
                      color: selectedKey === module.key ? "#fd9902" : "var(--color-text)",
                      fontSize: 22,
                    }}
                  >
                    {module.icon}
                  </div>
                </Tooltip>
              ))}
              <div style={{ marginTop: "auto", paddingBottom: 16 }}>
                <Tooltip title={showMenu ? "Fechar menu" : "Abrir menu"}>
                  <div
                    onClick={() => setShowMenu((open) => !open)}
                    style={{
                      background: "#fd9902",
                      color: "#fff",
                      borderRadius: 6,
                      padding: 6,
                      cursor: "pointer",
                    }}
                  >
                    {showMenu ? <DoubleLeftOutlined /> : <DoubleRightOutlined />}
                  </div>
                </Tooltip>
              </div>
            </div>
          </Sider>

          {showMenu ? (
            <div
              style={{
                width: 300,
                background: "var(--color-bg-container)",
                color: "var(--color-text)",
                padding: "24px 20px",
                borderRight: "1px solid var(--color-border)",
              }}
            >
              <h3 style={{ color: "#fd9902", marginBottom: 24, fontSize: 20 }}>{moduleName[selectedKey]}</h3>
              {menus[selectedKey].map((group) => (
                <div key={group.label || "acoes"} style={{ marginBottom: 24 }}>
                  {group.label ? (
                    <div style={{ color: "#fd9902", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                      <FormOutlined style={{ marginRight: 6 }} />
                      {group.label}
                    </div>
                  ) : null}
                  {group.items
                    .filter((item) => admin || item.href !== "/pa/acoes/empresas-usuario")
                    .map((item) => {
                    const active = pathname === item.href;
                    return (
                      <div
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setShowMenu(false);
                        }}
                        style={{
                          marginBottom: 8,
                          cursor: "pointer",
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: active ? "#fd9902" : "transparent",
                          color: active ? "#fff" : "var(--color-text)",
                          fontWeight: active ? "bold" : "normal",
                        }}
                      >
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}

          <Content style={{ background: darkMode ? "#262626" : "#f5f5f5", padding: 24, overflow: "auto" }}>
            {children}
          </Content>
        </Layout>

        <Drawer title="Configurações" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <span>Tema escuro</span>
            <Switch
              checked={darkMode}
              onChange={setDarkMode}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
          </div>
          <Button block onClick={leave}>
            Sair
          </Button>
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
}
