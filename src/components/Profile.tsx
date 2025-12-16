"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { User, Lock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { data: session, refetch } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui profil");
      }

      toast.success("Profil berhasil diperbarui");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field password harus diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah password");
      }

      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Profil</h2>
        <p className="text-muted-foreground mt-1">
          Kelola informasi profil dan keamanan akun Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Update Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>Perbarui nama dan informasi Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  "Perbarui Profil"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>Perbarui password akun Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  required
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 8 karakter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengubah...
                  </>
                ) : (
                  "Ubah Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
