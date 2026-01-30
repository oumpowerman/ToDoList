// IMPORTANT: You must get a Client ID from Google Cloud Console
// 1. Go to console.cloud.google.com
// 2. Create Project > Enable "Google Drive API"
// 3. Credentials > Create OAuth Client ID > Web Application
// 4. Add "http://localhost:3000" (or your domain) to "Authorized JavaScript origins"

// ------------------------------------------------------------------
// 👇 1. ใส่ Google Client ID ของคุณในเครื่องหมายคำพูดข้างล่างนี้
// ------------------------------------------------------------------
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE'; 
const API_KEY = process.env.GOOGLE_API_KEY || ''; // ไม่จำเป็นต้องใส่ก็ได้สำหรับการอัปโหลดไฟล์
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogleDrive = async () => {
    return new Promise<void>((resolve) => {
        const checkGapi = () => {
            if (typeof (window as any).gapi !== 'undefined' && typeof (window as any).google !== 'undefined') {
                loadGapi();
                resolve();
            } else {
                setTimeout(checkGapi, 100);
            }
        }
        checkGapi();
    });
};

const loadGapi = () => {
    (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        gapiInited = true;
    });

    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
};

export const uploadToDrive = async (file: File): Promise<string | null> => {
    if (!gapiInited || !gisInited) {
        await initGoogleDrive();
    }

    if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        alert("⚠️ ยังไม่ได้ตั้งค่า Google Client ID ในโค้ด (ไฟล์ services/googleDriveService.ts)");
        return null;
    }

    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                reject(resp);
                return;
            }
            try {
                const accessToken = resp.access_token;
                
                // 1. Upload File
                const metadata = {
                    name: file.name,
                    mimeType: file.type,
                    parents: ['root'] // Upload to root folder, or specify folder ID
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', file);

                const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                    method: 'POST',
                    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                    body: form
                });
                
                const fileData = await uploadRes.json();
                const fileId = fileData.id;

                // 2. Make Public (Anyone with link can view) - Required for <img> tag
                await (window as any).gapi.client.drive.permissions.create({
                    fileId: fileId,
                    resource: {
                        role: 'reader',
                        type: 'anyone',
                    }
                });

                // 3. Get Web Content Link (Thumbnail Link is better for embedding)
                // We construct a specific URL that forces image display
                // Format: https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
                const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
                
                resolve(publicUrl);

            } catch (err) {
                console.error("Drive Upload Error", err);
                reject(err);
            }
        };

        // Trigger Login Popup
        if ((window as any).gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
    });
};
