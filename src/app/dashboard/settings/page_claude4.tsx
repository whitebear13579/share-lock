"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
    Cog,
    Folder,
    House,
    LogOut,
    Star,
    User,
    Mail,
    Phone,
    Shield,
    Bell,
    Palette,
    Globe,
    Lock,
    Edit3,
    Save,
    Camera,
    Eye,
    EyeOff
} from "lucide-react";
import { Spinner, Switch, Select, SelectItem, Divider, Card, CardBody } from "@heroui/react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { Image } from "@heroui/react";
import NextImage from "next/image";
import { updatePassword, updateEmail } from "firebase/auth";

export default function Settings() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 狀態管理
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || "",
        email: user?.email || "",
        phone: "",
        bio: ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [preferences, setPreferences] = useState({
        language: "zh-TW",
        theme: "dark",
        emailNotifications: true,
        pushNotifications: true,
        securityAlerts: true,
        marketingEmails: false
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                displayName: user.displayName || "",
                email: user.email || ""
            }));
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            // 這裡可以添加保存到 Firebase 的邏輯
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 調用
            setIsEditing(null);
        } catch (error) {
            console.error("保存失敗:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("新密碼與確認密碼不相符");
            return;
        }

        setIsSaving(true);
        try {
            // 這裡可以添加密碼變更邏輯
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            alert("密碼已成功變更");
        } catch (error) {
            console.error("密碼變更失敗:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-800 flex items-center justify-center">
                <Spinner
                    classNames={{ label: "text-xl text-white" }}
                    variant="dots"
                    size="lg"
                    color="default"
                    label="載入中..."
                />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-700 to-neutral-800">
            {/* 導航欄 */}
            <div className="absolute top-6 right-6 flex space-x-3 z-10">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push("/dashboard")}
                    >
                        <House size={18} />
                        資訊主頁
                    </div>
                    <div
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push("/dashboard/files")}
                    >
                        <Folder size={18} />
                        我的檔案
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Cog size={18} />
                        帳號設定
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push("/dashboard/bug-report")}
                    >
                        <Star size={18} />
                        漏洞有賞計畫
                    </div>
                </div>
                <CustomButton
                    variant="blur"
                    size="lg"
                    radius="full"
                    startContent={<LogOut size={18} className="text-gray-200" />}
                    isDisabled={loading}
                    onPress={logout}
                    className="text-base hover:bg-white/20 text-gray-200"
                >
                    登出
                </CustomButton>
            </div>

            {/* 主要內容區域 */}
            <div className="container mx-auto px-6 pt-24 pb-12 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">帳號設定</h1>
                    <p className="text-gray-300 text-lg">管理您的個人資料與帳號偏好設定</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左側 - 個人資料卡片 */}
                    <div className="lg:col-span-1">
                        <Card className="bg-white/10 border border-white/20 shadow-2xl">
                            <CardBody className="p-8">
                                <div className="text-center mb-6">
                                    <div className="relative mx-auto w-24 h-24 mb-4">
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                            <User size={40} className="text-white" />
                                        </div>
                                        <button
                                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/20 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                            title="更換大頭貼"
                                            aria-label="更換大頭貼"
                                        >
                                            <Camera size={16} className="text-white" />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-1">
                                        {user?.displayName || "未設定姓名"}
                                    </h3>
                                    <p className="text-gray-300 text-sm">{user?.email}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300 text-sm">帳號狀態</span>
                                        <span className="text-green-400 text-sm font-medium">已驗證</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300 text-sm">加入時間</span>
                                        <span className="text-gray-300 text-sm">
                                            {user?.metadata?.creationTime ?
                                                new Date(user.metadata.creationTime).toLocaleDateString('zh-TW') :
                                                "未知"
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300 text-sm">最後登入</span>
                                        <span className="text-gray-300 text-sm">
                                            {user?.metadata?.lastSignInTime ?
                                                new Date(user.metadata.lastSignInTime).toLocaleDateString('zh-TW') :
                                                "未知"
                                            }
                                        </span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* 右側 - 設定選項 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 基本資料設定 */}
                        <Card className="bg-white/10 border border-white/20 shadow-2xl">
                            <CardBody className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                        <User size={20} />
                                        基本資料
                                    </h3>
                                    <CustomButton
                                        variant="blur"
                                        size="sm"
                                        startContent={isEditing === "profile" ? <Save size={16} /> : <Edit3 size={16} />}
                                        onPress={() => {
                                            if (isEditing === "profile") {
                                                handleSaveProfile();
                                            } else {
                                                setIsEditing("profile");
                                            }
                                        }}
                                        isLoading={isSaving && isEditing === "profile"}
                                        className="text-sm"
                                    >
                                        {isEditing === "profile" ? "保存" : "編輯"}
                                    </CustomButton>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomInput
                                        label="顯示名稱"
                                        placeholder="輸入您的姓名"
                                        value={profileData.displayName}
                                        isReadOnly={isEditing !== "profile"}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                                        startContent={<User size={18} className="text-gray-400" />}
                                    />
                                    <CustomInput
                                        label="電子郵件"
                                        placeholder="輸入電子郵件"
                                        value={profileData.email}
                                        isReadOnly={isEditing !== "profile"}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                        startContent={<Mail size={18} className="text-gray-400" />}
                                    />
                                    <CustomInput
                                        label="電話號碼"
                                        placeholder="輸入電話號碼"
                                        value={profileData.phone}
                                        isReadOnly={isEditing !== "profile"}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                        startContent={<Phone size={18} className="text-gray-400" />}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* 安全設定 */}
                        <Card className="bg-white/10 border border-white/20 shadow-2xl">
                            <CardBody className="p-8">
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <Shield size={20} />
                                    安全設定
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-white font-medium mb-4">變更密碼</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <CustomInput
                                                label="目前密碼"
                                                type={showPassword.current ? "text" : "password"}
                                                placeholder="輸入目前密碼"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                startContent={<Lock size={18} className="text-gray-400" />}
                                                endContent={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                                                        className="text-gray-400 hover:text-white"
                                                    >
                                                        {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                }
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <CustomInput
                                                    label="新密碼"
                                                    type={showPassword.new ? "text" : "password"}
                                                    placeholder="輸入新密碼"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                    startContent={<Lock size={18} className="text-gray-400" />}
                                                    endContent={
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                                            className="text-gray-400 hover:text-white"
                                                        >
                                                            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    }
                                                />
                                                <CustomInput
                                                    label="確認新密碼"
                                                    type={showPassword.confirm ? "text" : "password"}
                                                    placeholder="再次輸入新密碼"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                    startContent={<Lock size={18} className="text-gray-400" />}
                                                    endContent={
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                            className="text-gray-400 hover:text-white"
                                                        >
                                                            {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <CustomButton
                                            variant="blur"
                                            className="mt-4"
                                            onPress={handleChangePassword}
                                            isDisabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                            isLoading={isSaving}
                                        >
                                            更新密碼
                                        </CustomButton>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 偏好設定 */}
                        <Card className="bg-white/10 border border-white/20 shadow-2xl">
                            <CardBody className="p-8">
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <Palette size={20} />
                                    偏好設定
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-white font-medium mb-2 block">語言</label>
                                            <Select
                                                selectedKeys={[preferences.language]}
                                                onSelectionChange={(keys) => {
                                                    const selectedKey = Array.from(keys)[0] as string;
                                                    setPreferences(prev => ({ ...prev, language: selectedKey }));
                                                }}
                                                className="max-w-xs"
                                                classNames={{
                                                    trigger: "bg-white/10 border border-white/30 hover:bg-white/20",
                                                    value: "text-white",
                                                    selectorIcon: "text-white"
                                                }}
                                            >
                                                <SelectItem key="zh-TW" textValue="繁體中文">繁體中文</SelectItem>
                                                <SelectItem key="zh-CN" textValue="簡體中文">簡體中文</SelectItem>
                                                <SelectItem key="en-US" textValue="English">English</SelectItem>
                                                <SelectItem key="ja-JP" textValue="日本語">日本語</SelectItem>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-white font-medium mb-2 block">主題</label>
                                            <Select
                                                selectedKeys={[preferences.theme]}
                                                onSelectionChange={(keys) => {
                                                    const selectedKey = Array.from(keys)[0] as string;
                                                    setPreferences(prev => ({ ...prev, theme: selectedKey }));
                                                }}
                                                className="max-w-xs"
                                                classNames={{
                                                    trigger: "bg-white/10 border border-white/30 hover:bg-white/20",
                                                    value: "text-white",
                                                    selectorIcon: "text-white"
                                                }}
                                            >
                                                <SelectItem key="dark" textValue="深色模式">深色模式</SelectItem>
                                                <SelectItem key="light" textValue="淺色模式">淺色模式</SelectItem>
                                                <SelectItem key="auto" textValue="跟隨系統">跟隨系統</SelectItem>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 通知設定 */}
                        <Card className="bg-white/10 border border-white/20 shadow-2xl">
                            <CardBody className="p-8">
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                    <Bell size={20} />
                                    通知設定
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">電子郵件通知</p>
                                            <p className="text-gray-300 text-sm">接收重要活動的電子郵件通知</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.emailNotifications}
                                            onValueChange={(value) => setPreferences(prev => ({ ...prev, emailNotifications: value }))}
                                            classNames={{
                                                wrapper: "bg-white/20 group-data-[selected=true]:bg-blue-600"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">推播通知</p>
                                            <p className="text-gray-300 text-sm">接收瀏覽器推播通知</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.pushNotifications}
                                            onValueChange={(value) => setPreferences(prev => ({ ...prev, pushNotifications: value }))}
                                            classNames={{
                                                wrapper: "bg-white/20 group-data-[selected=true]:bg-blue-600"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">安全警報</p>
                                            <p className="text-gray-300 text-sm">帳號安全相關的重要警報</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.securityAlerts}
                                            onValueChange={(value) => setPreferences(prev => ({ ...prev, securityAlerts: value }))}
                                            classNames={{
                                                wrapper: "bg-white/20 group-data-[selected=true]:bg-blue-600"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white font-medium">行銷郵件</p>
                                            <p className="text-gray-300 text-sm">產品更新和促銷活動資訊</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.marketingEmails}
                                            onValueChange={(value) => setPreferences(prev => ({ ...prev, marketingEmails: value }))}
                                            classNames={{
                                                wrapper: "bg-white/20 group-data-[selected=true]:bg-blue-600"
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 危險區域 */}
                        <Card className="bg-red-500/10 border border-red-500/30 shadow-2xl">
                            <CardBody className="p-8">
                                <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                                    <Shield size={20} />
                                    危險區域
                                </h3>
                                <p className="text-gray-300 mb-6">以下操作將會永久影響您的帳號，請謹慎使用。</p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <CustomButton
                                        variant="blur"
                                        className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                                        onPress={() => {
                                            if (confirm("確定要刪除帳號嗎？此操作無法復原。")) {
                                                // 處理刪除帳號邏輯
                                            }
                                        }}
                                    >
                                        刪除帳號
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        className="bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30"
                                        onPress={() => {
                                            if (confirm("確定要清除所有資料嗎？")) {
                                                // 處理清除資料邏輯
                                            }
                                        }}
                                    >
                                        清除所有資料
                                    </CustomButton>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
