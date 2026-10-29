"use client";

import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { api } from "@/lib/api";

type UserRow = {
  id: number;
  name: string;
  email: string;
  user_name: string;
  type: string;
  status: string;
};

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<UserRow[]>("/users")
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Usuários</h2>
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
          { title: "Tipo", dataIndex: "type", width: 120 },
          {
            title: "Status",
            dataIndex: "status",
            width: 110,
            render: (status: string) => (
              <Tag color={status === "A" ? "green" : "red"}>{status === "A" ? "Ativo" : "Inativo"}</Tag>
            ),
          },
        ]}
      />
    </div>
  );
}
