import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  IconButton,
  Searchbar,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useClientStore } from '../store/clientStore';
import { useAuthStore } from '../store/authStore';
import { CloudStorageService } from '../services/cloudStorage';
import { RootStackParamList, CloudFile } from '../types';
import { COLORS } from '../config/constants';
import { format } from 'date-fns';

type RouteProps = RouteProp<RootStackParamList, 'CloudFolder'>;

export function CloudFolderScreen() {
  const route = useRoute<RouteProps>();
  const { clientId, provider } = route.params;

  const { getClientById } = useClientStore();
  const { accessToken } = useAuthStore();

  const client = getClientById(clientId);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'embed'>('embed');

  const folderId =
    provider === 'googledrive' ? client?.googleDriveFolderId : client?.oneDriveFolderId;
  const folderUrl =
    provider === 'googledrive' ? client?.googleDriveFolderUrl : client?.oneDriveFolderUrl;

  useEffect(() => {
    if (viewMode === 'list') {
      loadFiles();
    }
  }, [viewMode]);

  const loadFiles = async () => {
    if (!folderId || !accessToken) return;

    setIsLoading(true);
    try {
      const fetchedFiles = await CloudStorageService.listFiles(
        provider,
        accessToken,
        folderId
      );
      setFiles(fetchedFiles);
    } catch (error) {
      Alert.alert('Error', 'Failed to load files. Please check your permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const openFile = (file: CloudFile) => {
    if (file.webUrl) {
      Linking.openURL(file.webUrl);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return 'folder';
    if (mimeType.includes('pdf')) return 'file-pdf-box';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return 'file-excel';
    if (mimeType.includes('document') || mimeType.includes('word'))
      return 'file-word';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return 'file-powerpoint';
    if (mimeType.includes('image')) return 'file-image';
    if (mimeType.includes('video')) return 'file-video';
    if (mimeType.includes('audio')) return 'file-music';
    return 'file-document';
  };

  const getFileIconColor = (mimeType: string) => {
    if (mimeType.includes('folder')) return '#FFA000';
    if (mimeType.includes('pdf')) return '#F44336';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return '#4CAF50';
    if (mimeType.includes('document') || mimeType.includes('word'))
      return '#2196F3';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return '#FF5722';
    return COLORS.gray500;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFile = ({ item }: { item: CloudFile }) => (
    <Card style={styles.fileCard} onPress={() => openFile(item)}>
      <Card.Content style={styles.fileContent}>
        <MaterialCommunityIcons
          name={getFileIcon(item.mimeType)}
          size={32}
          color={getFileIconColor(item.mimeType)}
        />
        <View style={styles.fileInfo}>
          <Text variant="bodyLarge" numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={styles.fileMeta}>
            {formatFileSize(item.size)} •{' '}
            {format(new Date(item.modifiedAt), 'MMM d, yyyy')}
          </Text>
        </View>
        <IconButton
          icon="open-in-new"
          size={20}
          onPress={() => openFile(item)}
        />
      </Card.Content>
    </Card>
  );

  if (!folderUrl) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="folder-alert"
          size={64}
          color={COLORS.gray400}
        />
        <Text variant="titleMedium" style={styles.emptyText}>
          No folder configured
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          Configure a {provider === 'googledrive' ? 'Google Drive' : 'OneDrive'}{' '}
          folder in the client settings.
        </Text>
      </View>
    );
  }

  if (viewMode === 'embed') {
    const embedUrl = CloudStorageService.getEmbedUrl(provider, folderId || '');

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            {client?.name}'s Documents
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="format-list-bulleted"
              selected={viewMode === 'list'}
              onPress={() => setViewMode('list')}
            />
            <IconButton
              icon="open-in-new"
              onPress={() => Linking.openURL(folderUrl)}
            />
          </View>
        </View>
        <WebView
          source={{ uri: folderUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading documents...
              </Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>
          {client?.name}'s Documents
        </Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="web"
            selected={viewMode === 'embed'}
            onPress={() => setViewMode('embed')}
          />
          <IconButton
            icon="open-in-new"
            onPress={() => Linking.openURL(folderUrl)}
          />
        </View>
      </View>

      <Searchbar
        placeholder="Search files..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading files...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          renderItem={renderFile}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="folder-open"
                size={64}
                color={COLORS.gray400}
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                No files found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                This folder is empty or you don't have permission to view its
                contents.
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="open-in-new"
        style={styles.fab}
        onPress={() => Linking.openURL(folderUrl)}
        label="Open in Browser"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.gray500,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fileCard: {
    marginBottom: 8,
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileMeta: {
    color: COLORS.gray500,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.gray600,
  },
  emptySubtext: {
    marginTop: 8,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
});
