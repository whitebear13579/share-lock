"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, User, Mail, Lock, ImagePlus, Save, Shield, Bell } from "lucide-react";
import { Avatar, Divider, Spinner, Switch } from "@heroui/react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { auth, db, storage } from "@/utils/firebase";
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 本地狀態：個人資料
    const [displayName, setDisplayName] = useState<string>("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // 本地狀態：安全性（變更信箱 / 密碼）
    const [newEmail, setNewEmail] = useState<string>("");
    const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState<string>("");
    const [savingEmail, setSavingEmail] = useState(false);

    const [currentPasswordForPwd, setCurrentPasswordForPwd] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
    const [savingPassword, setSavingPassword] = useState(false);

    // 偏好設定（Firestore）
    const [prefNotifications, setPrefNotifications] = useState<boolean>(true);
    const [prefDeviceBinding, setPrefDeviceBinding] = useState<boolean>(true);
    const [savingPrefs, setSavingPrefs] = useState(false);

    const isPasswordProvider = useMemo(() => {
        if (!user) return false;
        return user.providerData.some((p) => p.providerId === "password");
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
            setPhotoURL(user.photoURL || null);
            setNewEmail(user.email || "");
        }
    }, [user]);

    // 載入偏好設定
    useEffect(() => {
        const loadPrefs = async () => {
            if (!user) return;
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as any;
                if (typeof data?.preferences?.notifications === "boolean") {
                    setPrefNotifications(data.preferences.notifications);
                }
                if (typeof data?.preferences?.deviceBinding === "boolean") {
                    setPrefDeviceBinding(data.preferences.deviceBinding);
                }
            } else {
                // 預設偏好寫入（不阻塞 UI）
                setDoc(docRef, {
                    profile: {
                        displayName: user.displayName || "",
                        photoURL: user.photoURL || null,
                        email: user.email || "",
                    },
                    preferences: {
                        notifications: prefNotifications,
                        deviceBinding: prefDeviceBinding,
                    },
                    updatedAt: Date.now(),
                }).catch(() => { });
            }
        };
        loadPrefs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handlePickAvatar = () => fileInputRef.current?.click();

    const handleUploadAvatar = async (file: File) => {
        if (!user) return;
        setUploadingAvatar(true);
        try {
            const avatarRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(avatarRef, file);
            const url = await getDownloadURL(avatarRef);
            await updateProfile(auth.currentUser!, { photoURL: url });
            setPhotoURL(url);
            // 同步 Firestore
            await updateDoc(doc(db, "users", user.uid), {
                "profile.photoURL": url,
                updatedAt: Date.now(),
            }).catch(async () => {
                await setDoc(doc(db, "users", user.uid), {
                    profile: { photoURL: url },
                    updatedAt: Date.now(),
                }, { merge: true });
            });
        } catch (e) {
            console.error(e);
            alert("上傳大頭貼失敗，請稍後再試。");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSavingProfile(true);
        try {
            await updateProfile(auth.currentUser!, { displayName: displayName.trim() });
            await updateDoc(doc(db, "users", user.uid), {
                "profile.displayName": displayName.trim(),
                updatedAt: Date.now(),
            }).catch(async () => {
                await setDoc(doc(db, "users", user.uid), {
                    profile: { displayName: displayName.trim() },
                    updatedAt: Date.now(),
                }, { merge: true });
            });
        } catch (e) {
            console.error(e);
            alert("儲存個人資料時發生錯誤。");
        } finally {
            setSavingProfile(false);
        }
    };

    const reauthWithPassword = async (email: string, password: string) => {
        const cred = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(auth.currentUser!, cred);
    };

    const handleSaveEmail = async () => {
        if (!user) return;
        if (!newEmail || !currentPasswordForEmail) {
            alert("請輸入新信箱與目前密碼。");
            return;
        }
        setSavingEmail(true);
        try {
            await reauthWithPassword(user.email || "", currentPasswordForEmail);
            await updateEmail(auth.currentUser!, newEmail.trim());
            await updateDoc(doc(db, "users", user.uid), {
                "profile.email": newEmail.trim(),
                updatedAt: Date.now(),
            }).catch(async () => {
                await setDoc(doc(db, "users", user.uid), {
                    profile: { email: newEmail.trim() },
                    updatedAt: Date.now(),
                }, { merge: true });
            });
            alert("已更新信箱。");
        } catch (e) {
            console.error(e);
            alert("更新信箱失敗，可能需要重新登入或密碼不正確。");
        } finally {
            setSavingEmail(false);
        }
    };

    const handleSavePassword = async () => {
        if (!user) return;
        if (!currentPasswordForPwd || !newPassword || !confirmNewPassword) {
            alert("請完整輸入欄位。");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            alert("兩次輸入的新密碼不一致。");
            return;
        }
        setSavingPassword(true);
        try {
            await reauthWithPassword(user.email || "", currentPasswordForPwd);
            await updatePassword(auth.currentUser!, newPassword);
            setCurrentPasswordForPwd("");
            setNewPassword("");
            setConfirmNewPassword("");
            alert("已更新密碼。");
        } catch (e) {
            console.error(e);
            alert("更新密碼失敗，可能需要重新登入或密碼不正確。");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSavePrefs = async () => {
        if (!user) return;
        setSavingPrefs(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                preferences: {
                    notifications: prefNotifications,
                    deviceBinding: prefDeviceBinding,
                },
                updatedAt: Date.now(),
            }, { merge: true });
        } catch (e) {
            console.error(e);
            alert("儲存偏好設定失敗。");
        } finally {
            setSavingPrefs(false);
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
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
            {/* 既有頂部導覽：不變更 */}
            <div className="absolute top-6 right-6 flex space-x-3">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <House size={18} />
                        資訊主頁
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Folder size={18} />
                        我的檔案
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Cog size={18} />
                        帳號設定
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
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

            {/* 內容區 */}
            <div className="pt-36 px-13">
                <h1 className="text-4xl font-bold text-white mb-2">帳號設定</h1>
                <p className="text-gray-300 text-lg">管理您的個人資料、安全性與偏好設定。</p>
            </div>

            <div className="px-12 py-8 pb-16 space-y-6">
                {/* 個人資料 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                    <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                        <div className="bg-blue-600/30 p-3 rounded-xl">
                            <User size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-white">個人資料</h4>
                            <p className="text-gray-300 text-sm">更新暱稱與大頭貼</p>
                        </div>
                    </CardHeader>
                    <CardBody className="px-6 py-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex items-center gap-4">
                                <Avatar size="lg" src={photoURL ?? undefined} className="w-20 h-20 text-large" />
                                <div className="flex flex-col gap-2">
                                    <CustomButton
                                        variant="blur"
                                        size="md"
                                        startContent={<ImagePlus size={18} className="text-gray-200" />}
                                        isDisabled={uploadingAvatar}
                                        onPress={handlePickAvatar}
                                        className="text-gray-200"
                                    >
                                        {uploadingAvatar ? "上傳中..." : "更換大頭貼"}
                                    </CustomButton>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        aria-label="選擇大頭貼圖片"
                                        title="選擇大頭貼圖片"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleUploadAvatar(f);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomInput
                                    label="顯示名稱"
                                    placeholder="輸入您的暱稱"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                                <CustomInput label="電子郵件（唯讀）" value={user.email || ""} isReadOnly />
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter className="px-6 pb-6 pt-0 flex justify-end">
                        <CustomButton
                            variant="blur"
                            startContent={<Save size={18} className="text-gray-200" />}
                            isDisabled={savingProfile}
                            onPress={handleSaveProfile}
                            className="text-gray-200"
                        >
                            {savingProfile ? "儲存中..." : "儲存變更"}
                        </CustomButton>
                    </CardFooter>
                </Card>

                {/* 安全性設定 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* 變更信箱 */}
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                            <div className="bg-purple-500/20 p-3 rounded-xl">
                                <Mail size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-white">變更電子郵件</h4>
                                <p className="text-gray-300 text-sm">需要再次驗證您的帳號密碼</p>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="grid grid-cols-1 gap-4">
                                <CustomInput label="新電子郵件" placeholder="your@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                                <CustomInput
                                    label="目前密碼"
                                    type="password"
                                    placeholder="輸入目前密碼以驗證"
                                    value={currentPasswordForEmail}
                                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                                />
                            </div>
                        </CardBody>
                        <CardFooter className="px-6 pb-6 pt-0 flex justify-end">
                            <CustomButton
                                variant="blur"
                                isDisabled={savingEmail}
                                onPress={handleSaveEmail}
                                className="text-gray-200"
                                startContent={<Save size={18} className="text-gray-200" />}
                            >
                                {savingEmail ? "更新中..." : "更新信箱"}
                            </CustomButton>
                        </CardFooter>
                    </Card>

                    {/* 變更密碼 */}
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                            <div className="bg-rose-500/20 p-3 rounded-xl">
                                <Lock size={24} className="text-rose-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-white">變更密碼</h4>
                                <p className="text-gray-300 text-sm">設定新密碼以保護您的帳號</p>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CustomInput
                                    label="目前密碼"
                                    type="password"
                                    placeholder="輸入目前密碼"
                                    value={currentPasswordForPwd}
                                    onChange={(e) => setCurrentPasswordForPwd(e.target.value)}
                                    isDisabled={!isPasswordProvider}
                                />
                                <CustomInput
                                    label="新密碼"
                                    type="password"
                                    placeholder="輸入新密碼"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    isDisabled={!isPasswordProvider}
                                />
                                <CustomInput
                                    label="確認新密碼"
                                    type="password"
                                    placeholder="再次輸入新密碼"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    isDisabled={!isPasswordProvider}
                                />
                            </div>
                            {!isPasswordProvider && (
                                <p className="text-sm text-amber-300 mt-2">您是以第三方登入，無法直接變更密碼。</p>
                            )}
                        </CardBody>
                        <CardFooter className="px-6 pb-6 pt-0 flex justify-end">
                            <CustomButton
                                variant="blur"
                                isDisabled={savingPassword || !isPasswordProvider}
                                onPress={handleSavePassword}
                                className="text-gray-200"
                                startContent={<Save size={18} className="text-gray-200" />}
                            >
                                {savingPassword ? "更新中..." : "更新密碼"}
                            </CustomButton>
                        </CardFooter>
                    </Card>
                </div>

                {/* 偏好設定 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                    <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                        <div className="bg-emerald-500/20 p-3 rounded-xl">
                            <Shield size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-white">偏好設定</h4>
                            <p className="text-gray-300 text-sm">管理通知與裝置綁定預設值</p>
                        </div>
                    </CardHeader>
                    <CardBody className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-sky-500/25 text-sky-400 p-2 h-10 w-10 flex items-center justify-center">
                                        <Bell size={18} />
                                    </div>
                                    <div>
                                        <p className="text-gray-200 font-medium">推播/郵件通知</p>
                                        <p className="text-gray-400 text-sm">接收 Share Lock 的重要訊息</p>
                                    </div>
                                </div>
                                <Switch isSelected={prefNotifications} onValueChange={setPrefNotifications} aria-label="切換通知" />
                            </div>
                            <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-indigo-500/25 text-indigo-400 p-2 h-10 w-10 flex items-center justify-center">
                                        <Shield size={18} />
                                    </div>
                                    <div>
                                        <p className="text-gray-200 font-medium">裝置綁定</p>
                                        <p className="text-gray-400 text-sm">新分享預設啟用裝置綁定限制</p>
                                    </div>
                                </div>
                                <Switch isSelected={prefDeviceBinding} onValueChange={setPrefDeviceBinding} aria-label="切換裝置綁定" />
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter className="px-6 pb-6 pt-0 flex justify-end">
                        <CustomButton
                            variant="blur"
                            isDisabled={savingPrefs}
                            onPress={handleSavePrefs}
                            className="text-gray-200"
                            startContent={<Save size={18} className="text-gray-200" />}
                        >
                            {savingPrefs ? "儲存中..." : "儲存偏好"}
                        </CustomButton>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
