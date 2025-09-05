"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, User, Search, Plus, Filter, Grid, List, Download, Share, Trash2, File, FileText, FileImage, FileVideo, FileAudio, MoreVertical, Calendar, Eye, ArrowUpDown, ArrowUpRight, CloudUpload, HardDrive, Clock, Users } from "lucide-react";
import { Spinner, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Card, CardHeader, CardBody, CardFooter, Chip, Progress, Avatar, Divider } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import NextImage from "next/image";

export default function MyFiles() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterType, setFilterType] = useState('all');

    // 模擬檔案資料
    const mockFiles = [
        {
            id: '1',
            name: '線性代數考古題.pdf',
            type: 'pdf',
            size: '2.4 MB',
            lastModified: '2025-08-20',
            shared: true,
            owner: 'Anna',
            thumbnail: null
        },
        {
            id: '2',
            name: '計算機概論解答.pdf',
            type: 'pdf',
            size: '1.8 MB',
            lastModified: '2025-08-19',
            shared: false,
            owner: 'me',
            thumbnail: null
        },
        {
            id: '3',
            name: '期末簡報.pptx',
            type: 'presentation',
            size: '15.2 MB',
            lastModified: '2025-08-18',
            shared: true,
            owner: 'me',
            thumbnail: null
        },
        {
            id: '4',
            name: '在學證明.pdf',
            type: 'pdf',
            size: '512 KB',
            lastModified: '2025-08-17',
            shared: false,
            owner: 'me',
            thumbnail: null,
            expiring: true
        },
        {
            id: '5',
            name: 'ヨルシカ 盗作.flac',
            type: 'audio',
            size: '42.1 MB',
            lastModified: '2025-08-15',
            shared: true,
            owner: 'me',
            thumbnail: null
        },
        {
            id: '6',
            name: '課堂筆記.docx',
            type: 'document',
            size: '3.7 MB',
            lastModified: '2025-08-14',
            shared: false,
            owner: 'me',
            thumbnail: null
        }
    ];

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return <FileText className="text-red-400" size={24} />;
            case 'document':
                return <FileText className="text-blue-400" size={24} />;
            case 'presentation':
                return <FileText className="text-orange-400" size={24} />;
            case 'image':
                return <FileImage className="text-green-400" size={24} />;
            case 'video':
                return <FileVideo className="text-purple-400" size={24} />;
            case 'audio':
                return <FileAudio className="text-pink-400" size={24} />;
            default:
                return <File className="text-gray-400" size={24} />;
        }
    };

    const formatFileSize = (size: string) => {
        return size;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
            {/* 頂部導航 */}
            <div className="absolute top-6 right-6 flex space-x-3">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push('/dashboard')}>
                        <House size={18} />
                        資訊主頁
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Folder size={18} />
                        我的檔案
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push('/dashboard/settings')}>
                        <Cog size={18} />
                        帳號設定
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push('/dashboard/bug-report')}>
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

            {/* 頁面標題區域 */}
            <div className="pt-36 px-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <Folder size={40} className="text-blue-400" />
                            我的檔案
                        </h1>
                        <p className="text-gray-300 text-lg">
                            管理您在 Share Lock 中的所有檔案，包含已分享和收到的檔案。
                        </p>
                    </div>
                    <CustomButton
                        variant="blur"
                        size="lg"
                        radius="lg"
                        startContent={<CloudUpload size={20} />}
                        className="bg-emerald-600/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30 text-base font-medium"
                    >
                        上傳檔案
                    </CustomButton>
                </div>
            </div>

            {/* 統計卡片區域 */}
            <div className="px-12 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/20 p-3 rounded-xl">
                                    <HardDrive size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-gray-300 text-sm">總檔案數</p>
                                    <p className="text-white text-2xl font-bold">{mockFiles.length}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-green-500/20 p-3 rounded-xl">
                                    <Users size={24} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-gray-300 text-sm">已分享</p>
                                    <p className="text-white text-2xl font-bold">{mockFiles.filter(f => f.shared).length}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-500/20 p-3 rounded-xl">
                                    <Download size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-gray-300 text-sm">已接收</p>
                                    <p className="text-white text-2xl font-bold">{mockFiles.filter(f => f.owner !== 'me').length}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-500/20 p-3 rounded-xl">
                                    <Clock size={24} className="text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-gray-300 text-sm">即將過期</p>
                                    <p className="text-white text-2xl font-bold">{mockFiles.filter(f => f.expiring).length}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* 工具列 */}
            <div className="px-12 mb-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Input
                                    placeholder="搜尋檔案..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    startContent={<Search size={18} className="text-gray-400" />}
                                    className="w-80"
                                    classNames={{
                                        input: "text-white",
                                        inputWrapper: "bg-white/10 border-white/30"
                                    }}
                                />

                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button className="bg-white/10 border border-white/30 text-gray-200" startContent={<Filter size={18} />}>
                                            篩選
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu>
                                        <DropdownItem key="all">所有檔案</DropdownItem>
                                        <DropdownItem key="pdf">PDF 文件</DropdownItem>
                                        <DropdownItem key="document">Word 文件</DropdownItem>
                                        <DropdownItem key="image">圖片檔案</DropdownItem>
                                        <DropdownItem key="shared">已分享</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>

                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button className="bg-white/10 border border-white/30 text-gray-200" startContent={<ArrowUpDown size={18} />}>
                                            排序
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu>
                                        <DropdownItem key="name">名稱</DropdownItem>
                                        <DropdownItem key="date">修改日期</DropdownItem>
                                        <DropdownItem key="size">檔案大小</DropdownItem>
                                        <DropdownItem key="type">檔案類型</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    isIconOnly
                                    className={`${viewMode === 'grid' ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-gray-200'} border border-white/30`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid size={18} />
                                </Button>
                                <Button
                                    isIconOnly
                                    className={`${viewMode === 'list' ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-gray-200'} border border-white/30`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List size={18} />
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* 檔案列表 */}
            <div className="px-12 pb-16">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {mockFiles.map((file) => (
                            <Card key={file.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all cursor-pointer" shadow="lg" isPressable>
                                <CardBody className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-white/10 p-3 rounded-xl">
                                            {getFileIcon(file.type)}
                                        </div>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" className="bg-transparent text-gray-400 hover:text-white">
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
                                                <DropdownItem key="preview" startContent={<Eye size={16} />}>預覽</DropdownItem>
                                                <DropdownItem key="download" startContent={<Download size={16} />}>下載</DropdownItem>
                                                <DropdownItem key="share" startContent={<Share size={16} />}>分享</DropdownItem>
                                                <DropdownItem key="delete" startContent={<Trash2 size={16} />} className="text-danger">刪除</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>

                                    <h3 className="text-white font-medium mb-2 truncate" title={file.name}>
                                        {file.name}
                                    </h3>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm text-gray-400">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>{formatDate(file.lastModified)}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {file.shared && (
                                                <Chip size="sm" className="bg-blue-500/20 text-blue-300">
                                                    已分享
                                                </Chip>
                                            )}
                                            {file.expiring && (
                                                <Chip size="sm" className="bg-amber-500/20 text-amber-300">
                                                    即將過期
                                                </Chip>
                                            )}
                                            {file.owner !== 'me' && (
                                                <Chip size="sm" className="bg-green-500/20 text-green-300">
                                                    來自 {file.owner}
                                                </Chip>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-white/20">
                                        <tr>
                                            <th className="text-left p-6 text-gray-300 font-medium">名稱</th>
                                            <th className="text-left p-6 text-gray-300 font-medium">大小</th>
                                            <th className="text-left p-6 text-gray-300 font-medium">修改日期</th>
                                            <th className="text-left p-6 text-gray-300 font-medium">狀態</th>
                                            <th className="text-left p-6 text-gray-300 font-medium">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockFiles.map((file) => (
                                            <tr key={file.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white/10 p-2 rounded-lg">
                                                            {getFileIcon(file.type)}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{file.name}</p>
                                                            {file.owner !== 'me' && (
                                                                <p className="text-gray-400 text-sm">來自 {file.owner}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-gray-300">{formatFileSize(file.size)}</td>
                                                <td className="p-6 text-gray-300">{formatDate(file.lastModified)}</td>
                                                <td className="p-6">
                                                    <div className="flex gap-2">
                                                        {file.shared && (
                                                            <Chip size="sm" className="bg-blue-500/20 text-blue-300">
                                                                已分享
                                                            </Chip>
                                                        )}
                                                        {file.expiring && (
                                                            <Chip size="sm" className="bg-amber-500/20 text-amber-300">
                                                                即將過期
                                                            </Chip>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" isIconOnly className="bg-white/10 text-gray-400 hover:text-white">
                                                            <Eye size={16} />
                                                        </Button>
                                                        <Button size="sm" isIconOnly className="bg-white/10 text-gray-400 hover:text-white">
                                                            <Download size={16} />
                                                        </Button>
                                                        <Button size="sm" isIconOnly className="bg-white/10 text-gray-400 hover:text-white">
                                                            <Share size={16} />
                                                        </Button>
                                                        <Dropdown>
                                                            <DropdownTrigger>
                                                                <Button size="sm" isIconOnly className="bg-white/10 text-gray-400 hover:text-white">
                                                                    <MoreVertical size={16} />
                                                                </Button>
                                                            </DropdownTrigger>
                                                            <DropdownMenu>
                                                                <DropdownItem key="delete" startContent={<Trash2 size={16} />} className="text-danger">
                                                                    刪除
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
}
