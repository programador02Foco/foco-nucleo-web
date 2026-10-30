"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Select, Transfer, message } from "antd";
import { api } from "@/lib/api";

type Person = { id: number; name: string; email: string };
type Company = {
  id: number;
  code: string;
  fantasy_name: string;
  cnpj: string;
  linked: boolean;
};

export default function CompanyAccessPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ userRoles?: { description: string }[] }>("/usersAutentication")
      .then((me) => {
        const allowed = Boolean(
          me.userRoles?.some((role) => role.description.toLowerCase() === "administrator"),
        );
        setAdmin(allowed);
        if (!allowed) return;
        return api<Person[]>("/users").then(setPeople);
      })
      .catch(() => setAdmin(false));
  }, []);

  async function load(id: number) {
    setLoading(true);
    try {
      const data = await api<{ businesses: Company[] }>(`/user-businesses/${id}`);
      setCompanies(data.businesses);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Não foi possível carregar as empresas.");
    } finally {
      setLoading(false);
    }
  }

  const linked = useMemo(
    () => companies.filter((company) => company.linked).map((company) => String(company.id)),
    [companies],
  );

  async function change(nextKeys: string[]) {
    if (!userId) return;
    const previous = new Set(linked);
    const next = new Set(nextKeys);
    const added = nextKeys.filter((key) => !previous.has(key));
    const removed = [...previous].filter((key) => !next.has(key));
    setCompanies((current) =>
      current.map((company) => ({ ...company, linked: next.has(String(company.id)) })),
    );
    try {
      await Promise.all([
        ...added.map((key) =>
          api(`/user-businesses/${userId}`, {
            method: "POST",
            body: JSON.stringify({ businessId: Number(key) }),
          }),
        ),
        ...removed.map((key) => api(`/user-businesses/${userId}/${key}`, { method: "DELETE" })),
      ]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Não foi possível salvar o acesso.");
      await load(userId);
    }
  }

  if (admin === false) {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Empresas do usuário</h2>
        <p>Somente o administrador altera as empresas de cada usuário.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Empresas do usuário</h2>
      <p style={{ color: "#666" }}>
        À esquerda ficam as empresas sem acesso. À direita, as empresas que o usuário já acessa.
      </p>
      <div style={{ maxWidth: 480, marginBottom: 24 }}>
        <Select
          showSearch
          allowClear
          placeholder="Selecione o usuário"
          style={{ width: "100%" }}
          optionFilterProp="label"
          value={userId ?? undefined}
          options={people.map((person) => ({
            value: person.id,
            label: `${person.name} — ${person.email}`,
          }))}
          onChange={(value) => {
            const id = typeof value === "number" ? value : null;
            setUserId(id);
            setCompanies([]);
            if (id) void load(id);
          }}
        />
      </div>
      {userId ? (
        <Transfer
          dataSource={companies.map((company) => ({
            key: String(company.id),
            title: `${company.code} ${company.fantasy_name}`.trim(),
            description: company.cnpj,
          }))}
          titles={["Sem acesso", "Com acesso"]}
          targetKeys={linked}
          onChange={(keys) => void change(keys.map(String))}
          showSearch
          filterOption={(input, item) => {
            const text = `${item.title} ${item.description}`.toLowerCase();
            return text.includes(input.toLowerCase());
          }}
          render={(item) => (
            <span>
              {item.title}
              <span style={{ display: "block", color: "#888", fontSize: 12 }}>{item.description}</span>
            </span>
          )}
          listStyle={{ width: 360, height: 460 }}
          disabled={loading}
        />
      ) : (
        <Button type="link" disabled>
          Escolha um usuário para ver as empresas.
        </Button>
      )}
    </div>
  );
}
