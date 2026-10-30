"use client";

import { useEffect, useState } from "react";
import { Button, Dropdown, Input, Modal, Select, Table, Tag, message } from "antd";
import { api } from "@/lib/api";

type RoleRow = { description: string };

type UserRow = {
  id: number;
  name: string;
  email: string;
  user_name: string;
  type: string;
  status: string;
  role?: string;
  userRoles?: RoleRow[];
};

const papeis = [
  { value: "Administrator", label: "Administrador" },
  { value: "Basic", label: "Básico" },
  { value: "Contador", label: "Contador" },
];

function papelCanonico(role: string) {
  const texto = role.trim().toLowerCase();
  return papeis.find((item) => item.value.toLowerCase() === texto)?.value ?? "";
}

function papelDaPessoa(row: UserRow) {
  const bruto = row.role || row.userRoles?.[0]?.description || "";
  return papelCanonico(bruto);
}

function nomePapel(row: UserRow) {
  const canonico = papelDaPessoa(row);
  return papeis.find((item) => item.value === canonico)?.label ?? "Sem papel";
}

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [papel, setPapel] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [accessType, setAccessType] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  function usersPath(term: string, role?: string) {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    if (role) params.set("access_type", role);
    const query = params.toString();
    return query ? `/users?${query}` : "/users";
  }

  async function load(term = applied, role = accessType) {
    const data = await api<UserRow[]>(usersPath(term, role));
    setRows(data);
  }

  useEffect(() => {
    api<{ userRoles?: RoleRow[] }>("/usersAutentication")
      .then((me) => {
        setAdmin(Boolean(me.userRoles?.some((role) => papelCanonico(role.description) === "Administrator")));
      })
      .catch(() => setAdmin(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setApplied(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    load(applied, accessType).finally(() => setLoading(false));
  }, [applied, accessType]);

  async function changeStatus(row: UserRow) {
    const next = row.status === "A" ? "I" : "A";
    const action = next === "I" ? "inativar" : "ativar";
    Modal.confirm({
      title: next === "I" ? "Inativar usuário" : "Ativar usuário",
      content: `Deseja ${action} ${row.name}?`,
      okText: next === "I" ? "Inativar" : "Ativar",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api(`/users/${row.id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: next }),
          });
          message.success(next === "I" ? "Usuário inativado." : "Usuário ativado.");
          await load();
        } catch (error) {
          message.error(error instanceof Error ? error.message : "Não foi possível alterar o status.");
          throw error;
        }
      },
    });
  }

  function removeUser(row: UserRow) {
    Modal.confirm({
      title: "Excluir usuário",
      content: `Excluir ${row.name}? Essa pessoa deixa de entrar no sistema.`,
      okText: "Excluir",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api(`/users/${row.id}`, { method: "DELETE" });
          message.success("Usuário excluído.");
          await load();
        } catch (error) {
          message.error(error instanceof Error ? error.message : "Não foi possível excluir.");
          throw error;
        }
      },
    });
  }

  function openEdit(row: UserRow) {
    setPapel(papelDaPessoa(row));
    setSenha("");
    setConfirma("");
    setEditing(row);
  }

  async function save() {
    if (!editing) return;
    if (!papel) {
      message.error("Escolha o papel.");
      return;
    }
    const nova = senha.trim();
    const repetida = confirma.trim();
    if ((nova || repetida) && nova !== repetida) {
      message.error("As senhas não coincidem.");
      return;
    }
    if (nova && nova.length < 4) {
      message.error("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await api(`/users/${editing.id}/acesso`, {
        method: "PUT",
        body: JSON.stringify({
          role: papel,
          ...(nova ? { password: nova } : {}),
        }),
      });
      message.success(nova ? "Senha e papel atualizados." : "Papel atualizado.");
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
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Input.Search
          allowClear
          placeholder="Pesquisar por nome, e-mail ou usuário"
          style={{ maxWidth: 420 }}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={(value) => setApplied(value.trim())}
        />
        <Select
          allowClear
          placeholder="Filtrar por tipo de acesso"
          style={{ width: 220 }}
          value={accessType}
          options={papeis}
          onChange={(value) => setAccessType(value)}
        />
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: 10,
          showSizeChanger: true,
          onChange: (next) => setPage(next),
        }}
        columns={[
          { title: "Id", dataIndex: "id", width: 80 },
          { title: "Nome", dataIndex: "name" },
          { title: "E-mail", dataIndex: "email" },
          { title: "Nome de Usuário", dataIndex: "user_name" },
          {
            title: "Papel",
            width: 160,
            render: (_: unknown, row: UserRow) => nomePapel(row),
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
                  title: "Ações",
                  width: 120,
                  render: (_: unknown, row: UserRow) => (
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          { key: "alterar", label: "Alterar senha e acesso" },
                          { key: "status", label: row.status === "A" ? "Inativar usuário" : "Ativar usuário" },
                          { key: "excluir", label: "Excluir usuário", danger: true },
                        ],
                        onClick: ({ key }) => {
                          if (key === "alterar") openEdit(row);
                          if (key === "status") void changeStatus(row);
                          if (key === "excluir") removeUser(row);
                        },
                      }}
                    >
                      <Button>Ações</Button>
                    </Dropdown>
                  ),
                },
              ]
            : []),
        ]}
      />
      <Modal
        title="Alterar senha e acesso"
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={save}
        confirmLoading={saving}
        okText="Salvar"
        destroyOnHidden
      >
        <p style={{ marginBottom: 16 }}>
          {editing ? editing.name : ""}
          {editing?.email ? ` — ${editing.email}` : ""}
        </p>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 6 }}>Papel</div>
          <Select
            style={{ width: "100%" }}
            placeholder="Selecione o papel"
            options={papeis}
            value={papel || undefined}
            onChange={setPapel}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 6 }}>Nova senha</div>
          <Input.Password
            placeholder="Digite a nova senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          />
        </div>
        <div>
          <div style={{ marginBottom: 6 }}>Confirmar nova senha</div>
          <Input.Password
            placeholder="Confirme a nova senha"
            value={confirma}
            onChange={(event) => setConfirma(event.target.value)}
          />
        </div>
        <p style={{ color: "#666", marginTop: 12, marginBottom: 0 }}>
          A senha só muda se as duas forem preenchidas e iguais. Em branco, ela permanece.
        </p>
      </Modal>
    </div>
  );
}
