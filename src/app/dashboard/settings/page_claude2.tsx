"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, User, Mail, Bell, Shield, Eye, EyeOff, Camera, Edit3, Save, X, Check } from "lucide-react";
import { Spinner, Switch, Avatar, Divider, Card, CardBody, CardHeader } from "@heroui/react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { Image } from "@heroui/react";
import NextImage from "next/image";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 設定頁面狀態
    const [activeTab, setActiveTab] = useState("profile");
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    // 個人資料表單狀態
    const [profileData, setProfileData] = useState({
        displayName: "",
        email: "",
        photoURL: ""
    });

    // 密碼變更表單狀態
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // 通知設定狀態
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        securityAlerts: true,
        marketingEmails: false
    });

    // 隱私設定狀態
    const [privacySettings, setPrivacySettings] = useState({
        profileVisibility: true,
        activityTracking: false,
        dataCollection: false,
        thirdPartySharing: false
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
        if (user) {
            setProfileData({
                displayName: user.displayName || "",
                email: user.email || "",
                photoURL: user.photoURL || ""
            });
        }
    }, [user, loading, router]);

    // 儲存個人資料
    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateProfile(user, {
                displayName: profileData.displayName,
                photoURL: profileData.photoURL
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
        setSaving(false);
    };

    // 變更密碼
    const handleChangePassword = async () => {
        if (!user || !user.email) return;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("新密碼與確認密碼不符");
            return;
        }
        setSaving(true);
        try {
            // 重新驗證用戶
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 更新密碼
            await updatePassword(user, passwordData.newPassword);

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
            alert("密碼已成功更新");
        } catch (error) {
            console.error("Error updating password:", error);
            alert("密碼更新失敗，請檢查當前密碼是否正確");
        }
        setSaving(false);
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
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
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

            {/* 主要內容區域 */}
            <div className="pt-24 px-8 pb-8">
                <div className="max-w-6xl mx-auto">
                    {/* 頁面標題 */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">帳號設定</h1>
                        <p className="text-gray-300">管理您的個人資料、安全性和偏好設定</p>
                    </div>

                    <div className="flex gap-8">
                        {/* 側邊選項卡 */}
                        <div className="w-80">
                            <Card className="bg-white/10 border border-white/20 backdrop-blur-xl">
                                <CardBody className="p-2">
                                    <div className="space-y-2">
                                        <div
                                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeTab === "profile"
                                                    ? "bg-white/20 text-white"
                                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                                                }`}
                                            onClick={() => setActiveTab("profile")}
                                        >
                                            <User size={20} />
                                            <span className="font-medium">個人資料</span>
                                        </div>
                                        <div
                                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeTab === "security"
                                                    ? "bg-white/20 text-white"
                                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                                                }`}
                                            onClick={() => setActiveTab("security")}
                                        >
                                            <Shield size={20} />
                                            <span className="font-medium">安全性</span>
                                        </div>
                                        <div
                                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeTab === "notifications"
                                                    ? "bg-white/20 text-white"
                                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                                                }`}
                                            onClick={() => setActiveTab("notifications")}
                                        >
                                            <Bell size={20} />
                                            <span className="font-medium">通知設定</span>
                                        </div>
                                        <div
                                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeTab === "privacy"
                                                    ? "bg-white/20 text-white"
                                                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                                                }`}
                                            onClick={() => setActiveTab("privacy")}
                                        >
                                            <Eye size={20} />
                                            <span className="font-medium">隱私設定</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* 主要設定內容 */}
                        <div className="flex-1">
                            <Card className="bg-white/10 border border-white/20 backdrop-blur-xl">
                                <CardBody className="p-8">
                                    {/* 個人資料頁面 */}
                                    {activeTab === "profile" && (
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-bold text-white">個人資料</h2>
                                                {!isEditing ? (
                                                    <CustomButton
                                                        variant="blur"
                                                        startContent={<Edit3 size={16} />}
                                                        onPress={() => setIsEditing(true)}
                                                    >
                                                        編輯資料
                                                    </CustomButton>
                                                ) : (
                                                    <div className="flex gap-3">
                                                        <CustomButton
                                                            variant="blur"
                                                            startContent={<X size={16} />}
                                                            onPress={() => {
                                                                setIsEditing(false);
                                                                if (user) {
                                                                    setProfileData({
                                                                        displayName: user.displayName || "",
                                                                        email: user.email || "",
                                                                        photoURL: user.photoURL || ""
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            取消
                                                        </CustomButton>
                                                        <CustomButton
                                                            variant="blur"
                                                            startContent={<Save size={16} />}
                                                            onPress={handleSaveProfile}
                                                            isDisabled={saving}
                                                        >
                                                            {saving ? "儲存中..." : "儲存變更"}
                                                        </CustomButton>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-start gap-8">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Avatar
                                                        src={profileData.photoURL}
                                                        alt="用戶頭像"
                                                        className="w-24 h-24"
                                                        isBordered
                                                        color="default"
                                                    />
                                                    {isEditing && (
                                                        <CustomButton
                                                            variant="blur"
                                                            size="sm"
                                                            startContent={<Camera size={16} />}
                                                        >
                                                            更換頭像
                                                        </CustomButton>
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                                顯示名稱
                                                            </label>
                                                            <CustomInput
                                                                variant="blur"
                                                                value={profileData.displayName}
                                                                onChange={(e) => setProfileData(prev => ({
                                                                    ...prev,
                                                                    displayName: e.target.value
                                                                }))}
                                                                isDisabled={!isEditing}
                                                                placeholder="請輸入您的顯示名稱"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                                電子信箱
                                                            </label>
                                                            <CustomInput
                                                                variant="blur"
                                                                value={profileData.email}
                                                                isDisabled={true}
                                                                placeholder="電子信箱無法更改"
                                                                startContent={<Mail size={16} className="text-gray-400" />}
                                                            />
                                                        </div>
                                                    </div>

                                                    {isEditing && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                                頭像網址
                                                            </label>
                                                            <CustomInput
                                                                variant="blur"
                                                                value={profileData.photoURL}
                                                                onChange={(e) => setProfileData(prev => ({
                                                                    ...prev,
                                                                    photoURL: e.target.value
                                                                }))}
                                                                placeholder="請輸入頭像圖片網址"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Divider className="bg-white/20" />

                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-4">帳戶資訊</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-white/5 rounded-lg p-4">
                                                        <p className="text-sm text-gray-400 mb-1">帳戶創建時間</p>
                                                        <p className="text-white">
                                                            {user?.metadata.creationTime ?
                                                                new Date(user.metadata.creationTime).toLocaleDateString('zh-TW') :
                                                                "未知"
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4">
                                                        <p className="text-sm text-gray-400 mb-1">上次登入時間</p>
                                                        <p className="text-white">
                                                            {user?.metadata.lastSignInTime ?
                                                                new Date(user.metadata.lastSignInTime).toLocaleDateString('zh-TW') :
                                                                "未知"
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 安全性頁面 */}
                                    {activeTab === "security" && (
                                        <div className="space-y-8">
                                            <h2 className="text-2xl font-bold text-white">安全性設定</h2>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-semibold text-white">變更密碼</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-200 mb-2">
                                                            目前密碼
                                                        </label>
                                                        <CustomInput
                                                            variant="blur"
                                                            type={showPassword ? "text" : "password"}
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData(prev => ({
                                                                ...prev,
                                                                currentPassword: e.target.value
                                                            }))}
                                                            placeholder="請輸入目前密碼"
                                                            endContent={
                                                                <button
                                                                    className="focus:outline-none text-gray-400 hover:text-white"
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                >
                                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                </button>
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                                新密碼
                                                            </label>
                                                            <CustomInput
                                                                variant="blur"
                                                                type={showNewPassword ? "text" : "password"}
                                                                value={passwordData.newPassword}
                                                                onChange={(e) => setPasswordData(prev => ({
                                                                    ...prev,
                                                                    newPassword: e.target.value
                                                                }))}
                                                                placeholder="請輸入新密碼"
                                                                endContent={
                                                                    <button
                                                                        className="focus:outline-none text-gray-400 hover:text-white"
                                                                        type="button"
                                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                                    >
                                                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                    </button>
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                                                確認新密碼
                                                            </label>
                                                            <CustomInput
                                                                variant="blur"
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                value={passwordData.confirmPassword}
                                                                onChange={(e) => setPasswordData(prev => ({
                                                                    ...prev,
                                                                    confirmPassword: e.target.value
                                                                }))}
                                                                placeholder="請再次輸入新密碼"
                                                                isInvalid={!!(passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword)}
                                                                errorMessage={
                                                                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                                                        ? "密碼不符合" : undefined
                                                                }
                                                                endContent={
                                                                    <button
                                                                        className="focus:outline-none text-gray-400 hover:text-white"
                                                                        type="button"
                                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                    >
                                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                    </button>
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <CustomButton
                                                        variant="blur"
                                                        onPress={handleChangePassword}
                                                        isDisabled={
                                                            !passwordData.currentPassword ||
                                                            !passwordData.newPassword ||
                                                            passwordData.newPassword !== passwordData.confirmPassword ||
                                                            saving
                                                        }
                                                        startContent={<Shield size={16} />}
                                                    >
                                                        {saving ? "更新中..." : "更新密碼"}
                                                    </CustomButton>
                                                </div>
                                            </div>

                                            <Divider className="bg-white/20" />

                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-4">帳戶安全</h3>
                                                <div className="space-y-4">
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">雙重驗證</p>
                                                            <p className="text-sm text-gray-400">為您的帳戶增加額外安全保護</p>
                                                        </div>
                                                        <Switch size="lg" />
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">登入通知</p>
                                                            <p className="text-sm text-gray-400">當有新設備登入時接收通知</p>
                                                        </div>
                                                        <Switch size="lg" defaultSelected />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 通知設定頁面 */}
                                    {activeTab === "notifications" && (
                                        <div className="space-y-8">
                                            <h2 className="text-2xl font-bold text-white">通知設定</h2>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-semibold text-white">電子郵件通知</h3>
                                                <div className="space-y-4">
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">一般通知</p>
                                                            <p className="text-sm text-gray-400">接收帳戶相關的重要通知</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={notificationSettings.emailNotifications}
                                                            onValueChange={(value) => setNotificationSettings(prev => ({
                                                                ...prev,
                                                                emailNotifications: value
                                                            }))}
                                                        />
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">安全警示</p>
                                                            <p className="text-sm text-gray-400">接收安全相關的緊急通知</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={notificationSettings.securityAlerts}
                                                            onValueChange={(value) => setNotificationSettings(prev => ({
                                                                ...prev,
                                                                securityAlerts: value
                                                            }))}
                                                        />
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">行銷郵件</p>
                                                            <p className="text-sm text-gray-400">接收產品更新和促銷資訊</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={notificationSettings.marketingEmails}
                                                            onValueChange={(value) => setNotificationSettings(prev => ({
                                                                ...prev,
                                                                marketingEmails: value
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Divider className="bg-white/20" />

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-semibold text-white">推播通知</h3>
                                                <div className="space-y-4">
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">瀏覽器推播</p>
                                                            <p className="text-sm text-gray-400">在瀏覽器中接收即時通知</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={notificationSettings.pushNotifications}
                                                            onValueChange={(value) => setNotificationSettings(prev => ({
                                                                ...prev,
                                                                pushNotifications: value
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 隱私設定頁面 */}
                                    {activeTab === "privacy" && (
                                        <div className="space-y-8">
                                            <h2 className="text-2xl font-bold text-white">隱私設定</h2>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-semibold text-white">個人資料可見度</h3>
                                                <div className="space-y-4">
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">公開個人資料</p>
                                                            <p className="text-sm text-gray-400">允許其他用戶查看您的基本資料</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={privacySettings.profileVisibility}
                                                            onValueChange={(value) => setPrivacySettings(prev => ({
                                                                ...prev,
                                                                profileVisibility: value
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Divider className="bg-white/20" />

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-semibold text-white">資料收集與追蹤</h3>
                                                <div className="space-y-4">
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">活動追蹤</p>
                                                            <p className="text-sm text-gray-400">允許收集使用行為數據以改善服務</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={privacySettings.activityTracking}
                                                            onValueChange={(value) => setPrivacySettings(prev => ({
                                                                ...prev,
                                                                activityTracking: value
                                                            }))}
                                                        />
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">數據收集</p>
                                                            <p className="text-sm text-gray-400">允許收集匿名使用統計</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={privacySettings.dataCollection}
                                                            onValueChange={(value) => setPrivacySettings(prev => ({
                                                                ...prev,
                                                                dataCollection: value
                                                            }))}
                                                        />
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-white font-medium">第三方分享</p>
                                                            <p className="text-sm text-gray-400">允許與合作夥伴分享匿名數據</p>
                                                        </div>
                                                        <Switch
                                                            size="lg"
                                                            isSelected={privacySettings.thirdPartySharing}
                                                            onValueChange={(value) => setPrivacySettings(prev => ({
                                                                ...prev,
                                                                thirdPartySharing: value
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Divider className="bg-white/20" />

                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold text-white">帳戶管理</h3>
                                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                                                    <h4 className="text-red-400 font-semibold mb-2">危險區域</h4>
                                                    <p className="text-sm text-gray-300 mb-4">
                                                        刪除帳戶將永久移除您的所有資料，此操作無法復原。
                                                    </p>
                                                    <CustomButton
                                                        variant="blur"
                                                        className="!bg-red-500/20 !border-red-500/50 hover:!bg-red-500/30"
                                                    >
                                                        刪除帳戶
                                                    </CustomButton>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
