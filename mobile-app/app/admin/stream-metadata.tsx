import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/radio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface StreamMetadata {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  startTime: string;
  endTime?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StreamMetadataScreen({ navigation }: any) {
  const [metadata, setMetadata] = useState<StreamMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTrack, setEditingTrack] = useState<StreamMetadata | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    duration: '',
    isActive: true,
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      // Mock data for now - in real app, this would come from metadata API
      const mockMetadata: StreamMetadata[] = [
        {
          id: '1',
          title: 'Summer Vibes',
          artist: 'DJ Enish',
          album: 'Summer Collection 2024',
          duration: 245,
          startTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 30 * 1000).toISOString(),
          isActive: false,
          createdAt: '2024-07-15T10:30:00Z',
          updatedAt: '2024-07-15T12:45:00Z',
        },
        {
          id: '2',
          title: 'Night Drive',
          artist: 'Enish Radio',
          album: 'Late Night Sessions',
          duration: 198,
          startTime: new Date(Date.now() - 30 * 1000).toISOString(),
          endTime: null,
          isActive: true,
          createdAt: '2024-07-15T11:00:00Z',
          updatedAt: '2024-07-15T11:30:00Z',
        },
        {
          id: '3',
          title: 'Morning Coffee',
          artist: 'Enish Team',
          album: 'Morning Beats',
          duration: 312,
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          isActive: false,
          createdAt: '2024-07-15T09:00:00Z',
          updatedAt: '2024-07-15T10:15:00Z',
        },
      ];

      setMetadata(mockMetadata.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading metadata:', error);
      Alert.alert('Error', 'Failed to load stream metadata');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdit = async () => {
    if (!formData.title || !formData.artist) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      if (editingTrack) {
        // Update existing track
        await axios.put(
          `http://localhost:3000/api/stream/metadata/${editingTrack.id}`,
          {
            ...formData,
            duration: formData.duration ? parseInt(formData.duration) : undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new track
        await axios.post(
          'http://localhost:3000/api/stream/metadata',
          {
            ...formData,
            duration: formData.duration ? parseInt(formData.duration) : undefined,
            startTime: new Date().toISOString(),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setModalVisible(false);
      resetForm();
      loadMetadata();
    } catch (error: any) {
      console.error('Error saving metadata:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save track metadata');
    }
  };

  const handleDelete = (track: StreamMetadata) => {
    Alert.alert(
      'Delete Track',
      `Are you sure you want to delete "${track.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('adminToken');
              await axios.delete(
                `http://localhost:3000/api/stream/metadata/${track.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              loadMetadata();
            } catch (error) {
              console.error('Error deleting metadata:', error);
              Alert.alert('Error', 'Failed to delete track metadata');
            }
          },
        },
      ]
    );
  };

  const handleEndTrack = async (track: StreamMetadata) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await axios.post(
        `http://localhost:3000/api/stream/metadata/${track.id}/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadMetadata();
    } catch (error) {
      console.error('Error ending track:', error);
      Alert.alert('Error', 'Failed to end track');
    }
  };

  const openEditModal = (track: StreamMetadata) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      duration: track.duration?.toString() || '',
      isActive: track.isActive,
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingTrack(null);
    setFormData({
      title: '',
      artist: '',
      album: '',
      duration: '',
      isActive: true,
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderMetadataItem = ({ item }: { item: StreamMetadata }) => (
    <View style={[styles.trackCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.trackHeader}>
        <View style={styles.trackInfo}>
          <View style={styles.trackMainInfo}>
            <Text style={[styles.trackTitle, !item.isActive && styles.inactiveText]}>
              {item.title}
            </Text>
            <Text style={[styles.trackArtist, !item.isActive && styles.inactiveText]}>
              {item.artist}
            </Text>
            {item.album && (
              <Text style={[styles.trackAlbum, !item.isActive && styles.inactiveText]}>
                {item.album}
              </Text>
            )}
          </View>
          <View style={styles.trackStatus}>
            <View style={[
              styles.statusIndicator,
              item.isActive ? styles.statusActive : styles.statusInactive
            ]} />
            <Text style={styles.statusText}>
              {item.isActive ? 'Now Playing' : 'Ended'}
            </Text>
          </View>
        </View>
        <View style={styles.trackActions}>
          {item.isActive && (
            <TouchableOpacity
              style={styles.endButton}
              onPress={() => handleEndTrack(item)}
            >
              <Ionicons name="stop-outline" size={20} color={COLORS.ACCENT} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.trackDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Start Time</Text>
          <Text style={styles.detailValue}>{formatTime(item.startTime)}</Text>
        </View>
        {item.endTime && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>End Time</Text>
            <Text style={styles.detailValue}>{formatTime(item.endTime)}</Text>
          </View>
        )}
      </View>

      <View style={styles.trackFooter}>
        <Text style={styles.trackDate}>
          Created: {formatDate(item.createdAt)}
        </Text>
        <View style={styles.trackButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.ACCENT} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stream Metadata</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={metadata}
        renderItem={renderMetadataItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={loadMetadata}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTrack ? 'Edit Track' : 'Add Track'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter track title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Artist *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.artist}
                  onChangeText={(text) => setFormData({ ...formData, artist: text })}
                  placeholder="Enter artist name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Album</Text>
                <TextInput
                  style={styles.input}
                  value={formData.album}
                  onChangeText={(text) => setFormData({ ...formData, album: text })}
                  placeholder="Enter album name (optional)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration (seconds)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration}
                  onChangeText={(text) => setFormData({ ...formData, duration: text })}
                  placeholder="Enter duration in seconds"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <TouchableOpacity
                  style={styles.switchRow}
                  onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
                >
                  <Text style={styles.switchLabel}>Active</Text>
                  <View
                    style={[
                      styles.switch,
                      formData.isActive && styles.switchActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        formData.isActive && styles.switchThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddEdit}
              >
                <Text style={styles.saveButtonText}>
                  {editingTrack ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  trackCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  trackInfo: {
    flex: 1,
  },
  trackMainInfo: {
    marginBottom: 10,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 5,
  },
  trackArtist: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.8,
    marginBottom: 3,
  },
  trackAlbum: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  trackStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  trackActions: {
    alignItems: 'flex-end',
  },
  endButton: {
    padding: 8,
    backgroundColor: COLORS.ACCENT + '20',
    borderRadius: 6,
  },
  trackDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  trackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackDate: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.6,
  },
  trackButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 10,
  },
  deleteButton: {
    padding: 8,
  },
  inactiveText: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.TEXT,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.BORDER,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    position: 'absolute',
    left: 2,
  },
  switchThumbActive: {
    left: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.CARD,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButtonText: {
    color: COLORS.TEXT,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});