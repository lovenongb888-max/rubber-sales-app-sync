import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncMutation = trpc.salesSync.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleLogin = async () => {
    await WebBrowser.openBrowserAsync(
      `${process.env.EXPO_PUBLIC_API_URL}/auth/login?redirect=${encodeURIComponent(
        `${process.env.EXPO_PUBLIC_APP_URL}/oauth/callback`,
      )}`,
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncMutation.refetch();
      setLastSync(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">การตั้งค่า</Text>
            <Text className="text-base text-muted">จัดการบัญชีและการซิงค์ข้อมูล</Text>
          </View>

          {/* Auth Section */}
          <View className="gap-3 rounded-2xl bg-surface p-4">
            <Text className="text-lg font-semibold text-foreground">บัญชี</Text>
            {isAuthenticated && user ? (
              <View className="gap-3">
                <View className="gap-1">
                  <Text className="text-sm text-muted">ชื่อผู้ใช้</Text>
                  <Text className="text-base font-medium text-foreground">{user.name || "ไม่ระบุ"}</Text>
                </View>
                <View className="gap-1">
                  <Text className="text-sm text-muted">อีเมล</Text>
                  <Text className="text-base font-medium text-foreground">{user.email || "ไม่ระบุ"}</Text>
                </View>
                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    {
                      backgroundColor: "#EF4444",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-center font-semibold text-white">ออกจากระบบ</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                <Text className="text-sm text-muted">เข้าสู่ระบบเพื่อใช้งานการซิงค์ข้อมูลบนคลาวด์</Text>
                <Pressable
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-center font-semibold text-white">เข้าสู่ระบบ</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Sync Section */}
          {isAuthenticated && (
            <View className="gap-3 rounded-2xl bg-surface p-4">
              <Text className="text-lg font-semibold text-foreground">การซิงค์ข้อมูล</Text>
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">สถานะการซิงค์</Text>
                  <Text className="text-sm font-medium text-success">พร้อมใช้งาน</Text>
                </View>
                {lastSync && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted">ซิงค์ล่าสุด</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {lastSync.toLocaleTimeString("th-TH")}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={handleSync}
                disabled={syncing}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    opacity: pressed || syncing ? 0.8 : 1,
                  },
                ]}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">ซิงค์ข้อมูลตอนนี้</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Info Section */}
          <View className="gap-3 rounded-2xl bg-surface p-4">
            <Text className="text-lg font-semibold text-foreground">เกี่ยวกับแอป</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">เวอร์ชัน</Text>
                <Text className="text-sm font-medium text-foreground">1.0.0</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">ฐานข้อมูลท้องถิ่น</Text>
                <Text className="text-sm font-medium text-success">เปิดใช้งาน</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
