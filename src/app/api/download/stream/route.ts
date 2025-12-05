import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/utils/firebase-admin";

/*

    method: GET /api/download/stream?token=xxx
    stream the file associated with the one-time download token
    the download count will be updated upon successful download ( in here, not in issue-url )

*/

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: "missing one-time download token" },
                { status: 400 }
            );
        }

        const tokenDoc = await adminDb.collection("download_tokens").doc(token).get();

        if (!tokenDoc.exists) {
            return NextResponse.json(
                { error: "token invalid" },
                { status: 404 }
            );
        }

        const tokenData = tokenDoc.data();
        if (!tokenData) {
            return NextResponse.json(
                { error: "token data not found" },
                { status: 404 }
            );
        }

        if (tokenData.used) {
            return NextResponse.json(
                { error: "token has already been used" },
                { status: 400 }
            );
        }

        const expiresAt = tokenData.expiresAt?.toDate().getTime();
        if (expiresAt && Date.now() > expiresAt) {
            return NextResponse.json(
                { error: "token has expired" },
                { status: 400 }
            );
        }
        // mark token as used
        await adminDb.collection("download_tokens").doc(token).update({
            used: true,
            usedAt: new Date(),
        });

        // update the download count
        try {
            const fileDoc = await adminDb.collection("files").doc(tokenData.fileId).get();
            if (fileDoc.exists) {
                const fileData = fileDoc.data();
                const remainingDownloads = fileData?.remainingDownloads || 0;

                if (typeof fileData?.maxDownloads === 'number' && fileData.maxDownloads > 0) {
                    await adminDb.collection("files").doc(tokenData.fileId).update({
                        remainingDownloads: Math.max(0, remainingDownloads - 1),
                        lastDownloadAt: new Date(),
                    });
                }
            }
        } catch (updateError) {
            console.error('failed to update download count:', updateError);
        }

        // get the file from firebase storage
        const bucket = adminStorage.bucket();
        const file = bucket.file(tokenData.storagePath);

        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json(
                { error: "file does not exist" },
                { status: 404 }
            );
        }

        const [metadata] = await file.getMetadata();
        const fileSize = metadata.size;
        const readStream = file.createReadStream();

        // convert Node.js ReadableStream to Web ReadableStream
        const webStream = new ReadableStream({
            async start(controller) {
                readStream.on('data', (chunk: Buffer) => {
                    controller.enqueue(new Uint8Array(chunk));
                });

                readStream.on('end', () => {
                    controller.close();
                });

                readStream.on('error', (error) => {
                    console.error('Stream error:', error);
                    controller.error(error);
                });
            },
            cancel() {
                readStream.destroy();
            }
        });

        try {
            await adminDb.collection("download_history").add({
                shareId: tokenData.shareId,
                fileId: tokenData.fileId,
                downloadedAt: new Date(),
                tokenId: token,
                ip: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            });
        } catch (historyError) {
            console.error('failed to record download history:', historyError);
        }

        // Record access log for download count tracking
        try {
            await adminDb.collection("accessLogs").add({
                fileId: tokenData.fileId,
                shareId: tokenData.shareId,
                type: "download",
                timestamp: new Date(),
                ip: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            });
        } catch (logError) {
            console.error('failed to record access log:', logError);
        }

        return new NextResponse(webStream, {
            headers: {
                'Content-Type': tokenData.contentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(tokenData.fileName)}"`,
                'Content-Length': String(fileSize),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error("failed to download file:", error);
        return NextResponse.json(
            { error: `failed to download file: ${error instanceof Error ? error.message : 'unknown error'}` },
            { status: 500 }
        );
    }
}
