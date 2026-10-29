"use client";

import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { api } from "@/lib/api";

type Group = { id: number; description: string; status: string };

export default function GrupoEmpresaPage() {
  const [rows, setRows] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Group[]>("/groups")
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Grupo de Empresa</h2>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "ID", dataIndex: "id", width: 80 },
          { title: "Descrição", dataIndex: "description" },
          {
            title: "Status",
            dataIndex: "status",
            width: 120,
            render: (status: string) => (
              <Tag color={status === "A" ? "green" : "red"}>{status === "A" ? "Ativo" : "Inativo"}</Tag>
            ),
          },
        ]}
      />
    </div>
  );
}
