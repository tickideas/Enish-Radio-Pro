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
import { COLORS, SOCIAL_PLATFORMS } from '@/constants/radio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  title: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function SocialLinksScreen({ navigation }: any) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState({
    platform: 'facebook',
    url: '',
    title: '',
    isActive: true,
  });

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:3000/api/social-links/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSocialLinks(response.data.sort((a: SocialLink, b: SocialLink) => a.order - b.order));
    } catch (error) {
      console.error('Error loading social links:', error);
      Alert.alert('Error', 'Failed to load social links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdit = async () => {
    if (!formData.url || !formData.title) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      if (editingLink) {
        // Update existing link
        await axios.put(
          `http://localhost:3000/api/social-links/${editingLink.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new link
        await axios.post(
          'http://localhost:3000/api/social-links',
          {
            ...formData,
            order: socialLinks.length,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setModalVisible(false);
      resetForm();
      loadSocialLinks();
    } catch (error: any) {
      console.error('Error saving social link:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save social link');
    }
  };

  const handleDelete = (link: SocialLink) => {
    Alert.alert(
      'Delete Social Link',
      `Are you sure you want to delete "${link.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('adminToken');
              await axios.delete(
                `http://localhost:3000/api/social-links/${link.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              loadSocialLinks();
            } catch (error) {
              console.error('Error deleting social link:', error);
              Alert.alert('Error', 'Failed to delete social link');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (link: SocialLink) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:3000/api/social-links/${link.id}`,
        { ...link, isActive: !link.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadSocialLinks();
    } catch (error) {
      console.error('Error toggling social link:', error);
      Alert.alert('Error', 'Failed to update social link');
    }
  };

  const openEditModal = (link: SocialLink) => {
    setEditingLink(link);
    setFormData({
      platform: link.platform,
      url: link.url,
      title: link.title,
      isActive: link.isActive,
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingLink(null);
    setFormData({
      platform: 'facebook',
      url: '',
      title: '',
      isActive: true,
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'logo-facebook';
      case 'twitter':
        return 'logo-twitter';
      case 'instagram':
        return 'logo-instagram';
      case 'youtube':
        return 'logo-youtube';
      default:
        return 'link-outline';
    }
  };

  const renderSocialLink = ({ item }: { item: SocialLink }) => (
    <View style={[styles.linkCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.linkHeader}>
        <View style={styles.platformInfo}>
          <Ionicons 
            name={getPlatformIcon(item.platform) as any} 
            size={24} 
            color={item.isActive ? COLORS.PRIMARY : COLORS.TEXT + '60'} 
          />
          <View style={styles.linkDetails}>
            <Text style={[styles.linkTitle, !item.isActive && styles.inactiveText]}>
              {item.title}
            </Text>
            <Text style={styles.linkPlatform}>{item.platform}</Text>
          </View>
        </View>
        <View style={styles.linkActions}>
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
      <Text style={[styles.linkUrl, !item.isActive && styles.inactiveText]}>
        {item.url}
      </Text>
      <View style={styles.linkFooter}>
        <Text style={styles.linkDate}>
          Updated: {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
        <View style={styles.linkButtons}>
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
        <Text style={styles.title}>Social Links Management</Text>
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
        data={socialLinks}
        renderItem={renderSocialLink}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={loadSocialLinks}
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
                {editingLink ? 'Edit Social Link' : 'Add Social Link'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Platform</Text>
                <View style={styles.platformSelector}>
                  {Object.values(SOCIAL_PLATFORMS).map((platform) => (
                    <TouchableOpacity
                      key={platform}
                      style={[
                        styles.platformOption,
                        formData.platform === platform && styles.platformOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, platform })}
                    >
                      <Ionicons
                        name={getPlatformIcon(platform) as any}
                        size={20}
                        color={formData.platform === platform ? 'white' : COLORS.TEXT}
                      />
                      <Text
                        style={[
                          styles.platformOptionText,
                          formData.platform === platform && styles.platformOptionTextSelected,
                        ]}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter link title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.url}
                  onChangeText={(text) => setFormData({ ...formData, url: text })}
                  placeholder="Enter URL"
                  keyboardType="url"
                  autoCapitalize="none"
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
                  {editingLink ? 'Update' : 'Add'}
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
  linkCard: {
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
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkDetails: {
    marginLeft: 15,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  linkPlatform: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  linkActions: {
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
  linkUrl: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.8,
    marginBottom: 10,
  },
  linkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkDate: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.6,
  },
  linkButtons: {
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
  platformSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
  },
  platformOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  platformOptionText: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginLeft: 8,
  },
  platformOptionTextSelected: {
    color: 'white',
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