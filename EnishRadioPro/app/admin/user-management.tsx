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

interface User {
  id: string;
  email: string;
  role: 'admin' | 'moderator';
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagementScreen({ navigation }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'moderator',
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      // Mock data for now - in real app, this would come from users API
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@enishradio.com',
          role: 'admin',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'moderator@enishradio.com',
          role: 'moderator',
          isActive: true,
          lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-02-20T10:00:00Z',
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdit = async () => {
    if (!formData.email || (!editingUser && !formData.password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      if (editingUser) {
        // Update existing user
        await axios.put(
          `http://localhost:3000/api/auth/users/${editingUser.id}`,
          {
            email: formData.email,
            role: formData.role,
            isActive: formData.isActive,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new user
        await axios.post(
          'http://localhost:3000/api/auth/register',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setModalVisible(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.email}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('adminToken');
              await axios.delete(
                `http://localhost:3000/api/auth/users/${user.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (user: User) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:3000/api/auth/users/${user.id}`,
        { ...user, isActive: !user.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      role: 'admin',
      isActive: true,
    });
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? 'shield-checkmark-outline' : 'person-outline';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? COLORS.PRIMARY : COLORS.SECONDARY;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`;
    } else {
      return 'Just now';
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.roleIcon, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Ionicons 
              name={getRoleIcon(item.role) as any} 
              size={20} 
              color={getRoleColor(item.role)} 
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userEmail, !item.isActive && styles.inactiveText]}>
              {item.email}
            </Text>
            <View style={styles.userMeta}>
              <Text style={styles.userRole}>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}</Text>
              <Text style={styles.userStatus}>
                Status: {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.userActions}>
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

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Login</Text>
          <Text style={styles.statValue}>{formatLastLogin(item.lastLogin)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Created</Text>
          <Text style={styles.statValue}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.userFooter}>
        <Text style={styles.userDate}>
          Updated: {formatDate(item.updatedAt)}
        </Text>
        <View style={styles.userButtons}>
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
        <Text style={styles.title}>User Management</Text>
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
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={loadUsers}
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
                {editingUser ? 'Edit User' : 'Add User'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingUser}
                />
              </View>

              {!editingUser && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.roleSelector}>
                  {(['admin', 'moderator'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        formData.role === role && styles.roleOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Ionicons
                        name={getRoleIcon(role) as any}
                        size={20}
                        color={formData.role === role ? 'white' : COLORS.TEXT}
                      />
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.role === role && styles.roleOptionTextSelected,
                        ]}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                  {editingUser ? 'Update' : 'Add'}
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 5,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.8,
    marginRight: 15,
  },
  userStatus: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  userActions: {
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
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDate: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.6,
  },
  userButtons: {
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
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    padding: 15,
    borderRadius: 8,
    width: '48%',
  },
  roleOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  roleOptionText: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginLeft: 10,
  },
  roleOptionTextSelected: {
    color: 'white',
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