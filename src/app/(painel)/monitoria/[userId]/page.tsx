"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, DatePicker, Modal, Select, Table, Tag } from "antd";
import { ArrowLeftOutlined, EnvironmentOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { api } from "@/lib/api";

type Point = {
  id: number;
  lat: number;
  lng: number;
  timestamp: string;
  mode: string;
};

const modes = [
  { value: "background", label: "App. Fechado" },
  { value: "foreground", label: "App. Aberto" },
];

const modeMap: Record<string, { text: string; color: string }> = {
  background: { text: "App. Fechado", color: "orange" },
  foreground: { text: "App. Aberto", color: "blue" },
};

export default function MonitoriaDetailPage() {
  const params = useParams<{ userId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const name = search.get("nome") ?? "";
  const [mode, setMode] = useState<string>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [rows, setRows] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapPoint, setMapPoint] = useState<Point | null>(null);

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (range?.[0]) query.set("timestampFrom", range[0].startOf("day").toISOString());
      if (range?.[1]) query.set("timestampTo", range[1].endOf("day").toISOString());
      const data = await api<Point[]>(`/collector-locations/user/${params.userId}?${query.toString()}`);
      setRows(mode ? data.filter((point) => point.mode === mode) : data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId, mode, range]);

  const list = useMemo(() => rows, [rows]);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Localização do Usuário</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Select
          allowClear
          placeholder="Modo (opcional)"
          options={modes}
          value={mode}
          onChange={setMode}
          style={{ width: 200 }}
        />
        <DatePicker.RangePicker
          allowClear
          value={range}
          onChange={(value) => setRange(value && value[0] && value[1] ? [value[0], value[1]] : null)}
          format="YYYY-MM-DD"
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            Recarregar
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/monitoria")}>
            Voltar
          </Button>
        </div>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        columns={[
          { title: "Código", dataIndex: "id", width: 90 },
          { title: "Usuário", render: () => name || "-" },
          { title: "Cidade", render: () => "-" },
          { title: "Estado/UF", render: () => "-" },
          {
            title: "Situacao App",
            dataIndex: "mode",
            width: 140,
            render: (value: string) => {
              const info = modeMap[value] ?? { text: value, color: "default" };
              return <Tag color={info.color}>{info.text}</Tag>;
            },
          },
          {
            title: "Data/Hora",
            dataIndex: "timestamp",
            render: (value: string) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
          },
          {
            title: "Ações",
            render: (_, record) => (
              <Button type="primary" icon={<EnvironmentOutlined />} onClick={() => setMapPoint(record)}>
                Detalhes
              </Button>
            ),
          },
        ]}
      />
      <Modal title="Local no Mapa" open={!!mapPoint} onCancel={() => setMapPoint(null)} footer={null} width={800}>
        {mapPoint ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div><strong>Usuário:</strong> {name || "-"}</div>
              <div>
                <strong>Data/Hora:</strong> {dayjs(mapPoint.timestamp).format("DD/MM/YYYY HH:mm")}
              </div>
            </div>
            <iframe
              title="map"
              width="100%"
              height="450"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${mapPoint.lat},${mapPoint.lng}&z=16&output=embed`}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
