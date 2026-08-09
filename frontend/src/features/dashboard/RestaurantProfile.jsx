import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save } from 'lucide-react';

export default function RestaurantProfile() {
  const [profile, setProfile] = useState({
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    currency: 'INR',
    openingHours: '',
    themeColor: '#3B82F6',
    taxSettings: { gst: 0, serviceCharge: 0 },
    receiptConfig: { header: '', footer: 'Thank you for your visit!', printerSize: '80mm' },
    socialLinks: { facebook: '', instagram: '', twitter: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [printerWidth, setPrinterWidth] = useState('80mm');

  useEffect(() => {
    const width = localStorage.getItem('thermalPrinterWidth');
    if (width) setPrinterWidth(width);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/restaurant/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: { ...(prev[parent] || {}), [child]: value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    // Save local settings
    localStorage.setItem('thermalPrinterWidth', printerWidth);
    
    try {
      await api.put('/restaurant/profile', profile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Restaurant Settings</h2>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
            <input
              type="text"
              name="name"
              value={profile.name || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={profile.phone || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          


          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={profile.address || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
            <input
              type="text"
              name="gstNumber"
              value={profile.gstNumber || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
            <input
              type="text"
              name="openingHours"
              placeholder="e.g. Mon-Sun: 9 AM - 10 PM"
              value={profile.openingHours || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="themeColor"
                value={profile.themeColor || '#3B82F6'}
                onChange={handleChange}
                className="h-10 w-10 border-0 rounded-md cursor-pointer"
              />
              <span className="text-sm text-gray-600 uppercase">{profile.themeColor || '#3B82F6'}</span>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Tax Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                <input
                  type="number"
                  name="taxSettings.gst"
                  value={profile.taxSettings?.gst || 0}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
                <input
                  type="number"
                  name="taxSettings.serviceCharge"
                  value={profile.taxSettings?.serviceCharge || 0}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Receipt Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thermal Printer Width</label>
                <select
                  name="receiptConfig.printerSize"
                  value={profile.receiptConfig?.printerSize || printerWidth}
                  onChange={(e) => { handleChange(e); setPrinterWidth(e.target.value); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="80mm">80mm (Standard)</option>
                  <option value="58mm">58mm (Small)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Header</label>
                <textarea
                  name="receiptConfig.header"
                  value={profile.receiptConfig?.header || ''}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Welcome to our restaurant!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                <textarea
                  name="receiptConfig.footer"
                  value={profile.receiptConfig?.footer || ''}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Thank you for your visit!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="text"
                  name="socialLinks.facebook"
                  value={profile.socialLinks?.facebook || ''}
                  onChange={handleChange}
                  placeholder="URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="text"
                  name="socialLinks.instagram"
                  value={profile.socialLinks?.instagram || ''}
                  onChange={handleChange}
                  placeholder="URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                <input
                  type="text"
                  name="socialLinks.twitter"
                  value={profile.socialLinks?.twitter || ''}
                  onChange={handleChange}
                  placeholder="URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="text"
              name="logo"
              placeholder="https://example.com/logo.png"
              value={profile.logo || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {profile.logo && (
              <div className="mt-4">
                <img src={profile.logo} alt="Restaurant Logo" className="h-16 object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
