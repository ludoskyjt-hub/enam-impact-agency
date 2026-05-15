import { useState, useCallback } from "react";
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { getToken, setToken } from "@/lib/auth";

const API_BASE = "/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface BiometricCredentialInfo {
  registered: boolean;
  count: number;
  devices: Array<{ id: number; deviceType: string | null; createdAt: string }>;
}

export function useBiometricSupport() {
  const supported = browserSupportsWebAuthn();
  const isHttps = typeof window !== "undefined" && (window.location.protocol === "https:" || window.location.hostname === "localhost");
  return { supported, isHttps, available: supported && isHttps };
}

export function useBiometricRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const options = await apiFetch("/auth/webauthn/register/options", { method: "POST" });
      const attResp = await startRegistration({ optionsJSON: options });
      const result = await apiFetch("/auth/webauthn/register/verify", {
        method: "POST",
        body: JSON.stringify(attResp),
      });
      return result.verified === true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}

export function useBiometricDelete() {
  const [loading, setLoading] = useState(false);

  const remove = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      await apiFetch("/auth/webauthn/credentials", { method: "DELETE" });
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading };
}

export function useBiometricLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const options = await apiFetch("/auth/webauthn/login/options", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const authResp = await startAuthentication({ optionsJSON: options });
      const result = await apiFetch("/auth/webauthn/login/verify", {
        method: "POST",
        body: JSON.stringify({ email, response: authResp }),
      });
      setToken(result.token);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
}

export async function fetchBiometricStatus(): Promise<BiometricCredentialInfo> {
  return apiFetch("/auth/webauthn/credentials");
}
