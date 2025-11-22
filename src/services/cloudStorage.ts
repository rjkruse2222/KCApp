import { CloudFile, CloudProvider } from '../types';
import { API_ENDPOINTS } from '../config/constants';

class CloudStorageServiceClass {
  // Google Drive API methods
  async listGoogleDriveFiles(
    accessToken: string,
    folderId: string
  ): Promise<CloudFile[]> {
    const response = await fetch(
      `${API_ENDPOINTS.googleDrive}/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,webViewLink,webContentLink,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list Google Drive files');
    }

    const data = await response.json();

    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || '0', 10),
      webUrl: file.webViewLink,
      downloadUrl: file.webContentLink,
      modifiedAt: file.modifiedTime,
    }));
  }

  async getGoogleDriveFileMetadata(
    accessToken: string,
    fileId: string
  ): Promise<CloudFile> {
    const response = await fetch(
      `${API_ENDPOINTS.googleDrive}/files/${fileId}?fields=id,name,mimeType,size,webViewLink,webContentLink,modifiedTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get Google Drive file metadata');
    }

    const file = await response.json();

    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || '0', 10),
      webUrl: file.webViewLink,
      downloadUrl: file.webContentLink,
      modifiedAt: file.modifiedTime,
    };
  }

  async searchGoogleDriveFolders(
    accessToken: string,
    query: string
  ): Promise<CloudFile[]> {
    const encodedQuery = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name contains '${query}'`
    );

    const response = await fetch(
      `${API_ENDPOINTS.googleDrive}/files?q=${encodedQuery}&fields=files(id,name,mimeType,webViewLink,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search Google Drive folders');
    }

    const data = await response.json();

    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: 0,
      webUrl: file.webViewLink,
      modifiedAt: file.modifiedTime,
    }));
  }

  // Microsoft OneDrive (Graph API) methods
  async listOneDriveFiles(
    accessToken: string,
    folderId: string
  ): Promise<CloudFile[]> {
    const endpoint =
      folderId === 'root'
        ? `${API_ENDPOINTS.microsoftGraph}/me/drive/root/children`
        : `${API_ENDPOINTS.microsoftGraph}/me/drive/items/${folderId}/children`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list OneDrive files');
    }

    const data = await response.json();

    return data.value.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.file?.mimeType || 'application/vnd.ms-folder',
      size: file.size || 0,
      webUrl: file.webUrl,
      downloadUrl: file['@microsoft.graph.downloadUrl'],
      modifiedAt: file.lastModifiedDateTime,
    }));
  }

  async getOneDriveFileMetadata(
    accessToken: string,
    fileId: string
  ): Promise<CloudFile> {
    const response = await fetch(
      `${API_ENDPOINTS.microsoftGraph}/me/drive/items/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get OneDrive file metadata');
    }

    const file = await response.json();

    return {
      id: file.id,
      name: file.name,
      mimeType: file.file?.mimeType || 'application/vnd.ms-folder',
      size: file.size || 0,
      webUrl: file.webUrl,
      downloadUrl: file['@microsoft.graph.downloadUrl'],
      modifiedAt: file.lastModifiedDateTime,
    };
  }

  async searchOneDriveFolders(
    accessToken: string,
    query: string
  ): Promise<CloudFile[]> {
    const response = await fetch(
      `${API_ENDPOINTS.microsoftGraph}/me/drive/root/search(q='${encodeURIComponent(query)}')?$filter=folder ne null`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search OneDrive folders');
    }

    const data = await response.json();

    return data.value
      .filter((item: any) => item.folder)
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: 'application/vnd.ms-folder',
        size: 0,
        webUrl: file.webUrl,
        modifiedAt: file.lastModifiedDateTime,
      }));
  }

  // Generic method to list files from either provider
  async listFiles(
    provider: CloudProvider,
    accessToken: string,
    folderId: string
  ): Promise<CloudFile[]> {
    if (provider === 'googledrive') {
      return this.listGoogleDriveFiles(accessToken, folderId);
    } else {
      return this.listOneDriveFiles(accessToken, folderId);
    }
  }

  // Generic method to search folders from either provider
  async searchFolders(
    provider: CloudProvider,
    accessToken: string,
    query: string
  ): Promise<CloudFile[]> {
    if (provider === 'googledrive') {
      return this.searchGoogleDriveFolders(accessToken, query);
    } else {
      return this.searchOneDriveFolders(accessToken, query);
    }
  }

  // Get embed URL for folder viewing
  getEmbedUrl(provider: CloudProvider, folderId: string): string {
    if (provider === 'googledrive') {
      return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    } else {
      // OneDrive doesn't have a simple embed URL, use the web URL directly
      return `https://onedrive.live.com/?id=${folderId}`;
    }
  }
}

export const CloudStorageService = new CloudStorageServiceClass();
