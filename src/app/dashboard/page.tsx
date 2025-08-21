"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, User, FileText, Activity, Calendar, Shield, Bell, TrendingUp, Users, Server, Database, ArrowRight, Share2, Check, CircleCheck, CircleCheckBig, Lock, X, ClockFading, LockOpen, ExternalLink, Package, BellRing, Trash, CloudUpload, ArrowUpRight, Github } from "lucide-react";
import { Chip, Progress, Spinner } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spacer } from "@heroui/spacer";
import { Avatar, Divider, Link, skeleton, chip } from "@heroui/react";
import { IoAlertOutline } from "react-icons/io5";

export default function Dashboard() {
    let welcomeString = ["🌅 早安，歡迎回來！", "☀️ 午安，歡迎回來！", "🌇 晚安，近來好嗎？", "🌙 夜深了，好好休息吧！"]
    const getWelcomeMessage = () => {
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
            return welcomeString[0];
        } else if (currentHour >= 12 && currentHour < 17) {
            return welcomeString[1];
        } else if (currentHour >= 17 && currentHour < 23) {
            return welcomeString[2];
        } else {
            return welcomeString[3];
        }
    };

    const { user, loading, logout } = useAuth();
    const router = useRouter();
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

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
            <div className="absolute top-6 right-6 flex space-x-3">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <House size={18} />
                        資訊主頁
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Folder size={18} />
                        我的檔案
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Cog size={18} />
                        帳號設定
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
                    {getWelcomeMessage()}
                </h1>
                <p className="text-gray-300 text-lg">
                    {user.displayName}，歡迎回來 Share Lock。&nbsp;&nbsp;&nbsp;這裡是專屬於您的資訊主頁，您可以在這裡取得最新動態與重要資訊。
                </p>
            </div>

            <div className="px-12 py-8 pb-16">
                {/* 第一列 */}
                <div className="flex mb-6">
                    <Card className=" bg-white/10 backdrop-blur-sm border-white/20 min-h-full" shadow="lg" isPressable isFooterBlurred>
                        <div className="flex-1 relative" >
                            <Image
                                isZoomed
                                alt="使用者頭像"
                                src={user.photoURL ? user.photoURL : undefined}
                                className="inset-0 z-0 min-w-[200px] h-full object-cover"
                                removeWrapper
                            />
                        </div>
                        <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between items-center h-14 px-4">
                            <div className="flex flex-col items-start justify-start" >
                                <p className="text-xs text-slate-600 font-light">查看你的</p>
                                <p className="text-sm text-blue-500 font-medium">帳號資訊與設定</p>
                            </div>
                            <ArrowRight size={24} className="text-slate-600 flex-shrink-0" />
                        </CardFooter>
                    </Card>

                    <Spacer x={6} />

                    <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-w-[700px] h-[212px]" shadow="lg" >
                        <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                            <div className="bg-blue-600/30 p-3 rounded-xl">
                                <Share2 size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-white">檔案分享</h4>
                                <p className="text-gray-300 text-sm">咚咚咚，看看有沒有人要分享檔案給你？</p>
                            </div>
                            <Button className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm" radius="lg" startContent={<ExternalLink size={18} />} >
                                查看更多
                            </Button>
                        </CardHeader>
                        <CardBody className="px-6 py-4">
                            <div className="px-4">
                                <div className="grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 gap-y-3">
                                    <Avatar src="https://i.pravatar.cc/40?u=user1" size="md" />
                                    <div className="flex min-w-0 flex-col">
                                        <p className="text-white text-base font-medium truncate">Anna 想要分享 "線性代數考古題" 給你</p>
                                        <p className="text-sm font-normal flex gap-2 items-center text-gray-400">
                                            <IoAlertOutline size={16} className="rounded-full bg-amber-500 p-0.5 text-zinc-900" />即將失效： 2025 / 08 / 31 前有效
                                        </p>
                                    </div>
                                    <div className="justify-self-center self-center">
                                        <Chip startContent={<Lock size={14} className="text-white" />} className="pl-3 items-center text-sm text-white h-8 bg-blue-600">
                                            已開啟裝置綁定
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 self-center">
                                        <Button
                                            size="sm"
                                            radius="full"
                                            isIconOnly
                                            aria-label="接受"
                                            className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0"
                                        >
                                            <Check size={20} />
                                        </Button>
                                        <span className="text-sm text-white font-extrabold">/</span>
                                        <Button
                                            size="sm"
                                            radius="full"
                                            isIconOnly
                                            aria-label="拒絕"
                                            className="custom-button-trans-override bg-rose-500 text-white h-8 w-8 p-0"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>
                                    <Avatar src="https://i.pravatar.cc/40?u=user2" size="md" />
                                    <div className="flex min-w-0 flex-col">
                                        <p className="text-white text-base font-medium truncate">Wendy 想要分享 "計算機&nbsp;...&nbsp;考解答.pdf" 給你</p>
                                        <p className="text-sm font-normal flex gap-2 items-center text-gray-400">
                                            <Check size={16} className="rounded-full bg-emerald-500 p-0.5 text-zinc-900" /> 2026 / 09 / 27 前有效
                                        </p>
                                    </div>
                                    <div className="justify-self-center self-center">
                                        <Chip startContent={<LockOpen size={14} className="text-white" />} className="pl-3 items-center text-sm text-white h-8 bg-emerald-600">
                                            未限制
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 self-center">
                                        <Button
                                            size="sm"
                                            radius="full"
                                            isIconOnly
                                            aria-label="接受"
                                            className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0"
                                        >
                                            <Check size={20} />
                                        </Button>
                                        <span className="text-sm text-white font-extrabold">/</span>
                                        <Button
                                            size="sm"
                                            radius="full"
                                            isIconOnly
                                            aria-label="拒絕"
                                            className="custom-button-trans-override bg-rose-500 text-white h-8 w-8 p-0"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Spacer x={6} />

                    <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-w-[458px] max-w-[600px]" shadow="lg">
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                            <div className="bg-purple-500/20 p-3 rounded-xl">
                                <Package size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-white">使用狀況</h4>
                                <p className="text-gray-300 text-sm">查看你的 Share Lock 帳號使用狀況</p>
                            </div>
                            <Button className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm" radius="lg" startContent={<ExternalLink size={18} />} >
                                瞭解詳情
                            </Button>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="px-4">
                                <div className="flex items-center gap-2 text-base align-middle text-gray-200 font-medium tracking-wider pb-3">
                                    {true ? (
                                        <>
                                            <IoAlertOutline size={24} className="shrink-0 rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                            <span className="leading-none">需要注意：可用空間不足 15%</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={24} className="shrink-0 rounded-full bg-emerald-500 p-0.5 text-zinc-900" />
                                            <span className="leading-none">一切正常：可用空間還剩 23%</span>
                                        </>
                                    )}
                                </div>
                                <Progress
                                    size="md"
                                    radius="full"
                                    showValueLabel
                                    classNames={{
                                        indicator: (true
                                            ? "bg-linear-245 from-amber-500 to-rose-700"
                                            : "bg-linear-245 from-cyan-500 to-sky-600"
                                        ),
                                        track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                        value: "text-2xl font-medium text-gray-200 tracking-wider leading-none",
                                        label: "text-gray-300 font-normal text-base relative top-2"
                                    }}
                                    label="882 MB / 1 GB"
                                    value={86}
                                >
                                </Progress>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* 第二列 */}
                <div className="flex mb-6">
                    <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-h-80" shadow="lg">
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-500/20 p-3 rounded-xl">
                                    <BellRing size={24} className="text-yellow-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-white">通知中心</h4>
                                    <p className="text-gray-300 text-sm">負責掌管你的重要訊息</p>
                                </div>
                            </div>
                            <Button className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm" radius="lg" startContent={<ExternalLink size={18} />} >
                                查看全部
                            </Button>
                        </CardHeader>
                        <CardBody className="px-6 py-4">
                            <div className="space-y-3">
                                <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3">
                                    <div className="rounded-xl bg-orange-500/25 text-orange-400 p-0 h-10 w-10 flex items-center justify-center">
                                        <ClockFading />
                                    </div>
                                    <div>
                                        <p className="text-base text-gray-200 font-medium">您的檔案即將過期</p>
                                        <p className="text-xs text-gray-400">2 小時前</p>
                                    </div>
                                    <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full mx-2" />
                                    <div className="text-gray-300 text-sm">
                                        你的檔案 "在學證明.pdf" 即將於一天後過期。
                                    </div>
                                    <Button
                                        size="sm"
                                        isIconOnly
                                        radius="full"
                                        className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                    >
                                        <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3">
                                    <div className="rounded-xl bg-red-500/25 text-red-400 p-0 h-10 w-10 flex items-center justify-center">
                                        <X />
                                    </div>
                                    <div>
                                        <p className="text-base text-gray-200 font-medium">Harry 婉拒了你分享的檔案</p>
                                        <p className="text-xs text-gray-400">5 小時前</p>
                                    </div>
                                    <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full mx-2" />
                                    <div className="text-gray-300 text-sm">
                                        Harry 已婉拒了你的 "期末簡報.pptx"
                                    </div>
                                    <Button
                                        size="sm"
                                        isIconOnly
                                        radius="full"
                                        className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                    >
                                        <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3">
                                    <div className="rounded-xl bg-emerald-500/25 text-emerald-400 p-0 h-10 w-10 flex items-center justify-center">
                                        <Check />
                                    </div>
                                    <div>
                                        <p className="text-base text-gray-200 font-medium">Miya 收到了你分享的檔案</p>
                                        <p className="text-xs text-gray-400">2025 / 07 / 31</p>
                                    </div>
                                    <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full  mx-2" />
                                    <div className="text-gray-300 text-sm">
                                        Miya 收到了你分享到 "ヨルシカ 盗作.flac"
                                    </div>
                                    <Button
                                        size="sm"
                                        isIconOnly
                                        radius="full"
                                        className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                    >
                                        <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Spacer x={6} />

                    <div className="flex-1 flex">
                        <Card className="flex-1 backdrop-blur-sm bg-gradient-to-tl from-green-500/20 to-emerald-500/20" shadow="lg" isPressable>
                            <CardHeader className="pb-0 pt-6 px-6 flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/30 p-4 rounded-xl">
                                        <CloudUpload size={36} className="text-emerald-400" />
                                    </div>
                                    <div className="flex flex-col items-start justify-start">
                                        <h4 className="font-bold text-2xl text-white tracking-wider">上傳檔案</h4>
                                        <p className="text-gray-300 text-sm">使用 Share Lock 來分享檔案</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardFooter className="gap-2 items-end justify-end mt-auto pr-6 pb-6 text-lg font-medium text-gray-200">
                                上傳檔案到 Share Lock
                                <ArrowUpRight size={24} />
                            </CardFooter>
                        </Card>

                        <Spacer x={6} />

                        <Card className="flex-1 backdrop-blur-sm bg-gradient-to-tl from-neutral-900/20 to-neutral-400/20" shadow="lg" isPressable>
                            <CardHeader className="pb-0 pt-6 px-6 flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-800/40 p-4 rounded-xl">
                                        <Github size={36} className="text-gray-200" />
                                    </div>
                                    <div className="flex flex-col items-start justify-start">
                                        <h4 className="font-bold text-2xl text-white tracking-wider">Github</h4>
                                        <p className="text-gray-300 text-sm">查看我們的原始碼</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardFooter className="gap-2 items-end justify-end mt-auto pr-6 pb-6 text-lg font-medium text-gray-200">
                                造訪 Github 儲存庫！
                                <ArrowUpRight size={24} />
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
