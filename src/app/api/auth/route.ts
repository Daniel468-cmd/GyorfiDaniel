import { NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/db";
import { cookies } from "next/headers";

const SESSION_COOKIE = "vortex_session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionRaw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionRaw) {
    return NextResponse.json({ user: null });
  }
  try {
    const parsed = JSON.parse(Buffer.from(sessionRaw, "base64").toString("utf-8"));
    return NextResponse.json({ user: parsed });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, name, organization } = body;

    if (action === "logout") {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ ok: true });
    }

    if (action === "demo") {
      const demoUser = await findUserByEmail("daniel@vortex.sh");
      if (!demoUser) {
        return NextResponse.json({ error: "Demo user not found" }, { status: 404 });
      }
      const safeUser = {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        organization: demoUser.organization,
        apiKeyPrefix: demoUser.apiKeyPrefix,
      };
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, Buffer.from(JSON.stringify(safeUser)).toString("base64"), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ user: safeUser });
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }
      const user = await findUserByEmail(email);
      if (!user || user.passwordHash !== password) {
        return NextResponse.json(
          { error: "Invalid credentials. Try the Founder Demo Pass or register a new account." },
          { status: 401 }
        );
      }
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        apiKeyPrefix: user.apiKeyPrefix,
      };
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, Buffer.from(JSON.stringify(safeUser)).toString("base64"), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ user: safeUser });
    }

    if (action === "register") {
      if (!name || !email || !password) {
        return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }
      const newUser = await createUser({ name, email, password, organization });
      const safeUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
        apiKeyPrefix: newUser.apiKeyPrefix,
      };
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, Buffer.from(JSON.stringify(safeUser)).toString("base64"), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ user: safeUser });
    }

    return NextResponse.json({ error: "Unsupported auth action." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
