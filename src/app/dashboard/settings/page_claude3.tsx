"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import {
    Cog, Folder, House, LogOut, Star, User, Camera, Shield,
    Bell, Lock, Eye, EyeOff, Mail, Globe, Smartphone,
    Palette, Moon, Sun, Monitor, Save, Trash2, Download,
    Upload, Key, AlertTriangle, Check, X, Settings,
    Database, HardDrive, FileText, Share2
} from "lucide-react";
import { Spinner } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";

export default function SettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        phoneNumber: "",
        bio: "",
        location: "",
        website: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [preferences, setPreferences] = useState({
        theme: "system",
        language: "zh-TW",
        timezone: "Asia/Taipei",
        emailNotifications: true,
        pushNotifications: true,
        shareNotifications: true,
        securityAlerts: true,
        marketingEmails: false,
        publicProfile: false,
        showEmail: false,
        allowFileSharing: true,
        twoFactorEnabled: false
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
        if (user) {
            setFormData(prev => ({
                ...prev,
                displayName: user.displayName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || ""
            }));
        }
    }, [user, loading, router]);

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

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePreferenceChange = (field: string, value: boolean | string) => {
        setPreferences(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const settingsTabs = [
        { id: "profile", label: "個人資料", icon: User },
        { id: "security", label: "帳號安全", icon: Shield },
        { id: "notifications", label: "通知設定", icon: Bell },
        { id: "privacy", label: "隱私設定", icon: Eye },
        { id: "preferences", label: "偏好設定", icon: Settings },
        { id: "storage", label: "資料與儲存", icon: Database }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div className="space-y-6">
                        {/* 頭像設定 */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <User className="text-blue-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">個人資料</h3>
                                        <p className="text-gray-300 text-sm">管理你的基本資料和頭像</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <Avatar
                                            src={user.photoURL || undefined}
                                            size="lg"
                                            className="w-24 h-24"
                                        />
                                        <Button
                                            size="sm"
                                            isIconOnly
                                            radius="full"
                                            className="absolute -bottom-1 -right-1 bg-blue-600 text-white"
                                        >
                                            <Camera size={16} />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-white font-medium">更換頭像</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-white/10 border border-white/30 text-gray-200">
                                                上傳照片
                                            </Button>
                                            <Button size="sm" variant="light" className="text-gray-400">
                                                移除
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="顯示名稱"
                                        value={formData.displayName}
                                        onValueChange={(value) => handleInputChange("displayName", value)}
                                        classNames={{
                                            input: "bg-transparent",
                                            inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    />
                                    <Input
                                        label="電子信箱"
                                        value={formData.email}
                                        isReadOnly
                                        classNames={{
                                            input: "bg-transparent text-gray-400",
                                            inputWrapper: "bg-white/5 border border-white/20"
                                        }}
                                    />
                                    <Input
                                        label="手機號碼"
                                        value={formData.phoneNumber}
                                        onValueChange={(value) => handleInputChange("phoneNumber", value)}
                                        classNames={{
                                            input: "bg-transparent",
                                            inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    />
                                    <Input
                                        label="網站"
                                        value={formData.website}
                                        onValueChange={(value) => handleInputChange("website", value)}
                                        classNames={{
                                            input: "bg-transparent",
                                            inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    />
                                </div>
                                <Input
                                    label="個人簡介"
                                    value={formData.bio}
                                    onValueChange={(value) => handleInputChange("bio", value)}
                                    classNames={{
                                        input: "bg-transparent",
                                        inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                    }}
                                />
                            </CardBody>
                            <CardFooter className="justify-end">
                                <Button className="bg-blue-600 text-white" startContent={<Save size={18} />}>
                                    儲存變更
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );

            case "security":
                return (
                    <div className="space-y-6">
                        {/* 密碼設定 */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Key className="text-amber-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">密碼設定</h3>
                                        <p className="text-gray-300 text-sm">更改您的帳號密碼</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Input
                                    label="目前密碼"
                                    type={isPasswordVisible ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onValueChange={(value) => handleInputChange("currentPassword", value)}
                                    endContent={
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        >
                                            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                    classNames={{
                                        input: "bg-transparent",
                                        inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                    }}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="新密碼"
                                        type="password"
                                        value={formData.newPassword}
                                        onValueChange={(value) => handleInputChange("newPassword", value)}
                                        classNames={{
                                            input: "bg-transparent",
                                            inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    />
                                    <Input
                                        label="確認新密碼"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onValueChange={(value) => handleInputChange("confirmPassword", value)}
                                        classNames={{
                                            input: "bg-transparent",
                                            inputWrapper: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* 雙重驗證 */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Smartphone className="text-green-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">雙重驗證</h3>
                                        <p className="text-gray-300 text-sm">增強您的帳號安全性</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">啟用雙重驗證</p>
                                        <p className="text-gray-400 text-sm">使用驗證應用程式保護您的帳號</p>
                                    </div>
                                    <Switch
                                        isSelected={preferences.twoFactorEnabled}
                                        onValueChange={(value) => handlePreferenceChange("twoFactorEnabled", value)}
                                        classNames={{
                                            wrapper: "group-data-[selected=true]:bg-green-600"
                                        }}
                                    />
                                </div>
                                {preferences.twoFactorEnabled && (
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-400 mb-2">
                                            <Check size={18} />
                                            <span className="font-medium">雙重驗證已啟用</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">您的帳號現在受到雙重驗證保護</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* 登入活動 */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="text-orange-400" size={24} />
                                        <div>
                                            <h3 className="text-xl font-bold text-white">登入活動</h3>
                                            <p className="text-gray-300 text-sm">檢視近期的登入記錄</p>
                                        </div>
                                    </div>
                                    <Button size="sm" className="bg-white/10 border border-white/30 text-gray-200">
                                        查看全部
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Monitor className="text-blue-400" size={20} />
                                            <div>
                                                <p className="text-white font-medium">Windows • Chrome</p>
                                                <p className="text-gray-400 text-sm">台灣，台北 • 目前裝置</p>
                                            </div>
                                        </div>
                                        <Chip size="sm" className="bg-green-500 text-white">活躍中</Chip>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="text-gray-400" size={20} />
                                            <div>
                                                <p className="text-white font-medium">iPhone • Safari</p>
                                                <p className="text-gray-400 text-sm">台灣，新北 • 2 天前</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="light" className="text-gray-400">
                                            登出
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "notifications":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Bell className="text-yellow-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">通知偏好設定</h3>
                                        <p className="text-gray-300 text-sm">選擇您想要接收的通知類型</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">電子郵件通知</p>
                                            <p className="text-gray-400 text-sm">接收重要更新的電子郵件</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.emailNotifications}
                                            onValueChange={(value) => handlePreferenceChange("emailNotifications", value)}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">推送通知</p>
                                            <p className="text-gray-400 text-sm">在瀏覽器中顯示通知</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.pushNotifications}
                                            onValueChange={(value) => handlePreferenceChange("pushNotifications", value)}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">檔案分享通知</p>
                                            <p className="text-gray-400 text-sm">當有人分享檔案給您時通知</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.shareNotifications}
                                            onValueChange={(value) => handlePreferenceChange("shareNotifications", value)}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">安全警告</p>
                                            <p className="text-gray-400 text-sm">帳號安全相關的重要通知</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.securityAlerts}
                                            onValueChange={(value) => handlePreferenceChange("securityAlerts", value)}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">行銷郵件</p>
                                            <p className="text-gray-400 text-sm">產品更新和促銷資訊</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.marketingEmails}
                                            onValueChange={(value) => handlePreferenceChange("marketingEmails", value)}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "privacy":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Eye className="text-purple-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">隱私設定</h3>
                                        <p className="text-gray-300 text-sm">控制您的資料可見性</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">公開個人檔案</p>
                                            <p className="text-gray-400 text-sm">允許其他用戶查看您的個人檔案</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.publicProfile}
                                            onValueChange={(value) => handlePreferenceChange("publicProfile", value)}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">顯示電子郵件</p>
                                            <p className="text-gray-400 text-sm">在個人檔案中顯示電子郵件地址</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.showEmail}
                                            onValueChange={(value) => handlePreferenceChange("showEmail", value)}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">允許檔案分享</p>
                                            <p className="text-gray-400 text-sm">允許其他用戶向您分享檔案</p>
                                        </div>
                                        <Switch
                                            isSelected={preferences.allowFileSharing}
                                            onValueChange={(value) => handlePreferenceChange("allowFileSharing", value)}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">資料下載</h3>
                                        <p className="text-gray-300 text-sm">下載您的帳號資料</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">匯出個人資料</p>
                                        <p className="text-gray-400 text-sm">下載您在 Share Lock 的所有資料</p>
                                    </div>
                                    <Button className="bg-blue-600 text-white" startContent={<Download size={18} />}>
                                        匯出資料
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "preferences":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Palette className="text-indigo-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">外觀設定</h3>
                                        <p className="text-gray-300 text-sm">自訂您的介面外觀</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Select
                                    label="主題"
                                    selectedKeys={[preferences.theme]}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0] as string;
                                        handlePreferenceChange("theme", value);
                                    }}
                                    classNames={{
                                        trigger: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                    }}
                                >
                                    <SelectItem key="light" startContent={<Sun size={18} />}>
                                        淺色主題
                                    </SelectItem>
                                    <SelectItem key="dark" startContent={<Moon size={18} />}>
                                        深色主題
                                    </SelectItem>
                                    <SelectItem key="system" startContent={<Monitor size={18} />}>
                                        跟隨系統
                                    </SelectItem>
                                </Select>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Globe className="text-green-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">語言與地區</h3>
                                        <p className="text-gray-300 text-sm">設定您的語言和時區偏好</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="語言"
                                        selectedKeys={[preferences.language]}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0] as string;
                                            handlePreferenceChange("language", value);
                                        }}
                                        classNames={{
                                            trigger: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    >
                                        <SelectItem key="zh-TW">繁體中文</SelectItem>
                                        <SelectItem key="zh-CN">简体中文</SelectItem>
                                        <SelectItem key="en-US">English</SelectItem>
                                        <SelectItem key="ja-JP">日本語</SelectItem>
                                    </Select>
                                    <Select
                                        label="時區"
                                        selectedKeys={[preferences.timezone]}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0] as string;
                                            handlePreferenceChange("timezone", value);
                                        }}
                                        classNames={{
                                            trigger: "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20"
                                        }}
                                    >
                                        <SelectItem key="Asia/Taipei">台北 (GMT+8)</SelectItem>
                                        <SelectItem key="Asia/Shanghai">上海 (GMT+8)</SelectItem>
                                        <SelectItem key="Asia/Tokyo">東京 (GMT+9)</SelectItem>
                                        <SelectItem key="UTC">UTC (GMT+0)</SelectItem>
                                    </Select>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "storage":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <HardDrive className="text-cyan-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">儲存空間使用狀況</h3>
                                        <p className="text-gray-300 text-sm">檢視您的儲存空間使用情況</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-base text-gray-200 font-medium">
                                        <AlertTriangle size={24} className="shrink-0 rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                        <span>需要注意：可用空間不足 15%</span>
                                    </div>
                                    <Progress
                                        size="lg"
                                        radius="full"
                                        showValueLabel
                                        classNames={{
                                            indicator: "bg-linear-245 from-amber-500 to-rose-700",
                                            track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                            value: "text-2xl font-medium text-gray-200 tracking-wider",
                                            label: "text-gray-300 font-normal text-base mt-2"
                                        }}
                                        label="882 MB / 1 GB"
                                        value={88}
                                    />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                        <div className="bg-white/5 p-4 rounded-lg text-center">
                                            <Share2 className="text-blue-400 mx-auto mb-2" size={24} />
                                            <p className="text-white font-medium">分享檔案</p>
                                            <p className="text-gray-400 text-sm">456 MB</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-lg text-center">
                                            <Upload className="text-green-400 mx-auto mb-2" size={24} />
                                            <p className="text-white font-medium">上傳檔案</p>
                                            <p className="text-gray-400 text-sm">326 MB</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-lg text-center">
                                            <FileText className="text-purple-400 mx-auto mb-2" size={24} />
                                            <p className="text-white font-medium">文件</p>
                                            <p className="text-gray-400 text-sm">78 MB</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-lg text-center">
                                            <Database className="text-orange-400 mx-auto mb-2" size={24} />
                                            <p className="text-white font-medium">其他</p>
                                            <p className="text-gray-400 text-sm">22 MB</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                            <CardFooter className="justify-end">
                                <Button className="bg-red-600 text-white" startContent={<Trash2 size={18} />}>
                                    清理儲存空間
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Trash2 className="text-red-400" size={24} />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">帳號管理</h3>
                                        <p className="text-gray-300 text-sm">刪除帳號和相關資料</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-400 mb-2">
                                        <AlertTriangle size={18} />
                                        <span className="font-medium">危險操作</span>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-4">
                                        刪除帳號將會永久刪除您的所有資料，包括檔案、分享記錄和個人設定。此操作無法復原。
                                    </p>
                                    <Button className="bg-red-600 text-white" startContent={<X size={18} />}>
                                        刪除帳號
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
            <div className="absolute top-6 right-6 flex space-x-3">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10" onClick={() => router.push('/dashboard')}>
                        <House size={18} />
                        資訊主頁
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10" onClick={() => router.push('/dashboard/files')}>
                        <Folder size={18} />
                        我的檔案
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Cog size={18} />
                        帳號設定
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10" onClick={() => router.push('/dashboard/bug-report')}>
                        <Star size={18} />
                        漏洞有賞計畫
                    </div>
                </div>
                <CustomButton
                    variant="blur"
                    size="lg"
                    radius="full"
                    startContent={
                        <LogOut
                            size={18}
                            className="text-gray-200"
                        />
                    }
                    isDisabled={loading}
                    onPress={logout}
                    className="text-base hover:bg-white/20 text-gray-200"
                >
                    登出
                </CustomButton>
            </div>

            <div className="pt-36 px-13">
                <h1 className="text-4xl font-bold text-white mb-2">
                    ⚙️ 帳號設定
                </h1>
                <p className="text-gray-300 text-lg">
                    管理您的個人資料、隱私設定和帳號偏好。
                </p>
            </div>

            <div className="px-12 py-8 pb-16">
                <div className="flex gap-6">
                    {/* 側邊欄 */}
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 w-80 h-fit" shadow="lg">
                        <CardBody className="p-4">
                            <div className="space-y-2">
                                {settingsTabs.map((tab) => (
                                    <Button
                                        key={tab.id}
                                        className={`w-full justify-start ${activeTab === tab.id
                                                ? "bg-white/20 text-white"
                                                : "bg-transparent text-gray-300 hover:bg-white/10"
                                            }`}
                                        startContent={<tab.icon size={18} />}
                                        onPress={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label}
                                    </Button>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* 主要內容 */}
                    <div className="flex-1">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
