'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/utils/firebase';
import { 
  applyActionCode, 
  verifyPasswordResetCode, 
  checkActionCode,
  ActionCodeInfo
} from 'firebase/auth';
import { Spinner } from '@heroui/react';
import Link from 'next/link';
import { CircleCheck, CircleAlert } from 'lucide-react';
import CustomButton from '@/components/button';
import PageTransition from '@/components/pageTransition';

export default function AuthAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const handleAuthAction = async () => {
      if (!mode || !oobCode) {
        setError('無效的連結');
        setLoading(false);
        return;
      }
      try {
        switch (mode) {
          case 'resetPassword':
            // 導向專用的密碼重設頁面
            router.replace(`/reset-password?mode=${mode}&oobCode=${oobCode}`);
            return;
            
          case 'verifyEmail':
            // 驗證電子郵件
            await applyActionCode(auth, oobCode);
            setSuccess('電子郵件驗證成功！您現在可以使用所有功能了。');
            break;
            
          case 'recoverEmail':
            // 恢復電子郵件
            const info: ActionCodeInfo = await checkActionCode(auth, oobCode);
            await applyActionCode(auth, oobCode);
            setSuccess(`電子郵件已恢復至：${info.data.email}`);
            break;
            
          default:
            setError('不支援的操作類型');
            break;
        }
      } catch (error: any) {
        console.error('處理認證操作時發生錯誤:', error);
        
        switch (error.code) {
          case 'auth/expired-action-code':
            setError('操作代碼已過期，請重新申請');
            break;
          case 'auth/invalid-action-code':
            setError('無效的操作代碼');
            break;
          case 'auth/user-disabled':
            setError('此帳號已被停用');
            break;
          case 'auth/user-not-found':
            setError('找不到對應的使用者帳號');
            break;
          default:
            setError('處理請求時發生錯誤，請稍後再試');
            break;
        }
      } finally {
        setLoading(false);
      }
    };

    handleAuthAction();
  }, [mode, oobCode, router]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-neutral-800 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-white">
            <Spinner size="lg" color="primary" />
            <p>正在處理您的請求...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-neutral-800 items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-white text-center max-w-md p-8">
          {success ? (
            <>
              <CircleCheck size={64} className="text-green-500" />
              <h1 className="text-2xl font-bold text-green-400">操作成功</h1>
              <p className="text-gray-300">{success}</p>
              <div className="flex gap-4">
                <Link href="/login">
                  <CustomButton 
                    variant="blur"
                    size="lg"
                    radius="full"
                    className="bg-blue-500 text-white border-0"
                  >
                    前往登入
                  </CustomButton>
                </Link>
                <Link href="/">
                  <CustomButton 
                    variant="blur"
                    size="lg"
                    radius="full"
                    className="bg-gray-500 text-white border-0"
                  >
                    返回首頁
                  </CustomButton>
                </Link>
              </div>
            </>
          ) : (
            <>
              <CircleAlert size={64} className="text-red-500" />
              <h1 className="text-2xl font-bold text-red-400">操作失敗</h1>
              <p className="text-gray-300">{error}</p>
              <Link href="/login">
                <CustomButton 
                  variant="blur"
                  size="lg"
                  radius="full"
                  className="bg-blue-500 text-white border-0"
                >
                  返回登入頁面
                </CustomButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
