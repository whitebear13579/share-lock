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
    Search,
    Filter,
    Grid3X3,
    List,
    SortAsc,
    SortDesc,
    FileText,
    Download,
    Share2,
    Trash2,
    Edit,
    Eye,
    MoreVertical,
    FolderPlus,
    Image as ImageIcon,
    Video,
    Music,
    File,
    Calendar,
    Clock
} from "lucide-react";
import { Spinner, Card, CardHeader, CardBody, CardFooter, Avatar, Chip, Progress, Divider, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import CustomButton from "@/components/button";
import { Image } from "@heroui/react";
import NextImage from "next/image";

// 模擬檔案資料
interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    fileType?: 'image' | 'video' | 'audio' | 'document' | 'other';
    size?: string;
    modifiedDate: string;
    sharedWith?: string[];
    isShared?: boolean;
    thumbnail?: string;
}

const mockFiles: FileItem[] = [
    {
        id: '1',
        name: '重要文件',
        type: 'folder',
        modifiedDate: '2025-08-20',
        sharedWith: ['user1', 'user2']
    },
    {
        id: '2',
        name: '線性代數考古題.pdf',
        type: 'file',
        fileType: 'document',
        size: '2.4 MB',
        modifiedDate: '2025-08-19',
        isShared: true,
        sharedWith: ['Anna']
    },
    {
        id: '3',
        name: '期末簡報.pptx',
        type: 'file',
        fileType: 'document',
        size: '15.2 MB',
        modifiedDate: '2025-08-18',
        isShared: false
    },
    {
        id: '4',
        name: '專案照片',
        type: 'folder',
        modifiedDate: '2025-08-17'
    },
    {
        id: '5',
        name: '在學證明.pdf',
        type: 'file',
        fileType: 'document',
        size: '856 KB',
        modifiedDate: '2025-08-16',
        isShared: false
    },
    {
        id: '6',
        name: 'ヨルシカ 盗作.flac',
        type: 'file',
        fileType: 'audio',
        size: '48.3 MB',
        modifiedDate: '2025-08-15',
        isShared: true,
        sharedWith: ['Miya']
    },
    {
        id: '7',
        name: '計算機結構考解答.pdf',
        type: 'file',
        fileType: 'document',
        size: '3.1 MB',
        modifiedDate: '2025-08-14',
        isShared: true,
        sharedWith: ['Wendy']
    },
    {
        id: '8',
        name: '假期照片.zip',
        type: 'file',
        fileType: 'other',
        size: '234.5 MB',
        modifiedDate: '2025-08-13',
        isShared: false
    }
];

export default function MyFiles() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    // 狀態管理
    const [files, setFiles] = useState<FileItem[]>(mockFiles);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'folder' | 'document' | 'image' | 'audio' | 'video' | 'other'>('all');

    // Modal 控制
    const { isOpen: isUploadOpen, onOpen: onUploadOpen, onOpenChange: onUploadOpenChange } = useDisclosure();
    const { isOpen: isCreateFolderOpen, onOpen: onCreateFolderOpen, onOpenChange: onCreateFolderOpenChange } = useDisclosure();

    // 檔案類型圖標
    const getFileIcon = (file: FileItem) => {
        if (file.type === 'folder') {
            return <Folder size={20} className="text-blue-400" />;
        }
        switch (file.fileType) {
            case 'document':
                return <FileText size={20} className="text-red-400" />;
            case 'image':
                return <ImageIcon size={20} className="text-green-400" />;
            case 'video':
                return <Video size={20} className="text-purple-400" />;
            case 'audio':
                return <Music size={20} className="text-yellow-400" />;
            default:
                return <File size={20} className="text-gray-400" />;
        }
    };

    // 篩選和排序檔案
    const filteredAndSortedFiles = files
        .filter(file => {
            if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            if (filterType === 'all') return true;
            if (filterType === 'folder') return file.type === 'folder';
            return file.fileType === filterType;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime();
                    break;
                case 'size':
                    const sizeA = a.size ? parseFloat(a.size) : 0;
                    const sizeB = b.size ? parseFloat(b.size) : 0;
                    comparison = sizeA - sizeB;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

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
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10" onClick={() => router.push('/dashboard')}>
                        <House size={18} />
                        資訊主頁
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                        <Folder size={18} />
                        我的檔案
                        <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                    </div>
                    <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10" onClick={() => router.push('/dashboard/settings')}>
                        <Cog size={18} />
                        帳號設定
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

            {/* 主要內容 */}
            <div className="pt-24 px-12">
                {/* 頁面標題 */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">我的檔案</h1>
                    <p className="text-gray-300 text-lg">
                        管理您的檔案、資料夾和共享內容。輕鬆上傳、組織和分享您的重要文件。
                    </p>
                </div>

                {/* 統計卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/20 p-3 rounded-xl">
                                    <Folder size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{files.filter(f => f.type === 'folder').length}</p>
                                    <p className="text-gray-300 text-sm">資料夾</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-green-500/20 p-3 rounded-xl">
                                    <FileText size={24} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{files.filter(f => f.type === 'file').length}</p>
                                    <p className="text-gray-300 text-sm">檔案</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-500/20 p-3 rounded-xl">
                                    <Share2 size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{files.filter(f => f.isShared).length}</p>
                                    <p className="text-gray-300 text-sm">已分享</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* 工具列 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6" shadow="lg">
                    <CardBody className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
                                {/* 搜尋 */}
                                <Input
                                    placeholder="搜尋檔案和資料夾..."
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                    startContent={<Search size={18} className="text-gray-400" />}
                                    className="max-w-xs"
                                    classNames={{
                                        inputWrapper: "bg-white/10 border-white/20 data-[hover=true]:bg-white/20",
                                        input: "text-white placeholder:text-gray-400"
                                    }}
                                />

                                {/* 篩選 */}
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            variant="flat"
                                            className="bg-white/10 text-gray-200 border-white/20"
                                            startContent={<Filter size={18} />}
                                        >
                                            篩選: {filterType === 'all' ? '全部' :
                                                filterType === 'folder' ? '資料夾' :
                                                    filterType === 'document' ? '文件' :
                                                        filterType === 'image' ? '圖片' :
                                                            filterType === 'audio' ? '音樂' :
                                                                filterType === 'video' ? '影片' : '其他'}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu onAction={(key) => setFilterType(key as typeof filterType)}>
                                        <DropdownItem key="all">全部</DropdownItem>
                                        <DropdownItem key="folder">資料夾</DropdownItem>
                                        <DropdownItem key="document">文件</DropdownItem>
                                        <DropdownItem key="image">圖片</DropdownItem>
                                        <DropdownItem key="audio">音樂</DropdownItem>
                                        <DropdownItem key="video">影片</DropdownItem>
                                        <DropdownItem key="other">其他</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>

                                {/* 排序 */}
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            variant="flat"
                                            className="bg-white/10 text-gray-200 border-white/20"
                                            startContent={sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                                        >
                                            排序: {sortBy === 'name' ? '名稱' : sortBy === 'date' ? '日期' : '大小'}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu>
                                        <DropdownItem key="name" onPress={() => setSortBy('name')}>按名稱排序</DropdownItem>
                                        <DropdownItem key="date" onPress={() => setSortBy('date')}>按日期排序</DropdownItem>
                                        <DropdownItem key="size" onPress={() => setSortBy('size')}>按大小排序</DropdownItem>
                                        <DropdownItem key="toggle" onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                                            {sortOrder === 'asc' ? '降序' : '升序'}
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>

                            <div className="flex gap-2 items-center">
                                {/* 檢視模式 */}
                                <div className="flex border border-white/20 rounded-lg bg-white/10">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className={`${viewMode === 'grid' ? 'bg-white/20' : 'bg-transparent'} text-gray-200`}
                                        onPress={() => setViewMode('grid')}
                                    >
                                        <Grid3X3 size={16} />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className={`${viewMode === 'list' ? 'bg-white/20' : 'bg-transparent'} text-gray-200`}
                                        onPress={() => setViewMode('list')}
                                    >
                                        <List size={16} />
                                    </Button>
                                </div>

                                {/* 動作按鈕 */}
                                <Button
                                    className="bg-emerald-600 text-white font-medium"
                                    startContent={<FolderPlus size={18} />}
                                    onPress={onCreateFolderOpen}
                                >
                                    新增資料夾
                                </Button>
                                <Button
                                    className="bg-blue-600 text-white font-medium"
                                    startContent={<Upload size={18} />}
                                    onPress={onUploadOpen}
                                >
                                    上傳檔案
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* 檔案列表 */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                    <CardBody className="p-6">
                        {filteredAndSortedFiles.length === 0 ? (
                            <div className="text-center py-12">
                                <Folder size={48} className="text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">沒有找到相符的檔案</p>
                                <p className="text-gray-500 text-sm">試試調整搜尋條件或上傳新檔案</p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredAndSortedFiles.map((file) => (
                                    <Card
                                        key={file.id}
                                        className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                                        shadow="sm"
                                        isPressable
                                    >
                                        <CardBody className="p-4">
                                            <div className="flex flex-col items-center text-center gap-3">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                                                    {getFileIcon(file)}
                                                </div>
                                                <div className="w-full">
                                                    <p className="text-white font-medium text-sm truncate" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {file.type === 'folder' ? '資料夾' : file.size}
                                                    </p>
                                                    <p className="text-gray-500 text-xs">
                                                        {new Date(file.modifiedDate).toLocaleDateString('zh-TW')}
                                                    </p>
                                                </div>
                                                {file.isShared && (
                                                    <Chip size="sm" className="bg-blue-600 text-white">
                                                        <Share2 size={12} className="mr-1" />
                                                        已分享
                                                    </Chip>
                                                )}
                                            </div>
                                        </CardBody>
                                        <CardFooter className="p-2 pt-0">
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 text-gray-200 ml-auto"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu>
                                                    <DropdownItem key="preview" startContent={<Eye size={16} />}>預覽</DropdownItem>
                                                    <DropdownItem key="download" startContent={<Download size={16} />}>下載</DropdownItem>
                                                    <DropdownItem key="share" startContent={<Share2 size={16} />}>分享</DropdownItem>
                                                    <DropdownItem key="rename" startContent={<Edit size={16} />}>重新命名</DropdownItem>
                                                    <DropdownItem key="delete" startContent={<Trash2 size={16} />} className="text-danger">刪除</DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* 列表標題 */}
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-300 border-b border-white/20">
                                    <div className="col-span-5">名稱</div>
                                    <div className="col-span-2">大小</div>
                                    <div className="col-span-3">修改日期</div>
                                    <div className="col-span-2">狀態</div>
                                </div>
                                {/* 檔案項目 */}
                                {filteredAndSortedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/10 rounded-lg transition-all cursor-pointer group items-center"
                                    >
                                        <div className="col-span-5 flex items-center gap-3">
                                            {getFileIcon(file)}
                                            <span className="text-white truncate" title={file.name}>
                                                {file.name}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-gray-400 text-sm">
                                            {file.type === 'folder' ? '-' : file.size}
                                        </div>
                                        <div className="col-span-3 text-gray-400 text-sm">
                                            {new Date(file.modifiedDate).toLocaleDateString('zh-TW')}
                                        </div>
                                        <div className="col-span-2 flex items-center justify-between">
                                            {file.isShared ? (
                                                <Chip size="sm" className="bg-blue-600 text-white">
                                                    <Share2 size={12} className="mr-1" />
                                                    已分享
                                                </Chip>
                                            ) : (
                                                <span className="text-gray-500 text-sm">私人</span>
                                            )}
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 text-gray-200"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu>
                                                    <DropdownItem key="preview" startContent={<Eye size={16} />}>預覽</DropdownItem>
                                                    <DropdownItem key="download" startContent={<Download size={16} />}>下載</DropdownItem>
                                                    <DropdownItem key="share" startContent={<Share2 size={16} />}>分享</DropdownItem>
                                                    <DropdownItem key="rename" startContent={<Edit size={16} />}>重新命名</DropdownItem>
                                                    <DropdownItem key="delete" startContent={<Trash2 size={16} />} className="text-danger">刪除</DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* 上傳檔案 Modal */}
                <Modal
                    isOpen={isUploadOpen}
                    onOpenChange={onUploadOpenChange}
                    size="2xl"
                    classNames={{
                        base: "bg-neutral-800 text-white",
                        header: "border-b border-white/20",
                        footer: "border-t border-white/20",
                        closeButton: "hover:bg-white/20"
                    }}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Upload size={20} />
                                        上傳檔案
                                    </div>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center">
                                        <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                                        <p className="text-lg text-white mb-2">將檔案拖放到此處</p>
                                        <p className="text-gray-400 mb-4">或</p>
                                        <Button className="bg-blue-600 text-white">
                                            選擇檔案
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-4">
                                            支援的檔案格式：PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, MP3, MP4 等
                                        </p>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="flat" onPress={onClose} className="text-gray-300">
                                        取消
                                    </Button>
                                    <Button className="bg-blue-600 text-white" onPress={onClose}>
                                        開始上傳
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* 新增資料夾 Modal */}
                <Modal
                    isOpen={isCreateFolderOpen}
                    onOpenChange={onCreateFolderOpenChange}
                    classNames={{
                        base: "bg-neutral-800 text-white",
                        header: "border-b border-white/20",
                        footer: "border-t border-white/20",
                        closeButton: "hover:bg-white/20"
                    }}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <FolderPlus size={20} />
                                        新增資料夾
                                    </div>
                                </ModalHeader>
                                <ModalBody>
                                    <Input
                                        label="資料夾名稱"
                                        placeholder="輸入資料夾名稱"
                                        classNames={{
                                            inputWrapper: "bg-white/10 border-white/20",
                                            input: "text-white placeholder:text-gray-400",
                                            label: "text-gray-300"
                                        }}
                                    />
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="flat" onPress={onClose} className="text-gray-300">
                                        取消
                                    </Button>
                                    <Button className="bg-emerald-600 text-white" onPress={onClose}>
                                        建立
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </div>
    );
}
