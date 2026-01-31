// ⚠️ ใส่ Google Client ID ตรงนี้ (เอาจาก Google Cloud Console)
const CLIENT_ID = '771008704083-h53hm1a5vnlkl7gju6r6s13ch2ua4552.apps.googleusercontent.com'; 
const API_KEY = ''; // Optional, usually strictly needed only for some read ops but Client ID handles Auth flow.
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
        callback: '', 
    });
    gisInited = true;
};

export const uploadToDrive = async (file: File): Promise<string | null> => {
    if (!gapiInited || !gisInited) {
        await initGoogleDrive();
    }

    if (CLIENT_ID === '771008704083-h53hm1a5vnlkl7gju6r6s13ch2ua4552.apps.googleusercontent.com') {
        alert("⚠️ ยังไม่ได้ใส่ Google Client ID ในไฟล์ services/googleDriveService.ts ครับ");
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
                
                const metadata = {
                    name: file.name,
                    mimeType: file.type,
                    parents: ['root'] 
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

                await (window as any).gapi.client.drive.permissions.create({
                    fileId: fileId,
                    resource: { role: 'reader', type: 'anyone' }
                });

                const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
                resolve(publicUrl);

            } catch (err) {
                console.error("Drive Upload Error", err);
                reject(err);
            }
        };

        if ((window as any).gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
    });
};