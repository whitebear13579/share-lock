import type { Metadata } from 'next';
import { adminAuth, adminDb } from '@/utils/firebase-admin';

export async function generateMetadata({ params } : {params: Promise<{ shareId: string }>}): Promise<Metadata> {
    const { shareId } = await params;

    try{
        const shareDoc = await adminDb.collection("shares").doc(shareId).get();

        if ( !shareDoc.exists ) {
            return {
                title: "檔案不存在 - Share Lock",
                description: "此分享連結不存在或檔案已被刪除。",
                openGraph : {
                    siteName: "Share Lock - 安全、高效的檔案分享軟體。",
                    title: "檔案不存在 QAQ",
                    description: "此分享連結不存在或檔案已被刪除。",
                }
            }
        }

        const shareData = shareDoc.data();
        if ( !shareData?.valid && !(shareData?.shareMode === "account" && shareData?.boundUid) ) {
            return {
                title: "檔案不存在 - Share Lock",
                description: "此分享連結不存在或檔案已被刪除。",
                openGraph: {
                    siteName: "Share Lock - 安全、高效的檔案分享軟體。",
                    title: "檔案不存在 QAQ",
                    description: "此分享連結不存在或檔案已被刪除。",
                }
            }
        }

        const fileDoc = await adminDb.collection("files").doc(shareData.fileId).get();
        if ( !fileDoc.exists ) {
            return {
                title: "檔案不存在 - Share Lock",
                description: "此分享連結不存在或檔案已被刪除。",
                openGraph: {
                    siteName: "Share Lock - 安全、高效的檔案分享軟體。9",
                    title: "檔案不存在 QAQ",
                    description: "此分享連結不存在或檔案已被刪除。",
                }
            }
        }

        const fileData = fileDoc.data();
        if ( !fileData ){
            return {
                title: "未知的檔案 - Share Lock",
                description: "載入檔案說明時發生錯誤，請直接造訪 Share Lock 來檔案取得詳情。",
                openGraph: {
                    siteName: "Share Lock - 安全、高效的檔案分享軟體。",
                    title: "未知的檔案 OAO",
                    description: "載入檔案說明時發生錯誤，請直接造訪 Share Lock 來檔案取得詳情。",
                }
            }
        }

        const now = Date.now();
        const expiresAt = fileData.expiresAt?.toDate().getTime();
        if ( expiresAt && now > expiresAt ) {
            return {
                title: "檔案已過期 - Share Lock",
                description: "此檔案已過期，重新聯繫檔案擁有者來取得檔案。",
                openGraph: {
                    siteName: "Share Lock - 安全、高效的檔案分享軟體。",
                    title: "檔案已過期",
                    description: "此檔案已過期，重新聯繫檔案擁有者來取得檔案。",
                }
            }
        }

        if ( fileData.revoked || shareData.revoked ){
            return {
                title: "檔案已撤銷 - Share Lock",
                description: "此檔案已被擁有者撤銷。",
                openGraph: {
                    siteName: "Share Lock - 安全、高效的檔案分享軟體。",
                    title: "檔案已撤銷",
                    description: "此檔案已被擁有者撤銷。",
                }
            }
        }

        const ownerData = await adminAuth.getUser(fileData.ownerUid);
        const ownerName = await ownerData.displayName || "Unknown User";
        const tipsString = fileData.shareMode === "device" ? "此檔案已開啟裝置綁定，"
            : fileData.shareMode === "account" ? "此檔案已開啟帳號綁定，"
            : fileData.shareMode === "pin" ? "此檔案受到 PIN 碼保護，"
            : "";

        return {
            title: `${fileData.displayName} - ShareLock`,
            description: `來自 ${ownerName} 分享的檔案。`,
            openGraph: {
                siteName: "Share Lock - 安全、高效的檔案分享軟體。",
                title: fileData.displayName,
                description: `${ownerName} 想要分享檔案給您。\n${tipsString}請造訪 Share Lock 來下載。`,
            },
        };

    } catch {
        // use default
    }

    return {
        openGraph: {
            siteName: "Share Lock - 安全、高效的檔案分享軟體。",
            title: "未知的檔案名稱",
            description: "載入檔案說明時發生錯誤，請直接造訪 Share Lock 來檔案取得詳情。",
        },
    };
}

export default function ShareLayout({ children } : { children: React.ReactNode }) {
    return <>{children}</>;
}
