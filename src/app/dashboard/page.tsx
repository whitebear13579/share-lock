
'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/utils/authProvider';
import { useRouter } from 'next/navigation';
import { Button } from "@heroui/button";
import { LogOut, User } from "lucide-react";
import { Spinner } from '@heroui/react';

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-800 flex items-center justify-center">
                <Spinner classNames={{label: "text-xl text-white"}} variant="dots" size='lg' color='default' label='載入中...'/>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-800 p-8">
            <div className="max-w-4xl mx-auto">
                {/* 標題列 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">使用者儀表板</h1>
                    <Button
                        color="danger"
                        variant="flat"
                        startContent={<LogOut size={20} />}
                        onPress={logout}
                    >
                        登出
                    </Button>
                </div>

                {/* 用戶資訊卡片 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                            {user.photoURL ? (
                                <img 
                                    src={user.photoURL} 
                                    alt="用戶頭像" 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User size={32} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                {user.displayName || '匿名用戶'}
                            </h2>
                            <p className="text-gray-300">{user.email}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">使用者 ID:</span>
                            <p className="text-white font-mono text-xs">{user.uid}</p>
                        </div>
                        <div>
                            <span className="text-gray-400">Email 驗證狀態:</span>
                            <p className={`font-semibold ${user.emailVerified ? 'text-green-400' : 'text-red-400'}`}>
                                {user.emailVerified ? '已驗證' : '未驗證'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-400">帳號建立時間:</span>
                            <p className="text-white">
                                {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString('zh-TW') : '無資料'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-400">最後登入時間:</span>
                            <p className="text-white">
                                {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('zh-TW') : '無資料'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 功能區域 */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">快速功能</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            variant="flat"
                            color="primary"
                            size="lg"
                            className="h-20"
                        >
                            檔案管理
                        </Button>
                        <Button
                            variant="flat"
                            color="secondary"
                            size="lg"
                            className="h-20"
                        >
                            設定
                        </Button>
                        <Button
                            variant="flat"
                            color="success"
                            size="lg"
                            className="h-20"
                        >
                            分享連結
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}