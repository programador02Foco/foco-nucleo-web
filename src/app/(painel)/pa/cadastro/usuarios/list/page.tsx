"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Table, Tag, message } from "antd";
import { api } from "@/lib/api";

type UserRow = {
  id: number;
  name: string;
  email: string;
  user_name: string;
  type: string;
  status: string;
  role: string;
};

const papeis = [
  { value: "Administrator", label: "Administrador" },
  { value: "Basic", label: "Básico" },
  { value: "Contador", label: "Contador" },
];

function papelCanonico(role: string) {
  return papeis.find((item) => item.value.toLowerCase() === role.trim().toLowerCase())?.value ?? "";
}

function nomePapel(role: string) {
  const canonico = papelCanonico(role);
  return papeis.find((item) => item.value === canonico)?.label ?? role || "Sem papel";
}

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ role: string; password?: string; confirm?: string }>();

  async function load() {
    const data = await api<UserRow[]>("/users");
    setRows(data);
  }

  useEffect(() => {
    Promise.all([
      api<{ userRoles?: { description: string }[] }>("/usersAutentication"),
      api<UserRow[]>("/users"),
    ])
      .then(([me, data]) => {
        setAdmin(
          Boolean(me.userRoles?.some((role) => role.description.toLowerCase() === "administrator")),
        );
        setRows(data);
      })
      .finally(() => setLoading(false));
  }, []);

  function openEdit(row: UserRow) {
    form.resetFields();
    setEditing(row);
  }

  async function save() {
    if (!editing) return;
    const role = (form.getFieldValue("role") as string | undefined) || papelCanonico(editing.role);
    if (!role) {
      message.error("Escolha o papel.");
      return;
    }
    form.setFieldsValue({ role });
    const values = await form.validateFields();
    const password = values.password?.trim() ?? "";
    setSaving(true);
    try {
      await api(`/users/${editing.id}/acesso`, {
        method: "PUT",
        body: JSON.stringify({
          role,
          ...(password ? { password } : {}),
        }),
      });
      message.success("Senha e papel atualizados.");
      setEditing(null);
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Usuários</h2>
      {admin ? null : (
        <p style={{ color: "#666" }}>Somente o administrador altera senha e papel.</p>
      )}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        columns={[
          { title: "Id", dataIndex: "id", width: 80 },
          { title: "Nome", dataIndex: "name" },
          { title: "E-mail", dataIndex: "email" },
          { title: "Nome de Usuário", dataIndex: "user_name" },
          {
            title: "Papel",
            dataIndex: "role",
            width: 160,
            render: (role: string) => nomePapel(role),
          },
          { title: "Tipo", dataIndex: "type", width: 120 },
          {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (status: string) => (
              <Tag color={status === "A" ? "green" : "red"}>{status === "A" ? "Ativo" : "Inativo"}</Tag>
            ),
          },
          ...(admin
            ? [
                {
                  title: "",
                  width: 120,
                  render: (_: unknown, row: UserRow) => (
                    <Button type="link" onClick={() => openEdit(row)}>
                      Alterar
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />
      <Modal
        title={editing ? `Senha e papel de ${editing.name}` : "Senha e papel"}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={save}
        confirmLoading={saving}
        okText="Salvar"
        destroyOnHidden
      >
        <p style={{ color: "#666" }}>Deixe a senha em branco para manter a atual.</p>
        {editing ? (
        <Form
          key={editing.id}
          form={form}
          layout="vertical"
          initialValues={{ role: papelCanonico(editing.role), password: "", confirm: "" }}
        >
          <Form.Item
            label="Papel"
            name="role"
            rules={[{ required: true, message: "Escolha o papel" }]}
          >
            <Select options={papeis} placeholder="Selecione o papel" />
          </Form.Item>
          <Form.Item
            label="Nova senha"
            name="password"
            rules={[
              {
                validator(_, value: string | undefined) {
                  if (!value?.trim()) return Promise.resolve();
                  if (value.trim().length < 4) {
                    return Promise.reject(new Error("A senha deve ter pelo menos 4 caracteres"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password placeholder="Digite a nova senha" />
          </Form.Item>
          <Form.Item
            label="Confirmar nova senha"
            name="confirm"
            dependencies={["password"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value: string | undefined) {
                  const password = String(getFieldValue("password") ?? "").trim();
                  const confirm = String(value ?? "").trim();
                  if (!password && !confirm) return Promise.resolve();
                  if (!confirm) return Promise.reject(new Error("Confirme a nova senha"));
                  if (password !== confirm) return Promise.reject(new Error("As senhas não coincidem"));
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirme a nova senha" />
          </Form.Item>
        </Form>
        ) : null}
      </Modal>
    </div>
  );
}
