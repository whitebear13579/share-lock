"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, User, Shield, Bell, Palette, Globe, Key, Trash, Eye, EyeOff, Save, Camera, Mail, Phone, MapPin, Calendar, Edit, Check, X, Monitor, Moon, Sun, Volume2, VolumeX, Smartphone, Lock, Unlock, AlertTriangle, Download, Upload, Settings, HardDrive, Cloud, Wifi, Database } from "lucide-react";
import { Spinner, Switch, Input, Select, SelectItem, Slider, Avatar, Divider, Chip, Textarea } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import NextImage from "next/image";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spacer } from "@heroui/spacer";

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 狀態管理
    const [activeTab, setActiveTab] = useState("profile");
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sharing: true,
        security: true
    });
    const [privacy, setPrivacy] = useState({
        profileVisibility: "public",
        fileShareDefault: "private",
        showOnlineStatus: true
    });
    const [appearance, setAppearance] = useState({
        theme: "system",
        language: "zh-TW",
        volume: 75
    });
    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || "",
        email: user?.email || "",
        bio: "",
        phone: "",
        location: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
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

    const settingsTabs = [
        { id: "profile", name: "個人資料", icon: User },
        { id: "security", name: "帳號安全", icon: Shield },
        { id: "notifications", name: "通知設定", icon: Bell },
        { id: "privacy", name: "隱私設定", icon: Lock },
        { id: "appearance", name: "外觀設定", icon: Palette },
        { id: "storage", name: "儲存空間", icon: HardDrive },
        { id: "advanced", name: "進階設定", icon: Settings }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/20 p-3 rounded-xl">
                                            <User size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">個人資料</h3>
                                            <p className="text-gray-300 text-sm">管理你的基本資訊和個人檔案</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-2xl"
                                        radius="lg"
                                        startContent={isEditing ? <Save size={18} /> : <Edit size={18} />}
                                        onPress={() => setIsEditing(!isEditing)}
                                    >
                                        {isEditing ? "儲存" : "編輯"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="flex gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <Avatar
                                                src={user.photoURL || undefined}
                                                size="lg"
                                                className="w-24 h-24"
                                            />
                                            {isEditing && (
                                                <Button
                                                    isIconOnly
                                                    radius="full"
                                                    size="sm"
                                                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white"
                                                >
                                                    <Camera size={14} />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-xs mt-2 text-center max-w-24">
                                            {isEditing ? "點擊更換頭像" : "個人頭像"}
                                        </p>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <Input
                                            label="顯示名稱"
                                            value={profileData.displayName}
                                            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                            isReadOnly={!isEditing}
                                            variant="bordered"
                                            classNames={{
                                                input: "text-white",
                                                label: "text-gray-300",
                                                inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                            }}
                                        />
                                        <Input
                                            label="電子郵件"
                                            value={profileData.email}
                                            isReadOnly
                                            variant="bordered"
                                            startContent={<Mail size={16} className="text-gray-400" />}
                                            classNames={{
                                                input: "text-gray-400",
                                                label: "text-gray-300",
                                                inputWrapper: "bg-gray-700/50 border-gray-600"
                                            }}
                                        />
                                        <Input
                                            label="電話號碼"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            isReadOnly={!isEditing}
                                            variant="bordered"
                                            startContent={<Phone size={16} className="text-gray-400" />}
                                            classNames={{
                                                input: "text-white",
                                                label: "text-gray-300",
                                                inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                            }}
                                        />
                                        <Input
                                            label="所在地區"
                                            value={profileData.location}
                                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                            isReadOnly={!isEditing}
                                            variant="bordered"
                                            startContent={<MapPin size={16} className="text-gray-400" />}
                                            classNames={{
                                                input: "text-white",
                                                label: "text-gray-300",
                                                inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                            }}
                                        />
                                        <div className="col-span-2">
                                            <Textarea
                                                label="個人簡介"
                                                value={profileData.bio}
                                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                isReadOnly={!isEditing}
                                                variant="bordered"
                                                maxRows={3}
                                                classNames={{
                                                    input: "text-white",
                                                    label: "text-gray-300",
                                                    inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-3 rounded-xl">
                                        <Calendar size={24} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">帳號資訊</h3>
                                        <p className="text-gray-300 text-sm">查看你的帳號狀態和統計資料</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-400">156</p>
                                        <p className="text-gray-300 text-sm">分享的檔案</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-green-400">89</p>
                                        <p className="text-gray-300 text-sm">收到的檔案</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-yellow-400">245</p>
                                        <p className="text-gray-300 text-sm">總下載次數</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "security":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/20 p-3 rounded-xl">
                                        <Shield size={24} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">密碼設定</h3>
                                        <p className="text-gray-300 text-sm">更改你的登入密碼</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4 max-w-md">
                                    <Input
                                        label="目前密碼"
                                        type={showPassword ? "text" : "password"}
                                        variant="bordered"
                                        endContent={
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                onPress={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </Button>
                                        }
                                        classNames={{
                                            input: "text-white",
                                            label: "text-gray-300",
                                            inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                        }}
                                    />
                                    <Input
                                        label="新密碼"
                                        type="password"
                                        variant="bordered"
                                        classNames={{
                                            input: "text-white",
                                            label: "text-gray-300",
                                            inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                        }}
                                    />
                                    <Input
                                        label="確認新密碼"
                                        type="password"
                                        variant="bordered"
                                        classNames={{
                                            input: "text-white",
                                            label: "text-gray-300",
                                            inputWrapper: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400"
                                        }}
                                    />
                                    <Button
                                        className="custom-button-trans-override bg-blue-600 text-white"
                                        radius="lg"
                                        startContent={<Key size={18} />}
                                    >
                                        更新密碼
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-500/20 p-3 rounded-xl">
                                        <Shield size={24} className="text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">雙重驗證</h3>
                                        <p className="text-gray-300 text-sm">提升帳號安全性</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">簡訊驗證</p>
                                            <p className="text-gray-400 text-sm">透過手機簡訊接收驗證碼</p>
                                        </div>
                                        <Switch
                                            defaultSelected={false}
                                            classNames={{
                                                base: "inline-flex flex-row-reverse w-full max-w-md bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">應用程式驗證</p>
                                            <p className="text-gray-400 text-sm">使用驗證應用程式如 Google Authenticator</p>
                                        </div>
                                        <Switch
                                            defaultSelected={true}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-500/20 p-3 rounded-xl">
                                        <Monitor size={24} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">活躍的裝置</h3>
                                        <p className="text-gray-300 text-sm">管理已登入的裝置</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <Monitor size={20} className="text-blue-400" />
                                            <div>
                                                <p className="text-white font-medium">Windows PC</p>
                                                <p className="text-gray-400 text-sm">目前裝置 • 最後活動: 現在</p>
                                            </div>
                                        </div>
                                        <Chip color="success" variant="flat" size="sm">
                                            目前
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <Smartphone size={20} className="text-green-400" />
                                            <div>
                                                <p className="text-white font-medium">iPhone</p>
                                                <p className="text-gray-400 text-sm">最後活動: 2 小時前</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            className="text-red-400 hover:bg-red-500/20"
                                        >
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
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-500/20 p-3 rounded-xl">
                                        <Bell size={24} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">通知設定</h3>
                                        <p className="text-gray-300 text-sm">控制你接收通知的方式</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">電子郵件通知</p>
                                            <p className="text-gray-400 text-sm">接收重要更新和活動摘要</p>
                                        </div>
                                        <Switch
                                            isSelected={notifications.email}
                                            onValueChange={(value) => setNotifications({ ...notifications, email: value })}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">推播通知</p>
                                            <p className="text-gray-400 text-sm">即時接收瀏覽器通知</p>
                                        </div>
                                        <Switch
                                            isSelected={notifications.push}
                                            onValueChange={(value) => setNotifications({ ...notifications, push: value })}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">檔案分享通知</p>
                                            <p className="text-gray-400 text-sm">有人分享檔案給你時通知</p>
                                        </div>
                                        <Switch
                                            isSelected={notifications.sharing}
                                            onValueChange={(value) => setNotifications({ ...notifications, sharing: value })}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">安全警告</p>
                                            <p className="text-gray-400 text-sm">異常登入和安全事件通知</p>
                                        </div>
                                        <Switch
                                            isSelected={notifications.security}
                                            onValueChange={(value) => setNotifications({ ...notifications, security: value })}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:ml-4"
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-3 rounded-xl">
                                        <Volume2 size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">音效設定</h3>
                                        <p className="text-gray-300 text-sm">調整通知音效</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">通知音效</p>
                                            <p className="text-gray-400 text-sm">開啟或關閉通知音效</p>
                                        </div>
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            className="text-gray-300"
                                        >
                                            {appearance.volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-white font-medium">音量</p>
                                        <Slider
                                            size="sm"
                                            step={5}
                                            maxValue={100}
                                            minValue={0}
                                            value={appearance.volume}
                                            onChange={(value) => setAppearance({ ...appearance, volume: Array.isArray(value) ? value[0] : value })}
                                            className="max-w-md"
                                            classNames={{
                                                track: "bg-white/20 border-white/30",
                                                filler: "bg-blue-400",
                                                thumb: "bg-blue-400 border-blue-400"
                                            }}
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
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-500/20 p-3 rounded-xl">
                                        <Lock size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">隱私控制</h3>
                                        <p className="text-gray-300 text-sm">管理你的隱私設定</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-white font-medium mb-2">個人檔案可見性</p>
                                        <Select
                                            selectedKeys={privacy.profileVisibility ? [privacy.profileVisibility] : []}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0] as string;
                                                setPrivacy({ ...privacy, profileVisibility: value });
                                            }}
                                            variant="bordered"
                                            className="max-w-xs"
                                            classNames={{
                                                trigger: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400",
                                                value: "text-white",
                                                listbox: "bg-neutral-800 border-white/20"
                                            }}
                                        >
                                            <SelectItem key="public">公開</SelectItem>
                                            <SelectItem key="friends">好友可見</SelectItem>
                                            <SelectItem key="private">私人</SelectItem>
                                        </Select>
                                    </div>

                                    <div>
                                        <p className="text-white font-medium mb-2">預設檔案分享權限</p>
                                        <Select
                                            selectedKeys={privacy.fileShareDefault ? [privacy.fileShareDefault] : []}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0] as string;
                                                setPrivacy({ ...privacy, fileShareDefault: value });
                                            }}
                                            variant="bordered"
                                            className="max-w-xs"
                                            classNames={{
                                                trigger: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400",
                                                value: "text-white",
                                                listbox: "bg-neutral-800 border-white/20"
                                            }}
                                        >
                                            <SelectItem key="private">私人</SelectItem>
                                            <SelectItem key="unlisted">未列出</SelectItem>
                                            <SelectItem key="public">公開</SelectItem>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">顯示線上狀態</p>
                                            <p className="text-gray-400 text-sm">讓其他用戶看到你是否在線上</p>
                                        </div>
                                        <Switch
                                            isSelected={privacy.showOnlineStatus}
                                            onValueChange={(value) => setPrivacy({ ...privacy, showOnlineStatus: value })}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/20 p-3 rounded-xl">
                                        <Trash size={24} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">資料管理</h3>
                                        <p className="text-gray-300 text-sm">下載或刪除你的資料</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">下載我的資料</p>
                                            <p className="text-gray-400 text-sm">取得你所有資料的副本</p>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override bg-blue-600 text-white"
                                            radius="lg"
                                            startContent={<Download size={18} />}
                                        >
                                            下載
                                        </Button>
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">刪除帳號</p>
                                            <p className="text-gray-400 text-sm">永久刪除你的帳號和所有資料</p>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override bg-red-600 text-white"
                                            radius="lg"
                                            startContent={<AlertTriangle size={18} />}
                                        >
                                            刪除帳號
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "appearance":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-3 rounded-xl">
                                        <Palette size={24} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">主題設定</h3>
                                        <p className="text-gray-300 text-sm">自訂你的介面外觀</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-white font-medium mb-4">選擇主題</p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${appearance.theme === 'light' ? 'border-blue-400 bg-blue-500/20' : 'border-white/20 bg-white/5'}`}
                                                onClick={() => setAppearance({ ...appearance, theme: 'light' })}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sun size={20} className="text-yellow-400" />
                                                    <p className="text-white font-medium">淺色模式</p>
                                                </div>
                                                <div className="w-full h-16 bg-white rounded border"></div>
                                            </div>
                                            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${appearance.theme === 'dark' ? 'border-blue-400 bg-blue-500/20' : 'border-white/20 bg-white/5'}`}
                                                onClick={() => setAppearance({ ...appearance, theme: 'dark' })}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Moon size={20} className="text-blue-400" />
                                                    <p className="text-white font-medium">深色模式</p>
                                                </div>
                                                <div className="w-full h-16 bg-gray-800 rounded border border-gray-600"></div>
                                            </div>
                                            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${appearance.theme === 'system' ? 'border-blue-400 bg-blue-500/20' : 'border-white/20 bg-white/5'}`}
                                                onClick={() => setAppearance({ ...appearance, theme: 'system' })}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Monitor size={20} className="text-green-400" />
                                                    <p className="text-white font-medium">跟隨系統</p>
                                                </div>
                                                <div className="w-full h-16 bg-linear-90 from-white to-gray-800 rounded border"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-500/20 p-3 rounded-xl">
                                        <Globe size={24} className="text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">語言設定</h3>
                                        <p className="text-gray-300 text-sm">選擇你的顯示語言</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div>
                                    <p className="text-white font-medium mb-2">介面語言</p>
                                    <Select
                                        selectedKeys={appearance.language ? [appearance.language] : []}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0] as string;
                                            setAppearance({ ...appearance, language: value });
                                        }}
                                        variant="bordered"
                                        className="max-w-xs"
                                        classNames={{
                                            trigger: "bg-white/10 border-white/30 data-[hover=true]:border-white/50 group-data-[focus=true]:border-blue-400",
                                            value: "text-white",
                                            listbox: "bg-neutral-800 border-white/20"
                                        }}
                                    >
                                        <SelectItem key="zh-TW">繁體中文</SelectItem>
                                        <SelectItem key="zh-CN">简体中文</SelectItem>
                                        <SelectItem key="en-US">English</SelectItem>
                                        <SelectItem key="ja-JP">日本語</SelectItem>
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
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-500/20 p-3 rounded-xl">
                                        <HardDrive size={24} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">儲存空間使用情況</h3>
                                        <p className="text-gray-300 text-sm">查看你的雲端儲存空間</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-lg p-6">
                                        <div className="text-center mb-4">
                                            <p className="text-3xl font-bold text-white">882 MB / 1 GB</p>
                                            <p className="text-gray-300">已使用 88.2% 的空間</p>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full w-[88.2%]"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Cloud size={20} className="text-blue-400" />
                                                <p className="text-white font-medium">雲端檔案</p>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-400">720 MB</p>
                                            <p className="text-gray-400 text-sm">156 個檔案</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Database size={20} className="text-green-400" />
                                                <p className="text-white font-medium">備份資料</p>
                                            </div>
                                            <p className="text-2xl font-bold text-green-400">162 MB</p>
                                            <p className="text-gray-400 text-sm">自動備份</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-500/20 p-3 rounded-xl">
                                        <Upload size={24} className="text-pink-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">自動備份設定</h3>
                                        <p className="text-gray-300 text-sm">管理檔案自動備份</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">啟用自動備份</p>
                                            <p className="text-gray-400 text-sm">自動備份重要檔案到雲端</p>
                                        </div>
                                        <Switch
                                            defaultSelected={true}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">僅在 Wi-Fi 時備份</p>
                                            <p className="text-gray-400 text-sm">避免使用行動數據</p>
                                        </div>
                                        <Switch
                                            defaultSelected={true}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                );

            case "advanced":
                return (
                    <div className="space-y-6">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-500/20 p-3 rounded-xl">
                                        <Settings size={24} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">開發者選項</h3>
                                        <p className="text-gray-300 text-sm">進階功能和開發者工具</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">API 存取</p>
                                            <p className="text-gray-400 text-sm">啟用 REST API 存取權限</p>
                                        </div>
                                        <Switch
                                            defaultSelected={false}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">除錯模式</p>
                                            <p className="text-gray-400 text-sm">顯示詳細的錯誤訊息</p>
                                        </div>
                                        <Switch
                                            defaultSelected={false}
                                            classNames={{
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: "w-6 h-6 border-2 shadow-lg group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4"
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/20 p-3 rounded-xl">
                                        <AlertTriangle size={24} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">危險操作</h3>
                                        <p className="text-gray-300 text-sm">請謹慎操作以下功能</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">重設所有設定</p>
                                            <p className="text-gray-400 text-sm">恢復到預設設定值</p>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override bg-orange-600 text-white"
                                            radius="lg"
                                        >
                                            重設
                                        </Button>
                                    </div>
                                    <Divider className="bg-white/20" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">清除所有資料</p>
                                            <p className="text-gray-400 text-sm">刪除所有快取和暫存資料</p>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override bg-red-600 text-white"
                                            radius="lg"
                                            startContent={<Trash size={18} />}
                                        >
                                            清除
                                        </Button>
                                    </div>
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
        <div className="min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55%">
            {/* 頂部導航 - 保持不變 */}
            <div className="absolute top-6 right-6 flex space-x-3">
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

            {/* 主要內容區 */}
            <div className="pt-36 px-13">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        帳號設定
                    </h1>
                    <p className="text-gray-300 text-lg">
                        管理你的個人資料、安全性和偏好設定
                    </p>
                </div>

                <div className="flex gap-6">
                    {/* 左側選單 */}
                    <div className="w-72 flex-shrink-0">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20 sticky top-6" shadow="lg">
                            <CardBody className="p-0">
                                <div className="space-y-1 p-2">
                                    {settingsTabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <div
                                                key={tab.id}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${activeTab === tab.id
                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                onClick={() => setActiveTab(tab.id)}
                                            >
                                                <Icon size={20} />
                                                <span className="font-medium">{tab.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* 右側內容 */}
                    <div className="flex-1 pb-16">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
