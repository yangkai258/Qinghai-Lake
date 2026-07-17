"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <form action="/api/auth/logout" method="post" style={{ marginTop: 12 }}>
      <button className="btn ghost sm" type="submit" style={{ width: "100%" }}>退出登录</button>
    </form>
  );
}
