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
    Upload,
    Download,
    Share2,
    Trash2,
    Search,
    Filter,
    Grid3X3,
    List,
    MoreVertical,
    FileText,
    Image as ImageIcon,
    Film,
    Music,
    Archive,
    Calendar,
    Eye,
    Copy,
    ExternalLink,
    CloudUpload,
    FolderPlus,
    SortAsc,
    SortDesc,
    Clock,
    HardDrive
} from "lucide-react";
import { Chip, Progress, Spinner } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spacer } from "@heroui/spacer";
import { Avatar, Divider, Link } from "@heroui/react";
import { Input } from "@heroui/input";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Badge } from "@heroui/badge";
import NextImage from "next/image";

export default function MyFiles() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 狀態管理
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    // 假資料 - 實際應用中會從 API 或資料庫獲取
    const [files] = useState([
        {
            id: '1',
            name: '線性代數考古題.pdf',
            type: 'pdf',
            size: '2.4 MB',
            uploadDate: '2024-08-20',
            lastModified: '2024-08-20',
            sharedWith: 3,
            isPublic: false,
            thumbnail: null,
            category: 'document'
        },
        {
            id: '2',
            name: '計算機概論期末報告.docx',
            type: 'docx',
            size: '1.8 MB',
            uploadDate: '2024-08-18',
            lastModified: '2024-08-19',
            sharedWith: 1,
            isPublic: true,
            thumbnail: null,
            category: 'document'
        },
        {
            id: '3',
            name: '專題簡報.pptx',
            type: 'pptx',
            size: '15.2 MB',
            uploadDate: '2024-08-15',
            lastModified: '2024-08-16',
            sharedWith: 5,
            isPublic: false,
            thumbnail: null,
            category: 'presentation'
        },
        {
            id: '4',
            name: '課程錄影_第一堂.mp4',
            type: 'mp4',
            size: '245.6 MB',
            uploadDate: '2024-08-10',
            lastModified: '2024-08-10',
            sharedWith: 0,
            isPublic: false,
            thumbnail: null,
            category: 'video'
        },
        {
            id: '5',
            name: 'profile_photo.jpg',
            type: 'jpg',
            size: '856 KB',
            uploadDate: '2024-08-05',
            lastModified: '2024-08-05',
            sharedWith: 2,
            isPublic: true,
            thumbnail: '/api/placeholder/150/100',
            category: 'image'
        },
        {
            id: '6',
            name: '程式碼備份.zip',
            type: 'zip',
            size: '12.3 MB',
            uploadDate: '2024-07-28',
            lastModified: '2024-07-28',
            sharedWith: 0,
            isPublic: false,
            thumbnail: null,
            category: 'archive'
        }
    ]);

    // 檔案類型圖示
    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'txt':
                return <FileText size={24} className="text-blue-400" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <ImageIcon size={24} className="text-green-400" />;
            case 'mp4':
            case 'avi':
            case 'mov':
                return <Film size={24} className="text-purple-400" />;
            case 'mp3':
            case 'wav':
            case 'flac':
                return <Music size={24} className="text-pink-400" />;
            case 'zip':
            case 'rar':
            case '7z':
                return <Archive size={24} className="text-yellow-400" />;
            default:
                return <FileText size={24} className="text-gray-400" />;
        }
    };

    // 篩選檔案
    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || file.category === selectedFilter;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        if (sortOrder === 'desc') {
            return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        } else {
            return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        }
    });

    // 檔案選取處理
    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    // 計算總使用空間
    const calculateTotalSize = () => {
        let total = 0;
        files.forEach(file => {
            const sizeStr = file.size;
            const sizeNum = parseFloat(sizeStr);
            if (sizeStr.includes('MB')) {
                total += sizeNum;
            } else if (sizeStr.includes('KB')) {
                total += sizeNum / 1024;
            } else if (sizeStr.includes('GB')) {
                total += sizeNum * 1024;
            }
        });
        return total.toFixed(1);
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
            {/* 導航列 */}
            <div className="absolute top-6 right-6 flex space-x-3">
                <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                    <div
                        onClick={() => router.push('/dashboard')}
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
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
                        onClick={() => router.push('/dashboard/settings')}
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                    >
                        <Cog size={18} />
                        帳號設定
                    </div>
                    <div
                        onClick={() => router.push('/dashboard/bug-report')}
                        className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
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

            {/* 頁面標題 */}
            <div className="pt-36 px-13">
                <h1 className="text-4xl font-bold text-white mb-2">
                    📁 我的檔案
                </h1>
                <p className="text-gray-300 text-lg">
                    管理您在 Share Lock 上的所有檔案。您可以上傳、分享、下載或刪除檔案。
                </p>
            </div>

            <div className="px-12 py-8 pb-16">
                {/* 功能統計卡片列 */}
                <div className="flex mb-6">
                    {/* 儲存空間使用狀況 */}
                    <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-w-[400px]" shadow="lg">
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                            <div className="bg-blue-500/20 p-3 rounded-xl">
                                <HardDrive size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-white">儲存空間</h4>
                                <p className="text-gray-300 text-sm">您的 Share Lock 儲存使用狀況</p>
                            </div>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="px-4">
                                <div className="flex items-center gap-2 text-base align-middle text-gray-200 font-medium tracking-wider pb-3">
                                    <Clock size={20} className="shrink-0 text-blue-400" />
                                    <span className="leading-none">已使用 {calculateTotalSize()} MB / 1 GB</span>
                                </div>
                                <Progress
                                    size="md"
                                    radius="full"
                                    showValueLabel
                                    classNames={{
                                        indicator: "bg-linear-245 from-blue-500 to-cyan-600",
                                        track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                        value: "text-xl font-medium text-gray-200 tracking-wider leading-none",
                                        label: "text-gray-300 font-normal text-sm relative top-2"
                                    }}
                                    label={`${files.length} 個檔案`}
                                    value={parseFloat(calculateTotalSize()) / 10}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Spacer x={6} />

                    {/* 快速動作 */}
                    <Card className="flex-1 backdrop-blur-sm bg-gradient-to-tl from-green-500/20 to-emerald-500/20 min-w-[300px]" shadow="lg" isPressable>
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/30 p-4 rounded-xl">
                                    <CloudUpload size={28} className="text-emerald-400" />
                                </div>
                                <div className="flex flex-col items-start justify-start">
                                    <h4 className="font-bold text-xl text-white tracking-wider">上傳檔案</h4>
                                    <p className="text-gray-300 text-sm">新增檔案到您的儲存空間</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter className="gap-2 items-end justify-end mt-auto pr-6 pb-6">
                            <Button className="custom-button-trans-override bg-emerald-600/30 border border-emerald-400/30 text-emerald-300 font-medium">
                                選擇檔案
                            </Button>
                        </CardFooter>
                    </Card>

                    <Spacer x={6} />

                    {/* 建立資料夾 */}
                    <Card className="flex-1 backdrop-blur-sm bg-gradient-to-tl from-purple-500/20 to-pink-500/20 min-w-[300px]" shadow="lg" isPressable>
                        <CardHeader className="pb-0 pt-6 px-6 flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-500/30 p-4 rounded-xl">
                                    <FolderPlus size={28} className="text-purple-400" />
                                </div>
                                <div className="flex flex-col items-start justify-start">
                                    <h4 className="font-bold text-xl text-white tracking-wider">新增資料夾</h4>
                                    <p className="text-gray-300 text-sm">組織您的檔案</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter className="gap-2 items-end justify-end mt-auto pr-6 pb-6">
                            <Button className="custom-button-trans-override bg-purple-600/30 border border-purple-400/30 text-purple-300 font-medium">
                                建立資料夾
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* 工具列 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* 搜尋 */}
                        <Input
                            placeholder="搜尋檔案..."
                            startContent={<Search size={18} className="text-gray-400" />}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="w-80"
                            classNames={{
                                inputWrapper: "bg-white/10 border-white/20 backdrop-blur-sm",
                                input: "text-white placeholder:text-gray-400"
                            }}
                        />

                        {/* 篩選器 */}
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="flat"
                                    className="custom-button-trans-override bg-white/10 border border-white/20 text-gray-200"
                                    startContent={<Filter size={18} />}
                                >
                                    篩選
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                selectedKeys={[selectedFilter]}
                                onSelectionChange={(keys) => setSelectedFilter(Array.from(keys)[0] as string)}
                                selectionMode="single"
                            >
                                <DropdownItem key="all">全部檔案</DropdownItem>
                                <DropdownItem key="document">文件</DropdownItem>
                                <DropdownItem key="image">圖片</DropdownItem>
                                <DropdownItem key="video">影片</DropdownItem>
                                <DropdownItem key="presentation">簡報</DropdownItem>
                                <DropdownItem key="archive">壓縮檔</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>

                        {/* 排序 */}
                        <Button
                            variant="flat"
                            className="custom-button-trans-override bg-white/10 border border-white/20 text-gray-200"
                            startContent={sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
                            onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        >
                            {sortOrder === 'desc' ? '最新' : '最舊'}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 批次操作 */}
                        {selectedFiles.length > 0 && (
                            <div className="flex items-center gap-2 mr-4">
                                <span className="text-gray-300 text-sm">已選取 {selectedFiles.length} 個檔案</span>
                                <Button size="sm" className="custom-button-trans-override bg-blue-600/30 border border-blue-400/30 text-blue-300">
                                    <Share2 size={16} />
                                    分享
                                </Button>
                                <Button size="sm" className="custom-button-trans-override bg-red-600/30 border border-red-400/30 text-red-300">
                                    <Trash2 size={16} />
                                    刪除
                                </Button>
                            </div>
                        )}

                        {/* 檢視模式切換 */}
                        <Button
                            isIconOnly
                            variant="flat"
                            className={`custom-button-trans-override border border-white/20 ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'}`}
                            onPress={() => setViewMode('grid')}
                        >
                            <Grid3X3 size={18} />
                        </Button>
                        <Button
                            isIconOnly
                            variant="flat"
                            className={`custom-button-trans-override border border-white/20 ${viewMode === 'list' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'}`}
                            onPress={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </Button>
                    </div>
                </div>

                {/* 檔案列表 */}
                {filteredFiles.length === 0 ? (
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 min-h-96 flex items-center justify-center" shadow="lg">
                        <div className="text-center">
                            <Folder size={64} className="text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">沒有找到檔案</h3>
                            <p className="text-gray-300">
                                {searchQuery ? '請嘗試不同的搜尋關鍵字' : '開始上傳您的第一個檔案吧！'}
                            </p>
                        </div>
                    </Card>
                ) : viewMode === 'grid' ? (
                    /* 網格檢視 */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredFiles.map((file) => (
                            <Card
                                key={file.id}
                                className={`bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer transition-all duration-200 hover:bg-white/15 ${selectedFiles.includes(file.id) ? 'ring-2 ring-blue-400' : ''}`}
                                shadow="lg"
                                isPressable
                                onPress={() => toggleFileSelection(file.id)}
                            >
                                <CardHeader className="p-4">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-800/50 p-3 rounded-lg">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-white text-sm truncate">{file.name}</h4>
                                                <p className="text-gray-400 text-xs">{file.size}</p>
                                            </div>
                                        </div>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    className="text-gray-400 hover:text-white"
                                                >
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
                                                <DropdownItem key="preview" startContent={<Eye size={16} />}>預覽</DropdownItem>
                                                <DropdownItem key="download" startContent={<Download size={16} />}>下載</DropdownItem>
                                                <DropdownItem key="share" startContent={<Share2 size={16} />}>分享</DropdownItem>
                                                <DropdownItem key="copy" startContent={<Copy size={16} />}>複製連結</DropdownItem>
                                                <DropdownItem
                                                    key="delete"
                                                    startContent={<Trash2 size={16} />}
                                                    className="text-danger"
                                                    color="danger"
                                                >
                                                    刪除
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </CardHeader>
                                <CardBody className="p-4 pt-0">
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>上傳於 {file.uploadDate}</span>
                                        <div className="flex items-center gap-2">
                                            {file.sharedWith > 0 && (
                                                <Badge content={file.sharedWith} color="primary" size="sm">
                                                    <Share2 size={14} />
                                                </Badge>
                                            )}
                                            {file.isPublic && (
                                                <Chip size="sm" className="bg-green-600/20 text-green-300">
                                                    公開
                                                </Chip>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    /* 列表檢視 */
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-0">
                            <div className="divide-y divide-white/10">
                                {/* 表頭 */}
                                <div className="grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 text-sm font-medium text-gray-300">
                                    <div className="w-8"></div>
                                    <div>名稱</div>
                                    <div className="text-center">大小</div>
                                    <div className="text-center">上傳日期</div>
                                    <div className="text-center">分享狀態</div>
                                    <div className="w-10"></div>
                                </div>

                                {/* 檔案列表 */}
                                {filteredFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`grid grid-cols-[auto_3fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-white/5 transition-all duration-200 ${selectedFiles.includes(file.id) ? 'bg-blue-600/10' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            checked={selectedFiles.includes(file.id)}
                                            onChange={() => toggleFileSelection(file.id)}
                                            aria-label={`選取檔案 ${file.name}`}
                                        />
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="bg-gray-800/50 p-2 rounded">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{file.name}</p>
                                                <p className="text-xs text-gray-400">修改於 {file.lastModified}</p>
                                            </div>
                                        </div>
                                        <div className="text-center text-gray-300">{file.size}</div>
                                        <div className="text-center text-gray-300">{file.uploadDate}</div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {file.sharedWith > 0 && (
                                                    <Badge content={file.sharedWith} color="primary" size="sm">
                                                        <Share2 size={14} />
                                                    </Badge>
                                                )}
                                                {file.isPublic && (
                                                    <Chip size="sm" className="bg-green-600/20 text-green-300">
                                                        公開
                                                    </Chip>
                                                )}
                                            </div>
                                        </div>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    className="text-gray-400 hover:text-white"
                                                >
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
                                                <DropdownItem key="preview2" startContent={<Eye size={16} />}>預覽</DropdownItem>
                                                <DropdownItem key="download2" startContent={<Download size={16} />}>下載</DropdownItem>
                                                <DropdownItem key="share2" startContent={<Share2 size={16} />}>分享</DropdownItem>
                                                <DropdownItem key="copy2" startContent={<Copy size={16} />}>複製連結</DropdownItem>
                                                <DropdownItem
                                                    key="delete2"
                                                    startContent={<Trash2 size={16} />}
                                                    className="text-danger"
                                                    color="danger"
                                                >
                                                    刪除
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
}
