"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
    Cog, Folder, House, LogOut, Star, User,
    FileText, Image as ImageIcon, File,
    Upload, Download, Share2, Trash2,
    Search, Filter, Grid3X3, List,
    SortAsc, SortDesc, Calendar,
    FolderPlus, FilePlus, MoreHorizontal,
    Eye, Edit3, Copy, Move, Lock,
    Clock, Users, Tag, Settings
} from "lucide-react";
import { Spinner, Card, CardBody, CardHeader, Chip, Avatar, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import NextImage from "next/image";

export default function MyFiles() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 狀態管理
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('all');

    // 模擬檔案資料
    const mockFiles = [
        {
            id: '1',
            name: '線性代數考古題.pdf',
            type: 'pdf',
            size: '2.4 MB',
            date: '2025-08-20',
            shared: true,
            locked: false,
            thumbnail: null,
            owner: 'Anna'
        },
        {
            id: '2',
            name: '期末簡報.pptx',
            type: 'presentation',
            size: '8.7 MB',
            date: '2025-08-19',
            shared: false,
            locked: true,
            thumbnail: null,
            owner: 'Me'
        },
        {
            id: '3',
            name: '專案截圖.png',
            type: 'image',
            size: '1.2 MB',
            date: '2025-08-18',
            shared: true,
            locked: false,
            thumbnail: '/public/placeholder-image.jpg',
            owner: 'Me'
        },
        {
            id: '4',
            name: 'ヨルシカ 盗作.flac',
            type: 'audio',
            size: '45.3 MB',
            date: '2025-08-17',
            shared: true,
            locked: false,
            thumbnail: null,
            owner: 'Me'
        },
        {
            id: '5',
            name: '計算機概論考解答.pdf',
            type: 'pdf',
            size: '3.1 MB',
            date: '2025-08-16',
            shared: true,
            locked: false,
            thumbnail: null,
            owner: 'Wendy'
        },
        {
            id: '6',
            name: '畢業專題資料夾',
            type: 'folder',
            size: '156.7 MB',
            date: '2025-08-15',
            shared: false,
            locked: true,
            thumbnail: null,
            owner: 'Me'
        }
    ];

    const folders = [
        { id: 'all', name: '全部檔案', icon: Folder, count: 12 },
        { id: 'recent', name: '最近使用', icon: Clock, count: 8 },
        { id: 'shared', name: '共享給我', icon: Users, count: 4 },
        { id: 'my-files', name: '我的檔案', icon: FileText, count: 6 },
        { id: 'favorites', name: '我的最愛', icon: Star, count: 3 },
        { id: 'trash', name: '垃圾桶', icon: Trash2, count: 2 }
    ];

    // 過濾檔案
    const filteredFiles = mockFiles.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = selectedFolder === 'all' ||
            (selectedFolder === 'shared' && file.shared) ||
            (selectedFolder === 'my-files' && file.owner === 'Me') ||
            (selectedFolder === 'recent' && ['1', '2', '3'].includes(file.id));
        return matchesSearch && matchesFolder;
    });

    // 檔案圖標
    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="text-red-400" size={20} />;
            case 'image': return <ImageIcon className="text-blue-400" size={20} />;
            case 'presentation': return <File className="text-orange-400" size={20} />;
            case 'audio': return <File className="text-green-400" size={20} />;
            case 'folder': return <Folder className="text-yellow-400" size={20} />;
            default: return <File className="text-gray-400" size={20} />;
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
            {/* 頂部導航 */}
            <div className="absolute top-6 right-6 flex space-x-3 z-50">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push('/dashboard')}
                    >
                        <House size={18} />
                        資訊主頁
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Folder size={18} />
                        我的檔案
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                        onClick={() => router.push('/dashboard/settings')}
                    >
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

            {/* 主內容區 */}
            <div className="pt-24 px-6 flex gap-6 min-h-screen">
                {/* 側邊欄 */}
                <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full shadow-lg sticky top-24">
                        <CardHeader className="pb-4 pt-6 px-6">
                            <div className="flex items-center justify-between w-full">
                                {!sidebarCollapsed && (
                                    <h3 className="text-xl font-bold text-white">檔案管理</h3>
                                )}
                                <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="text-gray-300 hover:text-white"
                                >
                                    <Settings size={16} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody className="px-3 py-0 pb-6">
                            <div className="space-y-2">
                                {folders.map((folder) => {
                                    const Icon = folder.icon;
                                    return (
                                        <div
                                            key={folder.id}
                                            onClick={() => setSelectedFolder(folder.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedFolder === folder.id
                                                    ? 'bg-blue-600/30 text-blue-300'
                                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <Icon size={18} className="flex-shrink-0" />
                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="flex-1 text-sm font-medium">{folder.name}</span>
                                                    <Chip
                                                        size="sm"
                                                        className="text-xs bg-white/20 text-gray-300 min-w-6 h-6"
                                                    >
                                                        {folder.count}
                                                    </Chip>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {!sidebarCollapsed && (
                                <div className="mt-6 pt-6 border-t border-white/20">
                                    <div className="space-y-2">
                                        <Button
                                            startContent={<Upload size={16} />}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                            radius="lg"
                                        >
                                            上傳檔案
                                        </Button>
                                        <Button
                                            startContent={<FolderPlus size={16} />}
                                            variant="bordered"
                                            className="w-full border-white/30 text-gray-300 hover:bg-white/10"
                                            radius="lg"
                                        >
                                            新增資料夾
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* 主要內容 */}
                <div className="flex-1">
                    {/* 頁面標題和工具列 */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    我的檔案
                                </h1>
                                <p className="text-gray-300">
                                    管理您在 Share Lock 中的所有檔案
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    placeholder="搜尋檔案..."
                                    startContent={<Search size={16} className="text-gray-400" />}
                                    className="w-80"
                                    classNames={{
                                        input: "bg-transparent text-white",
                                        inputWrapper: "bg-white/10 border border-white/20 hover:border-white/40 data-[hover=true]:bg-white/15"
                                    }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button
                                    isIconOnly
                                    variant="bordered"
                                    className="border-white/30 text-gray-300 hover:bg-white/10"
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                >
                                    {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
                                </Button>
                                <Button
                                    isIconOnly
                                    variant="bordered"
                                    className="border-white/30 text-gray-300 hover:bg-white/10"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                >
                                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                                </Button>
                            </div>
                        </div>

                        {/* 檔案統計 */}
                        <div className="flex gap-4 mb-6">
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600/30 p-2 rounded-lg">
                                        <FileText size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">總檔案數</p>
                                        <p className="text-lg font-bold text-white">{filteredFiles.length}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-600/30 p-2 rounded-lg">
                                        <Share2 size={20} className="text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">已共享</p>
                                        <p className="text-lg font-bold text-white">
                                            {filteredFiles.filter(f => f.shared).length}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-600/30 p-2 rounded-lg">
                                        <Lock size={20} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">已鎖定</p>
                                        <p className="text-lg font-bold text-white">
                                            {filteredFiles.filter(f => f.locked).length}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* 檔案列表 */}
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg">
                        <CardBody className="p-6">
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredFiles.map((file) => (
                                        <Card
                                            key={file.id}
                                            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer group"
                                            isPressable
                                        >
                                            <CardBody className="p-4">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="mb-3 p-4 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                                                        {getFileIcon(file.type)}
                                                    </div>
                                                    <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">
                                                        {file.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 mb-2">{file.size}</p>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {file.shared && (
                                                            <Chip size="sm" className="bg-green-600/30 text-green-300 text-xs">
                                                                共享
                                                            </Chip>
                                                        )}
                                                        {file.locked && (
                                                            <Chip size="sm" className="bg-yellow-600/30 text-yellow-300 text-xs">
                                                                鎖定
                                                            </Chip>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{file.date}</p>
                                                </div>
                                                <div className="flex justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                        <Eye size={14} />
                                                    </Button>
                                                    <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                        <Download size={14} />
                                                    </Button>
                                                    <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                        <Share2 size={14} />
                                                    </Button>
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                                <MoreHorizontal size={14} />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu>
                                                            <DropdownItem key="rename" startContent={<Edit3 size={14} />}>重新命名</DropdownItem>
                                                            <DropdownItem key="copy" startContent={<Copy size={14} />}>複製</DropdownItem>
                                                            <DropdownItem key="move" startContent={<Move size={14} />}>移動</DropdownItem>
                                                            <DropdownItem key="delete" startContent={<Trash2 size={14} />} color="danger">刪除</DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex-shrink-0">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white truncate">{file.name}</h4>
                                                <p className="text-sm text-gray-400">{file.size} • {file.date}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {file.shared && (
                                                    <Chip size="sm" className="bg-green-600/30 text-green-300">
                                                        共享
                                                    </Chip>
                                                )}
                                                {file.locked && (
                                                    <Chip size="sm" className="bg-yellow-600/30 text-yellow-300">
                                                        鎖定
                                                    </Chip>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                    <Eye size={14} />
                                                </Button>
                                                <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                    <Download size={14} />
                                                </Button>
                                                <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                    <Share2 size={14} />
                                                </Button>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-white">
                                                            <MoreHorizontal size={14} />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu>
                                                        <DropdownItem key="rename" startContent={<Edit3 size={14} />}>重新命名</DropdownItem>
                                                        <DropdownItem key="copy" startContent={<Copy size={14} />}>複製</DropdownItem>
                                                        <DropdownItem key="move" startContent={<Move size={14} />}>移動</DropdownItem>
                                                        <DropdownItem key="delete" startContent={<Trash2 size={14} />} color="danger">刪除</DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredFiles.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="bg-white/10 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                        <Folder size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">沒有找到檔案</h3>
                                    <p className="text-gray-400 mb-4">
                                        {searchQuery ? '調整搜尋條件或' : ''}開始上傳您的第一個檔案吧！
                                    </p>
                                    <Button
                                        startContent={<Upload size={16} />}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        上傳檔案
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
