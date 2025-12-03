"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FullPage from "@/components/base/FullPage";
import Field from "@/components/base/Field";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>(null);

  async function authWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Simple mock auth: accept any non-empty credentials and store user name locally
    if (identity && password) {
      localStorage.setItem("test_login", "true");
      localStorage.setItem("crm_user_name", identity);
      router.push("/");
    } else {
      setError("Please provide credentials.");
    }

    setIsLoading(false);
  }


  return (
    <FullPage>
      <div className="content txt-center m-b-base">
        <h4>Login to Flamycom CRM</h4>
      </div>

      <form className="block" onSubmit={authWithPassword}>
        <Field className="form-field required" name="identity" error={error}>
          <label htmlFor="identity">Email or Username</label>
          <input
            id="identity"
            type="text"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field className="form-field required" name="password">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <button
          type="submit"
          className={`btn btn-lg btn-block btn-next ${isLoading ? "btn-loading" : ""}`}
          disabled={isLoading}
        >
          <span className="txt">Login</span>
          <i className="ri-arrow-right-line" />
        </button>
      </form>
    </FullPage>
  );
}
