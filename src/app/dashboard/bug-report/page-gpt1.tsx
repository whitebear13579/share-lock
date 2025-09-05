"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, User, Shield, AlertTriangle, Award, DollarSign, Clock, Calendar, CheckCircle, XCircle, Send, FileText, Bug, Target, Lock, Eye, EyeOff, ArrowRight, ExternalLink, Github, Mail, TrendingUp, Users } from "lucide-react";
import { Spinner, Card, CardHeader, CardBody, CardFooter, Input, Textarea, Select, SelectItem, Chip, Progress, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import NextImage from "next/image";

export default function BugReport() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [selectedSeverity, setSelectedSeverity] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [reportTitle, setReportTitle] = useState("");
    const [reportDescription, setReportDescription] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 模擬漏洞回報數據
    const bugReports = [
        {
            id: "#BR-2024-001",
            title: "XSS 漏洞在用戶評論區",
            severity: "高",
            status: "已修復",
            reward: "$500",
            reporter: "白帽駭客_Alex",
            date: "2024/08/15",
            category: "Web 安全"
        },
        {
            id: "#BR-2024-002",
            title: "SQL 注入漏洞",
            severity: "嚴重",
            status: "處理中",
            reward: "$1,200",
            reporter: "SecurityPro_Jane",
            date: "2024/08/20",
            category: "資料庫安全"
        },
        {
            id: "#BR-2024-003",
            title: "權限提升漏洞",
            severity: "中",
            status: "待審核",
            reward: "$300",
            reporter: "EthicalHacker_Bob",
            date: "2024/08/25",
            category: "權限管理"
        }
    ];

    const severityOptions = [
        { key: "low", label: "低", color: "success" },
        { key: "medium", label: "中", color: "warning" },
        { key: "high", label: "高", color: "danger" },
        { key: "critical", label: "嚴重", color: "danger" }
    ];

    const categoryOptions = [
        { key: "web", label: "Web 安全" },
        { key: "mobile", label: "行動應用安全" },
        { key: "api", label: "API 安全" },
        { key: "database", label: "資料庫安全" },
        { key: "network", label: "網路安全" },
        { key: "crypto", label: "加密安全" },
        { key: "auth", label: "身份驗證" },
        { key: "other", label: "其他" }
    ];

    const handleSubmitReport = async () => {
        if (!reportTitle || !reportDescription || !selectedSeverity || !selectedCategory) {
            alert("請填寫所有必填欄位");
            return;
        }

        setIsSubmitting(true);
        // 模擬提交過程
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);

        // 重置表單
        setReportTitle("");
        setReportDescription("");
        setSelectedSeverity("");
        setSelectedCategory("");
        setContactEmail("");
        onOpenChange();

        alert("漏洞回報已成功提交！我們會儘快審核並回覆您。");
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "低": return "bg-green-500/20 text-green-400";
            case "中": return "bg-yellow-500/20 text-yellow-400";
            case "高": return "bg-orange-500/20 text-orange-400";
            case "嚴重": return "bg-red-500/20 text-red-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "已修復": return "bg-green-500/20 text-green-400";
            case "處理中": return "bg-blue-500/20 text-blue-400";
            case "待審核": return "bg-yellow-500/20 text-yellow-400";
            case "已拒絕": return "bg-red-500/20 text-red-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

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
        <div className="min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55%">
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
                    <div
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push("/dashboard/settings")}
                    >
                        <Cog size={18} />
                        帳號設定
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Star size={18} />
                        漏洞有賞計畫
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
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
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-red-500/20 p-4 rounded-2xl">
                        <Shield size={32} className="text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            🛡️ 漏洞有賞計畫
                        </h1>
                        <p className="text-gray-300 text-lg">
                            協助我們讓 Share Lock 變得更安全，獲得豐厚獎勵！發現漏洞並負責任地回報，與我們共同守護用戶資料安全。
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-12 py-8 pb-16">
                {/* 統計卡片區域 */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6 text-center">
                            <div className="bg-green-500/20 p-3 rounded-xl w-fit mx-auto mb-3">
                                <DollarSign size={24} className="text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">$25,600</h3>
                            <p className="text-gray-300 text-sm">總獎金發放</p>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6 text-center">
                            <div className="bg-blue-500/20 p-3 rounded-xl w-fit mx-auto mb-3">
                                <Bug size={24} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">147</h3>
                            <p className="text-gray-300 text-sm">漏洞已修復</p>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6 text-center">
                            <div className="bg-purple-500/20 p-3 rounded-xl w-fit mx-auto mb-3">
                                <Users size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">89</h3>
                            <p className="text-gray-300 text-sm">白帽駭客</p>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6 text-center">
                            <div className="bg-orange-500/20 p-3 rounded-xl w-fit mx-auto mb-3">
                                <TrendingUp size={24} className="text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">98.7%</h3>
                            <p className="text-gray-300 text-sm">安全評級</p>
                        </CardBody>
                    </Card>
                </div>

                {/* 主要內容區域 */}
                <div className="flex gap-6">
                    {/* 左側 - 漏洞回報表單和指引 */}
                    <div className="flex-1 space-y-6">
                        {/* 回報指引 */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-0 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-3 rounded-xl">
                                        <FileText size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-white">回報指引</h4>
                                        <p className="text-gray-300 text-sm">請遵循以下指引來提交漏洞回報</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1 mt-1">
                                            <CheckCircle size={16} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h5 className="text-white font-medium">詳細描述</h5>
                                            <p className="text-gray-300 text-sm">提供清楚的漏洞描述、重現步驟和影響範圍</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1 mt-1">
                                            <CheckCircle size={16} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h5 className="text-white font-medium">負責任披露</h5>
                                            <p className="text-gray-300 text-sm">請勿公開漏洞詳情，直到我們完成修復</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-500/20 rounded-full p-1 mt-1">
                                            <CheckCircle size={16} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h5 className="text-white font-medium">測試環境</h5>
                                            <p className="text-gray-300 text-sm">僅在測試環境中進行驗證，避免影響生產系統</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 獎勵方案 */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-0 pt-6 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-500/20 p-3 rounded-xl">
                                        <Award size={24} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-white">獎勵方案</h4>
                                        <p className="text-gray-300 text-sm">根據漏洞嚴重程度提供相應獎勵</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" className="bg-red-500/20 text-red-400">嚴重</Chip>
                                            <span className="text-white font-medium">Critical</span>
                                        </div>
                                        <span className="text-green-400 font-bold">$1,000 - $5,000</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" className="bg-orange-500/20 text-orange-400">高</Chip>
                                            <span className="text-white font-medium">High</span>
                                        </div>
                                        <span className="text-green-400 font-bold">$500 - $1,000</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" className="bg-yellow-500/20 text-yellow-400">中</Chip>
                                            <span className="text-white font-medium">Medium</span>
                                        </div>
                                        <span className="text-green-400 font-bold">$100 - $500</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" className="bg-green-500/20 text-green-400">低</Chip>
                                            <span className="text-white font-medium">Low</span>
                                        </div>
                                        <span className="text-green-400 font-bold">$50 - $100</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 提交漏洞回報按鈕 */}
                        <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30" shadow="lg" isPressable onPress={onOpen}>
                            <CardBody className="p-6 text-center">
                                <div className="bg-red-500/30 p-4 rounded-xl w-fit mx-auto mb-4">
                                    <Send size={32} className="text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">發現漏洞？</h3>
                                <p className="text-gray-300 mb-4">立即回報並獲得獎勵</p>
                                <Button
                                    className="custom-button-trans-override bg-red-500/20 border border-red-500/30 text-red-400 font-medium"
                                    radius="lg"
                                    startContent={<Bug size={18} />}
                                    onPress={onOpen}
                                >
                                    提交漏洞回報
                                </Button>
                            </CardBody>
                        </Card>
                    </div>

                    {/* 右側 - 最近的漏洞回報 */}
                    <div className="flex-1">
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full" shadow="lg">
                            <CardHeader className="pb-0 pt-6 px-6">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500/20 p-3 rounded-xl">
                                            <Clock size={24} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-white">最近回報</h4>
                                            <p className="text-gray-300 text-sm">查看最新的漏洞回報狀態</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm"
                                        radius="lg"
                                        startContent={<ExternalLink size={18} />}
                                    >
                                        查看全部
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-6">
                                <div className="space-y-4">
                                    {bugReports.map((report, index) => (
                                        <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h5 className="text-white font-medium mb-1">{report.title}</h5>
                                                    <p className="text-gray-400 text-sm">{report.id} • {report.reporter}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-green-400 font-bold text-sm">{report.reward}</p>
                                                    <p className="text-gray-400 text-xs">{report.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <Chip size="sm" className={getSeverityColor(report.severity)}>
                                                        {report.severity}
                                                    </Chip>
                                                    <Chip size="sm" className={getStatusColor(report.status)}>
                                                        {report.status}
                                                    </Chip>
                                                </div>
                                                <span className="text-gray-400 text-xs">{report.category}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>

            {/* 漏洞回報模態框 */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="2xl"
                classNames={{
                    base: "bg-neutral-900 border border-white/20",
                    header: "border-b border-white/20",
                    body: "py-6",
                    footer: "border-t border-white/20"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500/20 p-2 rounded-lg">
                                        <Bug size={20} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">提交漏洞回報</h3>
                                        <p className="text-gray-400 text-sm font-normal">請詳細描述您發現的安全問題</p>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <Input
                                        label="漏洞標題"
                                        placeholder="請簡要描述漏洞問題"
                                        value={reportTitle}
                                        onValueChange={setReportTitle}
                                        classNames={{
                                            base: "custom-input-trans-animate",
                                            input: "text-white",
                                            inputWrapper: "bg-white/10 border border-white/20 hover:bg-white/15"
                                        }}
                                        isRequired
                                    />

                                    <div className="flex gap-4">
                                        <Select
                                            label="嚴重程度"
                                            placeholder="選擇漏洞嚴重程度"
                                            selectedKeys={selectedSeverity ? [selectedSeverity] : []}
                                            onSelectionChange={(keys) => setSelectedSeverity(Array.from(keys)[0] as string)}
                                            classNames={{
                                                trigger: "bg-white/10 border border-white/20 hover:bg-white/15",
                                                value: "text-white",
                                                listbox: "bg-neutral-800",
                                                popoverContent: "bg-neutral-800 border border-white/20"
                                            }}
                                            isRequired
                                        >
                                            {severityOptions.map((severity) => (
                                                <SelectItem key={severity.key}>
                                                    {severity.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Select
                                            label="漏洞類別"
                                            placeholder="選擇漏洞類別"
                                            selectedKeys={selectedCategory ? [selectedCategory] : []}
                                            onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                                            classNames={{
                                                trigger: "bg-white/10 border border-white/20 hover:bg-white/15",
                                                value: "text-white",
                                                listbox: "bg-neutral-800",
                                                popoverContent: "bg-neutral-800 border border-white/20"
                                            }}
                                            isRequired
                                        >
                                            {categoryOptions.map((category) => (
                                                <SelectItem key={category.key}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <Textarea
                                        label="詳細描述"
                                        placeholder="請詳細描述漏洞的發現過程、重現步驟、影響範圍等..."
                                        value={reportDescription}
                                        onValueChange={setReportDescription}
                                        minRows={6}
                                        classNames={{
                                            base: "custom-input-trans-animate",
                                            input: "text-white",
                                            inputWrapper: "bg-white/10 border border-white/20 hover:bg-white/15"
                                        }}
                                        isRequired
                                    />

                                    <Input
                                        label="聯絡信箱"
                                        placeholder="我們會透過此信箱與您聯繫（選填）"
                                        value={contactEmail}
                                        onValueChange={setContactEmail}
                                        type="email"
                                        classNames={{
                                            base: "custom-input-trans-animate",
                                            input: "text-white",
                                            inputWrapper: "bg-white/10 border border-white/20 hover:bg-white/15"
                                        }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                    className="custom-button-trans-override"
                                >
                                    取消
                                </Button>
                                <Button
                                    className="custom-button-trans-override bg-red-500/20 border border-red-500/30 text-red-400 font-medium"
                                    onPress={handleSubmitReport}
                                    isLoading={isSubmitting}
                                    startContent={!isSubmitting ? <Send size={18} /> : null}
                                >
                                    {isSubmitting ? "提交中..." : "提交回報"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
