"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Checkbox, Form, Input, Switch, Typography } from "antd";
import { EyeInvisibleOutlined, EyeOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import NaoSouRobo, { noComputadorLocal } from "@/components/login/NaoSouRobo";
import "./login.css";

const { Title, Text, Link } = Typography;

type Session = {
  token: { token: string };
  user: { id: number; name: string; email: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noComputador, setNoComputador] = useState(true);
  const [captcha, setCaptcha] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  useEffect(() => {
    setNoComputador(noComputadorLocal());
  }, []);
  const logo = theme === "dark" ? "/images/FocoLogoWhite.png" : "/images/FocoLogo.png";

  async function onFinish(values: { email: string; password: string }) {
      setError("");
      if (!noComputador && !captcha) {
        setError(siteKey ? "Confirme que você não é um robô." : "Confirmação ainda sem a chave do site.");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            ...(captcha ? { captcha } : {}),
          }),
        });
      if (!response.ok) {
        let detail = "Credenciais inválidas.";
        try {
          const body = (await response.json()) as { message?: string; error?: string };
          if (typeof body.message === "string" && body.message) detail = body.message;
          else if (typeof body.error === "string" && body.error) detail = body.error;
        } catch {
          detail = "Credenciais inválidas.";
        }
        setError(detail);
        setCaptcha("");
        return;
      }
      const data = (await response.json()) as Session;
      localStorage.setItem("authToken", JSON.stringify({ token: data.token.token }));
      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem(
        "userProfile",
        JSON.stringify({ name: data.user.name, email: data.user.email }),
      );
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`login-layout ${theme === "light" ? "light-theme" : "dark-theme"}`}>
      <div className="background-image-dark" />
      <div className="background-image-light" />
      <div className="background-overlay" />
      <div className="login-content">
        <div className="login-panel">
          <Card className={theme === "dark" ? "dark-glass-card" : "light-glass-card"}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <Switch
                checked={theme === "dark"}
                onChange={(checked) => setTheme(checked ? "dark" : "light")}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </div>
            <img src={logo} alt="Foco" className="logo" />
            <Title level={4} style={{ textAlign: "center", color: theme === "dark" ? "#fff" : undefined }}>
              Entrar
            </Title>
            <Form layout="vertical" requiredMark={false} onFinish={onFinish}>
              <Form.Item label="E-mail" name="email" rules={[{ required: true, message: "Informe seu e-mail" }]}>
                <Input placeholder="exemplo@gmail.com" size="large" />
              </Form.Item>
              <Form.Item label="Senha" name="password" rules={[{ required: true, message: "Informe sua senha" }]}>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  size="large"
                  suffix={
                    showPassword ? (
                      <EyeInvisibleOutlined onClick={() => setShowPassword(false)} />
                    ) : (
                      <EyeOutlined onClick={() => setShowPassword(true)} />
                    )
                  }
                />
              </Form.Item>
              {!noComputador ? <NaoSouRobo siteKey={siteKey} onToken={setCaptcha} /> : null}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <Checkbox>Lembrar-me</Checkbox>
                <Link href="#esqueceu-senha">Esqueceu a senha?</Link>
              </div>
              {error ? <Text type="danger">{error}</Text> : null}
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Entrar
                </Button>
              </Form.Item>
              <div style={{ textAlign: "center" }}>
                <Text>
                  Precisa de uma conta? <Link href="#cadastre-se">Cadastre-se</Link>
                </Text>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
