import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  Modal,
  Switch,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { ModernButton } from '@/components/ModernButtonUnified';
import { ModernHeader } from '@/components/ModernHeader';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { User, Mail, Phone, MapPin, Building, Shield, Key, LogOut, CreditCard as Edit3, ChevronRight, X, Bell, Moon, Sun, Globe, Lock, FileText, CircleHelp as HelpCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';
import { isTablet } from '@/hooks/useResponsiveStyles';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const isTabletDevice = isTablet();
  
  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, you would call an API to update the profile
      // await apiService.updateProfile({ name, phone });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'storeman':
        return 'Store Manager';
      case 'salesman':
        return 'Salesman';
      case 'retailer':
        return 'Retailer';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  if (!user) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  return (
    <PlatformSafeAreaView style={styles.container} gradientHeader>
      {/* Header */}
      <ModernHeader
        title="Profile"
        leftButton={<HamburgerMenu />}
        rightButton={{
          icon: isEditing ? 
            <X size={isTabletDevice ? 24 : 20} color="#FFFFFF" /> : 
            <Edit3 size={isTabletDevice ? 24 : 20} color="#FFFFFF" />,
          onPress: () => setIsEditing(!isEditing)
        }}
        variant="gradient"
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, isTabletDevice && styles.tabletContent]}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.profileCardContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={[styles.profileGradient, isTabletDevice && styles.tabletProfileGradient]}
          >
            <View style={styles.profileContent}>
              <View style={[styles.avatarContainer, isTabletDevice && styles.tabletAvatarContainer]}>
                {user.profilePicture ? (
                  <Image 
                    source={{ uri: user.profilePicture }} 
                    style={[styles.avatar, isTabletDevice && styles.tabletAvatar]} 
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, isTabletDevice && styles.tabletAvatarPlaceholder]}>
                    <User size={isTabletDevice ? 50 : 40} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              <View style={styles.userInfo}>
                {isEditing ? (
                  <TextInput
                    style={[styles.nameInput, isTabletDevice && styles.tabletNameInput]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  />
                ) : (
                  <Text style={[styles.userName, isTabletDevice && styles.tabletUserName]}>
                    {user.name}
                  </Text>
                )}
                
                <View style={[styles.roleBadge, isTabletDevice && styles.tabletRoleBadge]}>
                  <Shield size={isTabletDevice ? 20 : 16} color="#FFFFFF" />
                  <Text style={[styles.roleText, isTabletDevice && styles.tabletRoleText]}>
                    {getRoleDisplayName(user.role)}
                  </Text>
                </View>
              </View>
              
              {isEditing && (
                <ModernButton
                  title="Save"
                  onPress={handleSaveProfile}
                  loading={isLoading}
                  disabled={isLoading}
                  variant="primary"
                  size="small"
                  style={styles.saveButton}
                />
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Contact Information */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Contact Information
          </Text>
          
          <View style={[styles.card, isTabletDevice && styles.tabletCard]}>
            <View style={[styles.infoItem, isTabletDevice && styles.tabletInfoItem]}>
              <View style={[styles.infoIcon, { backgroundColor: '#ede9fe' }]}>
                <Mail size={isTabletDevice ? 24 : 20} color="#667eea" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isTabletDevice && styles.tabletInfoLabel]}>
                  Email
                </Text>
                <Text style={[styles.infoValue, isTabletDevice && styles.tabletInfoValue]}>
                  {user.email}
                </Text>
              </View>
            </View>
            
            <View style={[styles.infoItem, isTabletDevice && styles.tabletInfoItem]}>
              <View style={[styles.infoIcon, { backgroundColor: '#dcfce7' }]}>
                <Phone size={isTabletDevice ? 24 : 20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isTabletDevice && styles.tabletInfoLabel]}>
                  Phone
                </Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.phoneInput, isTabletDevice && styles.tabletPhoneInput]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Your phone number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.infoValue, isTabletDevice && styles.tabletInfoValue]}>
                    {user.phone || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>
            
            {user.companyId && (
              <View style={[styles.infoItem, isTabletDevice && styles.tabletInfoItem]}>
                <View style={[styles.infoIcon, { backgroundColor: '#fef3c7' }]}>
                  <Building size={isTabletDevice ? 24 : 20} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, isTabletDevice && styles.tabletInfoLabel]}>
                    Company
                  </Text>
                  <Text style={[styles.infoValue, isTabletDevice && styles.tabletInfoValue]}>
                    Company ID: {user.companyId}
                  </Text>
                </View>
              </View>
            )}
            
            {user.storeId && (
              <View style={[styles.infoItem, isTabletDevice && styles.tabletInfoItem]}>
                <View style={[styles.infoIcon, { backgroundColor: '#fee2e2' }]}>
                  <MapPin size={isTabletDevice ? 24 : 20} color="#ef4444" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, isTabletDevice && styles.tabletInfoLabel]}>
                    Store
                  </Text>
                  <Text style={[styles.infoValue, isTabletDevice && styles.tabletInfoValue]}>
                    Store: {user.storeId}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* App Settings */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            App Settings
          </Text>
          
          <View style={[styles.card, isTabletDevice && styles.tabletCard]}>
            <View style={[styles.settingItem, isTabletDevice && styles.tabletSettingItem]}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#ede9fe' }]}>
                  <Bell size={isTabletDevice ? 24 : 20} color="#667eea" />
                </View>
                <Text style={[styles.settingText, isTabletDevice && styles.tabletSettingText]}>
                  Notifications
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#e2e8f0', true: '#ede9fe' }}
                thumbColor={notifications ? '#667eea' : '#94a3b8'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
            
            <View style={[styles.settingItem, isTabletDevice && styles.tabletSettingItem]}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
                  {darkMode ? (
                    <Moon size={isTabletDevice ? 24 : 20} color="#f59e0b" />
                  ) : (
                    <Sun size={isTabletDevice ? 24 : 20} color="#f59e0b" />
                  )}
                </View>
                <Text style={[styles.settingText, isTabletDevice && styles.tabletSettingText]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e2e8f0', true: '#fef3c7' }}
                thumbColor={darkMode ? '#f59e0b' : '#94a3b8'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          </View>
        </Animated.View>

        {/* Security */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Security
          </Text>
          
          <View style={[styles.card, isTabletDevice && styles.tabletCard]}>
            <ModernButton
              title="Change Password"
              onPress={() => setIsChangingPassword(true)}
              icon={<Key size={isTabletDevice ? 24 : 20} color="#667eea" />}
              variant="outline"
              size={isTabletDevice ? "medium" : "small"}
              style={styles.menuItem}
            />
            
            <ModernButton
              title="Privacy Settings"
              onPress={() => {}}
              icon={<Lock size={isTabletDevice ? 24 : 20} color="#10b981" />}
              variant="outline"
              size={isTabletDevice ? "medium" : "small"}
              style={styles.menuItem}
            />
          </View>
        </Animated.View>

        {/* Help & Support */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Help & Support
          </Text>
          
          <View style={[styles.card, isTabletDevice && styles.tabletCard]}>
            <ModernButton
              title="Help Center"
              onPress={() => {}}
              icon={<HelpCircle size={isTabletDevice ? 24 : 20} color="#f59e0b" />}
              variant="outline"
              size={isTabletDevice ? "medium" : "small"}
              style={styles.menuItem}
            />
            
            <ModernButton
              title="Documentation"
              onPress={() => {}}
              icon={<FileText size={isTabletDevice ? 24 : 20} color="#8b5cf6" />}
              variant="outline"
              size={isTabletDevice ? "medium" : "small"}
              style={styles.menuItem}
            />
            
            <ModernButton
              title="About"
              onPress={() => {}}
              icon={<Globe size={isTabletDevice ? 24 : 20} color="#3b82f6" />}
              variant="outline"
              size={isTabletDevice ? "medium" : "small"}
              style={styles.menuItem}
            />
          </View>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.section}>
          <ModernButton
            title="Sign Out"
            onPress={handleLogout}
            icon={<LogOut size={isTabletDevice ? 24 : 20} color="#FFFFFF" />}
            variant="danger"
            size={isTabletDevice ? "medium" : "medium"}
            style={styles.logoutButton}
          />
          
          <Text style={[styles.versionText, isTabletDevice && styles.tabletVersionText]}>
            NextApp Auto Parts CRM v1.0.0
          </Text>
        </Animated.View>

      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={isChangingPassword}
        animationType="slide"
        transparent
        onRequestClose={() => setIsChangingPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isTabletDevice && styles.tabletModalContainer]}>
            <View style={[styles.modalHeader, isTabletDevice && styles.tabletModalHeader]}>
              <Text style={[styles.modalTitle, isTabletDevice && styles.tabletModalTitle]}>
                Change Password
              </Text>
              <ModernButton
                title=""
                onPress={() => setIsChangingPassword(false)}
                icon={<X size={isTabletDevice ? 28 : 24} color="#64748b" />}
                variant="ghost"
                size="small"
                style={styles.modalCloseButton}
              />
            </View>
            
            <View style={[styles.modalContent, isTabletDevice && styles.tabletModalContent]}>
              <View style={[styles.inputGroup, isTabletDevice && styles.tabletInputGroup]}>
                <Text style={[styles.inputLabel, isTabletDevice && styles.tabletInputLabel]}>
                  Current Password
                </Text>
                <TextInput
                  style={[styles.textInput, isTabletDevice && styles.tabletTextInput]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              
              <View style={[styles.inputGroup, isTabletDevice && styles.tabletInputGroup]}>
                <Text style={[styles.inputLabel, isTabletDevice && styles.tabletInputLabel]}>
                  New Password
                </Text>
                <TextInput
                  style={[styles.textInput, isTabletDevice && styles.tabletTextInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              
              <View style={[styles.inputGroup, isTabletDevice && styles.tabletInputGroup]}>
                <Text style={[styles.inputLabel, isTabletDevice && styles.tabletInputLabel]}>
                  Confirm New Password
                </Text>
                <TextInput
                  style={[styles.textInput, isTabletDevice && styles.tabletTextInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Confirm new password"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            
            <View style={[styles.modalFooter, isTabletDevice && styles.tabletModalFooter]}>
              <ModernButton
                title="Cancel"
                onPress={() => setIsChangingPassword(false)}
                variant="outline"
                size={isTabletDevice ? "medium" : "small"}
                style={styles.cancelButton}
              />
              
              <ModernButton
                title="Update Password"
                onPress={handleChangePassword}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                size={isTabletDevice ? "medium" : "small"}
                style={styles.savePasswordButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </PlatformSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  tabletContent: {
    paddingBottom: 60,
    alignItems: 'center', // Center content on tablets
  },
  profileCardContainer: {
    marginTop: -30,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  profileGradient: {
    borderRadius: 20,
    padding: 24,
  },
  tabletProfileGradient: {
    padding: 32,
    borderRadius: 24,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  tabletAvatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabletAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabletAvatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tabletUserName: {
    fontSize: 32,
    marginBottom: 12,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    paddingBottom: 4,
    minWidth: 200,
  },
  tabletNameInput: {
    fontSize: 32,
    marginBottom: 12,
    minWidth: 300,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabletRoleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  tabletRoleText: {
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 600, // Limit width on tablets
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  tabletSectionTitle: {
    fontSize: 22,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabletCard: {
    borderRadius: 20,
    padding: 6,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletInfoItem: {
    padding: 20,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  tabletInfoLabel: {
    fontSize: 16,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  tabletInfoValue: {
    fontSize: 18,
  },
  phoneInput: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  tabletPhoneInput: {
    fontSize: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletSettingItem: {
    padding: 20,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  tabletSettingText: {
    fontSize: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  tabletVersionText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  tabletModalContainer: {
    borderRadius: 24,
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletModalHeader: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabletModalTitle: {
    fontSize: 22,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  tabletModalContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  tabletInputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  tabletInputLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabletTextInput: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  tabletModalFooter: {
    padding: 24,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  savePasswordButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  savePasswordGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePasswordText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});