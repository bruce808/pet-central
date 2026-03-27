'use client';

import { useState } from 'react';
import { Button, Input, Select, Textarea } from '@pet-central/ui';
import { PetType } from '@pet-central/types';

const PET_TYPE_OPTIONS = Object.values(PetType).map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

const TABS = ['Profile', 'Preferences', 'Security'] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Profile');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your account and preferences.</p>

      {/* Tab navigation */}
      <div className="mt-6 flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'Profile' && <ProfileSection />}
        {activeTab === 'Preferences' && <PreferencesSection />}
        {activeTab === 'Security' && <SecuritySection />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update your personal details visible to organizations.
        </p>

        <div className="mt-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
          </div>

          <Input
            label="Display Name"
            name="displayName"
            placeholder="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="City"
              name="city"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="State / Region"
              name="stateRegion"
              placeholder="State"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
            />
            <Input
              label="Country"
              name="country"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          <Textarea
            label="Bio"
            name="bio"
            placeholder="Tell organizations a bit about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end">
            <Button>Save Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferencesSection() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [breeds, setBreeds] = useState('');

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Pet Preferences</h2>
        <p className="mt-1 text-sm text-gray-500">
          Help us personalize your experience and recommendations.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Preferred Pet Types</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PET_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleType(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTypes.includes(opt.value)
                      ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Preferred Breeds"
            name="breeds"
            placeholder="Golden Retriever, Maine Coon, Cockatiel..."
            value={breeds}
            onChange={(e) => setBreeds(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end">
            <Button>Save Preferences</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        <div className="mt-6 max-w-md space-y-5">
          <Input
            label="Current Password"
            type="password"
            name="currentPassword"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            name="newPassword"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <Button>Update Password</Button>
          </div>
        </div>
      </div>

      {/* Phone verification */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Phone Verification</h2>
        <p className="mt-1 text-sm text-gray-500">
          Verify your phone number for added security and trust.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Input placeholder="+1 (555) 000-0000" name="phone" />
          <Button variant="outline" size="sm">Send Code</Button>
        </div>
      </div>

      {/* MFA */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add an extra layer of security to your account.
            </p>
          </div>
          <Button variant="outline">Setup MFA</Button>
        </div>
      </div>
    </div>
  );
}
