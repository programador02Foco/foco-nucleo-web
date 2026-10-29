"use client";

import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { api } from "@/lib/api";

type Business = {
  id: number;
  fantasy_name: string;
  company_name: string;
  code: string;
  cnpj: string;
  status: string;
};

export default function CentralBusinessPage() {
  const [rows, setRows] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Business[]>("/businesses")
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Central de Empresas</h2>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        columns={[
          { title: "ID", dataIndex: "id", width: 80 },
          { title: "Nome Fantasia", dataIndex: "fantasy_name" },
          { title: "Razão Social", dataIndex: "company_name" },
          { title: "Filial", dataIndex: "code", width: 100 },
          { title: "CNPJ", dataIndex: "cnpj", width: 180 },
          {
            title: "Status",
            dataIndex: "status",
            width: 100,
            render: (status: string) => (
              <Tag color={status === "A" ? "green" : "red"}>{status === "A" ? "Ativo" : "Inativo"}</Tag>
            ),
          },
        ]}
      />
    </div>
  );
}
