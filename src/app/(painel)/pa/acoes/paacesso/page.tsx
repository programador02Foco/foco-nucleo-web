"use client";

import { useEffect, useState } from "react";
import { Select, Table, Tag } from "antd";
import { api } from "@/lib/api";

type UserRow = { id: number; name: string; email: string };
type Access = { id: number; form_name: string; checked: string; access_removed: string };

export default function AcessoPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userId, setUserId] = useState<number>();
  const [rows, setRows] = useState<Access[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<UserRow[]>("/users").then(setUsers);
  }, []);

  useEffect(() => {
    if (!userId) {
      setRows([]);
      return;
    }
    setLoading(true);
    api<Access[]>(`/accesses/${userId}`)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Acessos por Usuário</h2>
      <Select
        showSearch
        optionFilterProp="label"
        placeholder="Selecione o usuário"
        style={{ width: 420, marginBottom: 16 }}
        value={userId}
        onChange={setUserId}
        options={users.map((user) => ({ value: user.id, label: `${user.name} — ${user.email}` }))}
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Formulário", dataIndex: "form_name" },
          {
            title: "Liberado",
            dataIndex: "checked",
            width: 120,
            render: (value: string) => <Tag color={value === "S" ? "green" : "default"}>{value === "S" ? "Sim" : "Não"}</Tag>,
          },
          {
            title: "Removido",
            dataIndex: "access_removed",
            width: 120,
            render: (value: string) => <Tag color={value === "S" ? "red" : "default"}>{value === "S" ? "Sim" : "Não"}</Tag>,
          },
        ]}
      />
    </div>
  );
}
