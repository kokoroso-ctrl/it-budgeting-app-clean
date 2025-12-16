import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Password saat ini dan password baru harus diisi" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password baru minimal 8 karakter" },
        { status: 400 }
      );
    }

    const userAccount = await db
      .select()
      .from(account)
      .where(eq(account.userId, session.user.id))
      .limit(1);

    if (!userAccount.length || !userAccount[0].password) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userAccount[0].password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(account.userId, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Gagal mengubah password" },
      { status: 500 }
    );
  }
}
