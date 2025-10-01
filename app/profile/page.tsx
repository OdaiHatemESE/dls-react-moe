"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ProfileIcon, 
  EditIcon,
  SettingsIcon,
  CheckIcon,
  LoadingIcon
} from '../components/icons';
import { mockParent } from '../data/mockData';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState(mockParent);
  const [formData, setFormData] = useState({
    name: mockParent.name,
    email: mockParent.email,
    phone: mockParent.phone
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setProfileData(prev => ({
        ...prev,
        ...formData
      }));
      setIsEditing(false);
      setIsSaving(false);
      alert(t.profile.updatedSuccess);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePreferenceChange = (key: keyof typeof profileData.preferences) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  return (
    <div className={clsx("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", locale === 'ar' && 'direction-rtl')}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{t.profile.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ProfileIcon className="w-5 h-5 me-2" />
                  {t.profile.personalInfo}
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className={clsx("flex items-center gap-2")}
                  >
                    <EditIcon className="w-4 h-4" />
                    <span>{t.profile.edit}</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.profile.fullName}
                    </label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.profile.emailAddress}
                    </label>
                    <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.profile.phoneNumber}
                    </label>
                    <Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className={clsx("flex gap-3")}> 
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={clsx("flex items-center space-x-2", locale === 'ar' && 'space-x-reverse')}
                    >
                      {isSaving ? (
                        <LoadingIcon className="w-4 h-4" />
                      ) : (
                        <CheckIcon className="w-4 h-4" />
                      )}
                      <span>{isSaving ? t.common.saving : t.profile.saveChanges}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t.profile.cancel}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Image
                      className="w-16 h-16 rounded-full"
                      src={profileData.avatar}
                      alt={`${profileData.name} avatar`}
                      width={64}
                      height={64}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{profileData.name}</h3>
                      <p className="text-sm text-gray-600">{t.profile.parentAccount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.profile.emailAddress}
                      </label>
                      <p className="text-sm text-gray-900">{profileData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.profile.phoneNumber}
                      </label>
                      <p className="text-sm text-gray-900">{profileData.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Children Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t.profile.linkedChildren}</CardTitle>
              <p className="text-sm text-gray-600">{t.profile.linkedChildrenSubtitle}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profileData.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className={clsx("flex items-center space-x-3", locale === 'ar' && 'space-x-reverse')}>
                      <Image
                        className="w-10 h-10 rounded-full"
                        src={child.avatar}
                        alt={`${child.name} avatar`}
                        width={40}
                        height={40}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{child.name}</p>
                        <p className="text-xs text-gray-500">{child.grade} • {child.teacher}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      {t.profile.active}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Preferences */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 me-2" />
                {t.profile.notificationPreferences}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.profile.emailNotifications}</p>
                    <p className="text-xs text-gray-500">{t.profile.emailNotificationsDesc}</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      profileData.preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={profileData.preferences.emailNotifications}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.profile.smsNotifications}</p>
                    <p className="text-xs text-gray-500">{t.profile.smsNotificationsDesc}</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('smsNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      profileData.preferences.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={profileData.preferences.smsNotifications}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.preferences.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.profile.pushNotifications}</p>
                    <p className="text-xs text-gray-500">{t.profile.pushNotificationsDesc}</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('pushNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      profileData.preferences.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={profileData.preferences.pushNotifications}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t.profile.accountActions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  {t.profile.changePassword}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  {t.profile.privacySettings}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  {t.profile.downloadData}
                </Button>
                <hr className="my-4" />
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" size="sm">
                  {t.profile.deactivateAccount}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}