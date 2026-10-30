"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Dropdown, Form, Input, Modal, Table, Tag, message } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EyeOutlined,
  SearchOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { api, readSession } from "@/lib/api";

type Collector = {
  id: number;
  name: string;
  email: string;
  cpf: string;
  username: string;
  collector_status: string;
  user_collector_id: number;
  manager_id: number;
};

type FoundUser = {
  id: number;
  name: string;
  email: string;
  cpf: string;
  isvinculed: boolean;
  isManagedByAuth: boolean;
};

export default function MonitoriaPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [rows, setRows] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoundUser[]>([]);
  const [picked, setPicked] = useState<FoundUser | null>(null);

  async function load(term = search) {
    const userId = readSession()?.userId;
    if (!userId) {
      window.location.assign("/login");
      return;
    }
    setLoading(true);
    try {
      const query = new URLSearchParams({ managerId: String(userId), status: "A", search: term });
      const data = await api<Collector[]>(`/user-collectors?${query.toString()}`);
      setRows(data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
    // carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => rows, [rows]);

  function closeDrawer() {
    setOpen(false);
    form.resetFields();
    setResults([]);
    setPicked(null);
  }

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Monitoria de Usuários</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Pesquisar por nome, email ou CPF..."
          style={{ width: 400 }}
          onSearch={(value) => {
            setSearch(value);
            void load(value);
          }}
        />
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setOpen(true)}>
          Vincular Usuário
        </Button>
      </div>
      <Table
        rowKey="user_collector_id"
        loading={loading}
        dataSource={data}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        columns={[
          { title: "ID", dataIndex: "id", width: "8%", align: "center" },
          { title: "Nome", dataIndex: "name", width: "25%" },
          { title: "Email", dataIndex: "email", width: "25%" },
          { title: "CPF", dataIndex: "cpf", width: "15%", align: "center" },
          { title: "Usuário", dataIndex: "username", width: "15%", align: "center" },
          {
            title: "Status",
            dataIndex: "collector_status",
            width: "10%",
            align: "center",
            render: (status: string) => (
              <Tag color={status === "A" ? "green" : "red"}>{status === "A" ? "Ativo" : "Inativo"}</Tag>
            ),
          },
          {
            title: "Ações",
            width: "12%",
            align: "center",
            render: (_, record) => (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "detalhar",
                      icon: <EyeOutlined style={{ color: "#1890ff" }} />,
                      label: "Detalhar",
                      onClick: () =>
                        router.push(`/monitoria/${record.id}?nome=${encodeURIComponent(record.name)}`),
                    },
                    {
                      key: "excluir",
                      icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
                      label: "Excluir Vínculo",
                      onClick: () =>
                        Modal.confirm({
                          title: "Confirmar exclusão?",
                          content: `Deseja excluir o vínculo com ${record.name}?`,
                          okText: "Sim",
                          cancelText: "Não",
                          onOk: async () => {
                            await api(`/user-collectors/${record.user_collector_id}`, { method: "DELETE" });
                            message.success("Vínculo excluído com sucesso!");
                            await load();
                          },
                        }),
                    },
                  ],
                }}
              >
                <Button type="primary">
                  Ações <DownOutlined />
                </Button>
              </Dropdown>
            ),
          },
        ]}
        footer={() => <strong>Total de Usuários Vinculados: {data.length}</strong>}
      />

      <Drawer title="Vincular Usuário" placement="right" width={600} open={open} onClose={closeDrawer}>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Informe o email" }]}>
            <Input placeholder="Email do usuário" />
          </Form.Item>
          <Form.Item name="cpf" label="CPF" rules={[{ required: true, message: "Informe o cpf da Empresa" }]}>
            <Input placeholder="cpf da empresa" />
          </Form.Item>
          <Button
            icon={<SearchOutlined />}
            loading={searching}
            block
            onClick={async () => {
              const values = form.getFieldsValue() as { email?: string; cpf?: string };
              if (!values.email || !values.cpf) {
                message.error("Preencha email e cpf para procurar");
                return;
              }
              setSearching(true);
              try {
                const query = new URLSearchParams({
                  email: values.email,
                  cpf: values.cpf.replace(/\D/g, ""),
                });
                const found = await api<FoundUser[]>(`/users/search-by-email-cpf?${query.toString()}`);
                setResults(found);
                setPicked(null);
                form.setFieldsValue({ email: "", cpf: "" });
              } catch (error) {
                message.error(error instanceof Error ? error.message : "Erro ao buscar");
                setResults([]);
              } finally {
                setSearching(false);
              }
            }}
          >
            Procurar Usuário
          </Button>
        </Form>
        <div style={{ marginTop: 16 }}>
          {results.length === 0 && !searching ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#999" }}>
              <SearchOutlined style={{ fontSize: 32, marginBottom: 12 }} />
              <div>Preencha email e cpf e clique em Procurar</div>
            </div>
          ) : null}
          {results.map((user) => {
            const blocked = user.isvinculed && user.isManagedByAuth;
            const selected = picked?.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => {
                  if (!blocked) setPicked(user);
                }}
                style={{
                  padding: 16,
                  marginBottom: 12,
                  borderRadius: 8,
                  background: blocked ? "#fafafa" : selected ? "#e6f7ff" : "#fff",
                  border: selected ? "2px solid #1890ff" : "1px solid #f0f0f0",
                  cursor: blocked ? "not-allowed" : "pointer",
                  opacity: blocked ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <UserOutlined style={{ fontSize: 20, marginRight: 12, color: blocked ? "#999" : "#1890ff" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ color: "#666" }}>ID: {user.id}</div>
                  </div>
                  {blocked || selected ? <CheckCircleOutlined style={{ fontSize: 20, color: blocked ? "#52c41a" : "#1890ff" }} /> : null}
                </div>
                <div style={{ color: "#666", marginLeft: 32 }}>
                  <div><strong>CPF:</strong> {user.cpf}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                </div>
                {blocked ? <div style={{ marginTop: 12, marginLeft: 32, color: "#52c41a" }}>Já vinculado ao sistema</div> : null}
              </div>
            );
          })}
          {results.length > 0 ? (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              disabled={!picked}
              block
              size="large"
              onClick={async () => {
                if (!picked) return;
                const managerId = readSession()?.userId;
                await api("/user-collectors", {
                  method: "POST",
                  body: JSON.stringify({ userId: picked.id, managerId, status: "A" }),
                });
                message.success("Usuário vinculado com sucesso!");
                closeDrawer();
                await load();
              }}
            >
              Vincular Usuário Selecionado
            </Button>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
