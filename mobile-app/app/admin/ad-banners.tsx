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
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: expo-image-picker needs to be installed separately
// For now, we'll use a placeholder implementation
import { COLORS } from '@/constants/radio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdBannersScreen({ navigation }: any) {
  const [adBanners, setAdBanners] = useState<AdBanner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdBanner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    targetUrl: '',
    imageUrl: '',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    loadAdBanners();
  }, []);

  const loadAdBanners = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:3000/api/ads/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdBanners(response.data.sort((a: AdBanner, b: AdBanner) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading ad banners:', error);
      Alert.alert('Error', 'Failed to load ad banners');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Image Upload',
      'Image picker functionality requires expo-image-picker package. For now, please enter image URL directly.',
      [{ text: 'OK' }]
    );
  };

  const handleAddEdit = async () => {
    if (!formData.title || !formData.targetUrl || !formData.imageUrl) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      if (editingBanner) {
        // Update existing banner
        await axios.put(
          `http://localhost:3000/api/ads/${editingBanner.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new banner
        await axios.post(
          'http://localhost:3000/api/ads',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setModalVisible(false);
      resetForm();
      loadAdBanners();
    } catch (error: any) {
      console.error('Error saving ad banner:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save ad banner');
    }
  };

  const handleDelete = (banner: AdBanner) => {
    Alert.alert(
      'Delete Ad Banner',
      `Are you sure you want to delete "${banner.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('adminToken');
              await axios.delete(
                `http://localhost:3000/api/ads/${banner.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              loadAdBanners();
            } catch (error) {
              console.error('Error deleting ad banner:', error);
              Alert.alert('Error', 'Failed to delete ad banner');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (banner: AdBanner) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:3000/api/ads/${banner.id}`,
        { ...banner, isActive: !banner.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadAdBanners();
    } catch (error) {
      console.error('Error toggling ad banner:', error);
      Alert.alert('Error', 'Failed to update ad banner');
    }
  };

  const openEditModal = (banner: AdBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      targetUrl: banner.targetUrl,
      imageUrl: banner.imageUrl,
      isActive: banner.isActive,
      startDate: banner.startDate.split('T')[0],
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      targetUrl: '',
      imageUrl: '',
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
  };

  const renderAdBanner = ({ item }: { item: AdBanner }) => (
    <View style={[styles.bannerCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.bannerHeader}>
        <View style={styles.bannerInfo}>
          <Text style={[styles.bannerTitle, !item.isActive && styles.inactiveText]}>
            {item.title}
          </Text>
          <Text style={styles.bannerStatus}>
            Status: {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={[styles.toggleButton, item.isActive && styles.toggleButtonActive]}
            onPress={() => handleToggleActive(item)}
          >
            <Text style={[styles.toggleText, item.isActive && styles.toggleTextActive]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
      )}

      <Text style={[styles.bannerUrl, !item.isActive && styles.inactiveText]}>
        Target URL: {item.targetUrl}
      </Text>

      <View style={styles.bannerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.impressions || 0}</Text>
          <Text style={styles.statLabel}>Impressions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.clicks || 0}</Text>
          <Text style={styles.statLabel}>Clicks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {item.impressions > 0 
              ? Math.round((item.clicks / item.impressions) * 100) 
              : 0}%
          </Text>
          <Text style={styles.statLabel}>CTR</Text>
        </View>
      </View>

      <View style={styles.bannerFooter}>
        <Text style={styles.bannerDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.bannerButtons}>
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
        <Text style={styles.title}>Ad Banners Management</Text>
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
        data={adBanners}
        renderItem={renderAdBanner}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={loadAdBanners}
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
                {editingBanner ? 'Edit Ad Banner' : 'Add Ad Banner'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter banner title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Target URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.targetUrl}
                  onChangeText={(text) => setFormData({ ...formData, targetUrl: text })}
                  placeholder="Enter target URL"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Banner Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {formData.imageUrl ? (
                    <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                      ) : (
                        <>
                          <Ionicons name="image-outline" size={40} color={COLORS.TEXT} />
                          <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.startDate}
                  onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.endDate}
                  onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                  placeholder="YYYY-MM-DD"
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
                disabled={uploadingImage}
              >
                <Text style={styles.saveButtonText}>
                  {editingBanner ? 'Update' : 'Add'}
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
  bannerCard: {
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
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  bannerStatus: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  bannerActions: {
    alignItems: 'flex-end',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: COLORS.BORDER,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.TEXT,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: 'white',
  },
  bannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: COLORS.BORDER,
  },
  bannerUrl: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.8,
    marginBottom: 10,
  },
  bannerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerDate: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.6,
  },
  bannerButtons: {
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
    maxHeight: '90%',
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
  imagePicker: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.CARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginTop: 10,
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